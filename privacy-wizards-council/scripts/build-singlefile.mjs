import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generated = path.join(root, 'dist', 'index.html');
const portable = path.join(root, 'dist', 'wizards.html');
// The browser-tab icon is the Toolkit shell's public/favicon-32.png at the repo root, read at build
// time so there is one source (never copy the PNG into this folder: the workspace hygiene gate
// deletes byte-duplicates). The page's CSP allows img-src data: only, so it ships as a data URI.
const favicon = path.resolve(root, '..', 'public', 'favicon-32.png');
const colorSchemeMeta = '<meta name="color-scheme" content="light" />';
if (!fs.existsSync(generated)) throw new Error('Vite did not produce dist/index.html');
if (!fs.existsSync(favicon)) throw new Error(`Toolkit favicon not found at ${favicon}`);
const iconLink = `<link rel="icon" type="image/png" sizes="32x32" href="data:image/png;base64,${fs.readFileSync(favicon).toString('base64')}" />`;
let html = fs.readFileSync(generated, 'utf8')
  .replace(/\r\n?/g, '\n')
  .replace(/[ \t]+$/gm, '');
if (!html.includes(colorSchemeMeta)) throw new Error('dist/index.html lacks the color-scheme meta the icon link is anchored to');
html = html.replace(colorSchemeMeta, () => `${colorSchemeMeta}\n    ${iconLink}`);
fs.writeFileSync(portable, html);
fs.unlinkSync(generated);
console.log('Portable artifact: dist/wizards.html');
