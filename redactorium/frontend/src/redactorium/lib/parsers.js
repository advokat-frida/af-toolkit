/**
 * Parsers — read CSV / XLSX / DOCX / PDF / TXT to a tabular {headers, rows}
 * shape. For unstructured formats (DOCX, PDF, TXT), the whole document is
 * split into paragraphs and returned as a single-column table so column-wise
 * detection still works, then joined back on export.
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";
import { parseDOCXStructured } from "./docxHandler";

// ---- CSV ----
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: false,
      complete: (res) => {
        if (!res.data || res.data.length === 0) return reject(new Error("Empty CSV"));
        const headers = res.data[0].map(h => String(h ?? ""));
        const rows = res.data.slice(1).map(r => headers.map((_, i) => r[i] ?? ""));
        resolve({ kind: "table", format: "csv", headers, rows, meta: { sheetName: null } });
      },
      error: reject,
    });
  });
}

// ---- XLSX ----
export async function parseXLSX(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  if (aoa.length === 0) throw new Error("Empty spreadsheet");
  const headers = aoa[0].map(h => String(h ?? ""));
  const rows = aoa.slice(1).map(r => headers.map((_, i) => r[i] ?? ""));
  return { kind: "table", format: "xlsx", headers, rows, meta: { sheetName, sheetNames: wb.SheetNames } };
}

// ---- DOCX ----  (structured — preserves formatting for round-trip)
export async function parseDOCX(file) {
  return parseDOCXStructured(file);
}

// ---- TXT ----
export async function parseTXT(file) {
  const text = await file.text();
  const rows = text.split(/\r?\n/).map(l => [l]);
  return {
    kind: "text",
    format: "txt",
    headers: ["line"],
    rows,
    meta: { originalText: text, joiner: "\n" },
  };
}

// ---- PDF ----  (uses pdfjs-dist, imported dynamically to keep bundle small)
export async function parsePDF(file) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf");
  // Keep file contents inside this origin. The matching worker is vendored in public/.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdf.worker.min.mjs", document.baseURI).href;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const paragraphs = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const text = content.items.map(i => i.str).join(" ");
    // split roughly on double-space / punctuation-newline
    text.split(/(?<=[.?!])\s+/).forEach(s => { const t = s.trim(); if (t) paragraphs.push(t); });
  }
  const rows = paragraphs.map(t => [t]);
  return {
    kind: "text",
    format: "pdf",
    headers: ["sentence"],
    rows,
    meta: { originalText: paragraphs.join("\n\n"), joiner: "\n\n" },
  };
}

// ---- dispatch ----
export async function parseFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return parseCSV(file);
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return parseXLSX(file);
  if (name.endsWith(".docx")) return parseDOCX(file);
  if (name.endsWith(".pdf"))  return parsePDF(file);
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".log")) return parseTXT(file);
  throw new Error("Unsupported format: " + name.split(".").pop());
}
