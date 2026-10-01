# Batch 1 fixes and live verification, 2026-10-01

These four fixes were explicitly authorized after Batch 1 verification, followed
by Ben's request to tuck. The isolated task worktree preserved the original clean
main checkout and existing worktrees at their starting commits.

[PR #28](https://github.com/advokat-frida/af-toolkit/pull/28) merged reviewed source
`108facb98349b4826ae2a04f264f0337f4247885` as
`35a519fb21f7d743652b052a2d21e58de523b651` at 04:39 UTC on October 1 after all six
PR checks passed. Connected Cloudflare production build
`a11827b8-e5f9-4e36-aaf5-d140591d1bab` succeeded at 04:40 UTC. The merge's Gate,
CodeQL analysis, Redactorium build and SafeList check also passed.

All **31 checked production files** match the merge, normalizing only the known
Cloudflare hidden-link injection in HTML. Synthetic live Chromium checks passed
at **1440, 1034, 390 and 320 pixels**: filename/record scrubbing, preserved PDF
bullet and accent text, two collision-safe ZIP folders, complete Outlook
recipients, keyboard scrolling, operable row decisions and zero document overflow.
No page errors or external requests occurred. The live exported PDF, four
SafeList views and phone Redactorium result were directly inspected.

Local live receipts are retained in the task workspace's `fix-live/`,
`fix-live.log`, and `tuck-live-assets.json`. Only synthetic inputs were used.
Rollback reference: the preceding production main was
`463cf950530917719cc091a14757eccb4080cd5d`.

## Changes and regressions

| Defect | Released behavior | Evidence |
| --- | --- | --- |
| An identifying document filename survived in the download and record | Names recognized in that document or its detected name columns are scrubbed case-insensitively across spaces, hyphens, and underscores. Ordinary filename text remains. Single downloads, records, batch folders, files, and manifests use the same context. | `Maya-Penrose-resume.pdf` becomes `redacted-resume.redacted.pdf`; the record uses `redacted-resume.pdf`. Two filenames that scrub to the same base survive in separate ZIP folders. Three new filename tests failed before the fix and pass afterward. |
| U+25CF corrupted an entire exported PDF line | A locally bundled Liberation Mono font embeds the glyphs and Unicode mapping. Both the visible PDF and extracted text preserve the bullet and its following text. | PDF.js round-trip tests for both bullet types, accented Latin text, original page boundaries, and automatic pagination. The first two regressions failed on the original Courier export. |
| A comma in a quoted Outlook display name omitted later recipients | Tokenization respects quoted display names, escaped quotes, and angle brackets. Complete recipients are CSV-quoted before loading. | Two new parser regressions; browser paste of `"Lovelace, Ada" <ada@example.com>; Grace Hopper <grace@example.org>` produces two matching recipient rows. |
| SafeList's review table widened the phone document | The table scrolls inside a bounded, keyboard-focusable region. The page remains at viewport width, and row decisions remain operable. | Review-state assertions added to the repository visual gate, including keyboard scrolling and selecting a row decision at all four review widths. |

The filename choice uses targeted scrubbing, the stated recommended assumption
after the optional preference question received no answer. Ordinary filename
text remains.

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
  actual resume was not retested for these changes; the production checks above
  are synthetic and do not replace Ben's acceptance.

New committed captures: `proofs/*-safelist-review.png`. Fresh unrelated
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
- AF-22 remains In Progress for Ben's actual-file verdict: the live resume must
  show Name, Email address, Phone number and Place findings, remove those matched
  identifiers from the clean PDF, scrub the export/record filename, and preserve
  readable bullet lines. The separately identified published-article coverage
  paragraph still needs reconciliation; no Ghost edit is included in this batch.
  The [article](https://advokatfrida.com/redactorium/) was rechecked on October 1:
  it describes names in labeled/column contexts, omits headline/repeat/Place and
  explicit document-employer/school/resume limits, and says records retain the
  original filename. That filename statement needs qualification after targeted
  scrubbing; unrecognized names can still survive.
- AF-2 remains Backlog. SafeList supplies the matching foundation, but counts-first
  deliberate reveal, `matches.csv`, restricted-cohort column selection and the
  empty-on-leave boundary remain separately scoped requirements.
- AF-4 remains Idea. The September 28 research already covers the Jam inspiration;
  Ben skipped the broad one-page-per-job direction, while AF-21 completed the
  narrower per-tool routes. Recommend accepting the existing research as AF-4's
  outcome, subject to Ben's decision. No new hub implementation is implied.
- Notion records the release, evidence and remaining boundaries on AF-22/AF-2,
  and the research disposition on AF-4. Readback confirmed all three statuses
  stayed unchanged. No ticket was marked Done, and no later batch was started.

Generated artifact SHA-256:

- Redactorium: `884f3ba1934aca85cf308e5162ee2daee56da9f18b3fe1a8d16fe3bd8b17030e`
- SafeList: `8f5386a73b06f6f839bdc6f01f70712222734ece18f76ff7042ca32c0eccd2a7`
