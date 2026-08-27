import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const candidateRoot = resolve(scriptDir, "..");
const requiredWorkspaceDirectories = ["redactorium", "safeseed", "privacy-wizards-council", "build-a-prompt", "objection-oracle", "website"];

function isWorkspaceRoot(path) {
  return requiredWorkspaceDirectories.every((directory) => existsSync(join(path, directory)));
}

function findWorkspaceRoot() {
  if (process.env.AF_WORKSPACE_ROOT) {
    const configured = resolve(process.env.AF_WORKSPACE_ROOT);
    if (!isWorkspaceRoot(configured)) {
      throw new Error(`AF_WORKSPACE_ROOT is not an Advokat Frida workspace: ${configured}`);
    }
    return configured;
  }
  const inferred = [resolve(scriptDir, "../.."), resolve(scriptDir, "../../../..")].find(isWorkspaceRoot);
  if (!inferred) {
    throw new Error("Tool synchronization requires the sibling Advokat Frida source repositories. Set AF_WORKSPACE_ROOT to that workspace; normal start and QA do not require it.");
  }
  return inferred;
}

const workspaceRoot = findWorkspaceRoot();
const publicRoot = join(candidateRoot, "public");
const stageRoot = join(candidateRoot, `.sync-stage-${process.pid}`);
const generatedPublicRoot = join(stageRoot, "public");
const toolsRoot = join(generatedPublicRoot, "tools");
const fontsRoot = join(generatedPublicRoot, "fonts");
const licensesRoot = join(generatedPublicRoot, "licenses");

const expected = {
  redactorium: "19511d72f5304383b2cd84a83614a0bc9c87a7efab3b5b1e16108d3539a2108b",
  safeseed: "9249f6b46fcef2f36ad4a75483336622d0082b8e3b43f77a7c54d527c48f20b6",
  "build-a-prompt": "994e4bf37c023aa453e497f2534d09fc0be8cc5b13fd589a1c146aaa5c4953f4",
  "privacy-wizards-council": "8191573efa0b464776570b8f05b66e3aa84b1e73279be55b731bbb6d38ff1dbe",
  "objection-oracle": "e98719a84e5c1e7d3d58b442ba38fda0b9184564268d439aa7501aab1af668b8"
};

const embeddedTypeTheme = `
  :root{
    --tk-font-reading:"Space Grotesk",system-ui,-apple-system,"Segoe UI",sans-serif;
    --tk-font-label:"Archivo",system-ui,-apple-system,"Segoe UI",sans-serif;
    --tk-font-data:"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace;
    --tk-task-size:22px;
    --tk-section-size:18px;
    --tk-card-size:16px;
    --tk-body-size:15px;
    --tk-secondary-size:13px;
    --tk-label-size:11px;
    --tk-status-size:12px;
    --tk-data-size:14px;
    --tk-action-size:14px;
  }
  html{font-size:16px!important}
  body{font-family:var(--tk-font-reading)!important;font-size:var(--tk-body-size)!important;line-height:1.5!important;font-synthesis:none!important}
`;

const adapters = {
  "build-a-prompt": `
<style id="af-toolkit-adapter">
  ${embeddedTypeTheme}
  .site-bar,.colophon{display:none!important}
  body{background:#f6f4ef!important}
  main{width:100%!important;max-width:none!important;margin:0!important;padding:16px 22px 28px!important}
  .orientation{display:none!important}
  .start-stage,.recipe-panel,.part-card,.composer,.review,.notice,.fallback-panel{border-radius:0!important}
  .review{box-shadow:4px 4px 0 #16140f!important;margin-right:4px!important;margin-bottom:4px!important}
  .start-stage{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
  .field-heading h2,.workspace-head h2,.review-head h2{font-family:var(--tk-font-reading)!important;font-size:var(--tk-task-size)!important;font-weight:700!important;line-height:1.15!important}
  .recipe-panel h3,.advanced-content h3{font-family:var(--tk-font-reading)!important;font-size:var(--tk-section-size)!important;font-weight:700!important;line-height:1.2!important}
  .part-copy strong{font-family:var(--tk-font-reading)!important;font-size:var(--tk-card-size)!important;font-weight:700!important;line-height:1.25!important}
  .start-stage>textarea{height:132px!important;min-height:132px!important;padding:12px!important;font-size:var(--tk-body-size)!important}
  .field-help{margin-top:6px!important}
  .start-actions{margin-top:12px!important}
  .recipe-panel{margin-top:14px!important;padding:16px!important}
  .field-help,.recipe-row small,.part-copy small,.radio-card small,.switch-row small,.suggestion-note,.privacy-note,.part-hint,.warning,.advanced-toggle small{font-family:var(--tk-font-reading)!important;font-size:var(--tk-secondary-size)!important;font-weight:400!important;line-height:1.5!important}
  .eyebrow,.step-label,.required-label,.patch-date,.part-number,.optional{font-family:var(--tk-font-label)!important;font-size:var(--tk-label-size)!important;font-weight:700!important;line-height:1.3!important}
  .suggested,.part-state,.mini-pill,.chip,.step-badge,.advanced-tabs button{font-family:var(--tk-font-label)!important;font-size:var(--tk-status-size)!important;font-weight:600!important;line-height:1.2!important}
  .radio-card,.switch-row,.check-row{font-family:var(--tk-font-reading)!important;font-size:var(--tk-body-size)!important;font-weight:400!important;line-height:1.5!important}
  input,textarea,select,.prompt-sheet{font-family:var(--tk-font-reading)!important;font-size:var(--tk-body-size)!important;font-weight:400!important}
  .button,.text-button{font-family:var(--tk-font-label)!important;font-size:var(--tk-action-size)!important;font-weight:700!important;line-height:1.2!important}
  .workspace{gap:16px!important}
  .composer,.review{padding:16px!important}
  .composer-intro{margin-bottom:12px!important}
  .part-summary{min-height:56px!important;padding:6px 10px!important}
  .part-panel,.advanced-content{padding:14px!important}
  .prompt-sheet{height:min(52vh,520px)!important;min-height:320px!important;max-height:520px!important;font-size:var(--tk-body-size)!important}
  .button.compact,.text-button,.icon-button{min-height:44px!important}
  .button.primary{border-color:#16140f!important;border-radius:0!important;box-shadow:4px 4px 0 #16140f!important}
  .button.primary:active{box-shadow:none!important;transform:translate(4px,4px)!important}
  .button.secondary,textarea,input,select{border-radius:0!important}
  @media(max-width:640px){
    main{width:100%!important;padding:10px 10px 18px!important}
    input,textarea,select,.prompt-sheet{font-size:16px!important}
    .start-stage>textarea{height:112px!important;min-height:112px!important;font-size:16px!important}
    .start-actions{gap:8px!important}
  }
</style>`,
  "privacy-wizards-council": `
<style id="af-toolkit-adapter">
  ${embeddedTypeTheme}
  .site-bar,.colophon{display:none!important}
  body{background:#f6f4ef!important}
  main{width:100%!important;max-width:none!important;margin:0!important;padding:16px 22px 28px!important}
  .orientation{display:none!important}
  .finder-stage,.determination-shell,.question-card,.outcome-card,.unavailable-card,.wizard-card,.source-layer,.source-card,.legal-gate{border-radius:0!important}
  .question-card,.outcome-card{box-shadow:4px 4px 0 #16140f!important;margin-right:4px!important;margin-bottom:4px!important}
  .finder-stage,.determination-shell{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
  .finder-head h2,.question-card h3,.outcome-card h2,.outcome-card h3,.integrity-error h2{font-family:var(--tk-font-reading)!important;font-size:var(--tk-task-size)!important;font-weight:700!important;line-height:1.15!important}
  .empty-state h3,.unavailable-card h3{font-family:var(--tk-font-reading)!important;font-size:var(--tk-section-size)!important;font-weight:700!important;line-height:1.2!important}
  .source-card h4{font-family:var(--tk-font-reading)!important;font-size:var(--tk-card-size)!important;font-weight:700!important;line-height:1.25!important}
  .search-wrap{min-height:48px!important}
  .search-wrap input,input,select,textarea{min-height:44px!important;font-family:var(--tk-font-reading)!important;font-size:var(--tk-body-size)!important;font-weight:400!important}
  .category-row{margin-top:10px!important;gap:6px!important}
  .category-row button{min-height:44px!important;font-family:var(--tk-font-label)!important;font-size:var(--tk-status-size)!important;font-weight:700!important}
  .legal-gate{margin-top:12px!important;padding:8px 12px!important}
  .legal-gate p,.wizard-copy small,.question-help,.answer-card small,.legal-status small,.why-disclosure p,.source-intro,.privacy-boundary,.exit-boundary{font-family:var(--tk-font-reading)!important;font-size:var(--tk-secondary-size)!important;font-weight:400!important;line-height:1.5!important}
  .library-heading{margin-top:16px!important}
  .library-heading h3{font-family:var(--tk-font-reading)!important;font-size:var(--tk-section-size)!important;font-weight:700!important;line-height:1.2!important}
  .title-cluster h2,.source-head h3{font-family:var(--tk-font-reading)!important;font-size:var(--tk-section-size)!important;font-weight:700!important;line-height:1.2!important}
  .library-heading a{min-height:44px!important;display:inline-flex!important;align-items:center!important}
  .wizard-list{margin-top:8px!important;gap:8px!important}
  .wizard-card{min-height:78px!important;padding:8px 10px!important;gap:8px!important}
  .wizard-icon{width:36px!important;height:36px!important}
  .wizard-copy strong{font-family:var(--tk-font-reading)!important;font-size:var(--tk-card-size)!important;font-weight:700!important;line-height:1.3!important}
  .eyebrow,.step-label,.patch-date,.card-meta,.status-kicker,.question-count,.tier-label,.draft-label,.source-meta,.panel-kicker,.answer-letter,.legal-status span{font-family:var(--tk-font-label)!important;font-size:var(--tk-label-size)!important;font-weight:700!important;line-height:1.35!important}
  .review-badge,.source-status{min-height:24px!important;max-width:max-content!important;padding:4px 8px!important;white-space:nowrap!important;font-family:var(--tk-font-label)!important;font-size:var(--tk-status-size)!important;font-weight:700!important;line-height:1.2!important}
  .count-badge,.outcome-tabs button{font-family:var(--tk-font-label)!important;font-size:var(--tk-status-size)!important;font-weight:600!important;line-height:1.2!important}
  .answer-card,.outcome-summary{font-family:var(--tk-font-reading)!important;font-size:var(--tk-body-size)!important;font-weight:400!important;line-height:1.5!important}
  .answer-card strong{font-size:var(--tk-body-size)!important;font-weight:700!important}
  .why-disclosure summary,.source-text summary,.selected-facts>summary{font-family:var(--tk-font-label)!important;font-size:var(--tk-secondary-size)!important;font-weight:700!important;line-height:1.3!important}
  .button,.text-button{font-family:var(--tk-font-label)!important;font-size:var(--tk-action-size)!important;font-weight:700!important;line-height:1.2!important}
  .button.compact,.text-button,.icon-button{min-height:44px!important}
  .wizard-card{box-shadow:3px 3px 0 #16140f!important;margin-right:3px!important;margin-bottom:3px!important}
  .button.primary{border-color:#16140f!important;border-radius:0!important;box-shadow:4px 4px 0 #16140f!important}
  .button.primary:active{box-shadow:none!important;transform:translate(4px,4px)!important}
  .button.secondary,input,select,textarea{border-radius:0!important}
  @media(min-width:900px){
    .wizard-list{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    .wizard-card{grid-template-columns:36px minmax(0,1fr) 20px!important}
    .review-badge{grid-column:2!important;justify-self:start!important}
    .card-arrow{grid-column:3!important;grid-row:1 / span 2!important}
  }
  @media(max-width:640px){
    main{width:100%!important;padding:10px 10px 18px!important}
    input,select,textarea{font-size:16px!important}
    .search-wrap input{font-size:16px!important}
    .question-card,.outcome-card{padding:12px!important;margin-right:4px!important}
    .legal-gate{grid-template-columns:26px minmax(0,1fr)!important;gap:8px!important}
    .library-heading{margin-top:12px!important}
    .review-badge{display:none!important}
  }
  @media(max-width:390px){
    .finder-head .step-label,.finder-head .count-badge{display:none!important}
    .category-row{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;padding-bottom:2px!important;scrollbar-width:thin!important}
    .category-row button{flex:0 0 auto!important}
    .library-heading{align-items:flex-end!important;flex-direction:row!important}
  }
</style>`,
  safeseed: `
<style id="af-toolkit-adapter">
  ${embeddedTypeTheme}
  .site-bar,.site-colophon{display:none!important}
  body{background:#f6f4ef!important}
  .site{width:100%!important;max-width:none!important;margin:0!important;padding:0 22px!important}
  .site-main{width:100%!important;max-width:none!important;margin:0!important;padding:16px 0 28px!important}
  .gen-main{gap:12px!important}
  .gen-intro>.eyebrow,.gen-intro>h1,.gen-intro>.gen-lede,.gen-intro>.gen-boundary,.gen-intro>.gen-changelog{display:none!important}
  .gen-panel,.gen-table-wrap,.verify-result,.gen-note,.file-drop,.preset-btn,.gen-modes{border-radius:0!important}
  .verify-result{box-shadow:4px 4px 0 #16140f!important;margin-right:4px!important;margin-bottom:4px!important}
  .gen-panel{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
  .gen-panel+.gen-panel{padding-top:18px!important;border-top:2px solid #16140f!important}
  .gen-panel-head{margin-bottom:10px!important}
  .gen-panel-head h2{font-family:var(--tk-font-reading)!important;font-size:var(--tk-section-size)!important;font-weight:700!important;line-height:1.2!important}
  .gen-panel-head p,.gen-presets-head span,.gen-hint,.preset-status,.derived-note,.gen-note,.file-drop-name,.download-boundary{font-family:var(--tk-font-reading)!important;font-size:var(--tk-secondary-size)!important;font-weight:400!important;line-height:1.5!important}
  .gen-presets{margin-bottom:12px!important;padding-bottom:12px!important}
  .gen-presets-head{margin-bottom:8px!important}
  .gen-presets-head p{font-family:var(--tk-font-label)!important;font-size:var(--tk-label-size)!important;font-weight:700!important;line-height:1.4!important;letter-spacing:.08em!important;text-transform:uppercase!important}
  .preset-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important}
  .preset-btn{position:relative!important;min-height:44px!important;padding:8px 10px!important;font-family:var(--tk-font-reading)!important;font-size:var(--tk-body-size)!important;font-weight:700!important;line-height:1.25!important}
  .preset-btn span{position:absolute!important;width:1px!important;height:1px!important;margin:-1px!important;padding:0!important;overflow:hidden!important;clip-path:inset(50%)!important;white-space:nowrap!important}
  .preset-status{margin-top:6px!important}
  .field-list{gap:6px!important}
  .field-name,.field-type,.num-ctl input{min-height:44px!important;font-family:var(--tk-font-reading)!important;font-size:var(--tk-body-size)!important;font-weight:400!important;line-height:1.35!important}
  .tier-chip{font-family:var(--tk-font-label)!important;font-size:var(--tk-status-size)!important;font-weight:600!important;line-height:1.2!important}
  .btn,.gen-mode{font-family:var(--tk-font-label)!important;font-size:var(--tk-action-size)!important;font-weight:700!important;line-height:1.2!important}
  .file-drop-label,.verify-checks li,.tier-key li,.verify-scope{font-family:var(--tk-font-reading)!important;font-size:var(--tk-body-size)!important;line-height:1.5!important}
  .verify-verdict{font-family:var(--tk-font-reading)!important;font-size:var(--tk-section-size)!important;font-weight:700!important;line-height:1.2!important}
  .gen-table th{font-family:var(--tk-font-label)!important;font-size:var(--tk-label-size)!important;font-weight:700!important}
  .gen-table td{font-family:var(--tk-font-data)!important;font-size:var(--tk-data-size)!important;font-weight:400!important}
  .btn-primary{border-color:#16140f!important;border-radius:0!important;box-shadow:4px 4px 0 #16140f!important}
  .btn-primary:active{box-shadow:none!important;transform:translate(4px,4px)!important}
  .gen-modes{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;width:min(100%,24rem)!important;padding:0!important}
  .gen-mode{width:100%!important;min-height:44px!important;padding:6px 12px!important;border-radius:0!important}
  input,select,.btn{border-radius:0!important}
  .tier-chip{border-radius:999px!important}
  @media(max-width:640px){
    .site{padding:0 10px!important}
    .site-main{padding:10px 0 18px!important}
    .field-name,.field-type,.num-ctl input{font-size:16px!important}
    .gen-main{gap:10px!important}
    .verify-result{padding:12px!important;margin-right:4px!important}
    .preset-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  }
</style>`,
  "objection-oracle": `
<style id="af-toolkit-adapter">
  ${embeddedTypeTheme}
  html,body{background:#f6f4ef!important}
  #main{padding:10px 12px 18px!important}
  .oo-panel,.panel,.oo-receipt-card{border-radius:0!important}
  .oo-panel{box-shadow:4px 4px 0 #16140f!important;margin-right:4px!important;margin-bottom:4px!important}
  .oo-stage{grid-template-columns:minmax(220px,.65fr) minmax(480px,1.35fr)!important;gap:24px!important}
  .oo-visual{padding:0!important}
  .oo-ball{width:min(100%,270px)!important}
  .oo-caption{max-width:270px!important;margin-top:12px!important;font-size:var(--tk-secondary-size)!important}
  .oo-panel{min-height:360px!important;padding:20px!important}
  .oo-view-title,.oo-question,.oo-result-title{font-family:var(--tk-font-reading)!important;font-size:var(--tk-task-size)!important;font-weight:700!important;line-height:1.15!important}
  .oo-view-title{margin-bottom:8px!important}
  .oo-view>.eyebrow{font-size:var(--tk-label-size)!important}
  .oo-view>p:not(.eyebrow):not(.oo-ruling-tag):not(.oo-result-quip){font-size:var(--tk-body-size)!important;margin-bottom:12px!important}
  .oo-outcome-key{margin-top:14px!important}
  .oo-main-action{min-height:50px!important;margin-top:16px!important}
  .oo-help,.oo-rationale dd,.oo-result-quip{font-family:var(--tk-font-reading)!important;font-size:var(--tk-body-size)!important;line-height:1.5!important}
  .oo-main-action,.oo-result-actions .btn,.oo-start-over{font-family:var(--tk-font-label)!important;font-size:var(--tk-action-size)!important;font-weight:700!important;line-height:1.2!important}
  .oo-answer-chip b,.oo-key,.oo-progress-label,.oo-ruling-tag,.oo-receipt-card summary{font-family:var(--tk-font-label)!important;font-size:var(--tk-status-size)!important;font-weight:700!important;line-height:1.2!important}
  .oo-receipt-card pre{font-family:var(--tk-font-data)!important;font-size:var(--tk-data-size)!important;font-weight:400!important;line-height:1.5!important}
  .oo-start-over{min-height:44px!important}
  .btn.primary{border-color:#16140f!important;border-radius:0!important;box-shadow:4px 4px 0 #16140f!important}
  .btn.primary:active{box-shadow:none!important;transform:translate(4px,4px)!important}
  .btn.secondary{border-radius:0!important}
  .oo-key{border-radius:999px!important}
  @media(max-width:860px){
    #main{padding:8px 6px 14px!important}
    .oo-stage{grid-template-columns:1fr!important;gap:12px!important}
    .oo-visual{position:static!important}
    .oo-ball{width:clamp(132px,38vw,150px)!important}
    .oo-caption{max-width:240px!important;margin-top:8px!important}
    .oo-panel{min-height:0!important;padding:14px!important}
    .oo-outcome-key{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;margin-top:10px!important}
    .oo-main-action{margin-top:12px!important}
  }
  @media(max-width:360px){
    .oo-caption{display:none!important}
    .oo-view>.eyebrow{font-size:var(--tk-label-size)!important}
  }
</style>`
};

function assertInside(base, target) {
  const rel = relative(resolve(base), resolve(target));
  if (!rel || rel.startsWith("..") || rel.includes(":")) {
    throw new Error(`Refusing generated-file operation outside ${base}: ${target}`);
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function git(repo, args) {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
}

function gitBytes(repo, args) {
  return execFileSync("git", args, { cwd: repo, maxBuffer: 64 * 1024 * 1024 });
}

function injectAdapter(html, adapter) {
  const index = html.lastIndexOf("</head>");
  if (index < 0) throw new Error("Portable artifact has no closing head tag.");
  return `${html.slice(0, index)}${adapter}\n${html.slice(index)}`;
}

function normalizeText(value) {
  return value.replace(/[ \t]+$/gm, "").replace(/\n+$/, "\n");
}

async function writeDerived({ id, repoName, inputPath, outputName, revisionRef = "HEAD", adapter, transform }) {
  const repo = join(workspaceRoot, repoName);
  let source = gitBytes(repo, ["show", `${revisionRef}:${inputPath.replaceAll("\\", "/")}`]);
  const sourceSha256 = sha256(source);
  if (expected[id] && sourceSha256 !== expected[id]) {
    throw new Error(`${id} source artifact hash changed: expected ${expected[id]}, got ${sourceSha256}`);
  }
  let html = source.toString("utf8");
  if (transform) html = transform(html);
  const output = normalizeText(injectAdapter(html, adapter));
  const outputPath = join(toolsRoot, outputName);
  await writeFile(outputPath, output);
  return {
    id,
    repository: repoName,
    revision: git(repo, ["rev-parse", revisionRef]),
    workingTree: revisionRef === "HEAD" ? "committed-head" : "committed-ref",
    sourceArtifact: inputPath.replaceAll("\\", "/"),
    sourceSha256,
    toolkitArtifact: `tools/${outputName}`,
    toolkitSha256: sha256(output),
    license: "MIT",
    licenseFile: `licenses/${id}.txt`
  };
}

async function walkFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const output = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(current, entry.name);
    if (entry.isDirectory()) output.push(...await walkFiles(root, path));
    else if (entry.isFile()) output.push(path);
  }
  return output;
}

async function treeHash(root) {
  const hash = createHash("sha256");
  for (const file of await walkFiles(root)) {
    hash.update(relative(root, file).replaceAll("\\", "/"));
    hash.update("\0");
    hash.update(await readFile(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

async function pruneSourceMaps(root) {
  for (const file of await walkFiles(root)) {
    if (file.endsWith(".map")) {
      await rm(file, { force: true });
      continue;
    }
    if (!file.endsWith(".js") && !file.endsWith(".css")) continue;
    const original = await readFile(file, "utf8");
    const cleaned = original
      .replace(/\n?\/\/# sourceMappingURL=.*?(?:\r?\n|$)/g, "\n")
      .replace(/\/\*# sourceMappingURL=.*?\*\//g, "");
    if (cleaned !== original) await writeFile(file, cleaned);
  }
}

async function normalizeTextFiles(root) {
  const textExtensions = new Set([".css", ".html", ".js", ".json", ".mjs", ".txt"]);
  for (const file of await walkFiles(root)) {
    if (!textExtensions.has(extname(file).toLowerCase())) continue;
    const original = await readFile(file, "utf8");
    const cleaned = normalizeText(original);
    if (cleaned !== original) await writeFile(file, cleaned);
  }
}

async function copyLicense(repoName, outputName, revisionRef = "HEAD") {
  const repo = join(workspaceRoot, repoName);
  const source = gitBytes(repo, ["show", `${revisionRef}:LICENSE`]);
  await writeFile(join(licensesRoot, outputName), source);
}

function assertClean(repo, label) {
  const status = git(repo, ["status", "--porcelain"]);
  if (status) throw new Error(`${label} must be clean before its browser bundle is synchronized.`);
}

async function installGeneratedOutput() {
  const backupRoot = join(candidateRoot, `.sync-backup-${process.pid}`);
  const generatedNames = ["tools", "fonts", "licenses", "tool-sources.json"];
  assertInside(candidateRoot, backupRoot);
  await rm(backupRoot, { recursive: true, force: true });
  await mkdir(backupRoot, { recursive: true });
  const backedUp = [];
  const installed = [];

  try {
    for (const name of generatedNames) {
      const current = join(publicRoot, name);
      if (existsSync(current)) {
        await rename(current, join(backupRoot, name));
        backedUp.push(name);
      }
    }
    for (const name of generatedNames) {
      await rename(join(generatedPublicRoot, name), join(publicRoot, name));
      installed.push(name);
    }
  } catch (error) {
    try {
      for (const name of installed.reverse()) {
        const current = join(publicRoot, name);
        if (existsSync(current)) await rm(current, { recursive: true, force: true });
      }
      for (const name of backedUp.reverse()) {
        await rename(join(backupRoot, name), join(publicRoot, name));
      }
      await rm(backupRoot, { recursive: true, force: true });
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        `Generated-output install and rollback both failed. Recovery data is preserved at ${backupRoot}.`
      );
    }
    throw error;
  }
  await rm(backupRoot, { recursive: true, force: true });
}

async function main() {
  const redactoriumRepo = join(workspaceRoot, "redactorium");
  const redactoriumFrontend = join(redactoriumRepo, "frontend");
  assertClean(redactoriumRepo, "Redactorium");

  assertInside(candidateRoot, stageRoot);
  await rm(stageRoot, { recursive: true, force: true });
  for (const target of [toolsRoot, fontsRoot, licensesRoot]) {
    assertInside(stageRoot, target);
    await mkdir(target, { recursive: true });
  }

  try {
  if (process.platform === "win32") {
    execFileSync(process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe", ["/d", "/s", "/c", "npm.cmd run build"], { cwd: redactoriumFrontend, stdio: "inherit" });
  } else {
    execFileSync("npm", ["run", "build"], { cwd: redactoriumFrontend, stdio: "inherit" });
  }

  const redactoriumBuild = join(redactoriumFrontend, "build");
  const redactoriumSourceSha256 = await treeHash(redactoriumBuild);
  if (redactoriumSourceSha256 !== expected.redactorium) {
    throw new Error(`redactorium source artifact hash changed: expected ${expected.redactorium}, got ${redactoriumSourceSha256}`);
  }
  assertClean(redactoriumRepo, "Redactorium");
  const redactoriumOutput = join(toolsRoot, "redactorium");
  await cp(redactoriumBuild, redactoriumOutput, { recursive: true });
  await pruneSourceMaps(redactoriumOutput);
  await normalizeTextFiles(redactoriumOutput);

  const records = [];
  records.push({
    id: "redactorium",
    repository: "redactorium",
    revision: git(redactoriumRepo, ["rev-parse", "HEAD"]),
    workingTree: "clean",
    sourceArtifact: "frontend/build/",
    sourceSha256: redactoriumSourceSha256,
    toolkitArtifact: "tools/redactorium/",
    toolkitSha256: await treeHash(redactoriumOutput),
    license: null,
    licenseFile: null,
    note: "No license file exists in the source repository; no license is asserted by the Toolkit."
  });

  records.push(await writeDerived({
    id: "safeseed",
    repoName: "safeseed",
    inputPath: "demo/safeseed-generator.html",
    outputName: "safeseed.html",
    adapter: adapters.safeseed,
    transform: (html) => html
      .replace(/@font-face\{font-family:Space Grotesk;font-style:normal;font-weight:500;font-display:swap;src:url\(\/assets\/fonts\/spacegrotesk-500-latin\.woff2\)format\("woff2"\)\}/, "")
      .replaceAll("url(/assets/fonts/", "url(/fonts/")
  }));

  records.push(await writeDerived({
    id: "privacy-wizards-council",
    repoName: "privacy-wizards-council",
    inputPath: "dist/wizards.html",
    outputName: "privacy-wizards-council.html",
    adapter: adapters["privacy-wizards-council"]
  }));

  records.push(await writeDerived({
    id: "build-a-prompt",
    repoName: "build-a-prompt",
    inputPath: "dist/prompt-builder.html",
    outputName: "build-a-prompt.html",
    adapter: adapters["build-a-prompt"]
  }));

  const oracleRepo = join(workspaceRoot, "objection-oracle");
  const oracleSource = gitBytes(oracleRepo, ["show", "origin/main:dist/objection-oracle-embed.html"]);
  const oracleSourceSha256 = sha256(oracleSource);
  if (oracleSourceSha256 !== expected["objection-oracle"]) {
    throw new Error(`objection-oracle source artifact hash changed: expected ${expected["objection-oracle"]}, got ${oracleSourceSha256}`);
  }
  const oracleOutput = normalizeText(injectAdapter(oracleSource.toString("utf8"), adapters["objection-oracle"]));
  await writeFile(join(toolsRoot, "objection-oracle.html"), oracleOutput);
  records.push({
    id: "objection-oracle",
    repository: "objection-oracle",
    revision: git(oracleRepo, ["rev-parse", "origin/main"]),
    workingTree: "committed-ref",
    sourceArtifact: "origin/main:dist/objection-oracle-embed.html",
    sourceSha256: oracleSourceSha256,
    toolkitArtifact: "tools/objection-oracle.html",
    toolkitSha256: sha256(oracleOutput),
    license: "MIT",
    licenseFile: "licenses/objection-oracle.txt"
  });

  const websiteRepo = join(workspaceRoot, "website");
  const websiteRevision = git(websiteRepo, ["rev-parse", "HEAD"]);
  const fontSourceRoot = "style-bible/src/assets/fonts";
  const fontNames = [
    "anton-400-latin.woff2",
    "archivo-400-latin.woff2",
    "archivo-700-latin.woff2",
    "spacegrotesk-400-latin.woff2",
    "spacegrotesk-600-latin.woff2",
    "spacegrotesk-700-latin.woff2"
  ];
  const fonts = [];
  for (const font of fontNames) {
    const sourceArtifact = `${fontSourceRoot}/${font}`;
    const source = gitBytes(websiteRepo, ["show", `HEAD:${sourceArtifact}`]);
    await writeFile(join(fontsRoot, font), source);
    fonts.push({
      file: font,
      repository: "website",
      revision: websiteRevision,
      workingTree: "committed-head",
      sourceArtifact,
      sha256: sha256(source)
    });
  }

  await copyLicense("safeseed", "safeseed.txt");
  await copyLicense("privacy-wizards-council", "privacy-wizards-council.txt");
  await copyLicense("build-a-prompt", "build-a-prompt.txt");
  await copyLicense("objection-oracle", "objection-oracle.txt", "origin/main");
  await cp(join(candidateRoot, "assets", "licenses", "lucide-static.txt"), join(licensesRoot, "lucide-static.txt"));
  await cp(join(candidateRoot, "assets", "licenses", "af-fonts.txt"), join(licensesRoot, "af-fonts.txt"));

  const manifest = {
    schemaVersion: 2,
    product: "The Advokat Frida Toolkit",
    generatedAt: new Date().toISOString(),
    releaseBoundary: "private-source-control-only",
    tools: records,
    fonts
  };
  await writeFile(join(generatedPublicRoot, "tool-sources.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await installGeneratedOutput();
  process.stdout.write(`Synchronized ${records.length} tools into ${relative(workspaceRoot, publicRoot)}.\n`);
  } finally {
    await rm(stageRoot, { recursive: true, force: true });
  }
}

await main();
