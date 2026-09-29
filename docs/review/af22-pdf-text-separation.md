# AF-22 PDF text separation correction

Base: `94eb6582c7ad188b96eb47786dc6a64dd59121e5`.
Task: [AF-22](https://app.notion.com/p/3ea0f293ed9d81d5a0f9d39af7ecacdf).
Continues Ben's existing AF-22 tuck authorization. The Ghost post must remain unpublished and unsent.

## Reproduced failure

The actual two-page resume supplied after the first release reproduced the missed name.
PDF.js emitted the left header's region and the independently positioned headline name without
a line-break marker between them. The parser joined them, so the document name rule rejected
the resulting region/name line. The earlier synthetic resume did not exercise this geometry.
No copy of the resume or its extracted personal values is included in source control.

## Correction and review

`pdfTextLines` keeps PDF content order and uses text baselines, directions and large column
gaps as additional line boundaries. Whitespace-only items do not move the last visible glyph's
position. Normal word spaces, small kerning differences, font changes and superscripts remain
together. The existing detector and treatment rules are unchanged.

Nine synthetic regression tests cover the reported geometry, same-baseline columns, missing
line markers, spacing, mixed fonts, whitespace/EOL items, missing geometry, superscripts and
rotated text. Independent review found a P1 reverse-column case: a backward jump joined an
email and name. Its regression failed before the fix and passed afterward; substantial gaps
are now checked in both directions. Independent re-review found no remaining parser blockers.
The reviewer's 100,000-item probe completed in about 32 ms.

## Verification

- 82 engine tests, lint and production build passed.
- The complete Toolkit gate passed after final staging. Unchanged-layout hover/focus and random
  record fingerprint capture noise was inspected and excluded from the diff.
- Staged Redactorium SHA-256:
  `fe04cc909941097c71fc64429636aa8aeeb9f5c6bf76ff714c0a71f40ceb3db5`.
- Other tools' staged hashes and Redactorium's CSS are unchanged.
- The actual supplied resume passed the rebuilt browser workflow at 1440, 1034, 390 and 320px:
  Person name (one match), Place (two), Email address (one), Phone number (one).
- All five matched values were absent from the downloaded PDF, including UTF-16 byte checks.
  Record treatment counts matched. Line reconstruction preserved every non-whitespace input
  character. No page errors, external requests or horizontal overflow occurred.
- Direct review covered desktop/phone findings and the rendered downloaded PDF.
- Private input hash, screenshots, downloaded files and detailed receipts stay in ignored
  `.local-working/af22-resume/`; they are not public test fixtures.

## Remaining limits found with the real file

- Schools, degrees, certifications, employers and the free-form region remain manual-review
  items. A detector not finding them does not mean they are not personal information.
- The identifying original filename is still retained in the download name and record.
- The unchanged PDF exporter mishandles U+25CF bullets with its standard font: the glyph is
  garbled visually and the affected line's text extraction is unreliable. The qualification
  remains visibly present and in the output bytes. This is a separate export defect, not
  evidence that the qualification was recognized or redacted.

These limits are recorded rather than silently expanded into this parser correction. Do not
describe this output as an anonymous resume. AF-22 remains active for Ben's final verdict.

## Corrective release and exact-file live result

[PR #21](https://github.com/advokat-frida/af-toolkit/pull/21) merged source
`c0d8f7c9ecf9932c179fdf209c82869489e3b922` as `cfc5b08f63752b2fc00d250b405f68986c567108`
after all five PR checks passed. Production build `6f6ea431-a2a9-4e2f-ba8e-bf02cb629f57`
released Worker version `8365da47-2498-445c-b57c-e38588f00a0d`.

At `2026-09-29T04:48:14.269Z`, all 29 checked production files matched the committed bytes,
allowing only the previously observed Cloudflare hidden `/cdn-cgi/content` link in HTML.
Verified public tree: `164030557eb6d65ca7217aeef3300ea57d27f2a8`.

The exact supplied resume then passed the production browser/download checks at all four
widths: one name, two places, one email and one phone, with the five matched values absent
from the PDF and correct treatment counts. Desktop and phone findings were directly viewed;
the downloaded PDF was also rendered. The unchanged limitations above were confirmed again,
including visible education/qualification retention. The input's SHA-256 is unchanged.
Private receipts are in `.local-working/af22-resume/live/` and `live-verification.json`.

Only the merged corrective branch was pruned locally and remotely. Ghost readback remains
draft, with no publication date or email object; no post content was changed during this repair.
