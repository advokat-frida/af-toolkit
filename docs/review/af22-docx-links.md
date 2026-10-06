# AF-22: Word links and software-list detection

**Released and verified.** [PR #37](https://github.com/advokat-frida/af-toolkit/pull/37)
merged reviewed source `a6582d98316bbe8ab89a7df45a459bc58e1522a1` as
`0f8bab0f9904ef6ebbd12b6e6366432fe0bad8ae` at 2026-10-06 01:12:52 UTC
(October 5, Pacific). All five PR checks passed. Connected Cloudflare production
build `bac2299e-f7ff-474e-af7b-302b5a36d41a` succeeded.

All 33 checked live files match the merged commit, normalizing only the known
Cloudflare hidden `/cdn-cgi/content` anchor in HTML. The actual-resume production
flow passed at all four review widths: keyboard treatment selection, DOCX and
record downloads, no horizontal overflow, page errors, or external requests.
Desktop findings/results, mid-width findings, and mobile/narrow controls and
results were directly inspected. All nine downloaded package parts match the
locally verified export byte for byte, and every XML/relationships part parses.
The original input hash is unchanged. Word visual layout remains unverified.

Rollback base: `01c99d1`, preserving the already released access repair and
Toolkit setup mode. Private live receipts: `.local-working/af22/live-assets.json`,
`live-docx-verification.json`, and `live-browser/`. No private resume or screenshot
is committed. This release does not change Ghost, access policy, or other tools.

Ben supplied a failing resume export, approved the proposed repair with
"proceed", then requested "tuck" on October 5, 2026 (Pacific). The existing
[AF-22 task](https://app.notion.com/3ea0f293ed9d81d5a0f9d39af7ecacdf)
remains the tracking record. Private source files, exports, and screenshots
stay in the executor's ignored `.local-working/af22/` directory.

## Behavior

- Web addresses in text and Word destinations are reviewable findings. Complete
  URLs own their spans even when a query contains an email or phone number.
- Redact, code replacement, and generalization remove Word link destinations
  while preserving displayed runs. Relationship links, drawing click/hover
  actions, simple fields, and split complex fields are covered. Keep preserves
  the link; synthetic treatment uses reserved example destinations.
- Empty hyperlinks cannot consume a neighboring bookmark's closing tag.
  Internal bookmarks and unrelated fields remain intact.
- `Confluence, MS Teams` stays intact. Excluding an MS product requires software
  context; ordinary `Jackson, MS office`, project, and access-road prose still
  produces a place finding. This remains a heuristic, not a city directory.

## Verification and review

- Redactorium: 94 engine tests, ESLint, and the production build passed.
  The new tests parse every complete XML/relationships part in their DOCX
  output with a pinned development-only parser. It is absent from the shipped
  source imports and bundle. The new assertions failed before the repair.
- The actual supplied resume produces two email, two web-address, one phone,
  one place, and one name match. Both web destinations are removed; the
  software list and link labels survive. Paragraph/run/formatting counts match,
  and numbering, styles, and font-table parts are byte-identical.
- Chromium upload, treatment, and download checks passed at 1440x1000,
  1034x917, 390x844, and 320x700, with no page errors, external requests, or
  document overflow. Keyboard Keep/Redact selection works. DOCX and JSON
  downloads were read back; findings at all four widths were directly inspected.
- Independent review initially blocked an empty-link XML corruption and an
  overbroad Mississippi exclusion. Both were repaired and independently cleared.
  The reviewer reran all 94 tests and ESLint, then validated 20 additional
  DOCX round trips with Python ElementTree across all five treatments,
  both empty-link orderings, and nested wrappers. No remaining blockers were found.
- Source build, staged artifact, and manifest agree on SHA-256
  `1feff19e8feec93fdff0207cc55933e4839e70e1a4883ad4794aa782a62f14a8`.
- The full Toolkit gate passed: 41 root tests, design/syntax/static checks,
  four-width browser checks, every state proof, and the unchanged style census.
  Fresh captures are retained privately; nondeterministic baseline-image changes
  are excluded. The current access repair is preserved, including its later
  documentation-only merge `01c99d1`.

Reviewed repair identities (SHA-256):

| File | Hash |
| --- | --- |
| `docxHandler.js` | `20827d9ccbe22b75176167e9578db7d5f4944e49d120d3c4a3b35879ee475ef0` |
| `places.js` | `212468d0e83920a431aa0c9d715a6ffce6996522772ee4d2f3c12bb7f1f1cea2` |
| `document-links.test.mjs` | `61f7c3ee5540b950e7681f69092574af7c5fc018de3e1fe7086f543b74d7c9c2` |

## Limits and closeout

Word's visual layout has not been rendered in this environment. XML and
formatting checks do not replace opening the exported DOCX in Word. Regional
descriptions, employers, schools, and other identifying context still need
manual review. Filename scrubbing depends on recognized patterns.

The separate article corrections were prepared for approval, which is still
pending. No Ghost edit, newsletter send, or theme upload occurred. AF-22 remains
In Progress while its article reconciliation is outstanding; automated export
checks are not a claim that Ben inspected the final document in Word. The
repository handoff and Notion task record the release and remaining work.
