import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as legacy from '../../src/lib/data/legacy.generated.js';
import * as manifest from '../../src/lib/data/manifest.generated.js';
import { validateGraph } from '../../src/lib/engine/council.js';
import { buildRegistry, jurisdictionFolder, readContent, sourceFromFile, sourceToFile, validateContent } from '../../scripts/registry/content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const content = readContent(root);
const built = buildRegistry(content);

describe('authored content registry', () => {
  it('content_files_validate_clean', () => {
    expect(validateContent(content)).toEqual([]);
  });

  it('paths_match_the_legacy_extraction_in_order_and_byte_for_byte', () => {
    expect(Object.keys(built.WIZARDS)).toEqual(Object.keys(legacy.WIZARDS));
    for (const id of Object.keys(legacy.WIZARDS)) expect(JSON.stringify(built.WIZARDS[id]), id).toBe(JSON.stringify(legacy.WIZARDS[id]));
  });

  it('sources_match_the_legacy_extraction_including_the_included_text', () => {
    expect(Object.keys(built.SOURCES).sort()).toEqual(Object.keys(legacy.SOURCES).sort());
    for (const id of Object.keys(legacy.SOURCES)) expect(JSON.stringify(built.SOURCES[id]), id).toBe(JSON.stringify(legacy.SOURCES[id]));
    // Sorted by id, so the manifest hash cannot depend on the order folders are read in.
    expect(Object.keys(built.SOURCES)).toEqual(Object.keys(built.SOURCES).sort());
  });

  it('manifest_entries_published_paths_and_check_notes_match', () => {
    expect(built.MANIFEST_VERSION).toBe(manifest.MANIFEST_VERSION);
    expect(built.ENABLED_WIZARDS).toEqual(manifest.ENABLED_WIZARDS);
    expect(built.AUTOMATED_CHECK_NOTES).toEqual(manifest.AUTOMATED_CHECK_NOTES);
    expect(Object.keys(built.SOURCE_MANIFEST).sort()).toEqual(Object.keys(manifest.SOURCE_MANIFEST).sort());
    for (const id of Object.keys(manifest.SOURCE_MANIFEST)) expect(built.SOURCE_MANIFEST[id], id).toEqual(manifest.SOURCE_MANIFEST[id]);
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
