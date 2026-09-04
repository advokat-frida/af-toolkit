// The rendered-style census — what the Toolkit actually paints, counted.
//
// design-gate.mjs reads source text: it can say "this hex is not a token". It cannot
// say "this button is 1px shorter than every other button" or "this 15px/600 run
// appears once, in one tool, and nowhere else". Only the rendered page can. This
// script drives every state the canvas draws (the same list as state-proofs.mjs),
// and for the shell document and the tool frame records:
//
//   type roles   every visible text run: family / size / weight / line-height /
//                letter-spacing / transform / color
//   controls     every visible button, link, input, select: type + border + fill +
//                radius + shadow + padding + height floor
//   paint        every rendered color (text, fill, border, shadow), radius, shadow
//
// It counts them across states and tools and flags one-offs. The counts are the
// review's evidence; the sorted set of distinct tuples is the regression baseline.
//
//   node scripts/style-census.mjs            report to stdout
//   node scripts/style-census.mjs --check    exit 1 on any tuple absent from the baseline
//   node scripts/style-census.mjs --update   rewrite docs/design/style-baseline.json
//   node scripts/style-census.mjs --json     the full census as JSON (for diffing)
//
// The baseline changes only in a reviewed change. A new tool that needs a new tuple
// adds it to the baseline in the same commit, which is the moment a reviewer asks
// why the system's existing roles did not fit.
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startServer, states } from "./state-proofs.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = join(repoRoot, "docs", "design", "style-baseline.json");
const args = new Set(process.argv.slice(2));
const mode = args.has("--check") ? "check" : args.has("--update") ? "update" : args.has("--json") ? "json" : "report";

// Token names for the rendered rgb values (DESIGN-SYSTEM.md §1).
const TOKENS = new Map([
  ["rgb(22, 20, 15)", "ink"],
  ["rgb(74, 70, 61)", "soft"],
  ["rgb(255, 253, 248)", "paper"],
  ["rgb(246, 244, 239)", "ground"],
  ["rgb(233, 231, 224)", "canvas"],
  ["rgba(22, 20, 15, 0.17)", "hairline"],
  ["rgba(22, 20, 15, 0.32)", "hairline-strong"],
  ["rgba(22, 20, 15, 0.3)", "faint"],
  ["rgb(31, 78, 50)", "forest"],
  ["rgb(239, 236, 228)", "forest-wash"],
  ["rgb(200, 50, 50)", "red"],
  ["rgb(18, 102, 106)", "teal"],
  ["rgb(58, 58, 140)", "indigo"],
  ["rgb(158, 84, 21)", "amber"],
  ["rgb(24, 62, 41)", "forest-press"],
  ["rgb(251, 244, 234)", "amber-wash"],
  ["rgb(255, 255, 255)", "white"],
  ["rgba(0, 0, 0, 0)", "transparent"]
]);

// Which tool frame a state exercises.
function routeOf(stateName) {
  if (/redactorium/.test(stateName)) return "redactorium";
  if (/safeseed/.test(stateName)) return "safeseed";
  if (/safelist/.test(stateName)) return "safelist";
  if (/wizards/.test(stateName)) return "privacy-wizards";
  if (/oracle/.test(stateName)) return "objection-oracle";
  return null;
}

// Runs inside a document. Returns type runs, controls, and paint for everything visible.
function censusDocument() {
  const visible = (el) => {
    if (!(el instanceof Element)) return false;
    if (el.closest("script, style, template, noscript")) return false;
    if (typeof el.checkVisibility === "function" && !el.checkVisibility({ visibilityProperty: true, opacityProperty: true })) return false;
    const r = el.getBoundingClientRect();
    // Screen-reader-only text is parked in a 1px box; it is not painted.
    return r.width > 1 && r.height > 1;
  };
  const family = (stack) => stack.split(",")[0].trim().replace(/^["']|["']$/g, "").toLowerCase();
  const label = (el) => {
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/)[0] : "";
    const text = (el.value || el.placeholder || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 32);
    return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""} "${text}"`;
  };
  const type = [];
  const controls = [];
  const paint = { colors: {}, radii: {}, shadows: {} };
  const note = (bucket, key, use) => {
    if (!key) return;
    const slot = (bucket[key] ??= { count: 0, uses: {} });
    slot.count += 1;
    slot.uses[use] = (slot.uses[use] || 0) + 1;
  };

  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el)) continue;
    if (el.namespaceURI === "http://www.w3.org/2000/svg" && el.tagName.toLowerCase() !== "text") {
      // Vector art: only its stroke/fill colors matter to the palette.
      const cs = getComputedStyle(el);
      if (cs.stroke && cs.stroke !== "none") note(paint.colors, cs.stroke, "svg-stroke");
      if (cs.fill && cs.fill !== "none") note(paint.colors, cs.fill, "svg-fill");
      continue;
    }
    const cs = getComputedStyle(el);
    const tag = el.tagName.toLowerCase();

    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) ||
      ((tag === "input" || tag === "textarea") && (el.value || el.placeholder));
    if (hasText) {
      type.push({
        key: `${family(cs.fontFamily)} ${cs.fontSize}/${cs.fontWeight} lh ${cs.lineHeight} ls ${cs.letterSpacing} ${cs.textTransform} ${cs.color}`,
        family: family(cs.fontFamily),
        size: cs.fontSize,
        weight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        transform: cs.textTransform,
        color: cs.color,
        sample: label(el)
      });
      note(paint.colors, cs.color, "text");
    }

    const isControl = tag === "button" || tag === "select" || tag === "textarea" || tag === "input" ||
      (tag === "a" && el.hasAttribute("href")) || el.getAttribute("role") === "button";
    if (isControl) {
      const r = el.getBoundingClientRect();
      controls.push({
        key: [
          tag,
          `${family(cs.fontFamily)} ${cs.fontSize}/${cs.fontWeight} ${cs.textTransform}`,
          `fg ${cs.color}`,
          `bg ${cs.backgroundColor}`,
          `border ${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
          `radius ${cs.borderRadius}`,
          `shadow ${cs.boxShadow}`,
          `pad ${cs.paddingTop} ${cs.paddingRight}`,
          `min-h ${cs.minHeight}`
        ].join(" · "),
        tag,
        height: Math.round(r.height),
        sample: label(el)
      });
    }

    if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)") note(paint.colors, cs.backgroundColor, "fill");
    for (const side of ["Top", "Right", "Bottom", "Left"]) {
      if (parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== "none") {
        note(paint.colors, cs[`border${side}Color`], "border");
      }
    }
    if (cs.borderRadius && cs.borderRadius !== "0px") note(paint.radii, cs.borderRadius, tag);
    if (cs.boxShadow && cs.boxShadow !== "none") {
      note(paint.shadows, cs.boxShadow, tag);
      for (const m of cs.boxShadow.matchAll(/rgba?\([^)]+\)/g)) note(paint.colors, m[0], "shadow");
    }
  }
  return { type, controls, paint };
}

// Merge one document's census into the running totals.
function merge(totals, doc, where) {
  const add = (bucket, key, extra) => {
    const slot = (bucket[key] ??= { count: 0, tools: new Set(), states: new Set(), samples: [], ...extra });
    slot.count += 1;
    slot.tools.add(where.tool);
    slot.states.add(where.state);
    return slot;
  };
  for (const run of doc.type) {
    const slot = add(totals.type, run.key, { family: run.family, size: run.size, weight: run.weight, lineHeight: run.lineHeight, letterSpacing: run.letterSpacing, transform: run.transform, color: run.color });
    if (slot.samples.length < 3 && !slot.samples.some((s) => s.endsWith(run.sample))) slot.samples.push(`${where.state} · ${where.tool} · ${run.sample}`);
  }
  for (const c of doc.controls) {
    const slot = add(totals.controls, c.key, { tag: c.tag, heights: new Set() });
    slot.heights.add(c.height);
    if (slot.samples.length < 3 && !slot.samples.some((s) => s.endsWith(c.sample))) slot.samples.push(`${where.state} · ${where.tool} · ${c.sample}`);
  }
  for (const [bucketName, bucket] of Object.entries(doc.paint)) {
    for (const [key, v] of Object.entries(bucket)) {
      const slot = add(totals.paint[bucketName], key, { uses: {} });
      slot.count += v.count - 1;
      for (const [use, n] of Object.entries(v.uses)) slot.uses[use] = (slot.uses[use] || 0) + n;
    }
  }
}

async function runCensus() {
  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1360, height: 800 }, acceptDownloads: true });
  await page.clock.setFixedTime(new Date("2026-09-01T12:00:00Z"));
  const totals = { type: {}, controls: {}, paint: { colors: {}, radii: {}, shadows: {} } };
  const failures = [];
  try {
    for (const [name, run] of Object.entries(states(page, base))) {
      try {
        await run();
        await page.waitForTimeout(300);
      } catch (error) {
        failures.push(`${name}: ${String(error.message).split("\n")[0]}`);
        continue;
      }
      // Park the pointer on empty rail so the last-clicked control is not censused in its hover state.
      await page.mouse.move(12, 780);
      await page.waitForTimeout(120);
      merge(totals, await page.evaluate(censusDocument), { state: name, tool: "shell" });
      const route = routeOf(name);
      if (route) {
        const handle = await page.$(`[data-view="${route}"] iframe`);
        const frame = handle && (await handle.contentFrame());
        if (frame) merge(totals, await frame.evaluate(censusDocument), { state: name, tool: route });
        else failures.push(`${name}: tool frame not found`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  return { totals, failures };
}

const sorted = (bucket) => Object.entries(bucket).sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]));
const tokenName = (rgb) => TOKENS.get(rgb) || "NOT A TOKEN";
const list = (set) => [...set].sort().join(", ");
const oneOff = (slot) => slot.count <= 2 || slot.tools.size === 1;

function report(totals) {
  const out = [];
  const h = (t) => out.push("", `== ${t} ==`);
  const toolsSeen = new Set();
  for (const slot of Object.values(totals.type)) for (const t of slot.tools) toolsSeen.add(t);

  h("Families");
  const fam = {};
  for (const [, s] of Object.entries(totals.type)) {
    const f = (fam[s.family] ??= { count: 0, tools: new Set(), sizes: new Set(), weights: new Set() });
    f.count += s.count; for (const t of s.tools) f.tools.add(t); f.sizes.add(parseFloat(s.size)); f.weights.add(s.weight);
  }
  for (const [name, f] of Object.entries(fam).sort((a, b) => b[1].count - a[1].count)) {
    out.push(`${name.padEnd(16)} ${String(f.count).padStart(5)} runs · sizes ${[...f.sizes].sort((a, b) => a - b).join("/")} · weights ${[...f.weights].sort().join("/")} · ${list(f.tools)}`);
  }

  h("Sizes by family (count · tools) — * marks a size used in one tool only");
  const bySize = {};
  for (const s of Object.values(totals.type)) {
    const k = `${s.family} ${String(parseFloat(s.size)).padStart(4)}px`;
    const b = (bySize[k] ??= { count: 0, tools: new Set() });
    b.count += s.count; for (const t of s.tools) b.tools.add(t);
  }
  for (const [k, b] of Object.entries(bySize).sort()) out.push(`${b.tools.size === 1 ? "*" : " "} ${k.padEnd(24)} ${String(b.count).padStart(5)} · ${list(b.tools)}`);

  h("Distinct type roles per tool (fewer is tighter)");
  for (const t of [...toolsSeen].sort()) {
    const n = Object.values(totals.type).filter((s) => s.tools.has(t)).length;
    out.push(`${t.padEnd(18)} ${n}`);
  }

  h(`Type roles, all ${Object.keys(totals.type).length} (count · tools) — ONE-OFF = ≤2 runs or a single tool`);
  for (const [key, s] of sorted(totals.type)) {
    out.push(`${String(s.count).padStart(5)}  ${key.replace(/ lh normal/, "").replace(/ ls normal/, "").replace(/ none rgb/, " rgb")}  [${tokenName(s.color)}]  · ${list(s.tools)}${oneOff(s) ? "   ONE-OFF" : ""}`);
    if (oneOff(s)) for (const sample of s.samples) out.push(`         ↳ ${sample}`);
  }

  h(`Control variants, all ${Object.keys(totals.controls).length} (count · rendered heights · tools)`);
  for (const [key, s] of sorted(totals.controls)) {
    out.push(`${String(s.count).padStart(5)}  ${key}  · h ${[...s.heights].sort((a, b) => a - b).join("/")}  · ${list(s.tools)}${oneOff(s) ? "   ONE-OFF" : ""}`);
    for (const sample of s.samples.slice(0, oneOff(s) ? 3 : 1)) out.push(`         ↳ ${sample}`);
  }

  h("Rendered colors (count · token · uses · tools)");
  for (const [rgb, s] of sorted(totals.paint.colors)) {
    out.push(`${String(s.count).padStart(6)}  ${rgb.padEnd(28)} ${tokenName(rgb).padEnd(16)} ${Object.entries(s.uses).map(([u, n]) => `${u} ${n}`).join(", ").padEnd(40)} · ${list(s.tools)}`);
  }
  h("Radii"); for (const [k, s] of sorted(totals.paint.radii)) out.push(`${String(s.count).padStart(6)}  ${k.padEnd(20)} ${Object.keys(s.uses).join(",").padEnd(24)} · ${list(s.tools)}`);
  h("Shadows"); for (const [k, s] of sorted(totals.paint.shadows)) out.push(`${String(s.count).padStart(6)}  ${k.padEnd(48)} ${Object.keys(s.uses).join(",").padEnd(16)} · ${list(s.tools)}`);
  return out.join("\n");
}

function baselineOf(totals) {
  return {
    note: "Rendered-style baseline. Regenerate with `node scripts/style-census.mjs --update` in a reviewed change only.",
    typeRoles: Object.keys(totals.type).sort(),
    controls: Object.keys(totals.controls).sort(),
    colors: Object.keys(totals.paint.colors).sort(),
    radii: Object.keys(totals.paint.radii).sort(),
    shadows: Object.keys(totals.paint.shadows).sort()
  };
}

async function main() {
  const { totals, failures } = await runCensus();
  if (failures.length) {
    process.stdout.write(`${failures.join("\n")}\n${failures.length} state(s) could not be censused.\n`);
    process.exitCode = 1;
    return;
  }
  if (mode === "json") {
    const plain = JSON.parse(JSON.stringify(totals, (k, v) => (v instanceof Set ? [...v].sort() : v)));
    process.stdout.write(JSON.stringify(plain, null, 2) + "\n");
    return;
  }
  if (mode === "update") {
    await writeFile(baselinePath, JSON.stringify(baselineOf(totals), null, 2) + "\n");
    process.stdout.write(`Baseline written: ${baselinePath}\n`);
    process.stdout.write(report(totals) + "\n");
    return;
  }
  if (mode === "check") {
    let baseline;
    try { baseline = JSON.parse(await readFile(baselinePath, "utf8")); }
    catch { process.stdout.write(`No baseline at ${baselinePath}. Run --update in a reviewed change first.\n`); process.exitCode = 1; return; }
    const current = baselineOf(totals);
    const buckets = { typeRoles: totals.type, controls: totals.controls, colors: totals.paint.colors, radii: totals.paint.radii, shadows: totals.paint.shadows };
    let added = 0, retired = 0;
    for (const [name, keys] of Object.entries(buckets)) {
      const known = new Set(baseline[name] || []);
      for (const key of current[name]) {
        if (known.has(key)) continue;
        added += 1;
        const slot = keys[key];
        process.stdout.write(`FAIL  [${name}] new: ${key}\n`);
        for (const s of (slot.samples || []).slice(0, 3)) process.stdout.write(`        ↳ ${s}\n`);
        if (!slot.samples?.length) process.stdout.write(`        ↳ ${list(slot.states)} · ${list(slot.tools)}\n`);
      }
      for (const key of known) if (!current[name].includes(key)) { retired += 1; process.stdout.write(`note  [${name}] retired: ${key}\n`); }
    }
    if (added) { process.stdout.write(`\n${added} rendered tuple(s) not in the baseline. Use an existing role, or add the new one to docs/design/style-baseline.json in the same reviewed change.\n`); process.exitCode = 1; return; }
    process.stdout.write(`PASS  style census · every rendered tuple is in the baseline${retired ? ` (${retired} retired; run --update to prune)` : ""}.\n`);
    return;
  }
  process.stdout.write(report(totals) + "\n");
}

await main();
