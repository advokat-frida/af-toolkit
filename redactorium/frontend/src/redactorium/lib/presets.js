/**
 * Presets — reusable transformation plans, saved to localStorage.
 *
 * A preset is a { header|detector-key → transform } mapping. When a new file
 * is loaded we try both matches (header first, then detector) so the same
 * preset works for CSVs with the same headers and unrelated files that just
 * happen to contain the same PII types.
 */

const KEY = "redactorium.presets.v1";

export function loadPresets() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function savePresets(p) { localStorage.setItem(KEY, JSON.stringify(p)); }

export function makePresetFromPlan(name, columnPlan, detection) {
  const byHeader = {};
  const byDetector = {};
  const notesByHeader = {};
  columnPlan.forEach((p, i) => {
    if (!p.header) return;
    const key = p.header.toLowerCase();
    byHeader[key] = p.transform;
    if (p.note) notesByHeader[key] = p.note;
    const detId = detection?.[i]?.top?.detectorId;
    if (detId) byDetector[detId] = p.transform;
  });
  return {
    id: Math.random().toString(36).slice(2, 10),
    name,
    createdAt: new Date().toISOString(),
    byHeader,
    byDetector,
    notesByHeader,
  };
}

/**
 * Apply a preset to a fresh columnPlan. Header match wins over detector match.
 * Returns { plan, matches } where matches is the count of columns re-mapped.
 */
export function applyPresetToPlan(preset, columnPlan, detection) {
  let matches = 0;
  const plan = columnPlan.map((p, i) => {
    const h = (p.header || "").toLowerCase();
    let next = p;
    if (h && preset.byHeader?.[h] && preset.byHeader[h] !== p.transform) {
      matches++;
      next = { ...next, transform: preset.byHeader[h] };
    } else {
      const detId = detection?.[i]?.top?.detectorId;
      if (detId && preset.byDetector?.[detId] && preset.byDetector[detId] !== p.transform) {
        matches++;
        next = { ...next, transform: preset.byDetector[detId] };
      }
    }
    if (h && preset.notesByHeader?.[h] && !next.note) {
      next = { ...next, note: preset.notesByHeader[h] };
    }
    return next;
  });
  return { plan, matches };
}
