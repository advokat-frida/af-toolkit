import { describe, expect, it } from 'vitest';
import { beginJurisdictions, answerJurisdiction, editJurisdiction, maxQuestionsRemaining, validateJurisdictionRoutes } from '../../src/lib/engine/jurisdictions.js';

const wizard = {
  start: 'states', jurisdictions: ['US-A', 'US-B'],
  jurisdictionRoutes: [{ id: 'US-A', label: 'State A', start: 'a' }, { id: 'US-B', label: 'State B', start: 'b' }],
  nodes: {
    states: { type: 'question', q: 'Which states?', opts: [{ label: 'State A', goto: 'a' }, { label: 'State B', goto: 'b' }] },
    a: { type: 'question', q: 'Threshold met?', opts: [{ label: 'Yes', goto: 'a-details' }, { label: 'Not sure', goto: 'a-unknown' }] },
    'a-details': { type: 'question', q: 'Exception applies?', opts: [{ label: 'No', goto: 'a-covered' }] },
    'a-covered': { type: 'outcome', title: 'Coverage indicated', cites: ['a-law'] },
    'a-unknown': { type: 'outcome', title: 'Find the consumer count', tier: 'warn', cites: ['a-law'], missingFacts: [{ fact: 'Consumer count', owner: 'Data team', why: 'Changes the threshold result' }] },
    b: { type: 'question', q: 'Doing business here?', opts: [{ label: 'Yes', goto: 'b-covered' }] },
    'b-covered': { type: 'outcome', title: 'Coverage indicated', cites: ['b-law'] }
  }
};

describe('independent jurisdiction interviews', () => {
  it('selected_jurisdictions_initialize_only_their_own_routes_in_authored_order', () => {
    const runs = beginJurisdictions(wizard, ['US-B', 'US-A']);
    expect(runs.map(({ id, currentNodeId }) => [id, currentNodeId])).toEqual([['US-A', 'a'], ['US-B', 'b']]);
    expect(runs.every(run => run.history.length === 0 && run.outcomeId === null)).toBe(true);
    expect(beginJurisdictions(wizard, ['US-B']).map(run => run.id)).toEqual(['US-B']);
  });

  it('empty_unknown_or_duplicate_jurisdictions_are_rejected', () => {
    for (const selection of [[], ['US-Z'], ['US-A', 'US-A']]) expect(() => beginJurisdictions(wizard, selection)).toThrow();
  });

  it('answers_and_edits_in_one_state_preserve_other_state_results', () => {
    const original = beginJurisdictions(wizard, ['US-A', 'US-B']);
    let runs = answerJurisdiction(wizard, original, 'US-B', 0);
    runs = answerJurisdiction(wizard, runs, 'US-A', 0);
    runs = answerJurisdiction(wizard, runs, 'US-A', 0);
    const other = structuredClone(runs[1]);
    runs = editJurisdiction(wizard, runs, 'US-A', 0);
    expect(runs[0]).toMatchObject({ currentNodeId: 'a', outcomeId: null, history: [] });
    expect(runs[1]).toEqual(other);
    expect(original[0].history).toEqual([]);
  });

  it('unknown_answers_remain_unresolved_and_carry_a_fact_owner_and_reason', () => {
    const runs = answerJurisdiction(wizard, beginJurisdictions(wizard, ['US-A']), 'US-A', 1);
    const outcome = wizard.nodes[runs[0].outcomeId];
    expect(outcome.tier).toBe('warn');
    expect(outcome.missingFacts[0]).toEqual({ fact: 'Consumer count', owner: 'Data team', why: 'Changes the threshold result' });
  });

  it('invalid_or_completed_state_mutations_do_not_silently_change_a_run', () => {
    const runs = beginJurisdictions(wizard, ['US-A']);
    expect(() => answerJurisdiction(wizard, runs, 'US-B', 0)).toThrow();
    expect(() => answerJurisdiction(wizard, runs, 'US-A', 99)).toThrow();
    expect(() => answerJurisdiction(wizard, runs, 'US-A', 0.5)).toThrow();
    const complete = answerJurisdiction(wizard, runs, 'US-A', 1);
    expect(() => answerJurisdiction(wizard, complete, 'US-A', 0)).toThrow();
  });

  it('progress_is_a_maximum_and_shrinks_when_a_shorter_branch_is_selected', () => {
    expect(maxQuestionsRemaining(wizard, 'a')).toBe(2);
    expect(maxQuestionsRemaining(wizard, 'a-details')).toBe(1);
    expect(maxQuestionsRemaining(wizard, 'a-unknown')).toBe(0);
  });
});

describe('authored jurisdiction integrity', () => {
  it('each_jurisdiction_has_a_unique_reachable_and_isolated_route', () => {
    expect(validateJurisdictionRoutes(wizard)).toEqual([]);
    const crossed = structuredClone(wizard);
    crossed.nodes.a.opts[0].goto = 'b';
    expect(validateJurisdictionRoutes(crossed).join(' ')).toMatch(/shared|cross/i);
  });

  it('invalid_missing_or_unlisted_routes_and_cycles_fail_validation', () => {
    for (const mutate of [
      w => { w.jurisdictionRoutes[0].id = 'US-Z'; },
      w => { w.jurisdictionRoutes[0].start = 'missing'; },
      w => { w.jurisdictionRoutes[1].id = 'US-A'; },
      w => { w.nodes.a.opts[0].goto = 'a'; },
      w => { w.nodes.states.opts.pop(); }
    ]) {
      const altered = structuredClone(wizard);
      mutate(altered);
      expect(validateJurisdictionRoutes(altered).length).toBeGreaterThan(0);
    }
  });
});
