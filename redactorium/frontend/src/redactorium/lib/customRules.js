/**
 * Custom regex rules — user-defined detectors saved to localStorage.
 * A rule looks like:
 *   { id, name, category, pattern, flags, columnHint, base, tier: "custom" }
 * The rule is compiled into the same shape as DETECTORS entries so the
 * scanner treats it uniformly.
 */

const STORAGE_KEY = "redactorium.customRules.v1";

export function loadCustomRules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function saveCustomRules(rules) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

export function compileRule(rule) {
  let re, hintRe = null;
  try { re = new RegExp(rule.pattern, rule.flags || ""); }
  catch (e) { throw new Error(`Invalid regex for "${rule.name}": ${e.message}`); }
  if (rule.columnHint) {
    try { hintRe = new RegExp(rule.columnHint, "i"); }
    catch (e) { throw new Error(`Invalid column hint for "${rule.name}": ${e.message}`); }
  }
  return {
    id: "custom:" + rule.id,
    name: rule.name,
    category: rule.category || "custom",
    tier: "heuristic",
    base: rule.base ?? 0.8,
    citation: `Custom rule "${rule.name}" (user-defined regex)`,
    test: (v) => re.test(String(v)) ? (rule.base ?? 0.85) : 0,
    columnHint: hintRe,
    columnHintBoost: 0.2,
    _custom: true,
  };
}
