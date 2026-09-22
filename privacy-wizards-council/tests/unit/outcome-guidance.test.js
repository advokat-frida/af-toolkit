import { expect, it } from 'vitest';
import { WIZARDS, answerQuestion, buildRecord, editAnswer, outcomeForState } from '../../src/lib/engine/council.js';
import { contextFor, tokenize } from '../../src/lib/engine/mentions.js';

const wizard = { nodes: {
  question: { type: 'question', q: 'Has this been confirmed?', cites: ['question-law'], opts: [
    { label: 'Yes', goto: 'result', desc: 'The incident team confirmed access.' },
    { label: 'Not yet', goto: 'result', resultActions: ['Preserve the investigation record.'], resultNotes: ['This result remains provisional.'] }
  ] },
  result: { type: 'outcome', title: 'Investigation result', summary: 'Review the selected facts.', actions: ['Record the decision.'], cites: ['law'] }
} };

it('selected_answer_guidance_appears_only_in_the_result_and_is_removed_when_the_answer_changes', () => {
  const selected = answerQuestion(wizard, 'question', 1);
  expect(selected.history[0].answerNote).toBe('');
  const result = outcomeForState(wizard, selected.history, 'result');
  expect(result.actions).toEqual(['Record the decision.', 'Preserve the investigation record.']);
  expect(result.notes).toEqual(['This result remains provisional.']);
  expect(result.cites).toEqual(['law']);
  expect(result.actionCites).toEqual([['law'], ['question-law']]);
  expect(result.noteCites).toEqual([['question-law']]);
  const edited = editAnswer(wizard, selected.history, 0);
  const confirmed = answerQuestion(wizard, edited.currentNodeId, 0, edited.history);
  expect(outcomeForState(wizard, confirmed.history, 'result').actions).toEqual(['Record the decision.']);
  expect(outcomeForState(wizard, confirmed.history, 'result').notes).toEqual([]);
  expect(confirmed.history[0].answerNote).toBe('The incident team confirmed access.');
  expect(wizard.nodes.result.actions).toEqual(['Record the decision.']);
});

it('a_general_question_does_not_change_the_final_uk_citation_context', () => {
  const breach = WIZARDS.breach;
  let state = answerQuestion(breach, breach.start, 0);
  state = answerQuestion(breach, state.currentNodeId, 1, state.history);
  state = answerQuestion(breach, state.currentNodeId, 1, state.history);
  const result = outcomeForState(breach, state.history, state.outcomeId);
  expect(result.cites).toEqual(breach.nodes[state.outcomeId].cites);
  const dpoAction = result.actions.findIndex(action => /DPO/.test(action));
  expect(dpoAction).toBeGreaterThanOrEqual(0);
  const tokens = tokenize(result.actions[dpoAction], contextFor('breach', { cites: result.actionCites[dpoAction] }));
  expect(tokens.find(token => token.text === 'DPO')?.sourceId).toBe('uk-gdpr-art-37');
});

it('a_real_unknown_answer_exports_its_provisional_reasoning_with_the_outcome_and_clears_it_after_editing', () => {
  const severity = WIZARDS.severity;
  const scope = answerQuestion(severity, severity.start, 0);
  const harm = answerQuestion(severity, scope.currentNodeId, 2, scope.history);
  const likelihood = severity.nodes[harm.currentNodeId];
  const index = likelihood.opts.findIndex(option => option.label.startsWith('Cannot yet be assessed'));
  const unknown = answerQuestion(severity, harm.currentNodeId, index, harm.history);
  const note = likelihood.opts[index].resultNotes[0];
  const action = likelihood.opts[index].resultActions[0];
  const record = buildRecord({ wizardId: 'severity', ...unknown });
  const facts = record.split('## Selected facts')[1].split('## Outcome')[0];
  expect(facts).not.toContain(note);
  expect(facts).not.toContain(action);
  expect(record.split('## Outcome')[1]).toContain(note);
  expect(record.split('## What to do next')[1]).toContain(action);
  const edit = editAnswer(severity, unknown.history, 2);
  const confirmed = answerQuestion(severity, edit.currentNodeId, 0, edit.history);
  const updated = buildRecord({ wizardId: 'severity', ...confirmed });
  expect(updated).not.toContain(note);
  expect(updated).not.toContain(action);
});

it('the_suspected_breach_answer_is_factual_and_its_result_preserves_investigation_advice', () => {
  const breach = WIZARDS.breach;
  const index = breach.nodes[breach.start].opts.findIndex(option => option.label.startsWith('Suspected'));
  const option = breach.nodes[breach.start].opts[index];
  expect(option.desc).toBeUndefined();
  const state = answerQuestion(breach, breach.start, index);
  const result = outcomeForState(breach, state.history, state.outcomeId);
  expect(result.actions.some(action => /investigation|incident response/i.test(action))).toBe(true);
  expect(result.summary).toMatch(/Suspicion alone does not establish/);
  const record = buildRecord({ wizardId: 'breach', ...state });
  expect(record.split('## Selected facts')[1].split('## Outcome')[0]).not.toMatch(/72|notify|document/i);
  expect(record.split('## What to do next')[1]).toMatch(/72 hours after awareness/);
});
