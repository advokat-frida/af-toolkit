import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generated = path.join(root, 'dist', 'index.html');
const portable = path.join(root, 'dist', 'prompt-builder.html');

if (!fs.existsSync(generated)) throw new Error('Vite did not produce dist/index.html');
const html = fs.readFileSync(generated, 'utf8')
  .replace(/\r\n?/g, '\n')
  .replace(/[ \t]+$/gm, '');
fs.writeFileSync(portable, html);
fs.unlinkSync(generated);
console.log('Portable artifact: dist/prompt-builder.html');
