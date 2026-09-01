/**
 * Verify + Scan for SafeSeed fixtures.
 *
 * verify(csvText, record, { allowAddedColumns }) — checks:
 *   1) byte-integrity: SHA-256(csvBytes) === record.output.sha256
 *   2) declared columns exist in the CSV (strict: no added columns; scoped: report only)
 *   3) each cell in a declared column satisfies its catalog inRange (if defined)
 *
 * scan(csvText) — no record required. For every column, tries every catalog
 * inRange predicate; declares the column's "likely SafeSeed type" if >=60% of
 * non-empty cells match. Any non-matching cells are flagged as candidate PII.
 */

import Papa from "papaparse";
import { BY_ID, CATALOG, TIERS } from "./safeCatalog";

async function sha256Hex(bytes) {
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function parseCsvStrict(csvText) {
  const result = Papa.parse(csvText, { header: false, skipEmptyLines: false });
  if (!result.data || result.data.length === 0) throw new Error("Empty CSV");
  const headers = result.data[0].map(h => String(h ?? ""));
  const rows = result.data.slice(1)
    .filter(r => !(r.length === 1 && r[0] === ""))
    .map(r => headers.map((_, i) => r[i] ?? ""));
  return { headers, rows };
}

export async function verifyFixture(csvText, record, { allowAddedColumns = false } = {}) {
  const bytes = new TextEncoder().encode(csvText);
  const actualHash = await sha256Hex(bytes);
  const declaredHash = record?.output?.sha256;
  const hashMatch = actualHash === declaredHash;

  let parsed;
  try { parsed = parseCsvStrict(csvText); }
  catch (e) { return { ok: false, phase: "parse", actualHash, declaredHash, hashMatch, error: e.message }; }

  const declaredCols = (record?.schema || []).map(f => f.column);
  const declaredSet  = new Set(declaredCols);
  const actualSet    = new Set(parsed.headers);

  const missing = declaredCols.filter(c => !actualSet.has(c));
  const added   = parsed.headers.filter(c => !declaredSet.has(c));

  // Per-cell range checks
  const failures = [];
  const attestedColumns = [];
  const unattestedColumns = [];
  for (const field of record?.schema || []) {
    const idx = parsed.headers.indexOf(field.column);
    if (idx < 0) continue;
    attestedColumns.push(field.column);
    const spec = BY_ID[field.type];
    if (!spec || !spec.inRange) continue; // no range predicate — nothing to check
    for (let i = 0; i < parsed.rows.length; i++) {
      const v = parsed.rows[i][idx];
      if (v === "" || v === undefined || v === null) continue;
      if (!spec.inRange(v)) {
        failures.push({
          row: i + 2, // +1 for 1-indexed, +1 for header row
          column: field.column,
          type: field.type,
          value: String(v),
          expected: `${spec.label} · ${TIERS[spec.tier].claim}`,
        });
        if (failures.length >= 500) break;
      }
    }
    if (failures.length >= 500) break;
  }
  for (const c of added) unattestedColumns.push(c);

  const strictOk = hashMatch && missing.length === 0 && added.length === 0 && failures.length === 0;
  const scopedOk = missing.length === 0 && failures.length === 0; // scoped ignores hash + added
  return {
    ok: allowAddedColumns ? scopedOk : strictOk,
    mode: allowAddedColumns ? "column-scoped" : "strict-whole-file",
    actualHash,
    declaredHash,
    hashMatch,
    rowsChecked: parsed.rows.length,
    columnsChecked: attestedColumns,
    unattestedColumns,
    missingColumns: missing,
    addedColumns: added,
    failures,
    truncated: failures.length >= 500,
  };
}

// ---------- Scan ----------
const SCAN_THRESHOLD = 0.6;

/**
 * scanFixture — walk every column, try every catalog predicate. If the best
 * match rate is >= 60%, we call the column likely-of-that-type and flag every
 * cell that failed the predicate. If no predicate hits, the column is
 * "unattested by SafeSeed catalog" and reported as such (out of scope).
 */
export function scanFixture(csvText) {
  const parsed = parseCsvStrict(csvText);
  const columnResults = parsed.headers.map((header, ci) => {
    const values = parsed.rows.map(r => r[ci]).filter(v => v !== "" && v !== undefined && v !== null).map(v => String(v));
    if (values.length === 0) {
      return { header, empty: true, likelyType: null, findings: [] };
    }
    let best = null;
    const scored = [];
    for (const spec of CATALOG) {
      if (!spec.inRange) continue;
      let hits = 0;
      for (const v of values) if (spec.inRange(v)) hits++;
      const rate = hits / values.length;
      if (rate > 0) scored.push({ id: spec.id, label: spec.label, tier: spec.tier, rate, hits, sampled: values.length });
      if (!best || rate > best.rate) best = { spec, rate, hits, sampled: values.length };
    }
    scored.sort((a, b) => b.rate - a.rate);

    const attested = best && best.rate >= SCAN_THRESHOLD;
    const outOfRange = [];
    if (attested) {
      for (let ri = 0; ri < parsed.rows.length; ri++) {
        const v = parsed.rows[ri][ci];
        if (v === "" || v === undefined || v === null) continue;
        if (!best.spec.inRange(String(v))) {
          outOfRange.push({ row: ri + 2, value: String(v) });
          if (outOfRange.length >= 100) break;
        }
      }
    }
    return {
      header,
      empty: false,
      likelyType: attested ? {
        id: best.spec.id, label: best.spec.label, tier: best.spec.tier,
        matchRate: best.rate, hits: best.hits, sampled: best.sampled,
      } : null,
      candidates: scored.slice(0, 3),
      outOfRange,
      truncated: outOfRange.length >= 100,
    };
  });

  const attestedCount    = columnResults.filter(c => c.likelyType).length;
  const suspiciousCount  = columnResults.reduce((s, c) => s + c.outOfRange.length, 0);
  const unattestedCount  = columnResults.filter(c => !c.likelyType && !c.empty).length;

  return {
    rowsScanned: parsed.rows.length,
    columnsScanned: parsed.headers.length,
    attestedCount,
    suspiciousCount,
    unattestedCount,
    columns: columnResults,
  };
}
