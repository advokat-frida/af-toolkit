import { REGISTRY_SHA256, SOURCES, WIZARDS } from '../data/registry.generated.js';
import {
  AUTOMATED_CHECK_NOTES,
  ENABLED_WIZARDS,
  MANIFEST_SHA256,
  MANIFEST_VERSION,
  SOURCE_MANIFEST
} from '../data/manifest.generated.js';
import { MOTION } from '../data/motion.js';
import { RELATED } from '../data/related.js';
import { SEARCH_ALIASES } from '../data/search.js';

export const LEGAL_STATUSES = ['draft', 'automated-check-only', 'practitioner-reviewed', 'superseded'];

// The ISO date at the front of a wizard's authored `verifiedAsOf` stamp, or null.
export function verifiedDate(wizard) {
  const match = String(wizard?.verifiedAsOf || '').match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

// Abbreviations the authored text follows with a capital ("Cal. Civ. Code", "Ch. V",
// "e.g. Google"): their full stop does not end a sentence.
const ABBREVIATIONS = new Set(['cal', 'civ', 'ch', 'gen', 'bus', 'cf', 'e.g', 'i.e', 'u.s', 'u.s.c', 'n.y', 'c.f.r', 'fed', 'eff', 'dept', 'inc', 'ltd', 'corp', 'jan', 'feb', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec']);

// The index just past each sentence end: a . ! or ? before a space and a capital, where a
// full stop does not close one of those abbreviations.
export function sentenceBreaks(text) {
  const value = String(text || '');
  const breaks = [];
  for (const match of value.matchAll(/[.!?](?=\s+[("'“‘]?[A-Z])/g)) {
    if (match[0] === '.') {
      const word = (value.slice(Math.max(0, match.index - 12), match.index).match(/[A-Za-z.]+$/) || [''])[0].toLowerCase();
      if (ABBREVIATIONS.has(word)) continue;
    }
    breaks.push(match.index + 1);
  }
  return breaks;
}

// The first sentence of a long text, for the one-line aside and the verdict qualifier.
// Short text comes back whole; the full text always stays reachable behind a disclosure.
export function decisionLead(text) {
  const value = String(text || '').trim();
  if (value.length <= 340) return value;
  const [first] = sentenceBreaks(value);
  return first !== undefined ? value.slice(0, first) : `${value.slice(0, 337).trimEnd()}…`;
}

// The included source text as plain paragraphs. Source bodies are authored with p, span,
// blockquote, b and i only; anything else is stripped the same way.
const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" };

export function sourceTextPlain(html) {
  let text = String(html || '')
    .replace(/\r/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|blockquote|h[1-6]|tr)>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ');
  // Strip tag-shaped markup until none is left; a bare "<" in the prose is text and stays.
  let previous;
  do {
    previous = text;
    text = text.replace(/<\/?[A-Za-z][^<>]*>/g, '');
  } while (text !== previous);
  // Entities decode in one pass, so an escaped "&amp;lt;" reads "&lt;", not "<".
  return text
    .replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/g, (entity, name) => ENTITIES[name])
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// The paths the finder offers: every published path, in registry order (content/registry.json).
export function publishedWizardIds(enabled = ENABLED_WIZARDS) {
  return Object.keys(WIZARDS).filter((id) => enabled.includes(id));
}

// The path most readers open after this one (data/related.js), only published paths. Given
// an outcome, only paths that share a jurisdiction with the law the outcome cites: a
// California answer is not sent to an EU-only path. INTL sources and paths are neutral.
export function relatedWizardIds(id, outcomeId = null, enabled = ENABLED_WIZARDS) {
  if (!own(RELATED, id)) return [];
  const outcome = outcomeId && own(WIZARDS, id) && own(WIZARDS[id].nodes || {}, outcomeId) ? WIZARDS[id].nodes[outcomeId] : null;
  const juris = new Set((outcome?.cites || []).map((sourceId) => SOURCES[sourceId]?.juris).filter((value) => value && value !== 'INTL'));
  return RELATED[id].filter((other) => {
    if (other === id || !own(WIZARDS, other) || !enabled.includes(other)) return false;
    return !juris.size || (WIZARDS[other].jurisdictions || []).some((value) => value === 'INTL' || juris.has(value));
  });
}

// Everything the finder matches a query against, lower-cased: the id, the authored
// title, question and tag, the category, the jurisdictions, and the synonyms.
export function searchText(id, wizard, categoryLabel = '') {
  return [id, wizard?.title, wizard?.q, wizard?.tag, categoryLabel, ...(wizard?.jurisdictions || []), ...(SEARCH_ALIASES[id] || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

// Pending-law notes that touch this outcome (data/motion.js). Annotations only. A scoped
// note shows only where the outcome cites law of that jurisdiction: an EU proposal says
// nothing about an answer that rests on UK law alone.
export function motionNotes(wizardId, outcomeId) {
  const nodes = own(WIZARDS, wizardId) ? WIZARDS[wizardId].nodes || {} : {};
  const outcome = own(nodes, outcomeId) ? nodes[outcomeId] : null;
  const juris = new Set((outcome?.cites || []).map((id) => SOURCES[id]?.juris));
  return MOTION.filter((note) => note.wizardIds.includes(wizardId)
    && (!note.outcomeIds || note.outcomeIds.includes(outcomeId))
    && (!note.scope || juris.has(note.scope)));
}

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

// A link names one published path. An unpublished path's link opens nothing, like an unknown one.
export function parseWizardHash(hash, enabled = ENABLED_WIZARDS) {
  if (!hash || hash === '#') return { status: 'empty' };
  if (!/^#[a-z0-9-]{1,64}$/.test(hash)) return { status: 'invalid' };
  const id = hash.slice(1);
  return own(WIZARDS, id) && enabled.includes(id) ? { status: 'ok', id } : { status: 'unknown' };
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
    answerNote: option.desc || '',
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
    `Sources checked: ${wizard.verifiedAsOf || 'not recorded'}`,
    `Source manifest: ${MANIFEST_VERSION}`,
    `Source manifest SHA-256: ${MANIFEST_SHA256}`,
    `Registry SHA-256: ${REGISTRY_SHA256}`,
    '',
    '## Selected facts',
    ''
  ];
  for (const entry of history) {
    lines.push(`- **${entry.question}**`, `  - ${entry.answer}`);
    if (entry.answerNote) lines.push(`    - ${entry.answerNote}`);
  }
  lines.push('', '## Outcome', '', `**${outcome.title}**`, '', outcome.summary, '');
  if (outcome.actions?.length) {
    lines.push('## What to do next', '');
    for (const action of outcome.actions) lines.push(`- ${action}`);
    lines.push('');
  }
  if (outcome.clock) lines.push('## Authored clock note', '', outcome.clock, '', 'No calendar reminder is generated unless the clock rule receives separate practitioner review.', '');
  const pending = motionNotes(wizardId, outcomeId);
  if (pending.length) {
    lines.push('## What may change', '');
    for (const note of pending) lines.push(`- ${note.text}`, `  - Checked ${note.checked}. Source: ${note.source.label} — ${note.source.url}`);
    lines.push('');
  }
  lines.push('## Sources', '');
  for (const id of sourceIds) {
    const source = SOURCES[id];
    const manifestEntry = manifest[id];
    lines.push(`- **${source?.label || id}** — ${source?.citation || 'Citation unavailable'}`, `  - Status: ${manifestEntry?.status || 'draft'}`, `  - Official text: ${source?.provenance || source?.url || 'No official URL recorded'}`);
    const text = sourceTextPlain(source?.body);
    if (text) {
      lines.push('  - Included text:', '');
      for (const line of text.split('\n')) lines.push(line ? `    > ${line}` : '    >');
      lines.push('');
    }
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

export { AUTOMATED_CHECK_NOTES, ENABLED_WIZARDS, MANIFEST_SHA256, MANIFEST_VERSION, REGISTRY_SHA256, SOURCE_MANIFEST, SOURCES, WIZARDS };
