/**
 * guessSchemaFromCSV — turn a CSV into a SafeSeed schema.
 *
 * For every column:
 *   1. Try every catalog `inRange` predicate. Best match rate >= 60% wins.
 *   2. If no catalog hit:
 *      - all numeric integers → randomInt with min/max drawn from the data
 *      - all numeric floats   → randomFloat with min/max drawn from the data
 *      - small unique vocab   → enum with observed values (up to 12)
 *      - looks like ISO date  → dateOnly
 *      - default              → opaqueId (structurally-fake)
 *   3. Column name is copied from the header; the guessed type is emitted.
 *
 * The result is a schema array compatible with Import / Export JSON.
 */

import Papa from "papaparse";
import { CATALOG } from "./safeCatalog";

const CATALOG_THRESHOLD = 0.6;
const MAX_ENUM_UNIQUE = 12;

const isIntStr = (s) => /^-?\d+$/.test(String(s).trim());
const isFloatStr = (s) => /^-?\d+(\.\d+)?$/.test(String(s).trim());
const isDateOnly = (s) => /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(String(s).trim());

export function guessSchemaFromCSV(csvText) {
  const res = Papa.parse(csvText, { header: false, skipEmptyLines: true });
  if (!res.data || res.data.length === 0) throw new Error("Empty CSV");
  const headers = res.data[0].map(h => String(h ?? "").trim() || `column_${Math.random().toString(36).slice(2,5)}`);
  const rows = res.data.slice(1);

  const schema = headers.map((header, ci) => {
    const rawValues = rows.map(r => r[ci]).filter(v => v !== "" && v !== undefined && v !== null).map(v => String(v).trim());
    if (rawValues.length === 0) {
      return { name: header, type: "opaqueId", inference: { basis: "empty column — defaulted to opaqueId", confidence: 0 } };
    }
    const values = rawValues.slice(0, 100);

    // 1. Try every catalog predicate
    let best = null;
    for (const spec of CATALOG) {
      if (!spec.inRange) continue;
      let hits = 0;
      for (const v of values) if (spec.inRange(v)) hits++;
      const rate = hits / values.length;
      if (!best || rate > best.rate) best = { spec, rate };
    }
    if (best && best.rate >= CATALOG_THRESHOLD) {
      return {
        name: header, type: best.spec.id,
        inference: { basis: `${Math.round(best.rate * 100)}% of sampled values match ${best.spec.label}`, confidence: best.rate },
      };
    }

    // 2. Fallbacks
    const uniq = Array.from(new Set(values));
    if (values.every(isIntStr)) {
      const nums = values.map(Number);
      return {
        name: header, type: "randomInt",
        options: { min: Math.min(...nums), max: Math.max(...nums) },
        inference: { basis: "all sampled values are integers", confidence: 0.9 },
      };
    }
    if (values.every(isFloatStr)) {
      const nums = values.map(Number);
      return {
        name: header, type: "randomFloat",
        options: { min: Math.min(...nums), max: Math.max(...nums) },
        inference: { basis: "all sampled values are numeric", confidence: 0.85 },
      };
    }
    if (values.every(isDateOnly)) {
      return { name: header, type: "dateOnly", inference: { basis: "all sampled values look like ISO dates", confidence: 0.8 } };
    }
    if (uniq.length <= MAX_ENUM_UNIQUE && uniq.length >= 2) {
      return {
        name: header, type: "enum",
        options: { values: uniq.join(",") },
        inference: { basis: `only ${uniq.length} unique values — enumerated`, confidence: 0.75 },
      };
    }

    // 3. Default
    return {
      name: header, type: "opaqueId",
      inference: { basis: "no catalog match, high cardinality — defaulted to opaqueId", confidence: 0.3 },
    };
  });

  return { schema, rowCount: rows.length, columnCount: headers.length };
}
