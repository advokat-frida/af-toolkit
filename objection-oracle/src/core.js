export const QUESTIONS = Object.freeze([
  Object.freeze({
    id: 'q1',
    prompt: 'Can you point to the exact sentence, step, or omission?',
    short: 'Specific target',
  }),
  Object.freeze({
    id: 'q2',
    prompt: 'Can you name the specific requirement, factual error, or realistic harm?',
    short: 'Supported concern',
  }),
  Object.freeze({
    id: 'q3',
    prompt: 'Would leaving it unchanged alter an obligation, make the resource factually wrong or unsafe, or lead the intended user to a meaningfully different action?',
    short: 'Release consequence',
  }),
  Object.freeze({
    id: 'q4',
    prompt: 'Can a targeted correction, scope limit, or reversible human control resolve it before release?',
    short: 'Targeted control',
  }),
  Object.freeze({
    id: 'q5',
    prompt: 'If it ships unchanged, would the likely harm be difficult to undo?',
    short: 'Hard to undo',
  }),
]);

export const OUTCOME_CODES = Object.freeze([
  'SHIP_IT',
  'NEXT_VERSION',
  'FIX_THEN_SHIP',
  'HARD_STOP',
]);

export const RUBRIC_VERSION = 'AF-OO-2026-08-24.1';

export const OUTCOMES = Object.freeze({
  SHIP_IT: Object.freeze({
    code: 'SHIP_IT',
    label: 'SHIP IT',
    reason: 'The objection is not specific, supported, and decision-relevant.',
    action: 'Proceed. Backlog any optional polish without reopening the release.',
    owner: 'The release owner.',
    meaning: 'Nobody could point to the exact sentence, name the requirement or the harm, or show that leaving it would change what a user does. That is a preference, and preferences do not hold releases.',
    closeout: 'Reply to the objection with this ruling and the backlog item, then ship.',
    accent: 'forest',
  }),
  NEXT_VERSION: Object.freeze({
    code: 'NEXT_VERSION',
    label: 'NEXT VERSION',
    reason: 'The concern is legitimate, but it does not change an obligation, factual accuracy, safety, or the user’s next action, and the likely harm is reversible.',
    action: 'Record it as a nonblocking improvement for the next version.',
    owner: 'Whoever raised the objection.',
    meaning: 'The objection is real and specific, but nothing a user does would change if this shipped as-is, and any harm could be undone. It earns a ticket, not a delay.',
    closeout: 'File the improvement in the objector’s own words, link it from the release notes, then ship.',
    accent: 'indigo',
  }),
  FIX_THEN_SHIP: Object.freeze({
    code: 'FIX_THEN_SHIP',
    label: 'FIX IT, THEN SHIP',
    reason: 'A real release issue exists. Correct it before release; the likely harm is either controllable or reversible.',
    action: 'Make the smallest effective correction, confirm the issue is controlled, and ship without reopening unrelated work.',
    owner: 'Whoever raised the objection.',
    meaning: 'The objection names a specific, supported problem that would change what a user does, and a targeted correction can resolve it before release. Fix that one thing; do not reopen the rest.',
    closeout: 'Have the objector confirm the correction against their original wording, then ship.',
    accent: 'amber',
  }),
  HARD_STOP: Object.freeze({
    code: 'HARD_STOP',
    label: 'HARD STOP',
    reason: 'The issue is specific and decision-relevant, cannot be narrowly controlled, and could cause harm that is difficult to undo.',
    action: 'Stop the release for substantive correction and review.',
    owner: 'The release owner.',
    meaning: 'This is the rare case: a supported objection, no narrow fix, and harm that would not reverse. The release waits for a substantive correction and a second review.',
    closeout: 'Record the stop, the correction plan, and who reviews the fix before the release is rescheduled.',
    accent: 'red',
  }),
});

export const RESPONSE_BANKS = Object.freeze({
  SHIP_IT: Object.freeze([
    'A preference has been detected. A blocker has not.',
    'No rule. No harm. No seventh meeting.',
    'The mountains can stay triangular. Ship the map.',
    'Perfect remains unavailable. Useful is ready.',
    'The Oracle rejects atmospheric concern.',
    'The backlog has accepted your offering.',
  ]),
  NEXT_VERSION: Object.freeze([
    'Good note. Wrong release.',
    'That would make it better. It does not make this unusable.',
    'Not ignored. Sequenced.',
    'Future You has been assigned this concern.',
    'Backlog it before it grows a calendar invite.',
    'Congratulations, you found version 1.1.',
  ]),
  FIX_THEN_SHIP: Object.freeze([
    'Fine. Fix the sentence. Do not summon a committee.',
    'One guardrail, then out the door.',
    'This needs a patch, not a pilgrimage.',
    'Fix the reef. Leave the triangle mountains alone.',
    'Correct it. Confirm it. Ship it.',
    'A real issue. Quick, before someone reopens section one.',
  ]),
  HARD_STOP: Object.freeze([
    'Annoyingly, this is a real blocker.',
    'Put the launch button down.',
    'This one can actually hurt someone. Fix it properly.',
    'Not vibes. Not polish. An actual reef.',
    'Time for a formal review. Yes, for real this time.',
    'This is why we review things.',
  ]),
});

function validateAnswers(answers) {
  if (!Array.isArray(answers) || answers.length !== QUESTIONS.length) {
    throw new TypeError('The oracle requires exactly five answers.');
  }
  if (answers.some((answer) => typeof answer !== 'boolean')) {
    throw new TypeError('Every oracle answer must be a boolean.');
  }
}

export function evaluateAnswers(answers) {
  validateAnswers(answers);
  const [specific, supported, decisionChanging, targetedControl, hardToUndo] = answers;

  if (!specific || !supported) return OUTCOMES.SHIP_IT;
  if (hardToUndo && !targetedControl) return OUTCOMES.HARD_STOP;
  if (decisionChanging || hardToUndo) return OUTCOMES.FIX_THEN_SHIP;
  return OUTCOMES.NEXT_VERSION;
}

export function pickQuip(code, random = Math.random, previous = null) {
  const bank = RESPONSE_BANKS[code];
  if (!bank) throw new RangeError(`Unknown outcome: ${code}`);
  const candidates = bank.length > 1 && previous
    ? bank.filter((response) => response !== previous)
    : [...bank];
  const draw = Number(random());
  const normalized = Number.isFinite(draw) ? Math.max(0, Math.min(draw, 0.999999999)) : 0;
  return candidates[Math.floor(normalized * candidates.length)];
}

export function formatReceipt(
  answers,
  result = evaluateAnswers(answers),
  quip = '',
  {generatedAt = new Date(), rubricVersion = RUBRIC_VERSION} = {},
) {
  validateAnswers(answers);
  if (!result || !OUTCOME_CODES.includes(result.code)) {
    throw new TypeError('A canonical oracle result is required.');
  }
  const generatedDate = generatedAt instanceof Date ? generatedAt : new Date(generatedAt);
  if (Number.isNaN(generatedDate.getTime())) {
    throw new TypeError('A valid receipt timestamp is required.');
  }
  const answerLines = QUESTIONS.map((question, index) => (
    `${index + 1}. ${question.prompt}\n   Answer: ${answers[index] ? 'Yes' : 'No'}`
  )).join('\n');
  const quipLine = quip ? `\n\nORACLE: ${quip}` : '';
  return [
    'OBJECTION ORACLE',
    `RUBRIC VERSION: ${rubricVersion}`,
    `GENERATED AT (UTC): ${generatedDate.toISOString()}`,
    '',
    answerLines,
    '',
    `RULING: ${result.label}`,
    `WHY: ${result.reason}`,
    `WHAT IT MEANS: ${result.meaning}`,
    `NEXT: ${result.action}`,
    `OWNER: ${result.owner}`,
    `CLOSE IT OUT: ${result.closeout}${quipLine}`,
  ].join('\n');
}
