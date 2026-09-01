import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacyPath = path.join(root, 'prompt-builder.html');
const source = fs.readFileSync(legacyPath, 'utf8');

function assignment(name) {
  const marker = `var ${name}=`;
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

const names = [
  'URLS',
  'REF',
  'PERSPECTIVES',
  'TONES',
  'JOBS',
  'JOBS_MORE',
  'FORMATS',
  'TAGS',
  'CANT_UNPASTE',
  'RETENTION',
  'RESEARCH_FRAMING',
  'FOCUS_NOTE',
  'GOV',
  'GOV_ORDER',
  'RECIPES',
  'ORG_FIELDS'
];

const moduleText = [
  '// Generated mechanically from the shipped prompt-builder.html. Do not hand-edit.',
  ...names.map((name) => `export const ${name} = ${assignment(name)};`),
  'export const ALL_JOBS = [...JOBS, ...JOBS_MORE];'
].join('\n\n') + '\n';

const dataPath = path.join(root, 'src', 'lib', 'data', 'legacy.generated.js');
fs.mkdirSync(path.dirname(dataPath), { recursive: true });
fs.writeFileSync(dataPath, moduleText, 'utf8');

const fontFaces = source.match(/@font-face\s*\{[\s\S]*?\}/g) || [];
if (fontFaces.length < 3) throw new Error(`Expected at least 3 inlined font faces, found ${fontFaces.length}`);
const fontPath = path.join(root, 'src', 'styles', 'fonts.generated.css');
fs.mkdirSync(path.dirname(fontPath), { recursive: true });
fs.writeFileSync(fontPath, `/* Generated from the shipped portable artifact. */\n${fontFaces.join('\n')}\n`, 'utf8');

console.log(`Extracted ${names.length} registries and ${fontFaces.length} font faces from ${path.basename(legacyPath)}.`);
