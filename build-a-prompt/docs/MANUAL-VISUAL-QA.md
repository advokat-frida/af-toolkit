# Manual visual QA — local vNext candidate

**Date:** 2026-08-21<br>
**Artifact:** `dist/prompt-builder.html`<br>
**Bytes:** 386,385<br>
**SHA-256:** `e7beaca790f26d37c56066ae26feaaa5f5bc9159d134b85f9fe0e0cd6fcdd41d`<br>
**Boundary:** source candidate eligible for commit and push to ADVO-156 review; no website sync,
deployment, publication, or live replacement authorized

Automated checks are supporting evidence, not visual acceptance. Every PASS below records direct
inspection of the built portable artifact in the in-app browser.

## Inspected states

| Viewport | State | Direct observation | Result |
|---|---|---|---|
| 1440×1000 | Empty start | Promise, closed changelog, work-request field, and both start actions form one clear hierarchy. No empty generated prompt or advanced console competes with the task. | PASS |
| 1440×1000 | Privacy-policy composer | Outcome/Context/Evidence/Guardrail/Format occupy the left sheet; a bounded generated prompt occupies the right. “Review this privacy policy” visibly inferred **Review it** and **Privacy analyst** after the inference correction. | PASS |
| 390×844 | Empty start | No horizontal overflow. The first task field is visible with compact changelog and normal-flow footer. | PASS |
| 390×844 | Five-part composer | Review action, five compact summaries, and Advanced setup are visible without a fixed overlay. Only one part is expanded. | PASS |
| 390×844 | Prompt review | Focus moves the review heading below the top bar. The full prompt sits in a selectable textarea with its own scroll; Copy, Download, and the provider boundary are visible in the same viewport. | PASS |
| 390×844 | Organization brief | Tab-only default, sensitive-context warning, device-memory opt-in, include toggle, and fields read in the correct order. | PASS |
| 390×844 | Save/share | The expanded layer visibly distinguishes included preset structure from excluded request, prompt, organization, warning, timestamp, and custom text. Clear-all remains separate. | PASS |
| 320×700 | Empty start stress | Document client/scroll width both measured 303px after scrollbar allocation; no horizontal scrollbar. The primary **Build the first draft** button ends at y=698.45 and is fully visible. | PASS |
| 320×700 | Prompt review stress | No horizontal overflow. The bounded prompt is 364px high; Copy begins at y=591.36 and remains visible without reading the complete prompt. | PASS |

## Privacy-state readback

- Entered an organization-definition canary with device memory off, reloaded, rebuilt the prompt,
  reopened Organization, and confirmed the value was absent.
- Enabled device memory, entered a second canary, reloaded, and confirmed both the value and checked
  persistence state returned.
- Turned device memory off, reloaded, and confirmed the stored canary no longer appeared while the
  active-tab wording remained accurate.
- No real person, client, employee, customer, matter, or Esri data was used.
- A fresh built-artifact start → compose → review smoke path produced zero browser console errors.

## Final tuck recheck — 2026-08-21

- Rebuilt the exact portable artifact above after restoring the canonical family palette and adding
  the standing style-token audit.
- Directly re-inspected the empty start and two-panel composer at 1440×1000, then the composer and
  focused prompt-review handoff at 390×844. Hierarchy, bounded prompt review, and action visibility
  remained intact with no document-width overflow.
- Browser diagnostics remained empty, and the portable page made no external asset requests.

## Defects found only through interaction/visual review

1. The mobile review originally rendered the full prompt as a 1,902px document-flow block and put
   Copy below a 2,963px page. Replaced it with a bounded selectable textarea and explicit focus/
   scroll handoff.
2. Exact 320px width produced a 17px horizontal scrollbar because `body` retained a false 320px
   minimum after the vertical scrollbar consumed space. Removed the minimum and re-inspected.
3. The 320px start CTA initially ended below the 700px viewport. Reduced only the narrow-screen
   work-request height; the CTA now remains fully visible.
4. “Review this privacy policy” fell back to **Explain it**. Corrected review/redline inference and
   added fixtures without breaking explicit draft precedence.
5. Organization fields auto-persisted despite their potential sensitivity. Persistence is now an
   explicit device-level opt-in with verified opt-out deletion.

## Still blocking any release claim

- No formative first-time-user task study has passed.
- Clipboard and downloaded-file artifacts still need exact release-candidate readback in the final
  distribution context.
- The portable file has not been synced into the website, compared in real site context, or reviewed
  from live bytes.
- Ben has not given a final product or release verdict.
