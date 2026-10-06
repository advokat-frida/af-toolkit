# AF-22: Word links and software-list detection

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

The separate article corrections were prepared for approval. No Ghost edit,
newsletter send, or theme upload is part of this Toolkit patch. AF-22 must not
be marked Done while its article reconciliation remains outstanding. The
repository handoff and Notion task will record the actual release result.
