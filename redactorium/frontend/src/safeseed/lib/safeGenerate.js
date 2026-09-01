/**
 * Generate a dataset from a schema.
 *
 * schema = [{ name, type, options? }]
 * type   = a CATALOG id
 * result = { columns:[...names], rows:[[...values]], meta:{ seed, rowCount, tierStats } }
 */

import { BY_ID, makeRng, TIERS } from "./safeCatalog";

export const MAX_ROWS = 100_000;

export function validateSchema(schema) {
  const errors = [];
  if (!Array.isArray(schema) || schema.length === 0) errors.push("Schema must have at least one field.");
  const seen = new Set();
  for (const [i, f] of (schema || []).entries()) {
    if (!f.name || typeof f.name !== "string") errors.push(`Field ${i + 1}: missing name.`);
    else if (seen.has(f.name.toLowerCase())) errors.push(`Duplicate column name "${f.name}".`);
    else seen.add(f.name.toLowerCase());
    if (!BY_ID[f.type]) errors.push(`Field "${f.name || i + 1}": unknown type "${f.type}".`);
  }
  return errors;
}

export async function generateDataset(schema, { rows = 100, seed = 0 } = {}) {
  const errors = validateSchema(schema);
  if (errors.length) throw new Error(errors.join(" · "));
  const n = Math.max(1, Math.min(MAX_ROWS, rows | 0));
  const rng = makeRng((seed >>> 0) || 1);

  const columns = schema.map(f => f.name);
  const outRows = new Array(n);
  const tierStats = {};
  for (const f of schema) tierStats[BY_ID[f.type].tier] = (tierStats[BY_ID[f.type].tier] || 0) + 1;

  // Every row is generated left-to-right, sharing one RNG (deterministic)
  for (let i = 0; i < n; i++) {
    const row = new Array(schema.length);
    for (let j = 0; j < schema.length; j++) {
      const spec = BY_ID[schema[j].type];
      const opts = schema[j].options || {};
      row[j] = spec.isAsync ? await spec.gen(rng, opts, i) : spec.gen(rng, opts, i);
    }
    outRows[i] = row;
  }

  return {
    columns,
    rows: outRows,
    meta: {
      rowCount: n,
      seed: seed >>> 0,
      generatedAt: new Date().toISOString(),
      tierStats,
      fieldsResolved: schema.map(f => ({
        name: f.name,
        type: f.type,
        tier: BY_ID[f.type].tier,
        citation: BY_ID[f.type].citation,
      })),
    },
  };
}

// Simple structural verify: values match catalog inRange (if defined)
export function verifyDataset({ columns, rows }, schema) {
  const failures = [];
  for (let j = 0; j < schema.length; j++) {
    const spec = BY_ID[schema[j].type];
    if (!spec?.inRange) continue;
    for (let i = 0; i < rows.length; i++) {
      const v = rows[i][j];
      if (v !== undefined && v !== null && String(v) !== "" && !spec.inRange(v)) {
        failures.push({ row: i + 1, column: columns[j], value: String(v), expected: `${spec.label} · ${TIERS[spec.tier].claim}` });
        if (failures.length >= 500) return { ok: false, failures, truncated: true };
      }
    }
  }
  return { ok: failures.length === 0, failures, truncated: false };
}
