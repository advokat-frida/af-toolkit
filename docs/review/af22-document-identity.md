# AF-22 document identity review

Task: [AF-22](https://app.notion.com/p/3ea0f293ed9d81d5a0f9d39af7ecacdf).
Base: `a21a34dd3ccccac8ce74946b9031e2ff519c4ec5`.
Ben authorized tuck on September 28, 2026, explicitly excluding post publication.

## Change

Documents can find a name-like opening line and exact whole-name repeats of an already found
name. US city/state shapes get a Place finding with all four treatments. The heuristic stays
reviewable, names stay confined to their document, and spreadsheets do not seed document names.
Employers, schools, free-form regions and unknown names remain outside the promised scope.

## Independent review

A separate Codex reviewer reviewed the source, tests, treatment/detection consistency, performance
and staged provenance. The reviewer found one P1 blocker: a labeled prefix in
`Name: Ada M. Lovelace` scored above the full opening-line name, leaving `M. Lovelace` behind.
The fix carries the strongest same-start person-name score into the full exact match, allowing
the existing longer-span tie-break to remove the complete name. It uses a map rather than a
per-match scan of every candidate. A regression first reproduced the leak and then passed.

The reviewer inspected the fix and independently reran the reproduction and 31 identity/scanner
tests. Final verdict: no remaining review blockers; safe after staging and the root gate. A
20,000-distinct-name probe completed detection in about 303 ms on the reviewer's local run.

## Verification

- 73 engine tests passed, plus lint and the production build.
- The complete Toolkit integration gate passed after the review fix and final staging.
- Canonical build and staged artifact SHA-256:
  `8f0a730d94fe4fb0fdd32d3aa19a8cb1277bc1406f8a665cbb03d8ee94cef9db`.
- Other three tool artifact hashes are unchanged.
- Synthetic resume PDF workflow passed at 1440, 1034, 390 and 320 pixels: Name, Place, Email
  address and Phone number rows; both name and both place occurrences removed from the download;
  record counts correct without matched values; no page errors, external requests or overflow.
- Direct visual review covered findings/results, wrapping, control access and the lower name
  score. Existing unrelated capture hover/focus and random fingerprint noise is excluded.
- Local detailed logs, snapshots and downloaded PDFs: `.local-working/af22/`.

## Acceptance still open

Ben's actual resume must produce the four expected kinds through the live tool, and its clean
PDF must remove those matches, before AF-22 is Done. Synthetic QA is not that acceptance result.
The article remains a Ghost draft. Its accepted scope/copy edits are saved separately in Ghost;
this release neither publishes nor sends it. The pre-existing legend wording and newsletter
button-pair markers are separate follow-ups, not included code changes.
