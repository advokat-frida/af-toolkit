import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ENABLED_WIZARDS,
  MANIFEST_SHA256,
  MANIFEST_VERSION,
  REGISTRY_SHA256,
  SOURCE_MANIFEST,
  SOURCES,
  WIZARDS,
  answerQuestion,
  buildRecord,
  calendarEligibility,
  decisionLead,
  editAnswer,
  finderGroups,
  finderWizardIds,
  motionNotes,
  parseWizardHash,
  publishedWizardIds,
  relatedWizardIds,
  reviewedThrough,
  searchText,
  sentenceBreaks,
  sourceIdsForState,
  sourceTextPlain,
  validateGraph,
  verifiedDate,
  wizardReviewState,
  wizardSourceIds
} from '../../src/lib/engine/council.js';
import { categories, commonWizardIds } from '../../src/lib/data/categories.js';
import { MOTION } from '../../src/lib/data/motion.js';
import { RELATED } from '../../src/lib/data/related.js';
import { SEARCH_ALIASES } from '../../src/lib/data/search.js';
import { readContent } from '../../scripts/registry/content.mjs';

const content = readContent(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'));
// The sixteen paths the legacy tool published: the extraction's allowlist until 2026-09-14.
const BASELINE_PATHS = ['breach', 'sale-share', 'dpia', 'legal-basis', 'special-category', 'transfer', 'role', 'dpo', 'dsar', 'children', 'cookies', 'adm', 'ropa', 'ai-role', 'ai-risk', 'severity'];

function firstOutcomePath(wizard) {
  let current = wizard.start;
  let history = [];
  for (let guard = 0; guard < 100; guard += 1) {
    const node = wizard.nodes[current];
    if (node.type === 'outcome') return { outcomeId: current, history };
    const result = answerQuestion(wizard, current, 0, history);
    if (!result.ok) throw new Error(`Could not advance from ${current}`);
    history = result.history;
    if (result.outcomeId) return { outcomeId: result.outcomeId, history };
    current = result.currentNodeId;
  }
  throw new Error('Path did not terminate');
}

describe('decision graph integrity', () => {
  it('all_wizard_starts_resolve_and_all_gotos_resolve', () => {
    const result = validateGraph();
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    // The counts come from the authored files, so a new path changes them in one place.
    const nodes = Object.values(content.wizards).flatMap((wizard) => Object.values(wizard.nodes));
    expect(result.stats).toEqual({
      wizards: Object.keys(content.wizards).length,
      nodes: nodes.length,
      questions: nodes.filter((node) => node.type === 'question').length,
      outcomes: nodes.filter((node) => node.type === 'outcome').length,
      branches: nodes.reduce((sum, node) => sum + (node.opts || []).length, 0),
      citations: nodes.reduce((sum, node) => sum + (node.cites || []).length, 0)
    });
    expect(result.stats.wizards).toBeGreaterThanOrEqual(16);
  });

  it('all_nodes_are_reachable_or_explicitly_exempt', () => {
    expect(validateGraph().warnings).toEqual([]);
  });

  it('all_outcomes_have_text_tier_and_citations', () => {
    for (const [wizardId, wizard] of Object.entries(WIZARDS)) {
      for (const [nodeId, node] of Object.entries(wizard.nodes)) {
        if (node.type !== 'outcome') continue;
        expect(node.title, `${wizardId}:${nodeId}`).toBeTruthy();
        expect(node.summary, `${wizardId}:${nodeId}`).toBeTruthy();
        expect(node.tier, `${wizardId}:${nodeId}`).toBeTruthy();
        expect(node.cites?.length, `${wizardId}:${nodeId}`).toBeGreaterThan(0);
      }
    }
  });

  it('all_citations_resolve_to_source_with_provenance_manifest', () => {
    for (const wizard of Object.values(WIZARDS)) {
      for (const id of wizardSourceIds(wizard)) {
        expect(SOURCES[id], id).toBeTruthy();
        expect(SOURCE_MANIFEST[id], id).toBeTruthy();
        expect(SOURCE_MANIFEST[id].contentSha256).toMatch(/^[a-f0-9]{64}$/);
      }
    }
  });
});

describe('published baseline and legal review state', () => {
  it('published_paths_run_and_claim_only_the_review_their_sources_carry', () => {
    // Publication and review status are authored in content/, so the expectations come from there.
    const published = content.registry.wizards.filter((entry) => entry.published === true).map((entry) => entry.id);
    expect(ENABLED_WIZARDS).toEqual(published);
    expect(publishedWizardIds()).toEqual(published);
    // Retiring a baseline path needs Ben's recorded approval, not a registry edit.
    for (const id of BASELINE_PATHS) expect(published, id).toContain(id);
    for (const id of Object.keys(WIZARDS)) {
      const review = wizardReviewState(id);
      const reviewed = review.sourceIds.every((sourceId) => SOURCE_MANIFEST[sourceId].status === 'practitioner-reviewed');
      expect(review.available, id).toBe(published.includes(id));
      expect(review.practitionerReviewed, id).toBe(reviewed);
      expect(review.reviewedThrough !== null, id).toBe(published.includes(id) && reviewed);
    }
  });

  it('graph_rejects_an_enabled_wizard_with_a_draft_or_superseded_source', () => {
    const manifest = structuredClone(SOURCE_MANIFEST);
    manifest['gdpr-art-33'].status = 'superseded';
    const result = validateGraph({ manifest, enabled: ['breach'] });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('breach: enabled path contains a draft, missing, or superseded source');
  });

  it('reviewed_through_uses_least_recent_relied_on_review', () => {
    const ids = ['gdpr-art-4', 'gdpr-art-33'];
    const manifest = {
      'gdpr-art-4': { status: 'practitioner-reviewed', reviewDate: '2026-08-19' },
      'gdpr-art-33': { status: 'practitioner-reviewed', reviewDate: '2026-08-12' }
    };
    expect(reviewedThrough(ids, manifest)).toBe('2026-08-12');
    manifest['gdpr-art-33'].status = 'automated-check-only';
    expect(reviewedThrough(ids, manifest)).toBe(null);
  });

  it('ui_record_allowlist_and_manifest_hash_agree', () => {
    expect(MANIFEST_VERSION).toBe(content.registry.manifestVersion);
    expect(MANIFEST_VERSION).toMatch(/^af-pwc-vnext-\d{4}-\d{2}-\d{2}$/);
    expect(MANIFEST_SHA256).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('path state and deep-link privacy', () => {
  it('back_reconstructs_history_and_path_citations', () => {
    const wizard = WIZARDS.breach;
    const first = answerQuestion(wizard, wizard.start, 0, []);
    expect(first.ok).toBe(true);
    const second = answerQuestion(wizard, first.currentNodeId, 0, first.history);
    expect(second.ok).toBe(true);
    const edit = editAnswer(wizard, second.history, 0);
    expect(edit.ok).toBe(true);
    expect(edit.history).toEqual([]);
    expect(edit.currentNodeId).toBe(wizard.start);
    expect(edit.removed).toBe(2);
    expect(sourceIdsForState(wizard, first.history, first.currentNodeId)).toContain('gdpr-art-4');
  });

  it('editing_earlier_answer_invalidates_downstream_state_and_explains_count', () => {
    const wizard = WIZARDS.dpia;
    let current = wizard.start;
    let history = [];
    for (let i = 0; i < 3; i += 1) {
      const result = answerQuestion(wizard, current, 0, history);
      expect(result.ok).toBe(true);
      history = result.history;
      if (result.outcomeId) break;
      current = result.currentNodeId;
    }
    const result = editAnswer(wizard, history, 1);
    expect(result.history).toHaveLength(1);
    expect(result.removed).toBe(history.length - 1);
  });

  it('deep_link_round_trips_current_wizard', () => {
    expect(parseWizardHash('#dpia')).toEqual({ status: 'ok', id: 'dpia' });
    expect(parseWizardHash('#ai-risk')).toEqual({ status: 'ok', id: 'ai-risk' });
  });

  it('an_unpublished_path_is_not_offered_named_or_opened_by_link', () => {
    const enabled = ENABLED_WIZARDS.filter((id) => id !== 'severity');
    expect(publishedWizardIds(enabled)).not.toContain('severity');
    expect(parseWizardHash('#severity', enabled)).toEqual({ status: 'unknown' });
    expect(relatedWizardIds('breach', 'o-eu-sa-only', enabled)).toEqual([]);
    expect(relatedWizardIds('breach', 'o-eu-sa-only')).toEqual(['severity']);
    expect(wizardReviewState('severity', { enabled }).available).toBe(false);
  });

  it('the_finder_lists_only_published_paths', () => {
    const enabled = ENABLED_WIZARDS.filter((id) => id !== 'severity');
    expect(finderWizardIds()).toEqual(commonWizardIds);
    expect(finderWizardIds({ showAll: true })).toEqual(publishedWizardIds());
    expect(finderWizardIds({ showAll: true, enabled })).not.toContain('severity');
    expect(finderWizardIds({ term: 'severity' })).toContain('severity');
    expect(finderWizardIds({ term: 'severity', enabled })).not.toContain('severity');
    expect(finderWizardIds({ categoryId: 'incidents', enabled })).toEqual(['breach']);
    expect(finderGroups(enabled).flatMap((group) => group.ids)).not.toContain('severity');
    expect(finderGroups().flatMap((group) => group.ids).sort()).toEqual([...publishedWizardIds()].sort());
    // A category whose paths are all unpublished shows no heading.
    expect(finderGroups(ENABLED_WIZARDS.filter((id) => !['breach', 'severity'].includes(id))).map((group) => group.id)).not.toContain('incidents');
  });

  it('deep_link_never_serializes_answers_history_outcome_or_dates', () => {
    const allowed = Object.keys(WIZARDS).map((id) => `#${id}`);
    for (const hash of allowed) expect(hash).toMatch(/^#[a-z0-9-]+$/);
    expect(parseWizardHash('#dpia?answer=yes')).toEqual({ status: 'invalid' });
    expect(parseWizardHash('#dpia/yes')).toEqual({ status: 'invalid' });
    expect(parseWizardHash('#dpia-2026-08-20')).toEqual({ status: 'unknown' });
  });

  it('unknown_or_malformed_fragment_recovers_without_echoing_input', () => {
    expect(parseWizardHash('')).toEqual({ status: 'empty' });
    expect(parseWizardHash('#')).toEqual({ status: 'empty' });
    expect(parseWizardHash('#does-not-exist')).toEqual({ status: 'unknown' });
    expect(parseWizardHash('#<script>')).toEqual({ status: 'invalid' });
  });
});

describe('records and calendar gate', () => {
  it('legacy_representative_paths_reach_an_authored_outcome', () => {
    for (const [id, wizard] of Object.entries(WIZARDS)) {
      const result = firstOutcomePath(wizard);
      expect(wizard.nodes[result.outcomeId].type, id).toBe('outcome');
      expect(result.history.length, id).toBeGreaterThan(0);
    }
  });

  it('markdown_record_contains_path_outcome_sources_and_manifest_hash', () => {
    const wizard = WIZARDS.breach;
    const route = firstOutcomePath(wizard);
    const record = buildRecord({ wizardId: 'breach', history: route.history, outcomeId: route.outcomeId, date: new Date('2026-08-20T12:00:00') });
    expect(record).toContain('## Selected facts');
    expect(record).toContain('## Outcome');
    expect(record).toContain('## Sources');
    expect(record).toContain(`Source manifest SHA-256: ${MANIFEST_SHA256}`);
    expect(record).toContain(`Registry SHA-256: ${REGISTRY_SHA256}`);
    expect(record).not.toContain('Legacy registry');
    const review = wizardReviewState('breach');
    expect(record).toContain(review.practitionerReviewed ? 'Legal sources reviewed through:' : `Legal review state: ${review.status}`);
    expect(record).not.toContain('Sources verified as of');
  });

  it('unreviewed_or_indeterminate_clock_does_not_export_ics', () => {
    const wizard = WIZARDS.breach;
    const clockedOutcome = Object.entries(wizard.nodes).find(([, node]) => node.clockSpec)?.[0];
    expect(clockedOutcome).toBeTruthy();
    // Unreviewed sources stop the reminder at legal review; reviewed sources still stop it at the clock review.
    const reason = wizardReviewState('breach').practitionerReviewed ? 'clock-review' : 'legal-review';
    expect(calendarEligibility({ wizardId: 'breach', outcomeId: clockedOutcome })).toEqual({ available: false, reason });
  });

  it('unclocked_outcomes_do_not_offer_calendar_export', () => {
    const wizard = WIZARDS.breach;
    const unclocked = Object.entries(wizard.nodes).find(([, node]) => node.type === 'outcome' && !node.clockSpec)?.[0];
    const allReviewed = Object.fromEntries(
      Object.entries(SOURCE_MANIFEST).map(([id, entry]) => [id, { ...entry, status: 'practitioner-reviewed', reviewDate: '2026-08-20' }])
    );
    expect(calendarEligibility({ wizardId: 'breach', outcomeId: unclocked, manifest: allReviewed, enabled: ['breach'] })).toEqual({ available: false, reason: 'no-clock' });
  });
});

describe('the authored depth reaches the page', () => {
  it('every_published_path_names_one_or_two_next_determinations_that_exist', () => {
    // Unpublished paths may point at each other while they are written; only what readers reach counts.
    for (const id of publishedWizardIds()) {
      const related = relatedWizardIds(id);
      expect(related.length, id).toBeGreaterThan(0);
      expect(related.length, id).toBeLessThanOrEqual(2);
      for (const other of related) {
        expect(WIZARDS[other], `${id} -> ${other}`).toBeTruthy();
        expect(other).not.toBe(id);
      }
    }
    for (const id of Object.keys(RELATED)) expect(WIZARDS[id], id).toBeTruthy();
  });

  it('an_outcome_names_only_next_determinations_that_share_its_jurisdiction', () => {
    for (const [id, wizard] of Object.entries(WIZARDS)) {
      for (const [outcomeId, node] of Object.entries(wizard.nodes)) {
        if (node.type !== 'outcome') continue;
        const juris = new Set(node.cites.map((sourceId) => SOURCES[sourceId].juris).filter((value) => value !== 'INTL'));
        if (!juris.size) continue;
        for (const other of relatedWizardIds(id, outcomeId)) {
          expect(WIZARDS[other].jurisdictions.some((value) => juris.has(value)), `${id}:${outcomeId} -> ${other}`).toBe(true);
        }
      }
    }
    const saleShare = Object.keys(WIZARDS['sale-share'].nodes).find((nodeId) => WIZARDS['sale-share'].nodes[nodeId].type === 'outcome');
    expect(relatedWizardIds('sale-share', saleShare)).toEqual(['dsar']);
    expect(relatedWizardIds('breach', 'o-ny-notify')).toEqual([]);
    expect(relatedWizardIds('breach', 'o-eu-sa-only')).toEqual(['severity']);
  });

  it('inherited_object_keys_are_not_wizards', () => {
    expect(parseWizardHash('#constructor')).toEqual({ status: 'unknown' });
    expect(relatedWizardIds('constructor')).toEqual([]);
    expect(motionNotes('constructor', 'constructor')).toEqual([]);
  });

  it('every_wizard_sits_in_exactly_one_category', () => {
    for (const id of Object.keys(WIZARDS)) expect(categories.filter((category) => category.wizardIds.includes(id)).length, id).toBe(1);
  });

  it('search_aliases_name_existing_wizards_and_resolve_common_terms', () => {
    for (const id of Object.keys(SEARCH_ALIASES)) expect(WIZARDS[id], id).toBeTruthy();
    expect(searchText('dsar', WIZARDS.dsar)).toContain('subject access');
    expect(searchText('cookies', WIZARDS.cookies, 'Rights & people')).toContain('gpc');
    expect(searchText('breach', WIZARDS.breach)).toContain('72 hours');
    expect(searchText('breach', WIZARDS.breach)).toContain('us-ny');
  });

  it('verified_date_reads_the_iso_prefix_of_the_authored_stamp', () => {
    expect(verifiedDate({ verifiedAsOf: '2026-07-02 (automated check)' })).toBe('2026-07-02');
    for (const id of publishedWizardIds()) expect(verifiedDate(WIZARDS[id]), id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(verifiedDate({ verifiedAsOf: 'soon' })).toBe(null);
    expect(verifiedDate({})).toBe(null);
  });

  it('source_text_plain_strips_markup_and_keeps_paragraph_breaks', () => {
    const text = sourceTextPlain(SOURCES['gdpr-art-4'].body);
    expect(text).not.toMatch(/<[^>]+>/);
    expect(text).toContain("'personal data' means any information");
    expect(text).toContain('\n\n');
    expect(sourceTextPlain('')).toBe('');
    expect(sourceTextPlain('<p>a &amp; b</p><blockquote>c</blockquote>')).toBe('a & b\n\nc');
    // Entities decode once, a bare "<" in prose stays, and tag fragments cannot reassemble.
    expect(sourceTextPlain('<p>&amp;lt;b&amp;gt; and &lt;i&gt;</p>')).toBe('&lt;b&gt; and <i>');
    expect(sourceTextPlain('<p>small (fewer than 50; <$3M revenue) ok</p><p>next</p>')).toBe('small (fewer than 50; <$3M revenue) ok\n\nnext');
    expect(sourceTextPlain('<scr<b>ipt>x</p>')).toBe('x');
  });

  it('decision_lead_returns_short_text_whole_and_cuts_long_text_at_a_sentence', () => {
    expect(decisionLead('Short.')).toBe('Short.');
    const long = `${'First sentence about the rule that runs on. '.repeat(6)}Second sentence. ${'x'.repeat(200)}`;
    const lead = decisionLead(long);
    expect(lead.length).toBeLessThan(long.length);
    expect(lead.endsWith('.')).toBe(true);
    // The lead exists because most authored help and reasoning is longer than one line.
    const longNodes = Object.values(WIZARDS).flatMap((wizard) => Object.values(wizard.nodes)).filter((node) => (node.help || node.summary || '').length > 340);
    expect(longNodes.length).toBeGreaterThan(100);
    for (const node of longNodes) expect(decisionLead(node.help || node.summary)).not.toBe(node.help || node.summary);
    // A citation abbreviation before a capital does not end the lead.
    const text = 'Under Cal. Civ. Code § 1798.82. Then Ch. V applies. Done';
    expect(sentenceBreaks(text).map((index) => text.slice(0, index))).toEqual(['Under Cal. Civ. Code § 1798.82.', 'Under Cal. Civ. Code § 1798.82. Then Ch. V applies.']);
    for (const node of longNodes) expect(decisionLead(node.help || node.summary)).not.toMatch(/\b(?:Cal|Civ|Ch|Gen|Bus)\.$/);
  });

  it('pending_law_notes_point_at_existing_outcomes_and_carry_a_dated_official_source', () => {
    for (const note of MOTION) {
      expect(note.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(note.source.url).toMatch(/^https:\/\//);
      expect(note.text).toMatch(/proposal/i);
      expect(note.text).toMatch(/not law/i);
      for (const wizardId of note.wizardIds) {
        expect(WIZARDS[wizardId], wizardId).toBeTruthy();
        for (const outcomeId of note.outcomeIds || []) expect(WIZARDS[wizardId].nodes[outcomeId]?.type, `${wizardId}:${outcomeId}`).toBe('outcome');
      }
    }
    expect(motionNotes('breach', 'o-eu-sa-only')).toHaveLength(1);
    expect(motionNotes('breach', 'o-ny-notify')).toHaveLength(0);
    expect(motionNotes('dpia', Object.keys(WIZARDS.dpia.nodes).find((id) => WIZARDS.dpia.nodes[id].type === 'outcome'))).toHaveLength(1);
    expect(motionNotes('ai-risk', 'anything')).toHaveLength(0);
    // An EU proposal note stays off an answer that rests on UK law alone.
    expect(motionNotes('cookies', 'o-analytics')).toHaveLength(1);
    expect(motionNotes('cookies', 'o-analytics-uk')).toHaveLength(0);
  });

  it('record_carries_the_check_date_answer_notes_pending_notes_and_included_source_text', () => {
    const wizard = WIZARDS.breach;
    let current = wizard.start;
    let history = [];
    let outcomeId = null;
    for (let guard = 0; guard < 20 && !outcomeId; guard += 1) {
      const node = wizard.nodes[current];
      const index = Math.max(0, (node.opts || []).findIndex((option) => option.desc));
      const result = answerQuestion(wizard, current, index, history);
      expect(result.ok).toBe(true);
      history = result.history;
      outcomeId = result.outcomeId;
      current = result.currentNodeId;
    }
    expect(history.some((entry) => entry.answerNote)).toBe(true);
    const record = buildRecord({ wizardId: 'breach', history, outcomeId, date: new Date('2026-09-13T12:00:00') });
    expect(record).toContain(`Sources checked: ${WIZARDS.breach.verifiedAsOf}`);
    expect(record).toContain('  - Included text:');
    expect(record).toMatch(/\n    > /);
    const noted = history.find((entry) => entry.answerNote);
    // A nested item, so a Markdown viewer does not run the note into the answer line.
    expect(record).toContain(`  - ${noted.answer}\n    - ${noted.answerNote}`);
    if (motionNotes('breach', outcomeId).length) expect(record).toContain('## What may change');
  });
});
