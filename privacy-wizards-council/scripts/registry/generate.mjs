// Build the registry modules the engine imports from the authored files in content/.
// A content error stops the build and writes nothing. `npm run registry` runs this, and dev,
// build and test run it first.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRegistry, readContent, validateContent } from './content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const content = readContent(root);
const errors = validateContent(content);
if (errors.length) {
  console.error(`content/ has ${errors.length} error${errors.length === 1 ? '' : 's'}, so nothing was written:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  process.exit(1);
}

const built = buildRegistry(content);
const header = '// Generated from content/ by scripts/registry/generate.mjs. Edit the files in content/, not this one.';
const modules = {
  'registry.generated.js': `${header}\n\nexport const SOURCES = ${JSON.stringify(built.SOURCES, null, 1)};\n\nexport const WIZARDS = ${JSON.stringify(built.WIZARDS, null, 1)};\n\nexport const REGISTRY_SHA256 = '${built.REGISTRY_SHA256}';\n`,
  'manifest.generated.js': `${header}\n// Enabled means a published aid, not practitioner review.\n\nexport const MANIFEST_VERSION = '${built.MANIFEST_VERSION}';\nexport const MANIFEST_SHA256 = '${built.MANIFEST_SHA256}';\nexport const SOURCE_MANIFEST = ${JSON.stringify(built.SOURCE_MANIFEST, null, 2)};\nexport const AUTOMATED_CHECK_NOTES = ${JSON.stringify(built.AUTOMATED_CHECK_NOTES, null, 2)};\nexport const ENABLED_WIZARDS = ${JSON.stringify(built.ENABLED_WIZARDS, null, 2)};\n`
};
const dir = path.join(root, 'src', 'lib', 'data');
for (const [name, text] of Object.entries(modules)) {
  const file = path.join(dir, name);
  // An unchanged module keeps its timestamp, so a running dev server does not reload for nothing.
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) fs.writeFileSync(file, text, 'utf8');
}
console.log(`Registry built from content/: ${Object.keys(built.WIZARDS).length} paths, ${Object.keys(built.SOURCES).length} sources, ${built.ENABLED_WIZARDS.length} published.`);
console.log(`Registry SHA-256: ${built.REGISTRY_SHA256}`);
console.log(`Source manifest SHA-256: ${built.MANIFEST_SHA256}`);
