// The bytes every machine sees for a staged or recorded artifact: text normalized to LF with
// trailing spaces and extra final newlines removed, binary files untouched. .gitattributes stores
// this repository as LF, so a Windows working copy that staged CRLF produced manifest hashes that
// matched locally and nowhere else: not in CI, not on the edge. Provenance is the whole product, so
// the staging script and the Toolkit gate hash the same bytes.
import { readFile } from "node:fs/promises";
import { extname } from "node:path";

export const TEXT_EXTENSIONS = new Set([".css", ".html", ".js", ".json", ".mjs", ".txt", ".map", ".svg"]);

export function isTextFile(path) {
  return TEXT_EXTENSIONS.has(extname(path).toLowerCase());
}

export function normalizeText(value) {
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").replace(/\n+$/, "\n");
}

export async function canonicalBytes(path) {
  const raw = await readFile(path);
  if (!isTextFile(path)) return raw;
  return Buffer.from(normalizeText(raw.toString("utf8")), "utf8");
}
