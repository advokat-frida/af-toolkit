// Stage every tool's portable artifact from its in-repo source folder into
// public/tools/, and write the provenance manifest. This replaced the cross-repo
// sync when the tool sources moved into this repository (2026-08-31): each tool
// folder is authoritative, its own build produces the artifact, and this script
// only stages, transforms paths for the Toolkit origin, hashes, and records.
//
//   node scripts/build-tools.mjs            stage committed artifacts
//   node scripts/build-tools.mjs --build    run each tool's build first
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = join(repoRoot, "public");
const toolsRoot = join(publicRoot, "tools");
const licensesRoot = join(publicRoot, "licenses");
const runBuilds = process.argv.includes("--build");

const TOOLS = [
  {
    id: "redactorium",
    folder: "redactorium",
    artifact: "frontend/build",
    kind: "tree",
    output: "redactorium",
    build: "npm run build --prefix frontend",
    buildEnv: { CI: "false" },
    license: null,
    note: "No license file exists in the tool source; no license is asserted by the Toolkit."
  },
  {
    id: "safeseed",
    folder: "safeseed",
    artifact: "demo/safeseed-generator.html",
    kind: "file",
    output: "safeseed.html",
    build: "npm run build:standalone:generator --prefix demo && node -e \"require('fs').copyFileSync('demo/standalone-generator/generator.html','demo/safeseed-generator.html')\"",
    license: "LICENSE",
    transform: (html) => html
      .replace(/@font-face\{font-family:Space Grotesk;font-style:normal;font-weight:500;font-display:swap;src:url\(\/assets\/fonts\/spacegrotesk-500-latin\.woff2\)format\("woff2"\)\}/, "")
      .replaceAll("url(/assets/fonts/", "url(/fonts/")
  },
  {
    id: "objection-oracle",
    folder: "objection-oracle",
    artifact: "dist/objection-oracle-embed.html",
    kind: "file",
    output: "objection-oracle.html",
    build: "node tools/build.mjs",
    license: "LICENSE"
  },
  {
    id: "privacy-wizards-council",
    folder: "privacy-wizards-council",
    artifact: "dist/wizards.html",
    kind: "file",
    output: "privacy-wizards-council.html",
    build: "npm run build",
    license: "LICENSE"
  },
  {
    id: "build-a-prompt",
    folder: "build-a-prompt",
    artifact: "dist/prompt-builder.html",
    kind: "file",
    output: "build-a-prompt.html",
    build: "npm run build",
    license: "LICENSE"
  }
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function walkFiles(root, current = root) {
  const output = [];
  for (const entry of (await readdir(current, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(current, entry.name);
    if (entry.isDirectory()) output.push(...(await walkFiles(root, path)));
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

function normalizeText(value) {
  return value.replace(/[ \t]+$/gm, "").replace(/\n+$/, "\n");
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

async function main() {
  await mkdir(toolsRoot, { recursive: true });
  await mkdir(licensesRoot, { recursive: true });
  const records = [];

  for (const tool of TOOLS) {
    const folder = join(repoRoot, tool.folder);
    if (!existsSync(folder)) throw new Error(`Tool folder missing: ${tool.folder}`);

    if (runBuilds && tool.build) {
      process.stdout.write(`building ${tool.id}…\n`);
      execSync(tool.build, { cwd: folder, stdio: "inherit", env: { ...process.env, ...tool.buildEnv } });
    }

    const artifactPath = join(folder, tool.artifact);
    if (!existsSync(artifactPath)) {
      throw new Error(`${tool.id}: artifact missing at ${tool.folder}/${tool.artifact}. Run its build (or pass --build).`);
    }

    let sourceSha256;
    let stagedSha256;
    if (tool.kind === "tree") {
      sourceSha256 = await treeHash(artifactPath);
      const output = join(toolsRoot, tool.output);
      await rm(output, { recursive: true, force: true });
      await cp(artifactPath, output, { recursive: true });
      await pruneSourceMaps(output);
      await normalizeTextFiles(output);
      stagedSha256 = await treeHash(output);
    } else {
      const source = await readFile(artifactPath);
      sourceSha256 = sha256(source);
      let html = source.toString("utf8");
      if (tool.transform) html = tool.transform(html);
      const staged = normalizeText(html);
      await writeFile(join(toolsRoot, tool.output), staged);
      stagedSha256 = sha256(staged);
    }

    if (tool.license) {
      await cp(join(folder, tool.license), join(licensesRoot, `${tool.id}.txt`));
    }

    records.push({
      id: tool.id,
      sourceFolder: tool.folder,
      sourceArtifact: `${tool.folder}/${tool.artifact}`.replaceAll("\\", "/"),
      sourceSha256,
      toolkitArtifact: `tools/${tool.output}${tool.kind === "tree" ? "/" : ""}`,
      toolkitSha256: stagedSha256,
      license: tool.license ? "MIT" : null,
      licenseFile: tool.license ? `licenses/${tool.id}.txt` : null,
      ...(tool.note ? { note: tool.note } : {})
    });
    process.stdout.write(`staged ${tool.id} (${stagedSha256.slice(0, 12)}…)\n`);
  }

  await cp(join(repoRoot, "assets", "licenses", "lucide-static.txt"), join(licensesRoot, "lucide-static.txt"));
  await cp(join(repoRoot, "assets", "licenses", "af-fonts.txt"), join(licensesRoot, "af-fonts.txt"));

  const fonts = [];
  for (const font of (await readdir(join(publicRoot, "fonts"))).sort()) {
    fonts.push({ file: font, sha256: sha256(await readFile(join(publicRoot, "fonts", font))) });
  }

  const manifest = {
    schemaVersion: 3,
    product: "The Advokat Frida Toolkit",
    generatedAt: new Date().toISOString(),
    releaseBoundary: "private-source-control-only",
    layout: "one repository; each tool is a top-level source folder and its committed build artifact is staged here",
    tools: records,
    fonts
  };
  await writeFile(join(publicRoot, "tool-sources.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`Staged ${records.length} tools into public/tools/ and wrote tool-sources.json.\n`);
}

await main();
