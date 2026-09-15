import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as manifest from '../../src/lib/data/manifest.generated.js';
import * as registry from '../../src/lib/data/registry.generated.js';
import { validateGraph } from '../../src/lib/engine/council.js';
import { buildRegistry, jurisdictionFolder, readContent, sourceFromFile, sourceToFile, validateContent } from '../../scripts/registry/content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const content = readContent(root);
const built = buildRegistry(content);

describe('authored content registry', () => {
  it('content_files_validate_clean', () => {
    expect(validateContent(content)).toEqual([]);
  });

  it('the_generated_modules_are_the_content_files', () => {
    // `npm test` regenerates them first; this catches a stale module in a bare vitest run.
    expect(Object.keys(registry.WIZARDS)).toEqual(content.registry.wizards.map((entry) => entry.id));
    expect(JSON.stringify(registry.WIZARDS)).toBe(JSON.stringify(built.WIZARDS));
    expect(JSON.stringify(registry.SOURCES)).toBe(JSON.stringify(built.SOURCES));
    expect(registry.REGISTRY_SHA256).toBe(built.REGISTRY_SHA256);
    expect(manifest.MANIFEST_VERSION).toBe(built.MANIFEST_VERSION);
    expect(manifest.MANIFEST_SHA256).toBe(built.MANIFEST_SHA256);
    expect(manifest.SOURCE_MANIFEST).toEqual(built.SOURCE_MANIFEST);
    expect(manifest.AUTOMATED_CHECK_NOTES).toEqual(built.AUTOMATED_CHECK_NOTES);
    // Sorted by id, so the manifest hash cannot depend on the order folders are read in.
    expect(Object.keys(registry.SOURCES)).toEqual(Object.keys(registry.SOURCES).sort());
  });

  it('only_published_paths_are_enabled', () => {
    expect(manifest.ENABLED_WIZARDS).toEqual(content.registry.wizards.filter((entry) => entry.published).map((entry) => entry.id));
  });

  it('the_built_registry_passes_the_engine_graph_checks', () => {
    const result = validateGraph({ wizards: built.WIZARDS, sources: built.SOURCES, manifest: built.SOURCE_MANIFEST, enabled: built.ENABLED_WIZARDS });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('source_files_round_trip_their_lines_and_keep_the_review_out_of_the_source', () => {
    const source = { kind: 'statute', juris: 'EU', label: 'L', citation: 'C', provenance: 'https://example.eu', body: '<p>a</p>\n  <p>b</p>' };
    const review = { status: 'draft', retrievedDate: null, effectiveOrPublicationDate: null, reviewDate: null, reviewer: null, reviewerRole: null };
    const file = sourceToFile(source, review);
    expect(file.body).toEqual(['<p>a</p>', '  <p>b</p>']);
    const back = sourceFromFile(JSON.parse(JSON.stringify(file)));
    expect(JSON.stringify(back.source)).toBe(JSON.stringify(source));
    expect(back.review).toEqual(review);
    expect(jurisdictionFolder('US (federal)')).toBe('us-federal');
    expect(jurisdictionFolder('US-CA')).toBe('us-ca');
    expect(jurisdictionFolder('EU')).toBe('eu');
  });

  it('a_review_status_change_does_not_change_the_content_hash', () => {
    const id = 'gdpr-art-33';
    const reviewed = { ...content, reviews: { ...content.reviews, [id]: { ...content.reviews[id], status: 'practitioner-reviewed', reviewDate: '2026-09-14', reviewer: 'test' } } };
    const rebuilt = buildRegistry(reviewed);
    expect(rebuilt.SOURCE_MANIFEST[id].contentSha256).toBe(built.SOURCE_MANIFEST[id].contentSha256);
    expect(rebuilt.SOURCE_MANIFEST[id].status).toBe('practitioner-reviewed');
    expect(rebuilt.MANIFEST_SHA256).not.toBe(built.MANIFEST_SHA256);
    expect(rebuilt.REGISTRY_SHA256).toBe(built.REGISTRY_SHA256);
  });

  it('validation_names_the_mistakes_an_author_makes', () => {
    const synthetic = {
      errors: [],
      registry: { manifestVersion: 'test', wizards: [{ id: 'w', published: true }] },
      wizards: { w: { title: 'W', start: 'q', nodes: { q: { type: 'question', q: 'Q?', cites: ['missing-source'], opts: [{ label: 'A', goto: 'q' }] } } } },
      sources: { s: { juris: 'EU', label: 'S', citation: 'C', provenance: 'http://insecure.example', body: 'text' } },
      reviews: { s: { status: 'practitioner-reviewed', retrievedDate: '14/09/2026', effectiveOrPublicationDate: null, reviewDate: null, reviewer: null } },
      locations: { s: 'sources/uk/s.json' }
    };
    const errors = validateContent(synthetic);
    expect(errors).toContain('wizards/w.json:q: cites missing-source, which has no source file');
    expect(errors).toContain('sources/uk/s.json: provenance must be an https URL');
    expect(errors).toContain('sources/uk/s.json: belongs in sources/eu/');
    expect(errors).toContain('sources/uk/s.json: practitioner-reviewed needs reviewDate and reviewer');
    expect(errors).toContain('sources/uk/s.json: review.reviewerRole is required (null when unknown)');
    expect(errors).toContain('sources/uk/s.json: review.retrievedDate must be YYYY-MM-DD or null');
  });

  it('validation_checks_the_path_graph', () => {
    const errors = validateContent({
      errors: [],
      registry: { manifestVersion: 'test', wizards: [{ id: 'w', published: true }] },
      wizards: {
        w: {
          title: 'W',
          start: 'nope',
          nodes: {
            q: { type: 'question', q: 'Q?', opts: [{ label: 'A', goto: 'missing' }] },
            o: { type: 'outcome', title: 'O', tier: 'ok' },
            x: { type: 'note' }
          }
        }
      },
      sources: {},
      reviews: {},
      locations: {}
    });
    expect(errors).toContain('wizards/w.json: start nope is not a node in this file');
    expect(errors).toContain('wizards/w.json:q: option "A" goes to missing, which is not a node in this file');
    expect(errors).toContain('wizards/w.json:o: an outcome needs summary');
    expect(errors).toContain('wizards/w.json:o: an outcome needs at least one cited source');
    expect(errors).toContain('wizards/w.json:x: type must be question or outcome');
    expect(errors).toContain('wizards/w.json:q: no answer leads here from the start');
  });
});
