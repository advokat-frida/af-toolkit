import { LEGACY_REGISTRY_SHA256, SOURCES, WIZARDS } from '../data/legacy.generated.js';
import {
  AUTOMATED_CHECK_NOTES,
  ENABLED_WIZARDS,
  MANIFEST_SHA256,
  MANIFEST_VERSION,
  SOURCE_MANIFEST
} from '../data/manifest.generated.js';

export const LEGAL_STATUSES = ['draft', 'automated-check-only', 'practitioner-reviewed', 'superseded'];

export function wizardSourceIds(wizard) {
  const ids = new Set();
  for (const node of Object.values(wizard.nodes || {})) {
    for (const id of node.cites || []) ids.add(id);
    for (const option of node.opts || []) for (const id of option.cites || []) ids.add(id);
  }
  return [...ids].sort();
}

export function reviewedThrough(sourceIds, manifest = SOURCE_MANIFEST) {
  if (!sourceIds.length) return null;
  const dates = [];
  for (const id of sourceIds) {
    const entry = manifest[id];
    if (!entry || entry.status !== 'practitioner-reviewed' || !entry.reviewDate) return null;
    dates.push(entry.reviewDate);
  }
  return dates.sort()[0] || null;
}

export function wizardReviewState(id, { manifest = SOURCE_MANIFEST, enabled = ENABLED_WIZARDS } = {}) {
  const wizard = WIZARDS[id];
  if (!wizard) return { status: 'missing', available: false, reviewedThrough: null, sourceIds: [] };
  const sourceIds = wizardSourceIds(wizard);
  const states = sourceIds.map((sourceId) => manifest[sourceId]?.status || 'draft');
  const allReviewed = sourceIds.length > 0 && states.every((status) => status === 'practitioner-reviewed');
  const hasSuperseded = states.includes('superseded');
  const hasDraft = states.includes('draft');
  const publishable = sourceIds.length > 0 && !hasDraft && !hasSuperseded && states.every((status) => status === 'automated-check-only' || status === 'practitioner-reviewed');
  const isEnabled = enabled.includes(id);
  return {
    status: hasSuperseded ? 'superseded' : allReviewed ? 'practitioner-reviewed' : states.includes('automated-check-only') ? 'automated-check-only' : 'draft',
    available: isEnabled && publishable,
    practitionerReviewed: allReviewed,
    reviewedThrough: isEnabled && allReviewed ? reviewedThrough(sourceIds, manifest) : null,
    sourceIds,
    automatedCheckNote: AUTOMATED_CHECK_NOTES[id] || null
  };
}

export function optionEligible(option, context = {}) {
  if (!option || typeof option !== 'object') return false;
  if (!option.when) return true;
  if (typeof option.when === 'function') return Boolean(option.when(context));
  if (typeof option.when === 'object') {
    return Object.entries(option.when).every(([key, expected]) => context[key] === expected);
  }
  return false;
}

export function eligibleOptions(node, context = {}) {
  return (node?.opts || []).filter((option) => optionEligible(option, context));
}

export function validateGraph({ wizards = WIZARDS, sources = SOURCES, manifest = SOURCE_MANIFEST, enabled = ENABLED_WIZARDS } = {}) {
  const errors = [];
  const warnings = [];
  const stats = { wizards: 0, nodes: 0, questions: 0, outcomes: 0, branches: 0, citations: 0 };
  for (const [wizardId, wizard] of Object.entries(wizards)) {
    stats.wizards += 1;
    if (!wizard.nodes?.[wizard.start]) errors.push(`${wizardId}: start node does not resolve`);
    const reachable = new Set();
    const queue = wizard.nodes?.[wizard.start] ? [wizard.start] : [];
    while (queue.length) {
      const nodeId = queue.shift();
      if (reachable.has(nodeId)) continue;
      reachable.add(nodeId);
      const node = wizard.nodes[nodeId];
      if (!node) continue;
      for (const option of node.opts || []) if (!reachable.has(option.goto)) queue.push(option.goto);
    }
    for (const [nodeId, node] of Object.entries(wizard.nodes || {})) {
      stats.nodes += 1;
      if (!reachable.has(nodeId)) warnings.push(`${wizardId}:${nodeId}: unreachable node`);
      if (node.type === 'question') {
        stats.questions += 1;
        if (!node.q || !Array.isArray(node.opts) || !node.opts.length) errors.push(`${wizardId}:${nodeId}: incomplete question`);
        for (const option of node.opts || []) {
          stats.branches += 1;
          if (!wizard.nodes[option.goto]) errors.push(`${wizardId}:${nodeId}: goto ${option.goto} does not resolve`);
        }
      } else if (node.type === 'outcome') {
        stats.outcomes += 1;
        if (!node.title || !node.summary || !node.tier) errors.push(`${wizardId}:${nodeId}: outcome missing title, summary, or tier`);
        if (!node.cites?.length) errors.push(`${wizardId}:${nodeId}: outcome has no cited authority`);
      } else errors.push(`${wizardId}:${nodeId}: unknown node type`);
      for (const sourceId of node.cites || []) {
        stats.citations += 1;
        if (!sources[sourceId]) errors.push(`${wizardId}:${nodeId}: source ${sourceId} missing`);
        if (!manifest[sourceId]) errors.push(`${wizardId}:${nodeId}: manifest entry ${sourceId} missing`);
      }
    }
    if (enabled.includes(wizardId)) {
      const review = wizardReviewState(wizardId, { manifest, enabled });
      if (!review.available) errors.push(`${wizardId}: enabled path contains a draft, missing, or superseded source`);
    }
  }
  for (const id of enabled) if (!wizards[id]) errors.push(`${id}: enabled wizard does not exist`);
  return { ok: errors.length === 0, errors, warnings, stats };
}

export function parseWizardHash(hash) {
  if (!hash || hash === '#') return { status: 'empty' };
  if (!/^#[a-z0-9-]{1,64}$/.test(hash)) return { status: 'invalid' };
  const id = hash.slice(1);
  return WIZARDS[id] ? { status: 'ok', id } : { status: 'unknown' };
}

export function sourceIdsForState(wizard, history = [], currentNodeId = null, outcomeId = null) {
  const ids = new Set();
  const addNode = (nodeId) => {
    const node = wizard?.nodes?.[nodeId];
    for (const id of node?.cites || []) ids.add(id);
  };
  for (const entry of history) {
    addNode(entry.nodeId);
    for (const id of entry.optionCites || []) ids.add(id);
  }
  if (currentNodeId) addNode(currentNodeId);
  if (outcomeId) addNode(outcomeId);
  return [...ids];
}

export function historyContext(history = []) {
  return Object.fromEntries(history.map((entry) => [entry.nodeId, entry.optionIndex]));
}

export function answerQuestion(wizard, nodeId, optionIndex, history = []) {
  const node = wizard?.nodes?.[nodeId];
  if (!node || node.type !== 'question') return { ok: false, reason: 'question' };
  const options = eligibleOptions(node, historyContext(history));
  const option = options[optionIndex];
  if (!option || !wizard.nodes[option.goto]) return { ok: false, reason: 'option' };
  const entry = {
    nodeId,
    question: node.q,
    optionIndex,
    answer: option.label,
    optionCites: option.cites || [],
    goto: option.goto
  };
  const nextHistory = [...history, entry];
  const next = wizard.nodes[option.goto];
  return {
    ok: true,
    history: nextHistory,
    currentNodeId: next.type === 'question' ? option.goto : null,
    outcomeId: next.type === 'outcome' ? option.goto : null
  };
}

export function editAnswer(wizard, history, index) {
  const entry = history[index];
  if (!entry || !wizard.nodes[entry.nodeId]) return { ok: false };
  return {
    ok: true,
    history: history.slice(0, index),
    currentNodeId: entry.nodeId,
    outcomeId: null,
    removed: history.length - index
  };
}

function localDate(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function buildRecord({ wizardId, history, outcomeId, date = new Date(), manifest = SOURCE_MANIFEST, enabled = ENABLED_WIZARDS }) {
  const wizard = WIZARDS[wizardId];
  const outcome = wizard?.nodes?.[outcomeId];
  if (!wizard || !outcome || outcome.type !== 'outcome') throw new Error('A complete outcome is required.');
  const review = wizardReviewState(wizardId, { manifest, enabled });
  const sourceIds = sourceIdsForState(wizard, history, null, outcomeId);
  const statusLine = review.practitionerReviewed && review.reviewedThrough
    ? `Legal sources reviewed through: ${review.reviewedThrough}`
    : `Legal review state: ${review.status} — published practitioner aid; not counsel approval`;
  const lines = [
    `# Privacy Wizards Council record — ${wizard.title}`,
    '',
    `Generated locally: ${localDate(date)}`,
    `Wizard ID: ${wizardId}`,
    statusLine,
    `Source manifest: ${MANIFEST_VERSION}`,
    `Source manifest SHA-256: ${MANIFEST_SHA256}`,
    `Legacy registry SHA-256: ${LEGACY_REGISTRY_SHA256}`,
    '',
    '## Selected facts',
    ''
  ];
  for (const entry of history) {
    lines.push(`- **${entry.question}**`, `  - ${entry.answer}`);
  }
  lines.push('', '## Outcome', '', `**${outcome.title}**`, '', outcome.summary, '');
  if (outcome.actions?.length) {
    lines.push('## What to do next', '');
    for (const action of outcome.actions) lines.push(`- ${action}`);
    lines.push('');
  }
  if (outcome.clock) lines.push('## Authored clock note', '', outcome.clock, '', 'No calendar reminder is generated unless the clock rule receives separate practitioner review.', '');
  lines.push('## Sources', '');
  for (const id of sourceIds) {
    const source = SOURCES[id];
    const manifestEntry = manifest[id];
    lines.push(`- **${source?.label || id}** — ${source?.citation || 'Citation unavailable'}`, `  - Status: ${manifestEntry?.status || 'draft'}`, `  - Official text: ${source?.provenance || source?.url || 'No official URL recorded'}`);
  }
  return lines.join('\n');
}

export function calendarEligibility({ wizardId, outcomeId, clockReviews = {}, manifest = SOURCE_MANIFEST, enabled = ENABLED_WIZARDS }) {
  const wizard = WIZARDS[wizardId];
  const outcome = wizard?.nodes?.[outcomeId];
  const review = wizardReviewState(wizardId, { manifest, enabled });
  const clockReview = clockReviews[`${wizardId}:${outcomeId}`];
  if (!review.available || !review.practitionerReviewed) return { available: false, reason: 'legal-review' };
  if (!outcome?.clockSpec) return { available: false, reason: 'no-clock' };
  if (!clockReview || clockReview.status !== 'practitioner-reviewed') return { available: false, reason: 'clock-review' };
  const required = ['anchorEvent', 'timezoneRule', 'countingRule', 'holidayRule', 'pauseExtensionTreatment', 'reviewer', 'reviewDate', 'sourceIds'];
  if (required.some((field) => !clockReview[field] || (Array.isArray(clockReview[field]) && !clockReview[field].length))) return { available: false, reason: 'clock-spec' };
  return { available: true, outcome, clockReview };
}

export function tierLabel(tier) {
  return ({ must: 'Required', warn: 'Caution', ok: 'OK', info: 'Info' })[tier] || 'Info';
}

export function sourceStatusLabel(status) {
  return (
    {
      draft: 'Draft source record',
      'automated-check-only': 'Automated check only',
      'practitioner-reviewed': 'Practitioner reviewed',
      superseded: 'Superseded — do not rely'
    }[status] || 'Draft source record'
  );
}

export { AUTOMATED_CHECK_NOTES, ENABLED_WIZARDS, LEGACY_REGISTRY_SHA256, MANIFEST_SHA256, MANIFEST_VERSION, SOURCE_MANIFEST, SOURCES, WIZARDS };
