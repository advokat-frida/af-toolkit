// SafeList engine: pure functions, no DOM, no network.
// Runs in the browser (tools/build.mjs inlines it and strips the export keywords)
// and in Node (test/, tools/run-sample.mjs). Every decision the page shows comes
// from here; app.js only renders.

export const SAFELIST_VERSION = "0.1.0";
export const STALE_AFTER_HOURS = 24;
export const DEFAULT_RULES = Object.freeze({ plusTags: true, gmailDots: true, domainRules: true, dedupe: true });

const EMAIL_RE = /^[^\s@<>"',;:()[\]]+@[^\s@<>"',;:()[\]]+\.[a-z0-9-]{2,}$/i;
const DOMAIN_RULE_RE = /^\*?@([a-z0-9.-]+\.[a-z0-9-]{2,})$/i;
const DOT_FOLD_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

/* ---------- CSV ---------- */

export function parseCSV(text) {
  const source = String(text || "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') { field += '"'; index += 1; } else { quoted = false; }
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field); field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field); rows.push(row); row = []; field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

export function toCSV(rows) {
  return rows.map((cells) => cells.map(csvCell).join(",")).join("\n") + "\n";
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) || /^\s|\s$/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/* ---------- addresses ---------- */

export function extractAddress(raw) {
  let value = String(raw == null ? "" : raw).trim();
  const angled = value.match(/<([^<>]+)>/);
  if (angled) value = angled[1].trim();
  return value.replace(/^mailto:/i, "").replace(/^["']+|["']+$/g, "").trim();
}

export function looksLikeEmail(raw) {
  return EMAIL_RE.test(extractAddress(raw).toLowerCase());
}

export function domainRule(raw) {
  const match = extractAddress(raw).toLowerCase().match(DOMAIN_RULE_RE);
  return match ? match[1] : null;
}

export function normalizeEmail(raw, rules = DEFAULT_RULES) {
  const value = extractAddress(raw).toLowerCase();
  if (!EMAIL_RE.test(value) || DOMAIN_RULE_RE.test(value)) return null;
  const at = value.lastIndexOf("@");
  let local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (rules.plusTags) local = local.split("+")[0];
  if (rules.gmailDots && DOT_FOLD_DOMAINS.has(domain)) local = local.replace(/\./g, "");
  return local ? `${local}@${domain}` : null;
}

export function domainOf(normalized) {
  return normalized.slice(normalized.lastIndexOf("@") + 1);
}

/* ---------- lists ---------- */

export function detectHeader(rows) {
  if (!rows.length) return false;
  return !rows[0].some((cell) => looksLikeEmail(cell) || domainRule(cell));
}

export function detectEmailColumns(header, rows) {
  const width = Math.max(header.length, ...rows.map((cells) => cells.length), 0);
  const columns = [];
  for (let index = 0; index < width; index += 1) {
    let filled = 0;
    let hits = 0;
    for (const cells of rows) {
      const cell = (cells[index] || "").trim();
      if (!cell) continue;
      filled += 1;
      if (looksLikeEmail(cell) || domainRule(cell)) hits += 1;
    }
    const ratio = filled ? hits / filled : 0;
    if (ratio >= 0.5) columns.push({ index, name: header[index] || `Column ${index + 1}`, ratio, hits, filled });
  }
  return columns.sort((a, b) => b.ratio - a.ratio || b.hits - a.hits || a.index - b.index);
}

export function loadList(text) {
  const parsed = parseCSV(text);
  const hasHeader = detectHeader(parsed);
  const rows = hasHeader ? parsed.slice(1) : parsed;
  const width = Math.max(...parsed.map((cells) => cells.length), 0);
  const header = hasHeader
    ? parsed[0].map((name, index) => (name.trim() ? name.trim() : `Column ${index + 1}`))
    : Array.from({ length: width }, (_, index) => `Column ${index + 1}`);
  return { header, rows, hasHeader, emailColumns: detectEmailColumns(header, rows) };
}

export function parseSuppression(list, rules = DEFAULT_RULES) {
  const emails = new Set();
  const domains = new Set();
  const invalid = [];
  const columns = list.emailColumns.length ? list.emailColumns.map((column) => column.index) : list.header.map((_, index) => index);
  for (const cells of list.rows) {
    for (const index of columns) {
      const raw = (cells[index] || "").trim();
      if (!raw) continue;
      const rule = domainRule(raw);
      if (rule) { if (rules.domainRules) domains.add(rule); continue; }
      const normalized = normalizeEmail(raw, rules);
      if (normalized) emails.add(normalized); else invalid.push(raw);
    }
  }
  return { emails, domains, count: emails.size, domainCount: domains.size, invalid };
}

/* ---------- matching ---------- */

export function findMatches(list, columnIndexes, suppression, rules = DEFAULT_RULES) {
  const matches = [];
  list.rows.forEach((cells, row) => {
    for (const column of columnIndexes) {
      const raw = (cells[column] || "").trim();
      const normalized = normalizeEmail(raw, rules);
      if (!normalized) continue;
      if (suppression.emails.has(normalized)) {
        matches.push({ row, column, raw, normalized, reason: "address" });
        return;
      }
      const domain = domainOf(normalized);
      if (rules.domainRules && suppression.domains.has(domain)) {
        matches.push({ row, column, raw, normalized, reason: "domain", domain });
        return;
      }
    }
  });
  return matches;
}

export function findDuplicates(list, columnIndexes, rules = DEFAULT_RULES) {
  if (!rules.dedupe || !columnIndexes.length) return [];
  const seen = new Map();
  const duplicates = [];
  list.rows.forEach((cells, row) => {
    const normalized = normalizeEmail((cells[columnIndexes[0]] || "").trim(), rules);
    if (!normalized) return;
    if (seen.has(normalized)) duplicates.push({ row, duplicateOf: seen.get(normalized), normalized, raw: (cells[columnIndexes[0]] || "").trim(), reason: "duplicate" });
    else seen.set(normalized, row);
  });
  return duplicates;
}

export function reviewItems(matches, duplicates) {
  const byRow = new Map();
  for (const match of matches) byRow.set(match.row, { kind: "match", ...match });
  for (const duplicate of duplicates) if (!byRow.has(duplicate.row)) byRow.set(duplicate.row, { kind: "duplicate", ...duplicate });
  return [...byRow.values()].sort((a, b) => a.row - b.row);
}

export function checkOne(raw, suppression, rules = DEFAULT_RULES) {
  const normalized = normalizeEmail(raw, rules);
  if (!normalized) return { status: "invalid", normalized: null };
  if (suppression.emails.has(normalized)) return { status: "listed", reason: "address", normalized };
  const domain = domainOf(normalized);
  if (rules.domainRules && suppression.domains.has(domain)) return { status: "listed", reason: "domain", domain, normalized };
  return { status: "clear", normalized };
}

export function applyDecisions(list, items, decisions) {
  const missing = items.filter((item) => !decisions[item.row] || !decisions[item.row].decision).map((item) => item.row);
  if (missing.length) return { ok: false, missing };
  const removed = new Set(items.filter((item) => decisions[item.row].decision === "remove").map((item) => item.row));
  const rows = list.rows.filter((_, row) => !removed.has(row));
  const counts = { input: list.rows.length, output: rows.length, matched: 0, removed: 0, keptOnList: 0, duplicates: 0, duplicatesRemoved: 0 };
  for (const item of items) {
    const decision = decisions[item.row].decision;
    if (item.kind === "match") {
      counts.matched += 1;
      if (decision === "remove") counts.removed += 1; else counts.keptOnList += 1;
    } else {
      counts.duplicates += 1;
      if (decision === "remove") counts.duplicatesRemoved += 1;
    }
  }
  return { ok: true, rows, removedRows: [...removed].sort((a, b) => a - b), counts };
}

/* ---------- time, hashes, record ---------- */

export function staleness(fileDate, now = new Date()) {
  const hours = Math.max(0, (now.getTime() - new Date(fileDate).getTime()) / 36e5);
  let age;
  if (hours < 1) age = "less than an hour old";
  else if (hours < 48) age = `${Math.round(hours)} hour${Math.round(hours) === 1 ? "" : "s"} old`;
  else age = `${Math.floor(hours / 24)} days old`;
  return { hours, age, blocked: hours > STALE_AFTER_HOURS };
}

export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function shortHash(hex) {
  return hex.length > 20 ? `${hex.slice(0, 12)}…${hex.slice(-6)}` : hex;
}

export function stamp(date) {
  return `${new Date(date).toISOString().slice(0, 16)}Z`;
}

export function ruleSummary(rules) {
  const parts = [];
  parts.push(rules.plusTags ? "plus-tags folded" : "plus-tags kept");
  parts.push(rules.gmailDots ? "gmail dots folded" : "gmail dots kept");
  parts.push(rules.domainRules ? "domain rules on" : "domain rules off");
  parts.push(rules.dedupe ? "duplicates flagged" : "duplicates ignored");
  return parts.join(", ");
}

export const ORIGINS = Object.freeze({
  crm: "Our CRM",
  event: "An event",
  partner: "A partner",
  purchased: "Purchased",
  other: "Other"
});

// The record names kept contacts in full (they stay on the send list) and reduces
// removed contacts to fingerprints, so the record never becomes a second copy of
// the suppression list.
export async function buildRecord(input) {
  const now = input.now ? new Date(input.now) : new Date();
  const decisions = [];
  for (const item of input.items) {
    const decision = input.decisions[item.row];
    const entry = {
      row: item.row + 1,
      kind: item.kind,
      reason: item.reason,
      decision: decision.decision,
      emailSha256: await sha256Hex(item.normalized)
    };
    if (item.kind === "duplicate") entry.duplicateOfRow = item.duplicateOf + 1;
    if (item.reason === "domain") entry.domain = item.domain;
    if (decision.decision === "keep") {
      entry.email = item.normalized;
      entry.keepReason = (decision.reason || "").trim() || null;
    }
    decisions.push(entry);
  }
  const record = {
    tool: "SafeList",
    version: SAFELIST_VERSION,
    generatedAt: now.toISOString(),
    sendList: {
      name: input.sendList.name,
      rows: input.sendList.rows,
      columns: input.sendList.columns,
      sha256: await sha256Hex(input.sendList.text)
    },
    suppressionList: {
      name: input.suppression.name,
      exportedAt: new Date(input.suppression.fileDate).toISOString(),
      ageHours: Number(staleness(input.suppression.fileDate, now).hours.toFixed(2)),
      addresses: input.suppression.count,
      domainRules: input.suppression.domainCount,
      sha256: await sha256Hex(input.suppression.text)
    },
    matchedOn: input.matchColumns,
    rules: { ...input.rules },
    origin: { key: input.origin, label: ORIGINS[input.origin] || input.origin },
    counts: input.counts,
    decisions,
    output: {
      name: input.output.name,
      rows: input.output.rows,
      sha256: await sha256Hex(input.output.text)
    }
  };
  record.recordSha256 = await sha256Hex(JSON.stringify(record));
  return record;
}

export function recordText(record) {
  const kept = record.decisions.filter((entry) => entry.decision === "keep");
  const lines = [
    `SAFELIST RECORD ${shortHash(record.recordSha256)} · ${stamp(record.generatedAt)}`,
    `SEND LIST: ${record.sendList.name} (${record.sendList.rows} rows) ${shortHash(record.sendList.sha256)}`,
    `CHECKED AGAINST: ${record.suppressionList.name} (${record.suppressionList.addresses} address${record.suppressionList.addresses === 1 ? "" : "es"}, ${record.suppressionList.domainRules} domain rule${record.suppressionList.domainRules === 1 ? "" : "s"}, exported ${stamp(record.suppressionList.exportedAt)}) ${shortHash(record.suppressionList.sha256)}`,
    `MATCHED ON: ${record.matchedOn.join(", ")}`,
    `RULES: ${ruleSummary(record.rules)}`,
    `LIST CAME FROM: ${record.origin.label}`,
    `RESULT: ${record.counts.output} of ${record.counts.input} rows kept · ${record.counts.matched} on the suppression list (${record.counts.removed} removed, ${record.counts.keptOnList} kept) · ${record.counts.duplicatesRemoved} of ${record.counts.duplicates} duplicates removed`,
    `OUTPUT: ${record.output.name} (${record.output.rows} rows) ${shortHash(record.output.sha256)}`
  ];
  for (const entry of kept) lines.push(`KEPT: row ${entry.row} ${entry.email}${entry.keepReason ? ` — ${entry.keepReason}` : ""}`);
  return lines.join("\n");
}
