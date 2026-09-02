import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
export const candidateRoot = resolve(scriptDir, "..");
export const publicRoot = join(candidateRoot, "public");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function check(condition, label, detail = "") {
  return { ok: Boolean(condition), label, detail };
}

async function treeHash(root, current = root, hash = createHash("sha256")) {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(current, entry.name);
    if (entry.isDirectory()) await treeHash(root, path, hash);
    else if (entry.isFile()) {
      hash.update(relative(root, path).replaceAll("\\", "/"));
      hash.update("\0");
      hash.update(await readFile(path));
      hash.update("\0");
    }
  }
  return current === root ? hash.digest("hex") : hash;
}

export async function runStaticChecks() {
  const results = [];
  const index = await readFile(join(publicRoot, "index.html"), "utf8");
  const css = await readFile(join(publicRoot, "toolkit.css"), "utf8");
  const js = await readFile(join(publicRoot, "toolkit.js"), "utf8");
  const manifest = JSON.parse(await readFile(join(publicRoot, "tool-sources.json"), "utf8"));

  // Shell structure: one view + one nav entry per route.
  const routes = ["home", "redactorium", "safeseed", "objection-oracle", "privacy-wizards"];
  for (const route of routes) {
    results.push(check(index.includes(`data-view="${route}"`), `view exists: ${route}`));
    results.push(check(index.includes(`data-route-link="${route}"`), `navigation exists: ${route}`));
  }
  results.push(check((index.match(/<h1\b/g) || []).length === 5, "one H1 per view", `found ${(index.match(/<h1\b/g) || []).length}`));
  results.push(check((index.match(/<iframe\b/g) || []).length === 4, "four tool frames", `found ${(index.match(/<iframe\b/g) || []).length}`));
  results.push(check((index.match(/title="[^"]+" data-tool-frame=/g) || []).length === 4, "every frame has a title"));
  results.push(check((index.match(/allow="clipboard-write"/g) || []).length === 2, "clipboard permission is limited to the tools that copy output"));
  results.push(check(index.includes("aria-current") === false, "aria-current is runtime-owned"));
  results.push(check(js.includes('setAttribute("aria-current", "page")'), "active navigation announces current page"));
  results.push(check(js.includes("trapMenuFocus") && js.includes('event.key === "Escape"'), "mobile navigation traps and returns focus"));
  results.push(check(js.includes("try {") && js.includes("decodeURIComponent") && js.includes('return "";'), "malformed route encoding falls back to Home"));
  results.push(check(js.includes('data.toolkit !== "context"') && js.includes("event.origin !== window.location.origin"), "breadcrumb context messages are origin-checked"));

  // The approved redesign: brand cap, grouped navigation, breadcrumb tool headers.
  results.push(check(index.includes('class="brand-cap"') && index.includes("frida-fox-forest.png"), "sidebar brand cap carries the fox mark"));
  for (const group of ["Manage data", "Decide"]) {
    results.push(check(index.includes(`>${group}</p>`), `navigation group exists: ${group}`));
    results.push(check(index.includes(`<span class="crumb-group">${group}</span>`), `breadcrumb group exists: ${group}`));
  }
  results.push(check((index.match(/class="tool-head"/g) || []).length === 4, "four breadcrumb tool headers"));
  results.push(check(index.includes('<h1 id="home-title" tabindex="-1">The Toolkit</h1>'), "Home nameplate is the approved The Toolkit"));
  results.push(check(index.includes('<p class="home-lede">The privacy practitioners swiss army knife.</p>'), "Home lede uses the approved practitioner promise"));
  results.push(check((index.match(/class="tool-card"/g) || []).length === 4, "four Home tool cards"));
  results.push(check(index.includes('data-context-title="Privacy Wizards Council"'), "Privacy Wizards breadcrumb accepts tool context"));

  for (const copy of [
    "Anonymize, hash, generalize, redact, or transform personal information.",
    "Generate fake personal information and generate a tamper-evident receipt.",
    "Get quick and citable answers for commonly recurring privacy questions.",
    "Get pointers from a magic 8-ball on risk tolerance."
  ]) {
    results.push(check(index.includes(copy), `approved Home tool description exists: ${copy.slice(0, 40)}…`));
  }

  // Retired chrome must stay retired.
  for (const retired of ["tool-number", "accent-red", "accent-forest", "accent-indigo", "accent-teal", "accent-amber", "local-chip", "tool-view-head", "home-brand-mark", "brand-mark", "card-actions"]) {
    results.push(check(!index.includes(`class="${retired}`) && !index.includes(` ${retired}"`), `retired chrome is absent: ${retired}`));
  }
  results.push(check(!index.includes(">Open tool<"), "cards carry no Open tool buttons — the card is the link"));
  results.push(check(!index.includes("What's on your desk today?"), "the desk question left with the redesign"));

  results.push(check((index.match(/<details class="changelog-card">/g) || []).length === 1, "one native Toolkit changelog disclosure"));
  results.push(check(index.includes('<span class="changelog-label">Changelog</span>'), "Changelog keeps its compact label"));
  results.push(check(index.includes('<section class="home-bottom" id="toolkit-changelog">'), "Changelog keeps its stable Home anchor"));

  // Stylesheet: tokens, canonical shadow, square grammar, no rejected faces.
  for (const token of ["--ink: #16140f", "--soft: #4a463d", "--paper: #fffdf8", "--ground: #f6f4ef", "--forest: #1f4e32", "--amber: #9e5415"]) {
    results.push(check(css.includes(token), `token exists: ${token.split(":")[0]}`));
  }
  results.push(check(css.includes("box-shadow: 4px 4px 0 var(--ink)"), "canonical 4px square shadow exists"));
  results.push(check(!/border-radius:\s*(?!0|50%)/.test(css.replace(/\s+/g, " ")), "shell radii are 0 or 50% only"));
  results.push(check(!css.includes("Alfa Slab") && !css.includes("DM Serif") && !css.includes("Inter"), "rejected font stack is absent"));
  results.push(check(!css.includes("feTurbulence") && !css.includes("fractalNoise"), "global grain is absent"));

  // Provenance manifest: in-repo schema.
  results.push(check(manifest.schemaVersion === 3, "provenance manifest uses the in-repo schema", `found ${manifest.schemaVersion}`));
  results.push(check(manifest.tools?.length === 4, "provenance manifest has four tools", `found ${manifest.tools?.length}`));
  results.push(check(manifest.releaseBoundary === "private-source-control-only", "manifest preserves the private repository boundary"));
  results.push(check(manifest.tools?.every((tool) => tool.sourceFolder && existsSync(join(candidateRoot, tool.sourceFolder))), "every tool's source folder exists in this repository"));
  results.push(check(manifest.tools?.find((tool) => tool.id === "redactorium")?.license === null, "Redactorium is not given a false license"));

  for (const tool of manifest.tools ?? []) {
    const target = join(publicRoot, tool.toolkitArtifact.replace(/\/$/, ""));
    results.push(check(existsSync(target), `artifact exists: ${tool.id}`));
    const sourcePath = join(candidateRoot, tool.sourceArtifact);
    results.push(check(existsSync(sourcePath), `source artifact exists: ${tool.id}`));
    if (tool.toolkitArtifact.endsWith(".html")) {
      results.push(check(sha256(await readFile(target)) === tool.toolkitSha256, `artifact hash matches manifest: ${tool.id}`));
    } else if (existsSync(target)) {
      results.push(check((await treeHash(target)) === tool.toolkitSha256, `artifact hash matches manifest: ${tool.id}`));
    }
    if (tool.licenseFile) results.push(check(existsSync(join(publicRoot, tool.licenseFile)), `license copied: ${tool.id}`));
  }

  // Embed contract: the shell frames each embed-mode tool with its flag.
  for (const framed of ["/tools/redactorium/index.html?embed=1", "/tools/safeseed.html?embed=1", "/tools/privacy-wizards-council.html?embed=1", "/tools/objection-oracle.html"]) {
    results.push(check(index.includes(`data-src="${framed}`), `frame source wired: ${framed}`));
  }

  // Fonts: committed in-repo, present, and recorded.
  const fontNames = [
    "anton-400-latin.woff2",
    "archivo-400-latin.woff2",
    "archivo-700-latin.woff2",
    "spacegrotesk-400-latin.woff2",
    "spacegrotesk-600-latin.woff2",
    "spacegrotesk-700-latin.woff2"
  ];
  for (const font of fontNames) {
    const path = join(publicRoot, "fonts", font);
    results.push(check(existsSync(path), `self-hosted font exists: ${font}`));
    const record = manifest.fonts?.find((item) => item.file === font);
    if (existsSync(path) && record) {
      results.push(check(sha256(await readFile(path)) === record.sha256, `font matches its manifest hash: ${font}`));
    }
  }
  results.push(check(existsSync(join(publicRoot, "licenses", "lucide-static.txt")), "Lucide ISC attribution is bundled"));
  results.push(check(existsSync(join(publicRoot, "licenses", "af-fonts.txt")), "AF font licenses are bundled"));

  // Redactorium bundle hygiene.
  const redactoriumRoot = join(publicRoot, "tools", "redactorium");
  results.push(check(existsSync(join(redactoriumRoot, "pdf.worker.min.mjs")), "Redactorium PDF worker is local"));
  const redFiles = await readdir(join(redactoriumRoot, "static", "js"));
  const redCssFiles = await readdir(join(redactoriumRoot, "static", "css"));
  results.push(check(!redFiles.some((name) => name.endsWith(".map")) && !redCssFiles.some((name) => name.endsWith(".map")), "Redactorium source maps are omitted"));
  const redText = [await readFile(join(redactoriumRoot, "index.html"), "utf8")];
  for (const file of redFiles.filter((name) => name.endsWith(".js"))) redText.push(await readFile(join(redactoriumRoot, "static", "js", file), "utf8"));
  for (const file of redCssFiles.filter((name) => name.endsWith(".css"))) redText.push(await readFile(join(redactoriumRoot, "static", "css", file), "utf8"));
  const redBundle = redText.join("\n");
  results.push(check(!redBundle.includes("sourceMappingURL="), "Redactorium bundles do not reference omitted source maps"));
  for (const banned of ["fonts.googleapis.com", "fonts.gstatic.com", "assets.emergent.sh", "ap.emergent.sh", "posthog.init", "unpkg.com/pdfjs-dist"]) {
    results.push(check(!redBundle.includes(banned), `Redactorium contains no ${banned}`));
  }

  // Single-file artifacts hide their standalone chrome in Toolkit embed mode.
  const safeseed = await readFile(join(publicRoot, "tools", "safeseed.html"), "utf8");
  results.push(check(!safeseed.includes("url(/assets/fonts/"), "SafeSeed fonts resolve through the Toolkit font path"));
  results.push(check(!safeseed.includes("spacegrotesk-500-latin.woff2"), "SafeSeed does not request an unavailable 500 font file"));
  for (const id of ["safeseed", "privacy-wizards-council"]) {
    const html = await readFile(join(publicRoot, "tools", `${id}.html`), "utf8");
    results.push(check(/has\((?:"embed"|'embed'|`embed`)\)/.test(html), `${id} carries its native embed mode`));
  }
  const oracle = await readFile(join(publicRoot, "tools", "objection-oracle.html"), "utf8");
  results.push(check(!oracle.includes('class="site-bar"') && !oracle.includes('class="site-colophon"'), "Oracle embed artifact carries no standalone chrome"));
  results.push(check(oracle.includes("__oracleNetViolations"), "Oracle network kill-switch is present"));

  return results;
}
