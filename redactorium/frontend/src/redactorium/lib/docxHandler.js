/**
 * DOCX round-trip.
 * Reads the .docx zip, extracts word/document.xml, walks paragraphs and
 * rewrites text inside <w:t> runs while preserving every other bit of the
 * document (styles, headings, images, tables' non-text content, etc.).
 *
 * Strategy per paragraph:
 *   1. Concatenate all <w:t> contents in the <w:p> to a single string
 *   2. That string is the "row" the pipeline sees / transforms
 *   3. On write-back, put the transformed string into the FIRST <w:t> of that
 *      paragraph and empty the remaining ones — this preserves paragraph-level
 *      formatting (heading level, bullet, alignment, first-run font) at the
 *      cost of intra-paragraph formatting variations, which is the honest
 *      trade-off we make explicit in the transformation log.
 */

import JSZip from "jszip";

const P_RE = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
const T_RE = /<w:t\b(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;

function decodeXml(s) {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
function encodeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function parseDOCXStructured(file) {
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);
  const docXml = await zip.file("word/document.xml").async("string");

  const paragraphs = []; // { fullText, tOffsets: [{start, end}, ...] within the paragraph }
  const paragraphSpans = []; // [{start, end}] within docXml
  let m;
  while ((m = P_RE.exec(docXml)) !== null) {
    const pStart = m.index;
    const pEnd = pStart + m[0].length;
    const pXml = m[0];
    const runs = [];
    let tm;
    T_RE.lastIndex = 0;
    while ((tm = T_RE.exec(pXml)) !== null) {
      runs.push({
        // absolute positions in docXml
        openTagEnd: pStart + tm.index + tm[0].indexOf(">") + 1,
        closeTagStart: pStart + tm.index + tm[0].lastIndexOf("</w:t>"),
        text: decodeXml(tm[1]),
      });
    }
    const fullText = runs.map(r => r.text).join("");
    paragraphs.push({ fullText, runs });
    paragraphSpans.push({ start: pStart, end: pEnd });
  }

  return {
    kind: "docx-structured",
    format: "docx",
    headers: ["paragraph"],
    rows: paragraphs.map(p => [p.fullText]),
    meta: {
      zip,
      docXml,
      paragraphs, // parallel to rows
    },
  };
}

/**
 * Rebuild a DOCX blob given transformed rows.
 * We do a single left-to-right pass, replacing each paragraph's <w:t> contents.
 */
export async function buildDOCX(parsed, newRows) {
  const { zip, docXml, paragraphs } = parsed.meta;
  // Build the new document.xml by rewriting each <w:t> content within each paragraph.
  // We process paragraphs in reverse to keep offsets stable.
  let xml = docXml;
  const edits = []; // {start, end, replacement}
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (p.runs.length === 0) continue;
    const newText = String(newRows[i]?.[0] ?? "");
    // First run gets the full new text (encoded); subsequent runs are emptied.
    for (let r = 0; r < p.runs.length; r++) {
      const run = p.runs[r];
      const replacement = r === 0 ? encodeXml(newText) : "";
      edits.push({ start: run.openTagEnd, end: run.closeTagStart, replacement });
    }
  }
  edits.sort((a, b) => b.start - a.start);
  for (const e of edits) xml = xml.slice(0, e.start) + e.replacement + xml.slice(e.end);

  zip.file("word/document.xml", xml);
  const arr = await zip.generateAsync({ type: "uint8array", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const blob = new Blob([arr], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  return { blob, text: newRows.map(r => r[0]).join("\n"), ext: "docx", mime: blob.type };
}
