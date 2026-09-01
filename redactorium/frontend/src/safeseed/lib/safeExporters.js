/**
 * SafeSeed exporters: CSV, JSON, JSONL, SQL, XLSX, plus the run-record JSON
 * and a human-readable PDF provenance sheet.
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { TIERS } from "./safeCatalog";

async function sha256Hex(bytes) {
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

export async function stringHash(s) { return sha256Hex(new TextEncoder().encode(s)); }
export async function blobHash(blob) { return sha256Hex(new Uint8Array(await blob.arrayBuffer())); }

// ---- Formatters ----
export function toCSV({ columns, rows }) {
  return Papa.unparse({ fields: columns, data: rows });
}

export function toJSON({ columns, rows }, { indent = 2 } = {}) {
  const arr = rows.map(r => Object.fromEntries(columns.map((c, i) => [c, r[i]])));
  return JSON.stringify(arr, null, indent);
}

export function toJSONL({ columns, rows }) {
  return rows.map(r => JSON.stringify(Object.fromEntries(columns.map((c, i) => [c, r[i]])))).join("\n");
}

function sqlLiteral(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return "'" + String(v).replace(/'/g, "''") + "'";
}
export function toSQL({ columns, rows }, { table = "fixture" } = {}) {
  const cols = columns.map(c => `"${String(c).replace(/"/g, '""')}"`).join(", ");
  const lines = [`-- SafeSeed generated fixture — ${new Date().toISOString()}`];
  for (const r of rows) {
    lines.push(`INSERT INTO "${table}" (${cols}) VALUES (${r.map(sqlLiteral).join(", ")});`);
  }
  return lines.join("\n");
}

export function toXLSXBlob({ columns, rows }) {
  const aoa = [columns, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "safeseed");
  const arr = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([arr], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

// ---- Format registry ----
export const FORMATS = {
  csv:   { label: "CSV",           ext: "csv",   mime: "text/csv" },
  json:  { label: "JSON (array)",  ext: "json",  mime: "application/json" },
  jsonl: { label: "JSON Lines",    ext: "jsonl", mime: "application/x-ndjson" },
  sql:   { label: "SQL INSERT",    ext: "sql",   mime: "text/plain" },
  xlsx:  { label: "Excel (XLSX)",  ext: "xlsx",  mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
};

export async function buildOutputBlob(dataset, format, options = {}) {
  if (format === "csv")   return new Blob([toCSV(dataset)], { type: "text/csv;charset=utf-8" });
  if (format === "json")  return new Blob([toJSON(dataset)], { type: "application/json" });
  if (format === "jsonl") return new Blob([toJSONL(dataset)], { type: "application/x-ndjson" });
  if (format === "sql")   return new Blob([toSQL(dataset, options)], { type: "text/plain;charset=utf-8" });
  if (format === "xlsx")  return toXLSXBlob(dataset);
  throw new Error("Unknown format: " + format);
}

// ---- Run record ----
export async function buildRunRecord(dataset, schema, outputBlob, format, extras = {}) {
  const outputHash = await blobHash(outputBlob);
  return {
    tool: "SafeSeed (Toolkit build)",
    version: "0.4.0",
    profile: "browser generator — no upload, no accounts, deterministic",
    generated_at: dataset.meta.generatedAt,
    seed: dataset.meta.seed,
    row_count: dataset.meta.rowCount,
    format,
    output: {
      filename: extras.filename || `safeseed-fixture.${FORMATS[format].ext}`,
      sha256:   outputHash,
      byte_size: outputBlob.size,
    },
    schema: schema.map((f, i) => {
      const meta = dataset.meta.fieldsResolved[i];
      return {
        column: f.name,
        type: f.type,
        tier: meta.tier,
        citation: meta.citation,
        claim: TIERS[meta.tier].claim,
        options: f.options || null,
      };
    }),
    tier_summary: dataset.meta.tierStats,
    disclaimers: [
      "The record declares provenance; it does not authenticate it. The record is unsigned — anyone who can change both file and record can recompute both.",
      "SafeSeed's browser generator does not accept production records as source material for any field in this schema.",
      "'Not derived from production data' is not the same as 'not personal data'. Review before release.",
    ],
  };
}

// ---- Human-readable PDF provenance sheet ----
export function buildProvenancePDF(record) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56;
  let y = M;
  let pageNum = 1;

  const drawFooter = () => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`SafeSeed · Advokat Frida Toolkit · run ${record.generated_at || "—"}`, M, H - 24);
    doc.text(String(pageNum), W - M, H - 24, { align: "right" });
    doc.setTextColor(20, 20, 20);
  };
  const newPage = () => { drawFooter(); doc.addPage(); pageNum++; y = M; };
  const ensure = (needed) => { if (y + needed > H - M - 30) newPage(); };
  const line = (txt, opts = {}) => {
    doc.setFont(opts.font || "helvetica", opts.style || "normal");
    doc.setFontSize(opts.size || 10);
    const lines = doc.splitTextToSize(txt, W - M * 2);
    for (const l of lines) {
      ensure((opts.size || 10) + 3);
      doc.text(l, M, y); y += (opts.size || 10) + 3;
    }
  };
  const rule = () => { ensure(14); doc.setDrawColor(0); doc.line(M, y, W - M, y); y += 12; };
  const space = (n = 8) => { y += n; };
  const section = (title) => { ensure(30); line(title, { style: "bold", size: 12 }); rule(); };

  // Cover
  doc.setFillColor(39, 74, 61); doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(245, 239, 225);
  doc.setFont("helvetica", "bold"); doc.setFontSize(22);
  doc.text("SAFESEED — PROVENANCE SHEET", M, 55);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text("Auditable, low-fidelity test data by construction · Advokat Frida Toolkit", M, 74);
  doc.setTextColor(20, 20, 20);
  y = 120;

  section("FIXTURE");
  line(`Filename:  ${record.output.filename}`);
  line(`Format:    ${record.format.toUpperCase()}`);
  line(`Row count: ${record.row_count}`);
  line(`Seed:      ${record.seed}`);
  line(`Generated: ${record.generated_at}`);
  line(`SHA-256:   ${record.output.sha256}`, { font: "courier", size: 9 });
  space();

  section("SCHEMA & TIERS");
  for (const f of record.schema) {
    // Keep each field's block on one page if it fits
    ensure(38);
    line(`· ${f.column}  —  ${f.type}  [${f.tier}]`, { style: "bold" });
    line(`   citation: ${f.citation}`, { size: 9 });
    line(`   claim:    ${f.claim}`, { size: 9, style: "italic" });
    if (f.options && Object.keys(f.options).length) {
      line(`   options:  ${JSON.stringify(f.options)}`, { size: 9 });
    }
    space(3);
  }

  section("TIER SUMMARY");
  for (const [tier, count] of Object.entries(record.tier_summary)) {
    line(`· ${tier}: ${count} column${count === 1 ? "" : "s"}`);
  }
  space();

  section("DISCLAIMERS");
  record.disclaimers.forEach(d => line("· " + d, { size: 9 }));

  drawFooter();
  return doc.output("blob");
}

export function saveBlob(blob, filename) { saveAs(blob, filename); }

export async function buildBundleZip({ outputBlob, filename, record, pdfBlob }) {
  const zip = new JSZip();
  zip.file(filename, outputBlob);
  zip.file("safeseed.record.json", JSON.stringify(record, null, 2));
  zip.file("safeseed.record.pdf", pdfBlob);
  zip.file("README.txt",
`SafeSeed fixture bundle
=======================
Contents:
  · ${filename}                — generated fixture in ${record.format.toUpperCase()} format
  · safeseed.record.json       — machine-readable run record
  · safeseed.record.pdf        — human-readable provenance sheet

Verification:
  · Output SHA-256: ${record.output.sha256}
  · Seed:           ${record.seed}
  · Row count:      ${record.row_count}
  · Generated:      ${record.generated_at}

The record is unsigned. Store the record independently from the fixture to
give the drift check any teeth.
`);
  return zip.generateAsync({ type: "blob", mimeType: "application/zip" });
}
