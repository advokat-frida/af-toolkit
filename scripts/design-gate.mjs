// The Toolkit design gate — mechanical half of docs/design/REVIEW-GATE.md.
// Scans the shell and staged tool artifacts for palette, font, copy, radius,
// and external-request violations. Exit 1 on any failure.
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = join(root, "public");

// §1 tokens — the only hexes allowed on a Toolkit surface, plus pure white
// (primary-button text) and the transparent/currentColor forms.
const CANONICAL_HEX = new Set([
  "#16140f", // ink
  "#4a463d", // soft
  "#fffdf8", // paper
  "#f6f4ef", // ground
  "#e9e7e0", // canvas
  "#1f4e32", // forest
  "#efece4", // forest wash
  "#c83232", // red (status)
  "#12666a", // teal (status)
  "#3a3a8c", // indigo (status)
  "#9e5415", // amber (status)
  "#183e29", // forest-press (primary hover shade)
  "#fbf4ea", // amber wash
  "#fff",
  "#ffffff"
]);

// Documented exceptions: file → extra hexes with a reason.
const HEX_EXCEPTIONS = {
  // The Oracle ball's sphere shading — the one sanctioned illustrative gradient.
  "tools/objection-oracle.html": new Set(["#4a4a4a", "#1c1c1c", "#050505", "#000", "#000000"])
};

const CANONICAL_FAMILIES = /^(anton|space grotesk|archivo|ui-monospace|sfmono-regular|menlo|consolas|liberation mono|monospace|system-ui|-apple-system|segoe ui|sans-serif|impact)$/i;

// §5 bright lines. Word-boundary, case-insensitive, scanned over *visible text*.
const BANNED_PHRASES = [
  "open tool",
  "learn more",
  "click here",
  "welcome to",
  "please note",
  "note that",
  "simply ",
  "seamless",
  "leverage",
  "empower",
  "cutting-edge",
  "state-of-the-art",
  "world-class",
  "best-in-class",
  "user-friendly",
  "hassle-free",
  "peace of mind",
  "rest assured",
  "we take your privacy seriously",
  "your data is safe",
  "trusted by",
  "effortless",
  "supercharge",
  "unlock the",
  "in order to"
];

// Radius grammar. The shell is square (0/50% only). Single-file tool artifacts also
// carry their standalone-page family chrome (4px) and sanctioned semantic pills
// (999px) — the tool folders' own audits enforce that grammar at the source.
// Compiled bundles (Redactorium) carry framework utility classes; their rendered
// radii are a REVIEW-GATE visual item instead.
const SHELL_RADIUS_SCOPE = ["toolkit.css", "index.html"];
const ARTIFACT_RADIUS_SCOPE = ["tools/safeseed.html", "tools/safelist.html", "tools/objection-oracle.html", "tools/privacy-wizards-council.html"];
const SHELL_RADIUS_ALLOWED = /border-radius\s*:\s*(0|50%)(\s|;|!|$)/;
const ARTIFACT_RADIUS_ALLOWED = /border-radius\s*:\s*(0|4px|50%|999px|9999px|calc\(infinity \* 1px\))(\s|;|!|$)/;

// Compiled framework bundles: palette/font internals (fallback stacks, library
// constants) are not rendered design choices — those surfaces are reviewed
// visually. External-request and copy scans still apply in full.
const COMPILED_SCOPE = /^tools\/redactorium\//;

const failures = [];
function fail(file, rule, detail) {
  failures.push({ file, rule, detail });
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ");
}

function auditHexes(rel, content) {
  const extras = HEX_EXCEPTIONS[rel] ?? new Set();
  for (const match of content.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const hex = match[0].toLowerCase();
    if (/^#[0-9a-f]{3}$|^#[0-9a-f]{6}$/.test(hex) && !CANONICAL_HEX.has(hex) && !extras.has(hex)) {
      fail(rel, "palette", `non-canonical color ${hex}`);
    }
  }
}

function auditFonts(rel, content) {
  for (const match of content.matchAll(/font-family\s*:\s*([^;}"]+)/gi)) {
    for (const raw of match[1].split(",")) {
      const family = raw.trim().replace(/^["']|["']$/g, "").replace(/\s*!important$/i, "");
      if (family.startsWith("var(") || family === "inherit" || family === "") continue;
      if (!CANONICAL_FAMILIES.test(family)) fail(rel, "font", `non-canonical family "${family}"`);
    }
  }
}

function auditPhrases(rel, content, isHtml) {
  const text = (isHtml ? visibleText(content) : content).toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    const index = text.indexOf(phrase);
    if (index >= 0) {
      fail(rel, "copy", `banned phrase "${phrase.trim()}" — …${text.slice(Math.max(0, index - 40), index + phrase.length + 40).replace(/\s+/g, " ").trim()}…`);
    }
  }
}

function auditRadius(rel, content, allowed) {
  for (const match of content.matchAll(/border-radius\s*:\s*[^;}!]+(?:!important)?/gi)) {
    if (!allowed.test(`${match[0]};`)) fail(rel, "radius", match[0].trim());
  }
}

function auditExternal(rel, content) {
  // Resource loads only. Links that open a new tab (articles, source) are fine.
  const loaders = [
    /<script[^>]+src\s*=\s*["']https?:\/\/[^"']+/gi,
    /<link[^>]+rel\s*=\s*["'](?:stylesheet|preload|modulepreload|icon|manifest)["'][^>]*href\s*=\s*["']https?:\/\/[^"']+/gi,
    /<link[^>]+href\s*=\s*["']https?:\/\/[^"']+["'][^>]*rel\s*=\s*["'](?:stylesheet|preload|modulepreload|icon|manifest)["']/gi,
    /<img[^>]+src\s*=\s*["']https?:\/\/[^"']+/gi,
    /<iframe[^>]+src\s*=\s*["']https?:\/\/[^"']+/gi,
    /url\(\s*["']?https?:\/\/[^)"']+/gi,
    /\bfetch\(\s*["']https?:\/\/[^"']+/gi,
    /new\s+WebSocket\(\s*["']wss?:\/\/[^"']+/gi,
    /navigator\.sendBeacon\(\s*["']https?:\/\/[^"']+/gi
  ];
  for (const pattern of loaders) {
    for (const match of content.matchAll(pattern)) {
      // Allow W3C SVG namespace-style false positives (none of these load resources).
      if (/w3\.org/.test(match[0])) continue;
      fail(rel, "external", match[0].slice(0, 120));
    }
  }
}

async function main() {
  const files = (await walk(publicRoot)).filter((path) => /\.(html|css|js|mjs)$/.test(path));
  for (const path of files) {
    const rel = relative(publicRoot, path).replaceAll("\\", "/");
    const content = await readFile(path, "utf8");
    const isHtml = path.endsWith(".html");

    const compiled = COMPILED_SCOPE.test(rel);
    if (!compiled) {
      auditHexes(rel, content);
      auditFonts(rel, content);
    }
    auditExternal(rel, content);
    if (isHtml || rel === "toolkit.css") auditPhrases(rel, content, isHtml);
    if (SHELL_RADIUS_SCOPE.includes(rel)) auditRadius(rel, content, SHELL_RADIUS_ALLOWED);
    if (ARTIFACT_RADIUS_SCOPE.includes(rel)) auditRadius(rel, content, ARTIFACT_RADIUS_ALLOWED);
  }

  // Token definitions must exist exactly once, in the shell stylesheet.
  const css = await readFile(join(publicRoot, "toolkit.css"), "utf8");
  for (const token of ["--ink", "--soft", "--paper", "--ground", "--forest", "--amber", "--hairline"]) {
    if (!css.includes(`${token}:`)) fail("toolkit.css", "tokens", `missing token ${token}`);
  }
  if (!existsSync(join(publicRoot, "fonts", "anton-400-latin.woff2"))) {
    fail("fonts/", "fonts", "self-hosted Anton missing");
  }

  if (failures.length) {
    for (const failure of failures) {
      process.stdout.write(`FAIL  [${failure.rule}] ${failure.file} · ${failure.detail}\n`);
    }
    process.stdout.write(`\n${failures.length} design-gate failure(s).\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`PASS  design gate · ${files.length} files scanned, palette/fonts/copy/radius/external clean.\n`);
}

await main();
