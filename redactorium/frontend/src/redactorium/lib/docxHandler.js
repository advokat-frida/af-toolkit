/**
 * DOCX round-trip.
 *
 * A Word file is a zip of XML parts. Text lives in <w:t> runs (and field codes in
 * <w:instrText>, e.g. a mailto: link) inside paragraphs, and not only in word/document.xml:
 * headers, footers, footnotes and endnotes carry text too, a hyperlink keeps its address in a
 * relationships file, and the title and subject sit in the document properties. Each piece of
 * text becomes one "segment", the row the scanner and the treatments see: a stretch of runs
 * between paragraph boundaries, one hyperlink address, or one property.
 *
 * Writing back, only the replaced characters change: each replacement goes into the run
 * where the match starts, and the matched characters are cut from every run they cover.
 * Runs with no match keep their text and formatting exactly.
 *
 * Before anything is read, the package is cleaned of what a shared Word file should not carry:
 *   - tracked deletions (<w:del>, <w:moveFrom>) are removed, because deleted text is still in
 *     the file and shows up the moment someone turns on Track Changes;
 *   - tracked insertions (<w:ins>, <w:moveTo>) are accepted, and formatting-change records
 *     (which name their author) are dropped;
 *   - comments are removed, with their anchors, references and parts;
 *   - the author, last editor, company and manager fields in the document properties are
 *     emptied, and the comment/revision author list (word/people.xml) is removed.
 * What was removed is reported in `meta.cleaned` and lands in the record.
 */

import JSZip from "jszip";

const TEXT_PARTS = /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/;
const RELS_PARTS = /^word\/_rels\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml\.rels$/;
const CORE_TEXT_TAGS = ["dc:title", "dc:subject", "dc:description", "cp:keywords"];
// A token is a paragraph boundary, a tab or line break (kept as a separator the scanner can
// see), or a text element whose content we read and may rewrite.
// (An empty <w:t/> is self-closing and carries no text; the open-tag pattern refuses it so the
// match cannot run on to the next </w:t>.)
const TOKEN_RE = /<w:p\b[^>]*\/>|<w:p\b[^>]*>|<\/w:p>|<w:(?:tab|br|cr)\b[^>]*\/>|(<w:(t|instrText)(?:\s[^>]*[^/])?>)([\s\S]*?)<\/w:\2>/g;

function decodeXml(s) {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
}
const encodeText = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const encodeAttr = (s) => encodeText(s).replace(/"/g, "&quot;");

// ---------- cleaning ----------
const count = (xml, re) => (xml.match(re) || []).length;
const REVISION_TAGS = "rPrChange|pPrChange|sectPrChange|tblPrChange|tblGridChange|tcPrChange|trPrChange|numberingChange";

export function cleanPartXml(xml, cleaned) {
  let x = xml;
  cleaned.trackedDeletions += count(x, /<w:del\b[^>]*>/g) + count(x, /<w:moveFrom\b[^>]*>/g);
  x = x.replace(/<w:del\b[^>]*\/>/g, "").replace(/<w:del\b[^>]*>[\s\S]*?<\/w:del>/g, "");
  x = x.replace(/<w:moveFrom\b[^>]*\/>/g, "").replace(/<w:moveFrom\b[^>]*>[\s\S]*?<\/w:moveFrom>/g, "");
  x = x.replace(/<w:move(?:From|To)Range(?:Start|End)\b[^>]*\/>/g, "");
  cleaned.trackedInsertions += count(x, /<w:ins\b[^>]*>/g) + count(x, /<w:moveTo\b[^>]*>/g);
  x = x.replace(/<w:ins\b[^>]*\/>/g, "").replace(/<w:ins\b[^>]*>/g, "").replace(/<\/w:ins>/g, "");
  x = x.replace(/<w:moveTo\b[^>]*\/>/g, "").replace(/<w:moveTo\b[^>]*>/g, "").replace(/<\/w:moveTo>/g, "");
  // Formatting revisions carry w:author; the current formatting stays.
  x = x.replace(new RegExp(`<w:(${REVISION_TAGS})\\b[^>]*\\/>`, "g"), "")
       .replace(new RegExp(`<w:(${REVISION_TAGS})\\b[^>]*>[\\s\\S]*?<\\/w:\\1>`, "g"), "");
  // Comment anchors and the runs that hold comment references.
  x = x.replace(/<w:commentRange(?:Start|End)\b[^>]*\/>/g, "");
  x = x.replace(/<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*?<w:commentReference\b[^>]*\/>(?:(?!<\/w:r>)[\s\S])*?<\/w:r>/g, "");
  x = x.replace(/<w:commentReference\b[^>]*\/>/g, "");
  return x;
}

async function cleanPackage(zip) {
  const cleaned = { trackedDeletions: 0, trackedInsertions: 0, comments: 0, propertiesCleared: [] };
  const commentsXml = zip.file("word/comments.xml") ? await zip.file("word/comments.xml").async("string") : "";
  cleaned.comments = count(commentsXml, /<w:comment\b/g);
  for (const p of Object.keys(zip.files).filter((p) => /^word\/comments[A-Za-z]*\.xml$/.test(p) || p === "word/people.xml")) zip.remove(p);
  for (const relsPath of Object.keys(zip.files).filter((p) => /^word\/_rels\/.*\.rels$/.test(p))) {
    const rels = await zip.file(relsPath).async("string");
    zip.file(relsPath, rels.replace(/<Relationship\b[^>]*Target="(?:comments[A-Za-z]*|people)\.xml"[^>]*\/>/g, ""));
  }
  if (zip.file("[Content_Types].xml")) {
    const ct = await zip.file("[Content_Types].xml").async("string");
    zip.file("[Content_Types].xml", ct.replace(/<Override\b[^>]*PartName="\/word\/(?:comments[A-Za-z]*|people)\.xml"[^>]*\/>/g, ""));
  }
  // Data parts a reader never sees: content-control data (customXml/), custom document
  // properties (docProps/custom.xml) and document variables (<w:docVars> in settings.xml).
  const customXml = Object.keys(zip.files).filter((p) => /^customXml\//.test(p) && !zip.files[p].dir);
  cleaned.dataPartsRemoved = customXml.filter((p) => /^customXml\/item\d+\.xml$/.test(p)).length;
  for (const p of customXml) zip.remove(p);
  if (zip.file("docProps/custom.xml")) {
    const custom = await zip.file("docProps/custom.xml").async("string");
    if (/<property\b/.test(custom)) cleaned.propertiesCleared.push("custom properties");
    zip.remove("docProps/custom.xml");
  }
  for (const relsPath of ["_rels/.rels", ...Object.keys(zip.files).filter((p) => /^word\/_rels\/.*\.rels$/.test(p))]) {
    const f = zip.file(relsPath);
    if (!f) continue;
    const rels = await f.async("string");
    zip.file(relsPath, rels.replace(/<Relationship\b[^>]*Target="(?:\.\.\/customXml\/[^"]*|\/?docProps\/custom\.xml)"[^>]*\/>/g, ""));
  }
  if (zip.file("[Content_Types].xml")) {
    const ct = await zip.file("[Content_Types].xml").async("string");
    zip.file("[Content_Types].xml", ct.replace(/<Override\b[^>]*PartName="\/(?:customXml\/[^"]*|docProps\/custom\.xml)"[^>]*\/>/g, ""));
  }
  if (zip.file("word/settings.xml")) {
    const settings = await zip.file("word/settings.xml").async("string");
    cleaned.documentVariables = count(settings, /<w:docVar\b/g);
    zip.file("word/settings.xml", settings.replace(/<w:docVars\b[^>]*\/>/g, "").replace(/<w:docVars\b[^>]*>[\s\S]*?<\/w:docVars>/g, ""));
  }
  // What Redactorium cannot read inside: pictures (a pasted screenshot), embedded files (a
  // pasted spreadsheet) and charts (their data). They stay in the file as they are, and the
  // page says so. A picture's alt text is text, and is treated with the rest.
  cleaned.unread = [];
  if (Object.keys(zip.files).some((p) => /^word\/media\//.test(p) && !zip.files[p].dir)) cleaned.unread.push("pictures");
  if (Object.keys(zip.files).some((p) => /^word\/embeddings\//.test(p) && !zip.files[p].dir)) cleaned.unread.push("embedded files");
  if (Object.keys(zip.files).some((p) => /^word\/charts\//.test(p) && !zip.files[p].dir)) cleaned.unread.push("charts");

  const blank = async (path, tags, labels) => {
    const f = zip.file(path);
    if (!f) return;
    let x = await f.async("string");
    tags.forEach((tag, i) => {
      const re = new RegExp(`<${tag}(\\s[^>]*)?>([\\s\\S]*?)</${tag}>`);
      const m = x.match(re);
      if (m && m[2].trim()) { cleaned.propertiesCleared.push(labels[i]); x = x.replace(re, `<${tag}$1></${tag}>`); }
    });
    zip.file(path, x);
  };
  await blank("docProps/core.xml", ["dc:creator", "cp:lastModifiedBy"], ["author", "last modified by"]);
  await blank("docProps/app.xml", ["Company", "Manager"], ["company", "manager"]);
  return cleaned;
}

// ---------- segments ----------
// A run is one place text is written back: an element's content (openTag + text) or an
// attribute's value (valueStart..valueEnd).
function segmentBody(path, xml) {
  const segments = [];
  let current = null;
  const close = () => { if (current && current.runs.length) segments.push(current); current = null; };
  TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = TOKEN_RE.exec(xml)) !== null) {
    const tok = m[0];
    if (!m[1]) {
      if (tok.startsWith("<w:p") || tok === "</w:p>") { close(); continue; }
      // A tab or break between runs: visible to the scanner, owned by no run.
      if (current) current.text += tok.startsWith("<w:tab") ? "\t" : "\n";
      continue;
    }
    if (!current) current = { path, text: "", runs: [] };
    const text = decodeXml(m[3]);
    const start = current.text.length;
    current.text += text;
    current.runs.push({ openTagStart: m.index, closeTagStart: m.index + tok.lastIndexOf("</w:"), openTag: m[1], start, end: start + text.length });
  }
  close();
  return segments;
}

// Image alt text and titles live in attributes (<wp:docPr descr="..."> and <pic:cNvPr>).
function segmentAltText(path, xml) {
  const segments = [];
  const re = /<(?:wp:docPr|pic:cNvPr)\b[^>]*>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const tag = m[0];
    const attr = /\b(descr|title)="([^"]*)"/g;
    let a;
    while ((a = attr.exec(tag)) !== null) {
      if (!a[2].trim()) continue;
      const valueStart = m.index + a.index + a[0].indexOf('"') + 1;
      const text = decodeXml(a[2]);
      segments.push({ path, text, runs: [{ attr: true, valueStart, valueEnd: valueStart + a[2].length, start: 0, end: text.length }] });
    }
  }
  return segments;
}

function segmentRels(path, xml) {
  const segments = [];
  const re = /<Relationship\b[^>]*\/>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const rel = m[0];
    if (!/TargetMode="External"/.test(rel)) continue;
    const t = rel.match(/\bTarget="([^"]*)"/);
    if (!t) continue;
    const valueStart = m.index + t.index + t[0].indexOf('"') + 1;
    const text = decodeXml(t[1]);
    segments.push({ path, text, runs: [{ attr: true, valueStart, valueEnd: valueStart + t[1].length, start: 0, end: text.length }] });
  }
  return segments;
}

function segmentCore(path, xml) {
  const segments = [];
  for (const tag of CORE_TEXT_TAGS) {
    const re = new RegExp(`(<${tag}(?:\\s[^>]*)?>)([\\s\\S]*?)</${tag}>`);
    const m = xml.match(re);
    if (!m || !m[2].trim()) continue;
    const text = decodeXml(m[2]);
    segments.push({ path, text, runs: [{ openTagStart: m.index, closeTagStart: m.index + m[1].length + m[2].length, openTag: m[1], start: 0, end: text.length }] });
  }
  return segments;
}

export async function parseDOCXStructured(file) {
  const buf = await file.arrayBuffer();
  let zip;
  try { zip = await JSZip.loadAsync(buf); }
  catch { throw new Error("This file could not be opened as a Word document (.docx)"); }
  if (!zip.file("word/document.xml")) throw new Error("This file is not a Word document (.docx)");
  const cleaned = await cleanPackage(zip);

  const order = (a, b) => (a === "word/document.xml" ? -1 : b === "word/document.xml" ? 1 : a.localeCompare(b));
  const parts = {};
  const segments = [];
  for (const path of Object.keys(zip.files).filter((p) => TEXT_PARTS.test(p)).sort(order)) {
    parts[path] = cleanPartXml(await zip.file(path).async("string"), cleaned);
    segments.push(...segmentBody(path, parts[path]), ...segmentAltText(path, parts[path]));
  }
  for (const path of Object.keys(zip.files).filter((p) => RELS_PARTS.test(p)).sort()) {
    parts[path] = await zip.file(path).async("string");
    segments.push(...segmentRels(path, parts[path]));
  }
  if (zip.file("docProps/core.xml")) {
    parts["docProps/core.xml"] = await zip.file("docProps/core.xml").async("string");
    segments.push(...segmentCore("docProps/core.xml", parts["docProps/core.xml"]));
  }

  return {
    kind: "docx-structured",
    format: "docx",
    headers: ["text"],
    rows: segments.map((s) => [s.text]),
    meta: { zip, parts, segments, cleaned },
  };
}

// New text for each run of a segment, given the replacements (sorted, non-overlapping,
// positions in the segment's text). A replacement lands in the run where its match starts.
export function spliceRuns(segment, replacements) {
  return segment.runs.map((run) => {
    let out = "";
    let pos = run.start;
    for (const r of replacements) {
      if (r.end <= run.start || r.start >= run.end) continue;
      if (r.start > pos) out += segment.text.slice(pos, r.start);
      if (r.start >= run.start) out += r.text;
      pos = Math.min(r.end, run.end);
    }
    if (pos < run.end) out += segment.text.slice(pos, run.end);
    return out;
  });
}

/**
 * Rebuild a DOCX blob. `edits[i]` lists the replacements made in segment i (from
 * applyTransformations). Segments with no edits are written back untouched.
 */
export async function buildDOCX(parsed, newRows, edits) {
  const { zip, parts, segments } = parsed.meta;
  const byPart = new Map();
  segments.forEach((seg, i) => {
    const reps = (edits && edits[i]) || [];
    if (!reps.length) return;
    const texts = spliceRuns(seg, [...reps].sort((a, b) => a.start - b.start));
    if (!byPart.has(seg.path)) byPart.set(seg.path, []);
    seg.runs.forEach((run, r) => {
      const t = texts[r];
      if (t === seg.text.slice(run.start, run.end)) return;
      if (run.attr) {
        byPart.get(seg.path).push({ start: run.valueStart, end: run.valueEnd, replacement: encodeAttr(t) });
        return;
      }
      const preserve = /^\s|\s$/.test(t) && !/xml:space=/.test(run.openTag);
      const openTag = preserve ? run.openTag.replace(/>$/, ' xml:space="preserve">') : run.openTag;
      byPart.get(seg.path).push({ start: run.openTagStart, end: run.closeTagStart, replacement: openTag + encodeText(t) });
    });
  });
  for (const [path, xml] of Object.entries(parts)) {
    let x = xml;
    for (const e of (byPart.get(path) || []).sort((a, b) => b.start - a.start)) x = x.slice(0, e.start) + e.replacement + x.slice(e.end);
    zip.file(path, x);
  }
  const arr = await zip.generateAsync({ type: "uint8array", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const blob = new Blob([arr], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  return { blob, text: newRows.map((r) => r[0]).join("\n"), ext: "docx", mime: blob.type };
}
