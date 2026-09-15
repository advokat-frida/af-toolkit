// The authored registry: one JSON file per path and one per source, under content/.
// Pure functions shared by the build (generate.mjs) and the tests. Nothing here
// runs in the browser.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const LEGAL_STATUSES = ['draft', 'automated-check-only', 'practitioner-reviewed', 'superseded'];
export const REVIEW_FIELDS = ['status', 'retrievedDate', 'effectiveOrPublicationDate', 'reviewDate', 'reviewer', 'reviewerRole'];

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
const own = (object, key) => Boolean(object) && Object.prototype.hasOwnProperty.call(object, key);

// The folder a source lives in: its jurisdiction, lower-cased (US-CA -> us-ca).
export function jurisdictionFolder(juris) {
  const value = String(juris || '').trim();
  if (value === 'US (federal)') return 'us-federal';
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unspecified';
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${file}: ${error.message}`);
  }
}

function listJson(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort(byName)) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listJson(full));
    else if (entry.isFile() && entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

// A source file keeps the included text as lines so a diff shows the line that changed;
// the registry joins them. The review block travels in the same file but never enters the
// source object, so a status change does not change the source's content hash.
export function sourceFromFile(raw) {
  const source = {};
  let review = null;
  for (const [key, value] of Object.entries(raw)) {
    if (key === 'review') review = value;
    else source[key] = key === 'body' && Array.isArray(value) ? value.join('\n') : value;
  }
  return { source, review };
}

export function sourceToFile(source, review) {
  const raw = {};
  for (const [key, value] of Object.entries(source)) raw[key] = key === 'body' && typeof value === 'string' ? value.split('\n') : value;
  raw.review = review;
  return raw;
}

export function readContent(root) {
  const dir = path.join(root, 'content');
  const errors = [];
  const registry = readJson(path.join(dir, 'registry.json'));
  const wizards = {};
  const listed = new Set();
  for (const entry of registry.wizards || []) {
    if (!entry || typeof entry.id !== 'string') {
      errors.push('registry.json: every wizard entry needs an id');
      continue;
    }
    if (listed.has(entry.id)) errors.push(`registry.json: ${entry.id} is listed twice`);
    listed.add(entry.id);
    const file = path.join(dir, 'wizards', `${entry.id}.json`);
    if (!fs.existsSync(file)) {
      errors.push(`registry.json: ${entry.id} has no wizards/${entry.id}.json`);
      continue;
    }
    wizards[entry.id] = readJson(file);
  }
  for (const file of listJson(path.join(dir, 'wizards'))) {
    const id = path.basename(file, '.json');
    if (!listed.has(id)) errors.push(`wizards/${id}.json is not listed in registry.json`);
  }
  const sources = {};
  const reviews = {};
  const locations = {};
  for (const file of listJson(path.join(dir, 'sources'))) {
    const id = path.basename(file, '.json');
    const rel = path.relative(dir, file).replaceAll('\\', '/');
    if (sources[id]) {
      errors.push(`${rel}: source id ${id} is already defined in ${locations[id]}`);
      continue;
    }
    const { source, review } = sourceFromFile(readJson(file));
    sources[id] = source;
    reviews[id] = review;
    locations[id] = rel;
  }
  return { registry, wizards, sources, reviews, locations, errors };
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateContent(content) {
  const errors = [...(content.errors || [])];
  const { registry, wizards, sources, reviews, locations } = content;
  if (typeof registry?.manifestVersion !== 'string' || !registry.manifestVersion) errors.push('registry.json: manifestVersion is required');
  for (const [id, source] of Object.entries(sources)) {
    const where = locations[id] || `sources/?/${id}.json`;
    for (const field of ['juris', 'label', 'citation']) if (!source[field]) errors.push(`${where}: ${field} is required`);
    if (typeof source.body !== 'string' || !source.body.trim()) errors.push(`${where}: body is required`);
    if (source.provenance && !/^https:\/\//.test(source.provenance)) errors.push(`${where}: provenance must be an https URL`);
    const folder = where.split('/')[1];
    const expected = jurisdictionFolder(source.juris);
    if (folder !== expected) errors.push(`${where}: belongs in sources/${expected}/`);
    const review = reviews[id];
    if (!review || typeof review !== 'object') {
      errors.push(`${where}: review block is required`);
      continue;
    }
    for (const field of REVIEW_FIELDS) if (!(field in review)) errors.push(`${where}: review.${field} is required (null when unknown)`);
    if (!LEGAL_STATUSES.includes(review.status)) errors.push(`${where}: review.status must be one of ${LEGAL_STATUSES.join(', ')}`);
    if (review.status === 'practitioner-reviewed' && (!review.reviewDate || !review.reviewer)) errors.push(`${where}: practitioner-reviewed needs reviewDate and reviewer`);
    for (const field of ['retrievedDate', 'effectiveOrPublicationDate', 'reviewDate']) {
      if (review[field] !== null && review[field] !== undefined && !DATE.test(review[field])) errors.push(`${where}: review.${field} must be YYYY-MM-DD or null`);
    }
  }
  for (const [id, wizard] of Object.entries(wizards)) {
    const where = `wizards/${id}.json`;
    for (const field of ['title', 'start', 'nodes']) if (!wizard[field]) errors.push(`${where}: ${field} is required`);
    const nodes = wizard.nodes || {};
    if (wizard.start && !own(nodes, wizard.start)) errors.push(`${where}: start ${wizard.start} is not a node in this file`);
    for (const [nodeId, node] of Object.entries(nodes)) {
      if (node.type === 'question') {
        if (!node.q) errors.push(`${where}:${nodeId}: a question needs q`);
        if (!Array.isArray(node.opts) || !node.opts.length) errors.push(`${where}:${nodeId}: a question needs at least one option`);
      } else if (node.type === 'outcome') {
        for (const field of ['title', 'summary', 'tier']) if (!node[field]) errors.push(`${where}:${nodeId}: an outcome needs ${field}`);
        if (!node.cites?.length) errors.push(`${where}:${nodeId}: an outcome needs at least one cited source`);
      } else {
        errors.push(`${where}:${nodeId}: type must be question or outcome`);
      }
      for (const cite of node.cites || []) if (!own(sources, cite)) errors.push(`${where}:${nodeId}: cites ${cite}, which has no source file`);
      for (const option of node.opts || []) {
        if (!own(nodes, option.goto)) errors.push(`${where}:${nodeId}: option "${option.label}" goes to ${option.goto}, which is not a node in this file`);
        for (const cite of option.cites || []) if (!own(sources, cite)) errors.push(`${where}:${nodeId}: an option cites ${cite}, which has no source file`);
      }
    }
    // A node no answer leads to from the start is a node no reader will ever see.
    const reached = new Set();
    const queue = own(nodes, wizard.start) ? [wizard.start] : [];
    while (queue.length) {
      const nodeId = queue.shift();
      if (reached.has(nodeId)) continue;
      reached.add(nodeId);
      for (const option of nodes[nodeId].opts || []) if (own(nodes, option.goto)) queue.push(option.goto);
    }
    for (const nodeId of Object.keys(nodes)) if (!reached.has(nodeId)) errors.push(`${where}:${nodeId}: no answer leads here from the start`);
  }
  return errors;
}

function citedBy(wizard) {
  const ids = new Set();
  for (const node of Object.values(wizard.nodes || {})) {
    for (const id of node.cites || []) ids.add(id);
    for (const option of node.opts || []) for (const id of option.cites || []) ids.add(id);
  }
  return [...ids].sort();
}

// The shapes the engine imports (SOURCES, WIZARDS, the source manifest), built from the
// authored files.
export function buildRegistry(content) {
  const { registry, wizards, sources, reviews } = content;
  const WIZARDS = {};
  for (const entry of registry.wizards || []) if (wizards[entry.id]) WIZARDS[entry.id] = wizards[entry.id];
  // Sorted by id, so the manifest hash does not depend on the order the folders are read in.
  const SOURCES = Object.fromEntries(Object.keys(sources).sort().map((id) => [id, sources[id]]));
  const citations = Object.entries(WIZARDS).map(([id, wizard]) => [id, citedBy(wizard)]);
  const SOURCE_MANIFEST = Object.fromEntries(
    Object.entries(SOURCES).map(([id, item]) => {
      const review = reviews[id] || {};
      return [
        id,
        {
          id,
          jurisdiction: item.juris || 'Unspecified',
          sourceType: item.kind || 'authority',
          officialUrl: item.provenance || item.url || null,
          effectiveOrPublicationDate: review.effectiveOrPublicationDate ?? null,
          retrievedDate: review.retrievedDate ?? null,
          reviewDate: review.reviewDate ?? null,
          reviewer: review.reviewer ?? null,
          reviewerRole: review.reviewerRole ?? null,
          status: review.status || 'draft',
          contentSha256: sha256(JSON.stringify(item)),
          affectedWizards: citations.filter(([, ids]) => ids.includes(id)).map(([wizardId]) => wizardId)
        }
      ];
    })
  );
  const ENABLED_WIZARDS = (registry.wizards || []).filter((entry) => entry.published && WIZARDS[entry.id]).map((entry) => entry.id);
  const MANIFEST_VERSION = registry.manifestVersion;
  const MANIFEST_SHA256 = sha256(JSON.stringify({ manifestVersion: MANIFEST_VERSION, manifest: SOURCE_MANIFEST, enabledWizards: ENABLED_WIZARDS }));
  const AUTOMATED_CHECK_NOTES = Object.fromEntries(Object.entries(WIZARDS).map(([id, wizard]) => [id, wizard.verifiedAsOf || null]));
  const REGISTRY_SHA256 = sha256(JSON.stringify({ sources: SOURCES, wizards: WIZARDS }));
  return { SOURCES, WIZARDS, SOURCE_MANIFEST, ENABLED_WIZARDS, AUTOMATED_CHECK_NOTES, MANIFEST_VERSION, MANIFEST_SHA256, REGISTRY_SHA256 };
}
