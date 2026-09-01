/**
 * Exporters — turn transformed { headers, rows } back into a file in the
 * original format, plus produce a JSON transformation log and a PDF report
 * suitable for handing to legal / compliance.
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { buildDOCX } from "./docxHandler";

// ---- file hash helper (SHA-256 of arbitrary bytes) ----
export async function bytesSha256(bytes) {
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function stringSha256(str) {
  return bytesSha256(new TextEncoder().encode(str));
}

// ---- build cleaned output as Blob + text ----
export async function buildOutput(parsed) {
  const { format, headers, rows, meta } = parsed;
  if (format === "csv") {
    const csv = Papa.unparse({ fields: headers, data: rows });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    return { blob, text: csv, ext: "csv", mime: "text/csv" };
  }
  if (format === "xlsx" || format === "xls") {
    const aoa = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, meta?.sheetName || "Sheet1");
    const arr = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([arr], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const csvPreview = XLSX.utils.sheet_to_csv(ws);
    return { blob, text: csvPreview, ext: "xlsx", mime: blob.type };
  }
  if (format === "docx" && parsed.kind === "docx-structured") {
    return buildDOCX(parsed, rows);
  }
  // text formats — join back into a document
  const joiner = meta?.joiner ?? "\n";
  const text = rows.map(r => r[0] ?? "").join(joiner);
  if (format === "pdf") {
    // Generate a clean PDF with the redacted text
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    doc.setFont("courier", "normal"); doc.setFontSize(10);
    const margin = 54; const width = doc.internal.pageSize.getWidth() - margin * 2;
    const lines = doc.splitTextToSize(text, width);
    let y = margin;
    for (const l of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
      doc.text(l, margin, y); y += 12;
    }
    const blob = doc.output("blob");
    return { blob, text, ext: "pdf", mime: "application/pdf" };
  }
  // txt fallback
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  return { blob, text, ext: "txt", mime: "text/plain" };
}

export function saveBlob(blob, filename) { saveAs(blob, filename); }

// ---- Bundle the three artifacts into one zip ----
export async function buildEvidenceZip({ cleanBlob, cleanFilename, log, pdfBlob }) {
  const zip = new JSZip();
  zip.file(cleanFilename, cleanBlob);
  zip.file("redactorium-log.json", JSON.stringify(log, null, 2));
  zip.file("redactorium-record.pdf", pdfBlob);
  zip.file("README.txt",
`Redactorium evidence package
============================
Contents:
  · ${cleanFilename}          — cleaned data file, same format as input
  · redactorium-log.json      — machine-readable transformation record
  · redactorium-record.pdf    — human-readable evidence package

Verification:
  · Input SHA-256:  ${log.input.sha256}
  · Output SHA-256: ${log.output.sha256}

Run: ${log.run.started_at} → ${log.run.finished_at}
Environment: ${log.run.environment}
Tool: ${log.tool} v${log.version}
`);
  return zip.generateAsync({ type: "blob", mimeType: "application/zip" });
}

// ---- Transformation log (JSON) ----
export function buildLogJSON({ inputFile, format, columnPlan, stats, detectionResults, inputHash, outputHash, salt, seed, startedAt, finishedAt }) {
  return {
    tool: "Redactorium",
    version: "0.1.0",
    profile: "pattern-based (no LLM, no network)",
    run: {
      started_at: startedAt,
      finished_at: finishedAt,
      environment: "browser (client-side only)",
    },
    input: {
      name: inputFile.name,
      size_bytes: inputFile.size,
      format,
      sha256: inputHash,
    },
    output: {
      sha256: outputHash,
    },
    parameters: {
      hash_algorithm: "SHA-256",
      hash_salt_used: !!salt,
      synthetic_seed: seed || null,
      catalog: "SafeSeed-style reserved / cited fields",
    },
    detection: detectionResults.map(c => ({
      column_index: c.index,
      column_header: c.header,
      sampled_cells: c.sampled,
      top_finding: c.top ? {
        detector: c.top.detectorId,
        name: c.top.name,
        category: c.top.category,
        tier: c.top.tier,
        citation: c.top.citation,
        confidence: c.top.confidence,
        match_rate: c.top.matchRate,
      } : null,
      all_findings: c.findings.map(f => ({
        detector: f.detectorId, confidence: f.confidence, match_rate: f.matchRate, tier: f.tier,
      })),
    })),
    transformations: columnPlan.map((p, i) => ({
      column_index: p.index,
      column_header: p.header,
      detector: p.detectorId || null,
      transform: p.transform,
      cells_touched: stats[i].sampled,
      cells_changed: stats[i].changed,
      reviewer_note: p.note && p.note.trim() ? p.note.trim() : null,
    })),
    disclaimers: [
      "This log is generated by an unsigned client-side tool. It documents intent and mechanism; it is not a cryptographic proof of origin.",
      "Detection uses pattern matching and cited catalogs. Real-world data may bypass regex; treat 'no findings' as 'nothing matched configured patterns', not 'no PII'.",
      "SHA-256 hashing is deterministic. Provide a per-tenant salt when using this file across contexts."
    ],
  };
}

// ---- Transformation log (PDF, human-readable) ----
export function buildLogPDF(log, options = {}) {
  const verifyUrl = options.verifyUrl || null;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56; // A4-appropriate margins
  let y = M;
  let pageNum = 1;

  const drawFooter = () => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Redactorium · Advokat Frida Toolkit · run ${log.run?.started_at || "—"}`, M, H - 24);
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
  doc.text("REDACTORIUM — TRANSFORMATION RECORD", M, 55);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text("Pattern-based PII redaction, generated client-side · Advokat Frida Toolkit", M, 74);
  doc.setTextColor(20, 20, 20);
  y = 120;

  section("EVIDENCE PACKAGE");
  line(`Input file: ${log.input.name}`);
  line(`Input size: ${log.input.size_bytes} bytes · format: ${log.input.format}`);
  line(`Input SHA-256:  ${log.input.sha256}`, { font: "courier", size: 9 });
  line(`Output SHA-256: ${log.output.sha256}`, { font: "courier", size: 9 });
  line(`Run started:  ${log.run.started_at}`);
  line(`Run finished: ${log.run.finished_at}`);
  line(`Environment:  ${log.run.environment}`);
  space();

  section("DETECTION SUMMARY");
  for (const c of log.detection) {
    if (!c.top_finding) {
      line(`· "${c.column_header}" — no PII pattern matched (sampled ${c.sampled_cells}).`);
    } else {
      const t = c.top_finding;
      line(`· "${c.column_header}" — ${t.name} [${t.tier}]  conf ${(t.confidence*100).toFixed(0)}% · match ${(t.match_rate*100).toFixed(0)}%`);
      line(`   citation: ${t.citation}`, { size: 9 });
    }
  }
  space();

  section("TRANSFORMATIONS APPLIED");
  for (const t of log.transformations) {
    line(`· "${t.column_header}" → ${t.transform.toUpperCase()}  (touched ${t.cells_touched}, changed ${t.cells_changed}${t.detector ? `, detector ${t.detector}` : ""})`);
    if (t.reviewer_note) {
      line(`   note: ${t.reviewer_note}`, { size: 9, style: "italic" });
    }
  }
  space();

  // Signature block (if present)
  if (log.signature) {
    section("SIGNATURE");
    line(`Algorithm:        ${log.signature.algorithm}`, { size: 10 });
    line(`Key fingerprint:  ${log.signature.key_fingerprint_sha256}`, { font: "courier", size: 9 });
    line(`Signed at:        ${log.signature.signed_at}`, { size: 10 });
    line(`Signature:        ${log.signature.signature_hex}`, { font: "courier", size: 8 });
    space();

    section("HOW TO VERIFY THIS SIGNATURE");
    line("1. Open the Redactorium verify page (URL below) in any modern browser.", { size: 10 });
    line("2. Paste the accompanying JSON log into the log field.", { size: 10 });
    line("3. Enter the same HMAC-SHA-256 key used at signing time.", { size: 10 });
    line("4. Click Verify. A green PASS confirms this record has not been tampered with.", { size: 10 });
    if (verifyUrl) {
      space(4);
      line("Verify URL:", { size: 10, style: "bold" });
      line(verifyUrl, { font: "courier", size: 9 });
    }
    line("Alternatively, replay the same HMAC-SHA-256 over the log JSON with the shared", { size: 9, style: "italic" });
    line("key using any cryptographic library — the check is offline and reproducible.", { size: 9, style: "italic" });
    space();
  }

  section("PARAMETERS");
  line(`Hash algorithm: ${log.parameters.hash_algorithm}`);
  line(`Salt used: ${log.parameters.hash_salt_used ? "yes" : "no"}`);
  line(`Synthetic seed: ${log.parameters.synthetic_seed || "default"}`);
  line(`Synthetic catalog: ${log.parameters.catalog}`);
  space();

  section("DISCLAIMERS");
  log.disclaimers.forEach(d => line("· " + d, { size: 9 }));

  drawFooter();
  return doc.output("blob");
}
