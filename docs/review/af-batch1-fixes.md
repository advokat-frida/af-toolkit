# Batch 1 fixes: local review, 2026-10-01

Candidate based on `463cf950530917719cc091a14757eccb4080cd5d`, isolated from the
clean main checkout and the existing worktrees. These four fixes were explicitly
authorized after Batch 1 verification. No commit, push, merge, deployment, Ghost
edit, or tracker mutation is part of this candidate.

## Changes and regressions

| Defect | Candidate behavior | Evidence |
| --- | --- | --- |
| An identifying document filename survived in the download and record | Names recognized in that document or its detected name columns are scrubbed case-insensitively across spaces, hyphens, and underscores. Ordinary filename text remains. Single downloads, records, batch folders, files, and manifests use the same context. | `Maya-Penrose-resume.pdf` becomes `redacted-resume.redacted.pdf`; the record uses `redacted-resume.pdf`. Two filenames that scrub to the same base survive in separate ZIP folders. Three new filename tests failed before the fix and pass afterward. |
| U+25CF corrupted an entire exported PDF line | A locally bundled Liberation Mono font embeds the glyphs and Unicode mapping. Both the visible PDF and extracted text preserve the bullet and its following text. | PDF.js round-trip tests for both bullet types, accented Latin text, original page boundaries, and automatic pagination. The first two regressions failed on the original Courier export. |
| A comma in a quoted Outlook display name omitted later recipients | Tokenization respects quoted display names, escaped quotes, and angle brackets. Complete recipients are CSV-quoted before loading. | Two new parser regressions; browser paste of `"Lovelace, Ada" <ada@example.com>; Grace Hopper <grace@example.org>` produces two matching recipient rows. |
| SafeList's review table widened the phone document | The table scrolls inside a bounded, keyboard-focusable region. The page remains at viewport width, and row decisions remain operable. | Review-state assertions added to the repository visual gate, including keyboard scrolling and selecting a row decision at all four review widths. |

The filename choice uses targeted scrubbing, the recommended option in the
pending preference question. It does not rename every file to a neutral name.

## Validation

- Redactorium: **88 tests**, lint, and production build passed.
- SafeList: **28 tests**, portable builds, and sample verification passed.
- Toolkit: **22 tests** and the full `npm run gate` passed, including design,
  syntax, static QA, four-width rendered QA, all state captures, and style census.
- The visual check was rerun after moving its new full-page captures to scroll
  position zero. It passed again. No product source changed after the full gate.
- Focused local Chromium checks passed at **1440, 1034, 390, and 320 pixels**:
  downloads and records, PDF text, recipient completeness, keyboard access,
  operable row decisions, and zero document horizontal overflow. No page errors
  or external requests occurred. The ZIP collision check also passed.
- The exported PDF was rendered with PDF.js and directly inspected. Both bullet
  glyphs, the complete qualification line, accents, and redaction markers are
  readable. The SafeList review proofs at all four widths were directly inspected.
  On narrow screens the table scrolls internally; controls below it remain in view.
- Only synthetic documents and reserved example addresses were used. The private
  actual resume and production deployment were not retested for these changes.

New committed-candidate captures: `proofs/*-safelist-review.png`. Fresh unrelated
captures were preserved in the executor's evidence folder and their tracked
baselines restored. Direct comparison found hover/focus differences, SafeSeed's
already-existing article link missing in two older proofs, and the randomized
Redactorium record hash. SafeSeed and Privacy Wizards artifacts are unchanged.
The full canvas package was not re-audited for this maintenance candidate.

## Limits and separate triage

Independent review on 2026-10-01 cleared this exact candidate with no blocking
findings. The read-only reviewer ran 62 focused tests, inspected the PDF and all
four SafeList review widths, recomputed both staged artifact hashes, and verified
the bundled font hash. `git diff --check` passed. The review explicitly preserves
Ben's actual-resume verdict as AF-22's Done gate.

Fresh Notion readback confirmed that this verdict follows release; the latest
comment also confirms that the article was published and sent on September 29.
The older draft-only instructions are superseded. No article change is included
here. Ben's explicit request to proceed with Batch 1 fixes and then tuck authorizes
the skill's scoped release sequence; the parent confirmed that interpretation.

- Filename scrubbing remains detection-based. An unrecognized name, or a file
  that cannot be parsed, has no document-derived name context. This is not a
  guarantee that every identifying filename is anonymized.
- The new PDF font covers the reported bullets and tested Latin text, not every
  Unicode script. Its lazy-loaded chunk adds about **216 KB gzip**. The tested
  one-page PDF is about **59 KB**. Font provenance, hashes, and license location
  are recorded in `redactorium/frontend/src/redactorium/lib/pdfFont.README.md`.
- Separate existing SafeList issue: pasting only
  `ada@example.com; grace@example.org` into the suppression list is interpreted
  as a header with zero data rows. Reproduced on the unchanged main checkout;
  left for separate triage. The browser regression uses an explicit `email`
  header and one address per line for the suppression list.
- AF-22 still needs Ben's actual-file acceptance and the separately identified
  article coverage reconciliation. AF-2's broader comparison requirements and
  AF-4's research disposition remain outside this fix scope. No ticket was marked done.
- The exact local `tuck` skill has now been read. It means full reviewed closeout,
  including applicable AF deployment and live verification, while preserving
  narrower restrictions and required practitioner acceptance. The lookup performed
  only safe preparation. No archive, source-control publication, or deployment
  has been performed; independent review was arranged before any merge step.

Generated artifact SHA-256:

- Redactorium: `884f3ba1934aca85cf308e5162ee2daee56da9f18b3fe1a8d16fe3bd8b17030e`
- SafeList: `8f5386a73b06f6f839bdc6f01f70712222734ece18f76ff7042ca32c0eccd2a7`
