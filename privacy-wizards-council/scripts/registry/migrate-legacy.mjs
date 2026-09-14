// One-time migration (2026-09-14): split the registry extracted from the legacy wizards.html
// into authored files under content/. Refuses to run over existing registry files, so it
// cannot silently overwrite authored work.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { jurisdictionFolder, sourceToFile } from './content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const contentDir = path.join(root, 'content');
const existing = fs.existsSync(contentDir) ? fs.readdirSync(contentDir).filter((name) => name !== 'README.md') : [];
if (existing.length) {
  console.error(`content/ already holds ${existing.join(', ')}. The migration runs once; move those aside to run it again.`);
  process.exit(1);
}

const legacy = await import(pathToFileURL(path.join(root, 'src', 'lib', 'data', 'legacy.generated.js')).href);
const manifest = await import(pathToFileURL(path.join(root, 'src', 'lib', 'data', 'manifest.generated.js')).href);

function write(rel, value) {
  const file = path.join(contentDir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

write('registry.json', {
  manifestVersion: manifest.MANIFEST_VERSION,
  wizards: Object.keys(legacy.WIZARDS).map((id) => ({ id, published: manifest.ENABLED_WIZARDS.includes(id) }))
});
for (const [id, wizard] of Object.entries(legacy.WIZARDS)) write(`wizards/${id}.json`, wizard);
for (const [id, source] of Object.entries(legacy.SOURCES)) {
  const entry = manifest.SOURCE_MANIFEST[id] || {};
  const review = {
    status: entry.status || 'draft',
    retrievedDate: entry.retrievedDate ?? null,
    effectiveOrPublicationDate: entry.effectiveOrPublicationDate ?? null,
    reviewDate: entry.reviewDate ?? null,
    reviewer: entry.reviewer ?? null,
    reviewerRole: entry.reviewerRole ?? null
  };
  write(`sources/${jurisdictionFolder(source.juris)}/${id}.json`, sourceToFile(source, review));
}
console.log(`Wrote registry.json, ${Object.keys(legacy.WIZARDS).length} path files and ${Object.keys(legacy.SOURCES).length} source files to content/.`);
