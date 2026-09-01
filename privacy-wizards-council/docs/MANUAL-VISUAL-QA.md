# Manual visual QA — v2 release artifact

**Date:** 2026-08-21<br>
**Artifact:** `dist/wizards.html`<br>
**Bytes:** 1,060,003<br>
**SHA-256:** `b0c3a45948b13a95372fe16b01d83b8e24477f480d431e59dbfb392f6f53d481`<br>
**Decision baseline:** 16 legacy production paths and 139 sources; registry SHA-256
`8548c5c80e20e888db794a5b4f577e30c90023e259288d3a2826f86259d8a900`<br>
**Legal state:** every source remains `automated-check-only`; no practitioner review is claimed<br>
**Release boundary:** Ben explicitly authorized the public v2 deployment on 2026-08-21

Automated graph checks are supporting evidence, not visual acceptance. Every PASS below records
direct inspection of the built portable artifact in the in-app browser. The final rebuild includes
the direct-link task-card scroll correction and was reopened at exact mobile sizes before release.

## Inspected states

| Viewport | State | Direct observation | Result |
|---|---|---|---|
| 1440×1000 | Finder | Changelog is closed by default; one search field, five category controls, the concise automated-check warning, and common paths form a readable first viewport. | PASS |
| 1440×1000 | Expanded changelog | Four significant v2 notes are readable as opt-in detail without displacing the finder until deliberately opened. | PASS |
| 1440×1000 | Search recovery | A nonsense query produces `0 paths` and a recovery instruction; `DPIA` produces exactly one matching card. | PASS |
| 1440×1000 | DPIA outcome | Decision, Actions & timing, and Review & sources are separate layers. Copy and record controls are visible; no calendar control is offered for an unreviewed clock. | PASS |
| 1440×1000 | Source layer | Eight contextual sources open in a two-column determination/source layout. The layer is sticky, official links remain deliberate, and source status precedes included text. | PASS |
| 390×844 | Finder | Title, search, category controls, concise trust language, and first paths remain legible with no horizontal overflow. No local-review or draft-enablement control exists. | PASS |
| 390×844 | Question focus | Selecting Breach moves focus to `question-heading`; the question and first three choices enter the viewport instead of leaving focus above the task. | PASS |
| 390×844 | Layered outcome | The default result reads `No notification required — but document the reasoning`; Copy outcome and Download record remain immediately available with automated-only status visible. | PASS |
| 390×844 | Actions & timing | Three numbered actions remain readable as an adjacent layer; no calendar button appears. | PASS |
| 390×844 | Review & sources | The page states that practitioner review is not recorded and exposes the manifest identifier and contextual source control. | PASS |
| 390×844 | Included source text | Full statutory text expands in normal document flow. The earlier nested scrollbar was removed; the expanded body has no independent max-height or overflow trap. | PASS |
| 320×700 | Finder and first question | Finder controls remain usable; after opening Breach, the question and first complete answer remain in view with no horizontal page scrollbar. | PASS |
| 1035/1033×900 | Source breakpoint | At the wide side the outcome and source layer use two columns/sticky context; below the 1034px media edge they become one column/static with zero overflow. | PASS |
| 761/760×800 | Mobile breakpoint | Both sides of the 760px media edge retain zero horizontal overflow; the compact side stacks export controls cleanly. | PASS |

## Interaction and boundary checks

- Direct `#dpia` navigation focuses the active question heading and aligns its task card after the
  browser's initial fragment handling.
- Native answer controls are semantic `button` elements and remain in the document tab order.
- Back/edit invalidates downstream answers and returns focus to the relevant question.
- Closing the contextual source layer returns focus to its trigger.
- Copy outcome writes the expected decision text to the browser clipboard.
- Download record reports completion and the page accurately states that it cannot retrieve or
  delete the file afterward.
- Expanded included source text renders as inert text; no script, iframe, or inline-handler node is
  introduced.
- Browser diagnostics remained empty and the portable page made no external asset requests.

## Defects found only through literal visual review

1. Determination navigation originally focused the shell above the useful content. Focus now lands on
   the current question, with a determination-heading fallback.
2. Full question help pushed choices out of the mobile viewport. The first authored sentence is now
   the visible lead and the complete text stays one click away under `Why this question?`.
3. Expanded source text created a scrollbar inside the source layer. Its independent height/overflow
   constraint was removed so the page has one scroll surface.
4. The initial outcome presented reasoning, actions, timing, status, exports, and exits as one legal
   wall. Decision, Actions & timing, and Review & sources now form deliberate adjacent layers.
5. Exact 320px width exposed a false body minimum and horizontal scrollbar. The minimum was removed
   and the artifact was re-inspected at 320×700.
6. Search initially retained the common-path list because its reactive statement did not name its
   dependencies. Matching, zero-state, and recovery states now update immediately.
7. Extracted source bodies previously used an unescaped HTML rendering path. They now render as inert
   text with paragraph breaks preserved.
8. Live `#breach` QA at 320×700 showed the first answer clipped by 17px even though the heading had
   focus. Task focus now suppresses implicit focus scrolling and explicitly aligns the task card on
   the next animation frame; the first answer is fully visible on the rebuilt 320×700 artifact.

## Standing release constraints

- `automated-check-only` is not practitioner review and is visible at the finder, determination,
  outcome, source, copy, and record layers.
- A future extracted wizard is not automatically public; the generator has an explicit 16-ID
  allowlist.
- Any enabled path containing a draft, missing, or superseded source fails closed.
- Calendar export remains unavailable until both the path and clock semantics have recorded
  practitioner review.
- Source or decision changes require a new registry comparison, automated checks, and a fresh
  literal-size visual pass. Passing code checks never substitutes for visual acceptance.
