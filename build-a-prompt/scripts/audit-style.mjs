import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(root, 'src', 'styles', 'app.css'), 'utf8');
const rootBlock = css.match(/^:root\s*\{[\s\S]*?\}\s*/);
if (!rootBlock) throw new Error('Could not isolate the :root token block');
const componentCss = css.slice(rootBlock[0].length);
const failures = [];

const rawColors = componentCss.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) || [];
if (rawColors.length) failures.push(`raw colors outside :root: ${[...new Set(rawColors)].join(', ')}`);

const fontValues = [...componentCss.matchAll(/font-family:\s*([^;}]+)/gi)].map((match) => match[1].trim());
const invalidFonts = fontValues.filter((value) => value !== 'inherit' && !value.startsWith('var('));
if (invalidFonts.length) failures.push(`font families outside variables: ${[...new Set(invalidFonts)].join(', ')}`);

const radii = [...componentCss.matchAll(/border-radius:\s*([^;}]+)/gi)].map((match) => match[1].trim());
const invalidRadii = radii.filter((value) => !['0', '4px', '999px'].includes(value));
if (invalidRadii.length) failures.push(`invalid radius values: ${[...new Set(invalidRadii)].join(', ')}`);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Style audit passed: tokenized colors/fonts and 0/4px/999px radius grammar.');
