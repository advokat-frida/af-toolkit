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

## Release and live verification

[PR #20](https://github.com/advokat-frida/af-toolkit/pull/20) merged reviewed source
`db52d5050d07f203772da9dbc799a78fe6b45610` as `9998a196dc78aac837120eeb91d471170506a96b`.
All five PR checks passed: Toolkit Gate, Redactorium CI, CodeQL analysis and its alert check,
and Workers Builds. Production build `17c13a37-ae52-4192-b62c-0b81078fdead` succeeded with
Worker version `a859786f-fb64-46fa-873c-ed7a3fddc0e2`.
The merge's main-branch Gate, CodeQL, Redactorium CI and Workers Builds also passed.
Verified public tree: `13033198a65e703f1206b8103f1a4b19e2f67644`.

At `2026-09-29T04:16:18.709Z`, all 29 checked live files matched committed source: shell,
manifest, the four tool entrypoints and the complete Redactorium asset tree. Comparison
removes only the observed hidden Cloudflare `/cdn-cgi/content` anchor from HTML. Full hashes
are in ignored `.local-working/af22/live-verification.json`.

The synthetic resume PDF workflow then passed on production at all four widths. All six
matches (two names, two places, email and phone) were removed from the downloaded PDF; counts
were correct and matched values absent from the record. There were no page errors, external
requests or horizontal overflow. Desktop findings, 320px findings and 390px results were
directly inspected. Live JSON, screenshots and PDFs are in `.local-working/af22/live/`.

Only the merged AF-22 branch was pruned, locally and remotely. AF-22 remains In Progress for
Ben's actual-resume acceptance. Ghost readback confirmed draft, no publication date and no
email object; the latest observed user edit timestamp was `2026-09-29T04:10:35.000Z`.
