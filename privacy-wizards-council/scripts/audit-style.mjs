import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(root, 'src', 'styles', 'app.css'), 'utf8');
// Every component, not only App.svelte: any of them can bring back what this audit bans.
const components = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.svelte')) components.push({ file: path.relative(root, full).replaceAll('\\', '/'), source: fs.readFileSync(full, 'utf8') });
  }
})(path.join(root, 'src'));
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

for (const { file, source } of components) {
  if (/\{(?:item|wizard)\.icon\}/u.test(source) || /[\u{1F300}-\u{1FAFF}]/u.test(source)) failures.push(`legacy emoji icon rendering remains in ${file}`);
  const styles = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1]).join('\n');
  const componentColors = styles.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) || [];
  if (componentColors.length) failures.push(`raw colors in ${file}: ${[...new Set(componentColors)].join(', ')}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Style audit passed: tokenized colors/fonts, 0/4px/999px radius grammar, and Lucide wizard chrome.');
