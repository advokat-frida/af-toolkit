import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
export const candidateRoot = resolve(scriptDir, "..");
export const publicRoot = join(candidateRoot, "public");
const workspaceCandidates = [
  process.env.AF_WORKSPACE_ROOT ? resolve(process.env.AF_WORKSPACE_ROOT) : null,
  resolve(scriptDir, "../.."),
  resolve(scriptDir, "../../../..")
].filter(Boolean);
const workspaceRoot = workspaceCandidates.find((path) => existsSync(join(path, "website", "advokat-frida-theme", "assets", "fonts")));
const canonicalFontRoot = workspaceRoot ? join(workspaceRoot, "website", "advokat-frida-theme", "assets", "fonts") : null;

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
  const sync = await readFile(join(candidateRoot, "scripts", "sync-tools.mjs"), "utf8");
  const manifest = JSON.parse(await readFile(join(publicRoot, "tool-sources.json"), "utf8"));

  const routes = ["home", "redactorium", "safeseed", "privacy-wizards", "build-a-prompt", "objection-oracle"];
  for (const route of routes) {
    results.push(check(index.includes(`data-view="${route}"`), `view exists: ${route}`));
    results.push(check(index.includes(`data-route-link="${route}"`), `navigation exists: ${route}`));
  }

  results.push(check((index.match(/<h1\b/g) || []).length === 6, "one parent H1 per view", `found ${(index.match(/<h1\b/g) || []).length}`));
  results.push(check((index.match(/<iframe\b/g) || []).length === 5, "five tool frames", `found ${(index.match(/<iframe\b/g) || []).length}`));
  results.push(check((index.match(/title="[^"]+" data-tool-frame=/g) || []).length === 5, "every frame has a title"));
  results.push(check((index.match(/allow="clipboard-write"/g) || []).length === 3, "clipboard permission is limited to the three tools that copy output"));
  results.push(check(index.includes("aria-current") === false, "aria-current is runtime-owned"));
  results.push(check(js.includes('setAttribute("aria-current", "page")'), "active navigation announces current page"));
  results.push(check(js.includes("trapMenuFocus") && js.includes('event.key === "Escape"'), "mobile navigation traps and returns focus"));
  results.push(check(js.includes("try {") && js.includes("decodeURIComponent") && js.includes('return "";'), "malformed route encoding falls back to Home"));
  results.push(check(index.includes('<p class="eyebrow">ADVOKAT FRIDA</p>'), "Home eyebrow uses the exact approved ADVOKAT FRIDA label"));
  results.push(check(index.includes('<h1 id="home-title" tabindex="-1">THE TOOLKIT</h1>'), "Home title uses the exact approved THE TOOLKIT nameplate"));
  results.push(check(index.includes('<p class="home-lede">The privacy practitioners swiss army knife.</p>'), "Home lede uses the approved compact practitioner promise"));
  results.push(check(index.includes('<span class="brand-mark home-brand-mark" aria-hidden="true">AF</span>'), "AF tile sits in the Home header"));
  results.push(check(index.includes("What's on your desk today?") && !index.includes("Choose by the job"), "Home task question replaces the filler eyebrow"));

  for (const copy of [
    "Anonymize, hash, generalize, redact, or transform personal information.",
    "Generate fake personal information and generate a tamper-evident receipt.",
    "Get quick and citable answers for commonly recurring privacy questions.",
    "Build detailed, reusable prompts for any privacy task.",
    "Get pointers from a magic 8-ball on risk tolerance."
  ]) {
    results.push(check(index.includes(copy), `approved Home tool description exists: ${copy}`));
  }

  const retiredHomeClasses = [
    "sidebar-head",
    "sidebar-promise",
    "sidebar-foot",
    "status-dot",
    "announcement",
    "announcement-tag",
    "tool-status",
    "editorial-note",
    "nav-code"
  ];
  for (const className of retiredHomeClasses) {
    results.push(check(!index.includes(`class="${className}"`) && !css.includes(`.${className}`), `retired Home chrome is absent: ${className}`));
  }
  results.push(check(!index.includes('class="brand"') && !css.includes(".brand,"), "desktop sidebar brand block is absent"));

  const expectedNavIcons = ["house", "eraser", "sprout", "wand-sparkles", "message-square-code", "circle-dot"];
  results.push(check((index.match(/<span class="nav-icon" aria-hidden="true">/g) || []).length === 6, "six decorative navigation icon boxes"));
  results.push(check((index.match(/<svg class="lucide /g) || []).length === 6, "six inline Lucide navigation icons"));
  results.push(check((index.match(/focusable="false"/g) || []).length === 6, "navigation icons stay outside the focus order"));
  for (const icon of expectedNavIcons) {
    results.push(check(index.includes(`lucide-${icon}`), `Lucide navigation icon exists: ${icon}`));
  }

  results.push(check((index.match(/<details class="changelog-card">/g) || []).length === 1, "one native Toolkit changelog disclosure"));
  results.push(check(index.includes('<span class="eyebrow">Changelog</span>') && !index.includes("Minor changelog"), "Home uses the regular Changelog label"));
  results.push(check(!index.includes("Toolkit changes, in one place"), "Changelog summary omits the maintenance filler line"));
  results.push(check(index.includes('<section class="home-bottom" id="toolkit-changelog">'), "Changelog keeps its stable Home anchor"));
  results.push(check(/\.changelog-card\s*\{[^}]*width:\s*100%/s.test(css), "Changelog is explicitly full width"));
  results.push(check(css.includes("padding-left: 6px;"), "secondary card links keep clearance from the primary button"));
  results.push(check(css.includes("box-shadow: 4px 4px 0 var(--ink)"), "canonical 4px square shadow exists"));
  results.push(check(css.includes("border-radius: 0"), "rectangular controls are square"));
  results.push(check(css.includes("grid-template-columns: repeat(2, minmax(0, 1fr))"), "paired choices can share equal width"));
  results.push(check(!css.includes("Alfa Slab") && !css.includes("DM Serif") && !css.includes("Inter"), "rejected Redactorium font stack is absent"));
  results.push(check(!css.includes("feTurbulence") && !css.includes("fractalNoise"), "global grain is absent"));

  results.push(check(sync.includes("const embeddedTypeTheme"), "embedded tools share one Toolkit type theme"));
  for (const token of [
    "--tk-task-size:22px",
    "--tk-section-size:18px",
    "--tk-card-size:16px",
    "--tk-body-size:15px",
    "--tk-secondary-size:13px",
    "--tk-label-size:11px",
    "--tk-status-size:12px",
    "--tk-data-size:14px",
    "--tk-action-size:14px"
  ]) {
    results.push(check(sync.includes(token), `embedded type token exists: ${token}`));
  }
  results.push(check(sync.includes('--tk-font-reading:"Space Grotesk"') && sync.includes('--tk-font-label:"Archivo"'), "embedded reading and label families follow AF canon"));
  results.push(check(sync.includes('--tk-font-data:"SFMono-Regular"'), "embedded data role keeps a dedicated monospace family"));

  results.push(check(manifest.tools?.length === 5, "provenance manifest has five tools", `found ${manifest.tools?.length}`));
  results.push(check(manifest.schemaVersion === 2, "provenance manifest uses the repository schema"));
  results.push(check(manifest.releaseBoundary === "private-source-control-only", "manifest preserves the private repository boundary"));
  results.push(check(manifest.tools.find((tool) => tool.id === "redactorium")?.license === null, "Redactorium is not given a false license"));
  results.push(check(existsSync(join(publicRoot, "licenses", "lucide-static.txt")), "Lucide ISC attribution is bundled"));
  results.push(check(existsSync(join(publicRoot, "licenses", "af-fonts.txt")), "AF font licenses are bundled"));

  const expectedWorkingTree = new Map([
    ["redactorium", "clean"],
    ["safeseed", "committed-head"],
    ["privacy-wizards-council", "committed-head"],
    ["build-a-prompt", "committed-head"],
    ["objection-oracle", "committed-ref"]
  ]);

  for (const tool of manifest.tools) {
    const target = join(publicRoot, tool.toolkitArtifact);
    results.push(check(existsSync(target), `artifact exists: ${tool.id}`));
    results.push(check(tool.workingTree === expectedWorkingTree.get(tool.id), `artifact uses committed provenance: ${tool.id}`, `found ${tool.workingTree || "none"}`));
    if (tool.licenseFile) results.push(check(existsSync(join(publicRoot, tool.licenseFile)), `license copied: ${tool.id}`));
    if (tool.toolkitArtifact.endsWith(".html")) {
      const output = await readFile(target);
      results.push(check(sha256(output) === tool.toolkitSha256, `artifact hash matches manifest: ${tool.id}`));
      results.push(check(output.toString("utf8").includes('id="af-toolkit-adapter"'), `square-shadow adapter exists: ${tool.id}`));
    } else if (tool.id === "redactorium" && existsSync(target)) {
      results.push(check(await treeHash(target) === tool.toolkitSha256, "artifact hash matches manifest: redactorium"));
    }
  }

  const fontNames = [
    "anton-400-latin.woff2",
    "archivo-400-latin.woff2",
    "archivo-700-latin.woff2",
    "spacegrotesk-400-latin.woff2",
    "spacegrotesk-600-latin.woff2",
    "spacegrotesk-700-latin.woff2"
  ];
  for (const font of fontNames) {
    const toolkitFont = join(publicRoot, "fonts", font);
    const fontRecord = manifest.fonts?.find((item) => item.file === font);
    results.push(check(existsSync(toolkitFont), `self-hosted font exists: ${font}`));
    if (existsSync(toolkitFont) && fontRecord) {
      const toolkitBytes = await readFile(toolkitFont);
      results.push(check(fontRecord.repository === "website" && fontRecord.workingTree === "committed-head" && Boolean(fontRecord.revision) && Boolean(fontRecord.sourceArtifact), `font has committed source provenance: ${font}`));
      results.push(check(sha256(toolkitBytes) === fontRecord.sha256, `font matches its committed provenance: ${font}`));
      if (canonicalFontRoot) {
        const canonicalFont = join(canonicalFontRoot, font);
        const canonicalBytes = existsSync(canonicalFont) ? await readFile(canonicalFont) : null;
        results.push(check(Boolean(canonicalBytes) && sha256(toolkitBytes) === sha256(canonicalBytes), `font matches the local AF site byte-for-byte: ${font}`));
      }
    } else {
      results.push(check(false, `font matches its committed provenance: ${font}`, "font or provenance record is missing"));
    }
  }

  const redactoriumRoot = join(publicRoot, "tools", "redactorium");
  results.push(check(existsSync(join(redactoriumRoot, "pdf.worker.min.mjs")), "Redactorium PDF worker is local"));
  const redFiles = await readdir(join(redactoriumRoot, "static", "js"));
  const redCssFiles = await readdir(join(redactoriumRoot, "static", "css"));
  results.push(check(!redFiles.some((name) => name.endsWith(".map")) && !redCssFiles.some((name) => name.endsWith(".map")), "Redactorium source maps are omitted from the private distribution snapshot"));
  const redText = [await readFile(join(redactoriumRoot, "index.html"), "utf8")];
  for (const file of redFiles.filter((name) => name.endsWith(".js"))) redText.push(await readFile(join(redactoriumRoot, "static", "js", file), "utf8"));
  for (const file of redCssFiles.filter((name) => name.endsWith(".css"))) redText.push(await readFile(join(redactoriumRoot, "static", "css", file), "utf8"));
  const redBundle = redText.join("\n");
  results.push(check(!redBundle.includes("sourceMappingURL="), "Redactorium bundles do not reference omitted source maps"));
  for (const banned of ["fonts.googleapis.com", "fonts.gstatic.com", "assets.emergent.sh", "ap.emergent.sh", "posthog.init", "unpkg.com/pdfjs-dist"]) {
    results.push(check(!redBundle.includes(banned), `Redactorium contains no ${banned}`));
  }

  const safeseed = await readFile(join(publicRoot, "tools", "safeseed.html"), "utf8");
  const privacyWizards = await readFile(join(publicRoot, "tools", "privacy-wizards-council.html"), "utf8");
  const buildAPrompt = await readFile(join(publicRoot, "tools", "build-a-prompt.html"), "utf8");
  results.push(check(!safeseed.includes("url(/assets/fonts/"), "SafeSeed fonts resolve through the Toolkit font path"));
  results.push(check(!safeseed.includes("spacegrotesk-500-latin.woff2"), "SafeSeed does not request an unavailable 500 font file"));
  results.push(check(safeseed.includes(".gen-panel{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}"), "SafeSeed root panel is flattened inside the Toolkit"));
  results.push(check(privacyWizards.includes(".finder-stage,.determination-shell{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}"), "Privacy Wizards root stages are flattened inside the Toolkit"));
  results.push(check(buildAPrompt.includes(".start-stage{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}"), "Build-A-Prompt root stage is flattened inside the Toolkit"));
  results.push(check(safeseed.includes(".field-name,.field-type,.num-ctl input{min-height:44px!important;font-family:var(--tk-font-reading)!important;font-size:var(--tk-body-size)!important;font-weight:400!important"), "SafeSeed field names and field types share one editable-control role"));
  results.push(check(safeseed.includes(".field-name,.field-type,.num-ctl input{font-size:16px!important}"), "SafeSeed restores the 16px editable-control step on small screens"));
  results.push(check(privacyWizards.includes(".search-wrap input{font-size:16px!important}"), "Privacy Wizards restores the 16px finder step on small screens"));
  results.push(check(buildAPrompt.includes(".start-stage>textarea{height:112px!important;min-height:112px!important;font-size:16px!important}"), "Build-A-Prompt restores the 16px work-request step on small screens"));
  results.push(check(privacyWizards.includes(".question-card,.outcome-card{box-shadow:4px 4px 0 #16140f!important"), "Privacy Wizards keeps shadows on meaningful decision cards"));
  results.push(check(buildAPrompt.includes(".review{box-shadow:4px 4px 0 #16140f!important"), "Build-A-Prompt keeps a shadow on its meaningful review card"));
  results.push(check(redBundle.includes("[data-toolkit-embedded=true] h2") && redBundle.includes("font-size:1.375rem"), "Redactorium keeps every embedded h2 at the 22px task step"));
  results.push(check(redBundle.includes("[data-toolkit-embedded=true] h3") && redBundle.includes("font-size:1.125rem"), "Redactorium keeps every embedded h3 at the 18px section step"));
  results.push(check(redBundle.includes("font-size:.875rem") && redBundle.includes("font-family:Archivo"), "Redactorium embedded actions use the compact Archivo action role"));
  return results;
}
