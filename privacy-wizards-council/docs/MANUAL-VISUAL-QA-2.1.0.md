# Manual visual QA — 2.1.0, the authored depth reaches the page

**Date:** 2026-09-13<br>
**Artifact:** `dist/wizards.html`, staged as `public/tools/privacy-wizards-council.html`<br>
**SHA-256:** `3e8660f13efaf70647166d9f7e5bec12ebe2f94eee1005e80ed62b2654e22677`<br>
**Decision baseline:** unchanged — 16 paths, 139 sources, registry SHA-256
`11250ac35555835903fcaa20f3f1ecef567ae3283c459e736e825cbd005359d2`<br>
**Legal state:** every source remains `automated-check-only`; no practitioner review is claimed<br>
**Change:** PWC-NEXT-006 and PWC-NEXT-007 in `BEHAVIOR-DELTAS.md`; Ben's call, 2026-09-13

Automated evidence: folder gate (24 vitest, style audit, build, verify-artifact); the Toolkit
gate end to end including the rendered-style census (every new run reuses a baseline tuple);
the behaviour rig `.local-working/pwc-wave0-verify.mjs`, 40 checks at 1440×1000 and 390×844
with zero console errors and zero horizontal overflow. Every PASS below is a direct look at the
staged shell, not a grep.

## Inspected states

| Viewport | State | Direct observation | Result |
|---|---|---|---|
| 1440×1000 | Browse all | Five category eyebrows (Incidents, Data use, Governance, Rights & people, AI systems) over sixteen rows; the first eyebrow sits under the list rule with the same padding as the rest. | PASS |
| 1440×1000 | Breach, question 1 | "Suspected but unconfirmed" carries its authored note as the 13px sub-line; the other three options have none and keep their height. The amber aside is the first sentence; `Why this question?` sits under it as a text action. | PASS |
| 1440×1000 | Why this question?, open | The body is the rest of the help (NY GBL §899-aa, EDPB 9/2022) at 15px; the aside's sentence is not repeated. Next and Back move down with it. | PASS |
| 1440×1000 | Breach, question 2 | Unchanged from 0.4.2: no option notes, short help, no disclosure. | PASS |
| 1440×1000 | Clocked outcome (SA only) | Verdict block keeps the clock line as its qualifier; `Read the reasoning` opens the whole 835-character reasoning above What you must do. `What may change` opens the dated Omnibus note with its source link. The aside reads "Automated source check, sources last checked 2026-07-02." | PASS |
| 1440×1000 | Authority rail | Six rows, each label over an amber square and "Automated check only". The first opens to the citation, `Open the official text ↗`, and the included Art. 4 text as plain paragraphs in the 330px rail. | PASS |
| 1440×1000 | Next determination | One eyebrow and one chooser row (Breach severity) under the exits; clicking it opens that path's first question with every disclosure closed. | PASS |
| 1440×1000 | State proof 4f | The determination proof now draws the disclosures, the dated aside, the next-determination row and the dotted authority rows; 3c and 4e are unchanged. | PASS |
| 390×844 | Question 1, open | One column; option notes wrap inside the row; the disclosure body reads at 15px with no horizontal scroll. | PASS |
| 390×844 | Outcome, open | Aside, full-width Download determination, Change an answer, the next-determination row, then the authority rows with their dotted labels and included text. No overflow. | PASS |

## Inline citations (added 2026-09-14, artifact SHA-256 `505280f186e45e2964aae151b8b7721500dc45e9350061db6774f1943d368705`)

| Viewport | State | Direct observation | Result |
|---|---|---|---|
| 1440×1000 | Breach, question 1 | "personal-data breach" in the heading and "personal data breach" / "GDPR Art. 4(12)" in the aside are forest, dotted-underlined citations; the option rows carry none. | PASS |
| 1440×1000 | Hover on the aside citation | One card under the mention: "GDPR Art. 4 — Definitions", the formal citation, the amber "Automated check only" label, paragraph (12) alone, then Show the whole text and Open the official text ↗ with the × top right. The mention turns red while open. Leaving closes it. | PASS |
| 1440×1000 | Click, Escape, focus | Click pins the card through pointer movement; Escape closes it and focus returns to the mention without reopening; Tab focus opens it again. | PASS |
| 1440×1000 | Determination, reasoning and actions open | Nine citations in the reasoning and nine in the actions (Art. 33(1), Article 34(1), VB v NAP, C-340/21, Art. 82, Art. 32, controller, processor, EDPB Guidelines 9/2022…); "controller" opens Art. 4(7) as a card over the actions; the × closes it. The Omnibus note's "Art. 33" is a citation too. | PASS |
| 390×844 | Question 1, pinned card | The card flips above the aside because the frame has no room below, spans the block width, and stays inside the frame. | PASS |
| 390×844 | Determination, citation in the actions | Card opens under "controller" at full block width; Escape and × both close it. | PASS |

## Review fixes (PR #13, 2026-09-14, artifact SHA-256 `33c28fcdfd086a2a5b71c5ab556a5eff95170e16640cd838b0aa8f3dff582c10`)

| Viewport | State | Direct observation | Result |
|---|---|---|---|
| 1440×1000 | Breach, question 1, aside citation pinned, Show the whole text | The card stays open with the whole text and focus moves into it; the mention stays red. The card measures 481 to 903 in a 944px frame. | PASS |
| 1440×1000 | Same, heading citation | The card opens under "personal-data breach" and measures 118 to 540. The answer group is named by the plain question, not by the card. | PASS |
| 390×844 | Breach, question 1, heading citation pinned | The card spans 10 to 380 of the 390px frame with paragraph (12), Show the whole text and the official link; after Show the whole text it measures 104 to 526 in a 788px frame. | PASS |
| 1440×1000 | Sale and sharing determination | The next determination is Rights request triage (EU / UK / US-CA); the EU and UK cookies path no longer shows for a California answer. | PASS |
| 1440×1000 | Pinned card, then #dpia | No stale card on the new path; hovering a citation there opens its card. | PASS |
| 1440×1000 | Focus on Next, hover a citation, Escape | The card closes and focus stays on Next. | PASS |
| 1440 and 390 | Behaviour rig | 68 checks, zero console errors, zero horizontal overflow. | PASS |

## Boundary checks

- A mention resolves only within the wizard's regime family and the node's UK/EU context;
  anything unmapped stays plain (Art. 55, Art. 56 and Art. 27 of the GDPR, Annex I, WP242).
  An explicit "UK GDPR Art. 32" stays plain rather than opening the EU text.
- One card at a time across the page; a card closes when the question or outcome changes.

- Every disclosure closes when the question or outcome changes (`closeDisclosures()`), so an
  open source text never carries into the next path.
- The pending-law notes render only on the outcomes named in `motion.js`; a New York breach
  outcome shows none. Each note says the cited law applies until an amending act is adopted.
- The record adds the answer notes, the check date, the pending notes and each source's included
  text; the manifest hash lines are unchanged.
- The URL still carries only the wizard id.

## Not changed, on purpose

- The question card's right edge stops short of the progress track on desktop, as the artboard
  draws it (DESIGN-PRINCIPLES nitpick 3 flagged this in the research; a separate call).
- The question view still shows no sources panel (DESIGN-SYSTEM §6, Turn 4).
