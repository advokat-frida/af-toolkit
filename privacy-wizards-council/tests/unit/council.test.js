import { describe, expect, it } from 'vitest';
import {
  ENABLED_WIZARDS,
  MANIFEST_SHA256,
  MANIFEST_VERSION,
  SOURCE_MANIFEST,
  SOURCES,
  WIZARDS,
  answerQuestion,
  buildRecord,
  calendarEligibility,
  editAnswer,
  parseWizardHash,
  reviewedThrough,
  sourceIdsForState,
  validateGraph,
  wizardReviewState,
  wizardSourceIds
} from '../../src/lib/engine/council.js';

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
    expect(result.stats).toEqual({ wizards: 16, nodes: 225, questions: 76, outcomes: 149, branches: 298, citations: 658 });
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
  it('the_exact_legacy_baseline_is_available_without_claiming_practitioner_review', () => {
    expect(ENABLED_WIZARDS).toEqual(Object.keys(WIZARDS));
    for (const id of Object.keys(WIZARDS)) {
      const review = wizardReviewState(id);
      expect(review.available, id).toBe(true);
      expect(review.practitionerReviewed, id).toBe(false);
      expect(review.status, id).toBe('automated-check-only');
      expect(review.reviewedThrough, id).toBe(null);
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
    expect(MANIFEST_VERSION).toBe('af-pwc-vnext-2026-08-21');
    expect(MANIFEST_SHA256).toMatch(/^[a-f0-9]{64}$/);
    expect(Object.values(SOURCE_MANIFEST).every((entry) => entry.status === 'automated-check-only')).toBe(true);
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
    const path = firstOutcomePath(wizard);
    const record = buildRecord({ wizardId: 'breach', history: path.history, outcomeId: path.outcomeId, date: new Date('2026-08-20T12:00:00') });
    expect(record).toContain('## Selected facts');
    expect(record).toContain('## Outcome');
    expect(record).toContain('## Sources');
    expect(record).toContain(`Source manifest SHA-256: ${MANIFEST_SHA256}`);
    expect(record).toContain('automated-check-only');
    expect(record).not.toContain('Sources verified as of');
  });

  it('unreviewed_or_indeterminate_clock_does_not_export_ics', () => {
    const wizard = WIZARDS.breach;
    const clockedOutcome = Object.entries(wizard.nodes).find(([, node]) => node.clockSpec)?.[0];
    expect(clockedOutcome).toBeTruthy();
    expect(calendarEligibility({ wizardId: 'breach', outcomeId: clockedOutcome })).toEqual({ available: false, reason: 'legal-review' });
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
