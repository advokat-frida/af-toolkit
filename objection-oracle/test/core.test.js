import { describe, expect, test } from 'vitest';
import {
  OUTCOME_CODES,
  OUTCOMES,
  QUESTIONS,
  RESPONSE_BANKS,
  RUBRIC_VERSION,
  evaluateAnswers,
  formatReceipt,
  pickQuip,
} from '../src/core.js';

const Y = true;
const N = false;

describe('decision engine', () => {
  test('oracle.shipsIfTargetIsNotSpecific', () => {
    expect(evaluateAnswers([N, Y, Y, N, Y]).code).toBe('SHIP_IT');
  });

  test('oracle.shipsIfNoRequirementErrorOrHarmIsNamed', () => {
    expect(evaluateAnswers([Y, N, Y, N, Y]).code).toBe('SHIP_IT');
  });

  test('oracle.queuesNextVersionIfNoReleaseConsequenceAndHarmIsReversible', () => {
    expect(evaluateAnswers([Y, Y, N, N, N]).code).toBe('NEXT_VERSION');
  });

  test('oracle.fixesThenShipsIfNarrowGuardrailWorks', () => {
    expect(evaluateAnswers([Y, Y, Y, Y, Y]).code).toBe('FIX_THEN_SHIP');
  });

  test('oracle.hardStopsIfUnguardedHarmIsHardToUndo', () => {
    expect(evaluateAnswers([Y, Y, Y, N, Y]).code).toBe('HARD_STOP');
  });

  test('oracle.neverQueuesHardToUndoHarmForNextVersion', () => {
    expect(evaluateAnswers([Y, Y, N, N, Y]).code).toBe('HARD_STOP');
  });

  test('oracle.allowsATargetedControlForHardToUndoHarm', () => {
    expect(evaluateAnswers([Y, Y, N, Y, Y]).code).toBe('FIX_THEN_SHIP');
  });

  test('oracle.fixesThenShipsIfUnguardedIssueIsReversible', () => {
    expect(evaluateAnswers([Y, Y, Y, N, N]).code).toBe('FIX_THEN_SHIP');
  });

  test('oracle.mapsAllThirtyTwoCombinationsToExactlyOneOutcome', () => {
    const counts = Object.fromEntries(OUTCOME_CODES.map((code) => [code, 0]));
    for (let mask = 0; mask < 32; mask += 1) {
      const answers = Array.from({ length: 5 }, (_, i) => Boolean(mask & (1 << i)));
      const result = evaluateAnswers(answers);
      expect(OUTCOME_CODES).toContain(result.code);
      expect(result).toBe(OUTCOMES[result.code]);
      counts[result.code] += 1;
    }
    expect(counts).toEqual({
      SHIP_IT: 24,
      NEXT_VERSION: 2,
      FIX_THEN_SHIP: 4,
      HARD_STOP: 2,
    });
  });

  test.each([
    [[N, N, N], 'NEXT_VERSION'],
    [[N, N, Y], 'HARD_STOP'],
    [[N, Y, N], 'NEXT_VERSION'],
    [[N, Y, Y], 'FIX_THEN_SHIP'],
    [[Y, N, N], 'FIX_THEN_SHIP'],
    [[Y, N, Y], 'HARD_STOP'],
    [[Y, Y, N], 'FIX_THEN_SHIP'],
    [[Y, Y, Y], 'FIX_THEN_SHIP'],
  ])('oracle.mapsSupportedSpecificTail%jTo%s', (tail, expected) => {
    expect(evaluateAnswers([Y, Y, ...tail]).code).toBe(expected);
  });

  test('oracle.rejectsIncompleteOrNonBinaryAnswers', () => {
    expect(() => evaluateAnswers([Y, N])).toThrow(/five/i);
    expect(() => evaluateAnswers([Y, Y, Y, Y, 'yes'])).toThrow(/boolean/i);
  });
});

describe('response banks', () => {
  test('oracle.quipAlwaysStaysInsideTheCanonicalOutcomeBank', () => {
    for (const code of OUTCOME_CODES) {
      for (const draw of [0, 0.17, 0.49, 0.999999]) {
        expect(RESPONSE_BANKS[code]).toContain(pickQuip(code, () => draw));
      }
    }
  });

  test('oracle.reshakeAvoidsAnImmediateRepeat', () => {
    for (const code of OUTCOME_CODES) {
      const previous = RESPONSE_BANKS[code][0];
      expect(pickQuip(code, () => 0, previous)).not.toBe(previous);
      expect(RESPONSE_BANKS[code]).toContain(pickQuip(code, () => 0, previous));
    }
  });

  test('oracle.eachOutcomeHasSixDistinctApprovedResponses', () => {
    for (const code of OUTCOME_CODES) {
      expect(RESPONSE_BANKS[code]).toHaveLength(6);
      expect(new Set(RESPONSE_BANKS[code]).size).toBe(6);
    }
  });

  test('oracle.usesTheApprovedReviewLanguageAndOriginalOracleVoice', () => {
    expect(RESPONSE_BANKS.HARD_STOP).toContain('This is why we review things.');
    expect(RESPONSE_BANKS.HARD_STOP).toContain('Time for a formal review. Yes, for real this time.');
    expect(RESPONSE_BANKS.SHIP_IT).toContain('The backlog has accepted your offering.');

    const allResponses = Object.values(RESPONSE_BANKS).flat();
    expect(allResponses).not.toContain('This is why review exists.');
    expect(allResponses).not.toContain('Formal review. Yes, for real this time.');
    expect(allResponses).not.toContain('Put it in the backlog if it sparks joy.');
  });

  test('oracle.responseBanksDoNotTargetPeopleOrProfessions', () => {
    const forbidden = /\b(lawyers?|counsel|attorneys?|boss(?:es)?|legal team|reviewers?)\b/i;
    for (const response of Object.values(RESPONSE_BANKS).flat()) {
      expect(response).not.toMatch(forbidden);
    }
  });
});

describe('ruling receipt', () => {
  test('oracle.receiptIncludesAnswersOutcomeReasonAndAction', () => {
    const answers = [Y, Y, Y, N, Y];
    const result = evaluateAnswers(answers);
    const generatedAt = '2026-08-24T20:15:00.000Z';
    const receipt = formatReceipt(answers, result, '', {generatedAt});
    expect(QUESTIONS).toHaveLength(5);
    QUESTIONS.forEach((question, index) => {
      expect(receipt).toContain(`${index + 1}. ${question.prompt}`);
      expect(receipt).toContain(`Answer: ${answers[index] ? 'Yes' : 'No'}`);
    });
    expect(receipt).toContain(`RULING: ${result.label}`);
    expect(receipt).toContain(`WHY: ${result.reason}`);
    expect(receipt).toContain(`NEXT: ${result.action}`);
    expect(receipt).toContain(`RUBRIC VERSION: ${RUBRIC_VERSION}`);
    expect(receipt).toContain(`GENERATED AT (UTC): ${generatedAt}`);
  });

  test('oracle.receiptRejectsAnInvalidTimestamp', () => {
    expect(() => formatReceipt([Y, Y, Y, N, Y], undefined, '', {generatedAt: 'not-a-date'})).toThrow(/timestamp/i);
  });
});
