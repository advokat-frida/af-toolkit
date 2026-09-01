import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacyPath = path.join(root, 'wizards.html');
const source = fs.readFileSync(legacyPath, 'utf8');

function assignment(name) {
  const marker = `const ${name} =`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Legacy assignment not found: ${name}`);
  const valueStart = start + marker.length;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let depth = 0;
  for (let i = valueStart; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      i += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      i += 1;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if ('[{('.includes(char)) depth += 1;
    else if (']})'.includes(char)) depth -= 1;
    else if (char === ';' && depth === 0) return source.slice(valueStart, i).trim();
  }
  throw new Error(`Unterminated legacy assignment: ${name}`);
}

const sourceText = assignment('SOURCES');
const wizardText = assignment('WIZARDS');
const sources = JSON.parse(sourceText);
const wizards = JSON.parse(wizardText);
const registryHash = crypto.createHash('sha256').update(`${sourceText}\n${wizardText}`).digest('hex');

const dataPath = path.join(root, 'src', 'lib', 'data', 'legacy.generated.js');
fs.mkdirSync(path.dirname(dataPath), { recursive: true });
fs.writeFileSync(
  dataPath,
  `// Generated mechanically from the shipped wizards.html. Do not hand-edit.\n\nexport const SOURCES = ${sourceText};\n\nexport const WIZARDS = ${wizardText};\n\nexport const LEGACY_REGISTRY_SHA256 = '${registryHash}';\n`,
  'utf8'
);

function citedByWizard(wizard) {
  const ids = new Set();
  for (const node of Object.values(wizard.nodes || {})) {
    for (const id of node.cites || []) ids.add(id);
    for (const option of node.opts || []) for (const id of option.cites || []) ids.add(id);
  }
  return [...ids].sort();
}

const citationsByWizard = Object.fromEntries(Object.entries(wizards).map(([id, wizard]) => [id, citedByWizard(wizard)]));
const manifest = Object.fromEntries(
  Object.entries(sources).map(([id, item]) => {
    const affectedWizards = Object.entries(citationsByWizard)
      .filter(([, citations]) => citations.includes(id))
      .map(([wizardId]) => wizardId);
    return [
      id,
      {
        id,
        jurisdiction: item.juris || 'Unspecified',
        sourceType: item.kind || 'authority',
        officialUrl: item.provenance || item.url || null,
        effectiveOrPublicationDate: null,
        retrievedDate: null,
        reviewDate: null,
        reviewer: null,
        reviewerRole: null,
        status: 'automated-check-only',
        contentSha256: crypto.createHash('sha256').update(JSON.stringify(item)).digest('hex'),
        affectedWizards
      }
    ];
  })
);
// These are the exact wizard IDs already published in the legacy production tool. Keeping this
// allowlist explicit prevents a newly extracted wizard from becoming public by accident.
const enabledWizards = [
  'breach',
  'sale-share',
  'dpia',
  'legal-basis',
  'special-category',
  'transfer',
  'role',
  'dpo',
  'dsar',
  'children',
  'cookies',
  'adm',
  'ropa',
  'ai-role',
  'ai-risk',
  'severity'
];
for (const id of enabledWizards) if (!wizards[id]) throw new Error(`Published baseline wizard is missing: ${id}`);

const manifestVersion = 'af-pwc-vnext-2026-08-21';
const manifestHash = crypto
  .createHash('sha256')
  .update(JSON.stringify({ manifestVersion, manifest, enabledWizards }))
  .digest('hex');
const automatedNotes = Object.fromEntries(Object.entries(wizards).map(([id, wizard]) => [id, wizard.verifiedAsOf || null]));
const manifestPath = path.join(root, 'src', 'lib', 'data', 'manifest.generated.js');
fs.writeFileSync(
  manifestPath,
  `// Generated source manifest. Enabled means published aid, not practitioner-reviewed.\n\nexport const MANIFEST_VERSION = '${manifestVersion}';\nexport const MANIFEST_SHA256 = '${manifestHash}';\nexport const SOURCE_MANIFEST = ${JSON.stringify(manifest, null, 2)};\nexport const AUTOMATED_CHECK_NOTES = ${JSON.stringify(automatedNotes, null, 2)};\nexport const ENABLED_WIZARDS = ${JSON.stringify(enabledWizards, null, 2)};\n`,
  'utf8'
);

const fontFaces = source.match(/@font-face\s*\{[\s\S]*?\}/g) || [];
if (fontFaces.length < 3) throw new Error(`Expected at least 3 inlined font faces, found ${fontFaces.length}`);
const fontPath = path.join(root, 'src', 'styles', 'fonts.generated.css');
fs.mkdirSync(path.dirname(fontPath), { recursive: true });
fs.writeFileSync(fontPath, `/* Generated from the shipped portable artifact. */\n${fontFaces.join('\n')}\n`, 'utf8');

console.log(`Extracted ${Object.keys(sources).length} sources, ${Object.keys(wizards).length} wizards, and ${fontFaces.length} font faces.`);
console.log(`Registry SHA-256: ${registryHash}`);
console.log(`Source manifest SHA-256: ${manifestHash}`);
