# Objection Oracle

Status: approved for implementation
Tracking: ADVO-108
Surface: private, standalone Advokat Frida tool

## Purpose

Turn a review objection into one of four practical release decisions using five
binary questions. The experience should feel like asking a magic fortune ball,
but the ruling must remain deterministic and explainable.

## Five questions

1. Can you point to the exact sentence, step, or omission?
2. Can you name the specific requirement, factual error, or realistic harm?
3. Would leaving it unchanged violate that requirement or cause the intended
   user to take a meaningfully different action?
4. Can one sentence, label, scope limit, or human check resolve it?
5. If it ships unchanged, would the likely harm be difficult to undo?

There is no free text, Maybe, Other, skip, or confidence input.

## Decision logic

```text
IF Q1 = No OR Q2 = No:
  SHIP IT
ELSE IF Q3 = No:
  NEXT VERSION
ELSE IF Q4 = Yes:
  FIX IT, THEN SHIP
ELSE IF Q5 = Yes:
  HARD STOP
ELSE:
  FIX IT, THEN SHIP
```

## Canonical outcomes

- `SHIP IT`: no specific, supported, decision-relevant blocker. Proceed;
  backlog optional polish.
- `NEXT VERSION`: legitimate but non-decision-changing. Preserve it as a
  nonblocking improvement.
- `FIX IT, THEN SHIP`: a targeted correction or reversible control resolves the
  issue. Make the smallest correction without reopening the whole resource.
- `HARD STOP`: a real, decision-relevant issue cannot be narrowly controlled
  and the likely harm is difficult to undo. Stop for substantive correction.

The outcome, reason, and next action are canonical. A response is selected at
random only from that outcome's approved response bank. An immediate re-shake
may change the response but never the ruling.

## Interaction

`WELCOME -> Q1 -> Q2 -> Q3 -> Q4 -> Q5 -> READY -> SHAKING -> RESULT`

- Show one question and `N of 5`.
- Show a white 8 face while asking questions.
- Enable `SHAKE FOR RULING` only after all five answers.
- Animate three asymmetric jolts plus a turn for 900–1200 milliseconds.
- Reveal an indigo triangular answer window with outcome and response.
- `SHAKE AGAIN` changes only the response and avoids an immediate repeat.
- `COPY RULING` includes all five answers, outcome, reason, and next action.
- `START OVER` clears only in-memory state.
- Reduced-motion users receive an immediate result with a short fade.
- No sound, haptics, device motion, network, analytics, or persistence.

## Tone

The joke targets vague objections, perfection theater, and process paralysis.
It never targets lawyers, counsel, bosses, legal teams, reviewers, or any other
profession or person. A hard stop should recognize that substantive review
worked.

## Release boundary

This build is a private prototype. Moving it into the website repository,
publishing it, or deploying it requires a separate approval.
