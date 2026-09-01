# Objection Oracle QA

Date: 2026-07-29
Build: private workshop prototype
Manual visual verification: **PASS**

## Reference and runtime

- Approved family reference: the current Build-A-Prompt Advokat Frida tool
  chrome at desktop and mobile widths, retained as
  `shots/reference-bap-desktop-1440.png` and
  `shots/reference-bap-mobile-390.png`.
- Actual runtime reviewed: `dist/objection-oracle.html`.
- Literal display sizes reviewed: 1440 × 1000 and 390 × 844.
- The ball and triangle are an original CSS treatment; there was no supplied
  visual reference for that component.
- The compact top bar, 16px body scale, forest `#1f4e32`, and dark colophon
  match the current Build-A-Prompt family shell.

## Visual review

- Welcome, question, ready, and result states were inspected at desktop size.
- Welcome, question, longest-response, Hard Stop, and reduced-motion result
  states were inspected at mobile size.
- All four outcomes were inspected with their longest response-bank entry.
- Every authored shake keyframe was inspected at 0%, 18%, 36%, 54%, 72%, and
  100%.
- The white 8 face remains centered and legible before a ruling.
- The answer copy is centered, moved upward, and given more horizontal room
  within the triangle.
- Short and longest response variants remain inside the triangle without
  clipping or collisions.
- The caption fades during the shake so it cannot collide with the moving ball.
- Outcome color is reinforced by a four-pixel semantic edge and never carries
  meaning alone.
- Keyboard-triggered state changes retain a visible three-pixel forest focus
  indicator on the focused heading.
- No horizontal overflow was observed at either reviewed viewport.

## Mechanical verification

- `npm.cmd run build`: PASS
- `npm.cmd test`: PASS, 20 tests
- `npm.cmd run harness`: PASS
- Playwright is declared locally and the harness has no absolute dependency on
  another repository.
- All four deterministic branches: PASS
- Re-shake preserves the ruling and avoids an immediate response repeat: PASS
- Keyboard focus and live-region announcement: PASS
- Reduced-motion result path: PASS
- Copy receipt includes all five answers and the canonical ruling: PASS
- External requests, browser persistence, wrapper violations, and console or
  page errors: zero

## Remaining boundary

The source and exact built HTML remain in the private workshop repository. The
tool has not been integrated into the Advokat Frida website, published, or
deployed. Those actions require separate approval.
