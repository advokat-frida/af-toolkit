# HANDOFF

## 2026-10-05 - Dispatch subscriber gating released

Both Toolkit and Guide now require an active free Dispatch subscription for
protected content. Public tool descriptions and selected Guide previews remain
available. Toolkit [PR #38](https://github.com/advokat-frida/af-toolkit/pull/38)
merged as `c24cee32`; activation version `8fd0c46e-ff70-4778-941a-558d0851fa97`
was verified at 100%. Guide PR #4 merged as `fed6ee7a` and deployed gated version
`9a3de839-bf99-4ea8-953d-d966eec58ab2`. Later documentation builds may assign a
new Toolkit version without changing the verified application bytes.

The full Toolkit gate passed after integrating released AF-18; independent
review confirmed all public assets and tool sources were preserved exactly.
Live checks passed 182 guest, 102 subscriber/revocation, and 19 fresh-unsubscribed
assertions, plus desktop and 390px browser inspection. Real consumed tickets
rejected replay. After native unsubscribe, existing session cookies lost protected
file access in 6,831 ms on Toolkit and 7,062 ms on Guide. The designated test
member is restored to unsubscribed, and its isolated Ghost browser session is
signed out. Ghost's forced free-tier welcome URL was cleared with Ben's direct
approval. Keys, bindings, migrations, and host-only sessions are preserved.

See [activation, coverage limits, and rollback](ACCESS-ACTIVATION-2026-10-05.md)
for exact evidence. AF-32/33/34 own gating closeout. AF-25 remains separate for
Google's actual sitemap-processing result; its existing follow-up is already
scheduled. Do not reopen implementation or duplicate that follow-up.

## 2026-10-05 - AF-18 and AF-22 acceptance status

AF-18 is Done after PR #26 (`f10f8281`) and live desktop, phone, and keyboard
checks. Its approved layout and complete public artifacts are included unchanged
in the gated release.

[AF-22](https://app.notion.com/p/3ea0f293ed9d81d5a0f9d39af7ecacdf) is Done.
Ben accepted the exact exported DOCX and approved the five-node Ghost article
correction; the saved correction and public rendering were verified in that task.
The already-sent email is unchanged. Full evidence and remaining future-send
preview/audit limits are in the existing Notion record. These completed decisions
supersede the pending-acceptance statements in the historical sections below.

## 2026-10-05 - AF-22 Word-link repair released (historical checkpoint)

Ben approved the supplied-resume fix, then requested tuck. [PR #37](https://github.com/advokat-frida/af-toolkit/pull/37)
merged reviewed `a6582d9` as `0f8bab0f9904ef6ebbd12b6e6366432fe0bad8ae`.
All five PR checks passed; connected Cloudflare production build
`bac2299e-f7ff-474e-af7b-302b5a36d41a` succeeded. All 33 checked live files match
the merged bytes, allowing only the known Cloudflare HTML anchor injection.

Web destinations are detected and redacted Word links lose their destinations
while keeping labels and formatting. The resume's software list remains intact;
ordinary Mississippi office/project/access prose still matches as a place.
94 engine tests, lint/build, and the full Toolkit gate (41 root tests) passed.
Independent review found two defects, both repaired and rechecked with 20 extra
Word round trips and XML parsing. The actual-resume live flow passed at 1440,
1034, 390, and 320 pixels; screenshots and downloads were inspected. All nine
exported package parts match the local verified result; the input is unchanged.

AF-22 remains In Progress for article reconciliation; the prepared Ghost copy
awaits Ben's content decision. Word visual layout and Ben's final personal
document inspection remain unclaimed. No Ghost write, newsletter send, theme
upload, or access-policy change occurred. The current access release and all
unrelated work are preserved. See [release, review, and limits](review/af22-docx-links.md).

Private receipts and the proposed article corrections remain under
`C:/Users/Ben/Documents/ChatGPT/Advokat Frida/af-toolkit/.local-working/af22/`.
Resume at the pending article decision; do not infer approval from this handoff.

## 2026-10-01 - Batch 1 export and recipient fixes released

The approved follow-up fixes identifying Redactorium export/record filenames,
U+25CF PDF corruption, quoted Outlook recipient parsing, and SafeList's phone
review overflow. Ben explicitly requested the fixes followed by tuck.
88 Redactorium tests, 28 SafeList tests, lint/builds, and the full Toolkit gate
(including 22 shell tests) pass. Focused synthetic browser checks pass at all
four review widths; exported PDF rendering and affected screens were inspected.

See [scope, evidence, limits, and separate triage](review/af-batch1-fixes.md).
Independent review cleared the exact candidate with 62 focused tests, proof
inspection and artifact/font hash verification. All six PR checks passed.
[PR #28](https://github.com/advokat-frida/af-toolkit/pull/28) merged `108facb` as
`35a519fb21f7d743652b052a2d21e58de523b651`. Connected Cloudflare production build
`a11827b8-e5f9-4e36-aaf5-d140591d1bab` succeeded; the merge's hosted checks passed.
All 31 checked live files match source, allowing only the known Cloudflare HTML
injection. Synthetic production workflows passed at all four widths, including
PDF text/rendering, names in records/downloads/ZIPs, complete Outlook recipients,
keyboard access and contained table overflow. Live affected views were inspected.

AF-22 remains In Progress for Ben's actual-resume verdict and the separately
identified article coverage reconciliation. AF-2 remains Backlog for its residual
exposure-comparison requirements; AF-4 remains Idea pending acceptance of the
existing September 28 research. Notion has the release and disposition evidence;
no status was promoted. No Ghost edit or later-batch feature is included.
The original main checkout and other worktrees were preserved. Local live receipts
and synthetic fixtures remain in `C:/Users/Ben/Documents/Codex/2026-09-30/task-4/`.

## 2026-09-29 - Redactorium article link and final redirect validation

Ben requested the same top-right article link on Redactorium that SafeSeed has.
The shell header now links to the published `https://advokatfrida.com/redactorium/`
article, using the existing `head-action` style, label and new-tab behavior. The
destination returns 200 with the matching canonical URL and article title.
Ben's dated direction is recorded in the design system; all seven affected
Redactorium proof images were refreshed and directly reviewed.

The full Toolkit gate passed for the combined candidate. Focused browser checks
at 1440, 1034, 390 and 320 pixels verified matching SafeSeed styles, the 44px target,
no overlap or overflow, keyboard focus and opening the actual article in a new tab.
Independent review cleared both this link and the final local redirect validation
described below. No generated tool artifact changed for this follow-up. Private
browser receipts are in `.local-working/maintenance/article-link-local/`.

## 2026-09-29 - Toolkit maintenance after the live release

Ben confirmed that both the post and tool are live, then authorized the repo-audit
recommendations. This supersedes the older draft-status notes below. This maintenance
is scoped to Toolkit; it makes no Ghost or website changes.

CodeQL init and analyze now use the same pinned v4.38.1 commit, with Dependabot grouping
to keep later updates together. The separate updates in PRs #17 and #18 caused their
version-mismatch failures. Playwright is updated to 1.63.0, incorporating PR #10; its
refreshed branch also passed every check before the combined candidate was tested.

The five open CodeQL findings were investigated and corrected. The two HTML-stripping
alerts concern offline QA, not a production sanitizer, but malformed script end tags
could hide visible copy from the checks. Both checks now share a parse5 text extractor.
Two redundant phone-pattern character classes were simplified without changing matching.
The local preview server now rejects decoded network-path references before redirecting;
the production Worker uses a separate handler. Six regression tests cover the parser and
redirect cases, including an HTTP regression that failed before the fix.

An independent reviewer cleared the candidate with no blocking findings, including 121
HTTP redirect probes. All 82 Redactorium tests, lint and production build passed, followed
by tool staging and the full Toolkit gate (including 137 static checks, four-width rendered
QA, state proofs and the style census). Changed proof captures were directly inspected;
only hover/focus and randomized-record noise changed. Fresh captures and logs are retained
in ignored `.local-working/maintenance/`; committed visual baselines remain unchanged.
Only the generated Redactorium artifact changed; its SHA-256 is
`2daf7b2d3ec22c49518fd26369fea79decb6235338d33df53fafbfce4a4d37b5`.

Two abandoned Claude worktrees and the obsolete README stash were retired after recovery
archives, Git snapshots and bundle verification. Exact safety-kit working bytes and the
unique XLSX commit are preserved. The clean PWC worktree remains available for reuse.
Private recovery receipts and restoration commands are in
`.local-working/recovery/2026-09-29-maintenance/`.

[PR #22](https://github.com/advokat-frida/af-toolkit/pull/22) merged reviewed commit
`145c9b0` as `e937917d401c16303c63139121bda6680a0d7700` after all five PR checks passed.
Main CI passed, Cloudflare production build `54f6a5a9-1ac3-4f67-ad4f-1249f6a46b0e`
succeeded, and all 29 checked production files match the merge (normalizing only the
known Cloudflare hidden-link injection). Superseded PRs #10, #17 and #18 are closed.
CodeQL automatically marked #1, #2, #7 and #8 fixed; #9 remained open despite the
input guard and passing adversarial probes. The follow-up validates the final asset
`Location` against a fixed origin as well. Independent review cleared that change,
including both server regressions and 127 HTTP probes with no off-origin redirects
or request failures. The full Toolkit gate passed again. Fresh proof captures match
the previously reviewed candidate apart from the randomized record hash, which was
directly inspected. The final CodeQL closure still requires a fresh analysis; no
alerts have been dismissed.

Two new updates appeared during this maintenance and are separate follow-ups:
[PR #23](https://github.com/advokat-frida/af-toolkit/pull/23) patches a newly surfaced
moderate brace-expansion advisory in ESLint's development-only dependency chain;
[PR #24](https://github.com/advokat-frida/af-toolkit/pull/24) updates both CodeQL actions
to v4.38.2 together, confirming the new grouping. Both remain open for separate
review. The deployed browser tool does not use brace-expansion.

## 2026-09-28 (actual resume correction) - PDF header geometry swallowed the name

Ben supplied the exact resume after reporting the name still missing. Reproduction found
the PDF parser joining independently positioned region and name fields when PDF.js omitted
`hasEOL`. This was a parser defect, not a non-PII classification. The correction separates
baselines and large column gaps in either direction while preserving ordinary text runs.
An independent reviewer found the reverse-column variant, then cleared its tested fix.

82 engine tests, lint/build and the actual-resume browser workflow at four widths passed.
The local candidate finds one name, two places, one email and one phone, and removes those
five matched values from the PDF. See [review and remaining limits](review/af22-pdf-text-separation.md).
Input, private screenshots, downloads and receipts stay in ignored `.local-working/af22-resume/`.
Only synthetic geometry/text appears in the committed tests. The final Toolkit gate passed.

**Released and verified with the actual file.** [PR #21](https://github.com/advokat-frida/af-toolkit/pull/21)
merged `c0d8f7c` as `cfc5b08f63752b2fc00d250b405f68986c567108` after all five PR checks passed.
Production build `6f6ea431-a2a9-4e2f-ba8e-bf02cb629f57` released Worker
`8365da47-2498-445c-b57c-e38588f00a0d`. All 29 checked live files match committed bytes, with
only the known Cloudflare hidden-link injection normalized. The exact input also passed
all four production widths and downloaded-output checks, including removal of its name.
The original input is unchanged. Only the merged corrective branch was pruned. This closeout
changes documentation only; public tree `164030557eb6d65ca7217aeef3300ea57d27f2a8` is unchanged.

Schools, qualifications and certifications still need manual review. The actual file also
exposed retained identifying filenames and the unchanged PDF exporter's garbled Unicode
bullets. Those are documented follow-ups, not fixes silently included in this parser change.
Keep AF-22 In Progress for Ben's final verdict; keep the Ghost post draft and unsent.

## 2026-09-28 (tuck complete for code) - AF-22 live; actual-resume acceptance still open

[PR #20](https://github.com/advokat-frida/af-toolkit/pull/20) merged reviewed source `db52d50`
as `9998a196dc78aac837120eeb91d471170506a96b` after all five PR checks passed. Cloudflare
production build `17c13a37-ae52-4192-b62c-0b81078fdead` released Worker version
`a859786f-fb64-46fa-873c-ed7a3fddc0e2`. All 29 checked live files matched the committed bytes,
with only the known Cloudflare hidden-link injection normalized. The production synthetic
PDF workflow passed at 1440, 1034, 390 and 320 pixels, including downloaded PDF and record
checks. Desktop and phone captures were directly inspected. Full review, tests and release
evidence: [AF-22 review](review/af22-document-identity.md); local receipts in
`.local-working/af22/live-verification.json` and `.local-working/af22/live/`.

Only merged `codex/af22-document-identity` was deleted locally and remotely. Untracked
`.claude/` and unrelated sibling work remain untouched. This closeout changes documentation
only, with the same public tree as the verified merge.

**Next:** Ben's actual resume through the live tool must show Name, Place, Email and Phone,
with those matched values absent from the clean PDF. AF-22 stays In Progress until that
acceptance succeeds; synthetic QA is not a substitute. Employers, schools and free-form
regions still need manual review. The tracker has the independent review and release evidence.

**Post boundary:** Ghost still reports draft, `published_at: null`, `email: null`; latest
observed user edit `2026-09-29T04:10:35.000Z`. Do not publish or send. Approved article copy
edits are saved in Ghost, and later manual edits are preserved. Pre-existing newsletter
button-pair markers and the tool legend's wording remain separate follow-ups.

## 2026-09-28 (tuck) - AF-22 reviewed release candidate; Ghost remains draft

Ben authorized tuck, explicitly excluding post publication. The reviewed candidate is on
`codex/af22-document-identity`, based on `a21a34d`. Independent review found and resolved a
partial-name leak for a labeled name with a middle initial; the regression failed before the
fix and passes now. The reviewer reran 31 focused tests and found no remaining blockers.
All 73 engine tests, lint, build, final tool staging and the complete Toolkit gate passed.
The synthetic PDF workflow also passed at 1440, 1034, 390 and 320 pixels, including downloaded
PDF and record checks. See [review evidence](review/af22-document-identity.md).

Final staged Redactorium SHA-256:
`8f0a730d94fe4fb0fdd32d3aa19a8cb1277bc1406f8a665cbb03d8ee94cef9db`.
Other tools are unchanged. Only the intended findings proof is included; unrelated capture
noise and the pre-existing untracked `.claude/` work are excluded.

AF-22 is now In Progress. Ben's actual resume still needs the specified live acceptance test
after deployment; synthetic QA does not close that requirement. The later accepted article
section order and wording edits were saved to Ghost at `2026-09-29T03:57:43.000Z`. The post
remains a draft and must not be published or sent. The prior entry below describes an earlier
checkpoint; its no-Ghost-edits and untouched-tracker statements no longer describe current state.
The pre-existing newsletter button-pair markers and remaining tool legend wording are separate
follow-ups. Release/CI/deployment results will be recorded in the closeout entry.

## 2026-09-28 (later night) - AF-22 local candidate, article review only

Ben asked Codex to pick up Fable's Redactorium handoff, update the stale `advokat` skill, and
proofread the latest Ghost draft as a suggestions table for Ben to edit manually. Read the live
AF-22 spec (Not Started) and this handoff before implementing. Starting HEAD was
`a21a34dd3ccccac8ce74946b9031e2ff519c4ec5`; tracked files were clean. The existing untracked
`.claude/` files were preserved. This entry and the candidate are local and uncommitted.

**Implemented the three AF-22 rules.** A short two-to-four-word capitalized line among a
document's first five nonempty body lines becomes a lower-score name candidate (0.45), with
common headings, roles and region words excluded. Names found there or after an existing label
seed exact, case-sensitive whole-name repeats inside that same document, including Word headers
and footers. A new Place kind recognizes capitalized city + US state abbreviation/full name;
Make less exact retains the state, and fake places are explicit placeholders ending in `ZZ`.
Detection and treatment share the same document context. No cross-file name learning, model,
network lookup, employer/school recognition or free-form region recognition was added.

**Verified.** Redactorium's 72 engine tests, lint and production build passed. The new tests cover
resume/letter/timesheet boundaries, exact repeats, accented names, Word runs/headers/footers,
all place treatments, Keep, headerless rows, records without matched values and a large log.
`npm run build:tools` and the complete root `npm run gate` passed; other tool artifact hashes
were unchanged. Staged Redactorium SHA-256:
`e4a6ed7a02ee7e7ee34702e4f57da1cc18c3c0ba2664dbe5041a2341bc5c36e1`.

Browser QA used a synthetic resume PDF at widths 1440, 1034, 390 and 320. Each produced Name,
Place, Email address and Phone number rows; both name and both place occurrences were removed
from the downloaded PDF. The record counted the changes without copying the values. Controls
fit, there was no horizontal overflow, no page errors and no external requests. Direct visual
inspection covered findings and result views, including mobile wrapping and the lower-confidence
name citation. Evidence and the reusable QA script are in ignored `.local-working/af22/`, with
`browser-results.json`, `gate.log`, findings/result screenshots and clean PDFs. Kept the updated
`proofs/states/4a-redactorium-findings.png` citation proof. Restored unrelated SafeSeed/Wizards
capture hover/focus/scroll noise and the record screenshot's random fingerprint-only difference
to their exact starting bytes after comparison.

**Still open.** This is a local candidate, not a live fix or an AF-22 closeout. Ben's actual resume
still needs the specified live retest after a separately authorized release. Employers, schools,
free-form regions and unknown names can remain; a resume is not anonymous just because these
four rows are treated. The latest Ghost draft was read at `2026-09-29T03:31:07.000Z`; no Ghost
content was changed. Copy suggestions are in the chat, including the scope mismatch, Code/Fake
guarantees, format exceptions, and the non-ASCII hyphen in the custom-rule example. Existing
tool legend copy repeats some of those overclaims and needs a separately scoped wording pass.
No commit, push, deploy, publication or Notion mutation was performed. AF-22 remains untouched.

## 2026-09-28 (night) - The tuck: PR #19, what CI and two reviews caught, live

Everything in the evening entry and the AF-20 entry below shipped as advokat-frida/af-toolkit#19
(`6ba17c5` Redactorium release, `70cde32` SafeList, `824e438` SafeSeed + Wizards chrome,
`5d4f0eb` tool addresses, then the two fixes below), fast-forwarded to `main` at `fa8c9ef`,
deployed by Workers Builds and verified live (end of this entry). AF-20 and AF-21 are Done.

**What CI caught.** Redactorium's engine tests failed on the shared runner: "large text scans in
reasonable time" took 5.5 s (1.4 s here). Not a slow runner: the overlap pass in `scanText`
compared every candidate with every span already kept, quadratic in the number of matches (a
2 MB log has 40,000), and would hang the browser on a bigger file. `resolveOverlaps` groups the
candidates into runs of touching spans and applies the same strongest-first rule inside each run
(a span can only conflict with spans in its own run): linear, same answer, proven against the
one-by-one rule on 300 random sets in the suite (2,000 in a scratch probe). 80 ms now. `991580d`.

**What the reviews caught.** Two independent read-only reviewers read the branch (routing, shell
and chrome; the Redactorium engine and SafeList). Both verdicts: safe to merge after fixing one
thing. The one thing and every should-fix are in `fa8c9ef`, each with a test:
- *Engine, the blocker.* A card or IBAN that starts inside a rejected candidate was never found:
  the scanner resumed after the whole rejected span, so "415 555 0134 4111 1111 1111 1111" (a
  phone beside a card, the row shape PDF extraction produces) kept the full card with no finding.
  It resumes one character in now.
- *Engine.* An international phone ran greedily into the date, time or ordinal after it and was
  lost or mangled; a `refine` step on the pattern drops trailing groups until the phone ends where
  the phone ends. Ten digits failing the NHS check digit scored 0.2 and put a code on order-ID
  columns by default (0 now). Phone headers in other languages and shorthand (telefon, tél, handy,
  msisdn, whatsapp, mob, ph) count, and the phone citation says digits alone count only under such
  a header. A headerless file of names, dates of birth and addresses kept the first person as the
  header row: a date, street or postcode shape in row one, with the column below sharing the
  shape, marks the row as data (a timesheet whose column names are dates keeps its header). A
  header narrower than its rows dropped the extra columns; a trailing delimiter adds none. Replace
  with a code hashed the raw string, so "Ada@Example.org" and "ada@example.org" (or a spaced
  SSN) got different codes: values are trimmed, case-folded and, for digit kinds, stripped of
  separators first. Swap for fakes merged people once a pool ran out (100 names, one NHS number):
  900 name combinations with a middle initial past that, streets and companies take a suffix, NHS
  fakes come from the 999 test range with a valid check digit, and the record's limits name any
  kind whose published pool (test cards, test IBANs) had to repeat. Sixteen-digit numbers kept in
  Excel go back as text so Excel shows every digit. Word: building blocks (glossary) are read and
  treated; hover text and simple-field instructions are treated; table cell revisions are removed;
  the headings list, the attached-template path (a user name on disk) and the page thumbnail are
  removed and listed; SmartArt is declared unread; a redacted mailto link becomes
  `mailto:redacted@example.invalid` so Word does not offer a repair. The PDF writer imports jsPDF
  by name, so the PDF path runs under Node and has a test.
- *SafeList.* A broken address inside a multi-entry cell ("ada@example.com; grace@example") was
  dropped from the suppression set without a trace; it is reported as invalid.
- *Shell and edge.* The SafeList frame carries `?embed=1` like the other three: a browser that
  sends no `Sec-Fetch-Dest` (Safari 16.3 and older) could otherwise get the shell inside its own
  frame; a test reads every frame source and checks the Worker leaves it alone. `tests/worker.test.mjs`
  runs the edge handler against a stub asset host (rewritten shell, stripped conditional headers,
  HEAD, the 302 no-store, frame and curl passthrough, the 301, 404s), and a shell without its
  anchors is served as it is instead of a 500. The edge names the route on `<body>` and
  `toolkit.css` shows that view before `toolkit.js` runs, so a direct visit never shows the Home
  while the script loads; the no-script note links to the Home view. `popstate` from a fragment
  jump no longer re-routes. The three tool workflows rebuild on a change to `public/favicon-32.png`.
  ARCHITECTURE says how the `_headers` rules reach the Worker-served addresses.

**The re-test that gates the article.** Ben ran his own resume through the tool that was live (the pre-release build: one "Job title" row from a column heuristic, nothing from the text) and asked how it could be published. On the released build the resume yields the email address and the phone number, and not the name at the top, the place lines ("City, ST") or the employers. In free text a name is only found after a label, and there is no place kind. AF-22 (Not Started, spec on the task): a headline-name rule for the first lines of a document, repeats of a found name, and a City, ST kind. Organizations stay out of reach for a pattern tool, and the article should say so.

**Left for Ben** (review notes not done tonight, heaviest first):
1. Bare-digit columns with no phone-like header get no row at all (main flagged them as phones at
   0.72; the ID-column fix traded that away). A low-confidence "Digits: a phone number or an ID,
   check it" row when 35% or more of a column is 8 to 15 bare digits would keep the quiet default
   honest. Needs UI copy.
2. The fixed default fake seed means two separate runs draw the same fake stream, so two files
   cleaned separately hand unrelated people the same first fake (batch mode salts by count). Say so
   in the seed help, or default to a random seed written to the record.
3. The Code key field is a plain text input; a password toggle would suit a key reused across files.
4. The input sheet name is reused for the output sheet and lands in the record.
5. PDF: annotations and form-field values are neither scanned nor carried (dropped, not leaked);
   non-Latin names render as garbage in the clean PDF (standard Courier); pdf.js cannot fetch cMaps
   under the CSP, so some CJK PDFs fail extraction with an error rather than a leak.
6. Pin wrangler in devDependencies so Workers Builds deploys with the version the branch was
   verified against (4.143.0 tonight); Dependabot keeps it moving.
7. With JavaScript off, a tool address shows the tool's empty frame stage plus the note linking
   Home (the tools need JavaScript anyway).
8. A custom rule stops at 10,000 matches per text, silently.
9. Numbers of 17 to 19 digits stored as numbers in XLSX are rounded by the parser (a JS double)
   before anything sees them; only text cells carry them exactly, and Excel itself keeps 15.

**Verified on the final tree.** `npm run gate` exit 0 (264 checks; of the proofs only
`states/4a-redactorium-findings.png` changed, the phone citation wraps to three lines; a 28% diff
in `4f-wizards-determination` was a one-off capture flake, two fresh captures byte-identical to
the committed file); root `npm test` 16/16 (routes, worker, the rest); Redactorium 60/60 engine
tests, lint, build; SafeList 26/26 and build; the AF-20 end-to-end harness 58/58 (its "no emails
left" check now allows `redacted@example.invalid`); on `wrangler dev`, the routing suite 30/30 and
8/8 direct-visit screenshots with the footer and the frame right on every address. CI on the final
head: 11 of 11 green (Gate, CodeQL, SafeSeed CI with the Action contract on three runners, Redactorium CI, SafeList CI, Wizards CI, Workers Builds). Live after the deploy: 27 curl probes OK (200 on the four addresses and the Home with their own title, canonical link and data-route; 302 no-store for page visits to all nine artifact paths; 200 for frames and curl; 301 for trailing slashes with the query kept; 404 for unknown paths); 8/8 direct-visit screenshots (footer and frame right on every address, a direct visit to /tools/safeseed and /tools/safelist lands in the shell); the browser routing suite 1 of NaN on production, the miss being Cloudflare's AI Labyrinth, not the router: the zone injects a hidden /cdn-cgi/content decoy link into pages served to suspected bots (curl sees it too), so the Tab-then-Enter skip-link check landed on a decoy page; humans never see it, and all 30 pass on wrangler dev. Ben's own resume through the live build: Email address and Phone number found inside the text (the old build found nothing), his name, the place lines and the employers not..

## 2026-09-28 (evening) - Tool addresses, direct-visit redirects, one footer for all four: shipped in PR #19

Ben's calls after finding SafeSeed's standalone page (`/tools/safeseed`) live with an old stacked
footer and a false "Analytics by Plausible" line: (1) forward direct visits to the shell,
(2) give every tool its own address, `toolkit.advokatfrida.com/safeseed`, `/safelist`,
`/redactorium`, `/privacy-wizards` (no `/tools`), (3) fix the footer on all four standalone
pages, (4) the tab icon too. All in this working tree, on top of the AF-20 work below (one tuck).
The side worktree `.claude/worktrees/safeseed-analytics-line` from the first SafeSeed fix was
superseded by this and has been removed, branch included.

**How it works.**
- `routes.mjs` (new, repo root): the one list of routes, artifact entry paths, titles and
  descriptions; `redirectFor()`, `redirectResponse()` and `shellForRoute()`. `worker.mjs` (new)
  is the edge script: a browser opening an artifact as a page (`Sec-Fetch-Dest: document`, or
  `Accept: text/html` with no Sec-Fetch headers) without `?embed=1` gets a 302 marked
  `no-store` to the tool's address (a bare 301 was the first cut; Chromium cached it per URL and
  then applied it to the shell's own frame request for `/tools/safelist`, loading the shell
  inside itself: caught by the browser suite on wrangler dev, never by the local server, which
  sends `no-store` on everything); `/<tool>/` 301s to `/<tool>`; `/<tool>` is answered with
  `index.html` rewritten (title, description, canonical, `body[data-route]`); everything else
  goes to the asset host, so a missing file still 404s. `wrangler.jsonc` gains `main`,
  `binding: ASSETS` and `run_worker_first` for the nine artifact entry paths
  (tests/routes.test.mjs checks the list).
- `server.mjs` applies the same rules locally plus the asset host's `auto-trailing-slash`
  behavior (`/x.html` 307s to `/x`; `/dir/index.html` to `/dir/`), exports
  `createToolkitHandler`, and `scripts/visual-qa.mjs` + `scripts/state-proofs.mjs` (and so
  `style-census`) now serve through it instead of their own mini servers.
- `public/toolkit.js`: path routing (rail and cards link to `/<tool>`, in-place switching with
  `pushState`, `popstate`, per-route title); old `/#<tool>` and `/#home` links are adopted onto
  the path with their query; the skip link and the changelog anchor are left to the browser (the
  skip link used to flip the view to Home: fixed). `public/index.html`: hrefs, a canonical link,
  and the frames load the extensionless artifact addresses (one hop instead of two).
- Standalone footers: SafeSeed (`demo/src/components/SiteChrome.tsx`, `generator.html`,
  both CSS files, `verify-chrome.mjs`), the Wizards (`App.svelte`, `app.css`,
  `verify-artifact.mjs`, `build-singlefile.mjs`), SafeList (`page-body.html`,
  `chrome/shared.css`, `tools/build.mjs`, its CLAUDE.md and README) and Redactorium
  (`Footer.jsx`, `index.css`, `vite.config.mjs`) now carry the shell footer: one row, the
  nameplate as a link, About / Contact / Privacy / RSS, no description line, the Plausible line
  banned in the contracts. Each build inlines the shell's `public/favicon-32.png` as a data
  URI for the tab icon (SafeSeed's teal `fox.svg` retired). Canon: DESIGN-SYSTEM §7.
- Docs: ARCHITECTURE (Hosting), README, VERIFYING (curl still gets the file), REVIEW-GATE step 3.
- The Ghost draft for the Redactorium article now links `https://toolkit.advokatfrida.com/redactorium`,
  which is a 404 until this deploys: publish the article only after the Toolkit release.

**Verified.** Each tool's own gate on the new chrome: SafeSeed `release:check` (127 tests, CLI
6/6, Action 5/5) and `build:standalone:all` with `verify:chrome` (`safeseed-proof.html`/`.js`
changed by one inert CSS span each, because they inline `src/index.css`); the Wizards
`npm run check` (75 tests, style audit, artifact contract); SafeList `npm run check` (25 tests);
Redactorium lint, 47 tests, build. Every standalone footer measured identical to the shell's at
1440 and 390 (screenshots in the scratchpad `footers/`, looked at). All four restaged. Root:
`npm test` (7, incl. `tests/routes.test.mjs`), syntax check over 16 files, `npm run gate` exit 0
twice on the restaged tree (264 checks, the rendered QA now going through `server.mjs`, style
census unchanged), the AF-20 end-to-end harness 58/58. Routing: `npx wrangler dev` (the real
Workers runtime) answered every case as designed with curl (302 `no-store` for page visits to
all nine artifact paths, 200 for frames and for curl, 307 `.html` to extensionless, 200 with the
right title/canonical/route on all four addresses, 301 for trailing slashes with the query kept,
404 for `/nope` and `/tools/nope`, `no-cache` and no ETag on the rewritten shell), and a
Playwright suite of 30 browser checks (scratchpad `routes-browser.mjs`: addresses, hash adoption
with the query kept, rail and card switching, back/forward, the skip link, direct visits landing
in the shell, every frame's first control, no nested shell after a direct visit, 404, tab icon)
passes in full on wrangler dev and on `server.mjs`. Proofs reviewed: Home (the auto-fit grid,
three across at 1034), Redactorium and SafeList changed as intended; three that differed only by
noise were restored.

**Left for Ben.**
1. The tuck. Workers Builds must keep the empty build command and plain `npx wrangler deploy`
   (it bundles `worker.mjs`). After the deploy: `curl -sI https://toolkit.advokatfrida.com/tools/safeseed`
   (200) and the same with `-H "Sec-Fetch-Dest: document" -H "Accept: text/html"` (302 to
   `/safeseed`, `Cache-Control: no-store`); open `/tools/safeseed` in a browser and land on
   `/safeseed` in the shell; `/nope` still 404.
2. Publish the Redactorium article only after that deploy (its links now point at `/redactorium`).
3. Optional, later: `safelist/shots/*.png` still show the old footer (SafeList's own harness
   output, not the gate's); the standalone masthead (Subscribe chip, old nav) is the same vintage
   the footer was, now only seen at `file://` and by no-script visitors; search consolidation of
   `/tools/*` onto the tool addresses (a canonical link in each artifact) belongs with the parked
   SEO direction.

## 2026-09-28 - Fixes from a real deletion-request job (AF-20): same working tree, still waiting for the tuck

Ben used SafeList and Redactorium on a real data subject deletion job (a list of email addresses
to remove from a team's spreadsheets) and reported five things. Everything below sits in the same
uncommitted working tree as the 2026-09-24 review.

- **A 15-digit card came back as 3.78282E+14.** Excel stores a typed Amex as a number; kept as it
  was, the clean workbook wrote it back with the General format, which shows any whole number of
  12 or more digits in scientific notation. `exporters.js` now gives those numbers the `0` format:
  they show in full and stay numbers. The repro found a worse neighbor: a number shown through a
  digit mask (ZIP `00000`, SSN `000-00-0000`, Excel's Phone format) was read as its raw value, so a
  formatted SSN (78051120) hid from detection and a ZIP lost its leading zero. `parsers.js` now
  reads those cells as the text a person sees (`isDigitMask`).
- **False alarms on ID columns** (also from the repro). Any 12 digits read as an Aadhaar number (no
  check digit was ever tested), any bare run of 8+ digits as a phone number, and any 12 to 19
  digits that fail the card check as a weak card. Aadhaar now needs its Verhoeff check digit, a
  first digit of 2 to 9, and a column named for it. A bare digit run counts as a phone only in a
  phone column (a +, spaces or dashes still count anywhere), and a failed card check only in a card
  column (the new `hintOnly` detector field).
- **SafeList paste separators.** The suppression paste already split on commas by accident (it is
  read as CSV) but said "one address per line", and semicolons (Outlook's To line) failed. It now
  takes commas, semicolons, tabs, new lines and display names (`cellEntries`), and a send list
  pasted on one line becomes one contact per address (`pastedList`). The hints say so. The README's
  missing "Later" section now exists and lists what the deletion job ran into.
- **"Synthetic swap" was jargon.** The pending release already renames the options (Swap for fakes,
  Replace with a code, Make less exact). Ben asked for "anonymize": it now names the job (the Home
  card, the page description, the legend's title) rather than one option, because every option is
  a way to anonymize and swapping in fakes alone does not make a file anonymous in law. The Home
  card's pinned copy in `scripts/checks.mjs` moved with it.
- **People could not tell the options apart.** A legend card above the findings (single file and
  batch) shows the four treatments on one phone number, from `lib/legend.js`; `tests/legend.test.mjs`
  holds every example to the real function.
- **Home cards were very wide on a large display.** The grid now fits cards of at least 240px:
  unchanged at 1440 (297px), 298px at 1920 (was 507), 336px at 2560 (was 690).

Design canon: DESIGN-SYSTEM §3 (Home tool card, the treatment legend) and §7 record both as Ben's
2026-09-28 calls.

**Verification.** Redactorium 47/47 tests, lint and build clean; SafeList 25/25 and its check;
root gate exit 0 (style census unchanged: the legend reuses existing roles); end to end 58/58;
the legend at 1440, 1034 and 390 and Home at 390 to 2560 looked at, right edges matching. Proofs
that differed only by a scroll offset or a caret were restored. Staged hashes: Redactorium
`7ce7199ad6495b4b670a2bfaeef6057677297c3c0aee7c4530e749299334dbdc`, SafeList
`3472a4c5049d1d1a5e3ac134724a423428e67240b9808c88792880278fe27504`.

**Open, Ben's call.** The "anonymize" wording; SafeList's "Later" list (Excel input, other match
keys, the 24-hour rule for deletion lists, anonymizing a listed person's rows instead of deleting
them); the tool review and research on the Toolkit's product page in Notion.

## 2026-09-24 - Redactorium release review (AF-20): ready locally, waiting for Ben's tuck

Ben asked for a full review of Redactorium to make it ready for release, plus its newsletter
article as a Ghost draft. Task: [AF-20](https://app.notion.com/p/3e50f293ed9d811b92f6cb0e578a7f8a).
Three independent reviewers (engine correctness, UX and copy, security/dependencies/docs) worked
against main `2e91b15`, whose served Redactorium tree was byte-identical to the repo.

**What they found.** All fixed below unless listed under Open.
- P1: personal data inside text was never found. Every detector matched a whole cell, so PDF,
  Word, text and log files came back unchanged (or wiped line by line if a treatment was forced),
  and a notes column kept its emails, phones and SSNs.
- P1: Hash was plain SHA-256 cut to 16 hex characters, unsalted by default (the salt field started
  as `""` and `??` never fell back). An SSN column reversed in under a second. The intro strip and
  the Home card said "Anonymize".
- P1: Word output kept headers, footers, footnotes, comments with their authors, tracked-deletion
  text, hyperlink targets, field codes, document properties and customXml. Single-file mode wrote
  a DOCX out as .txt (it did not pass `kind`).
- P1: a CSV or XLSX without a header row kept its first row verbatim; Generalize on an IP column
  passed IPv6 and anything unexpected through unchanged; the result band said "Signed: SHA-256"
  although the record calls itself unsigned.
- P1 UX: batch mode ignored dropped files, the findings table clipped its selects from 768 to
  1073px, paired buttons had unequal widths, the record had no way back to the treatments, load
  errors were four-second toasts, and the standalone footer claimed Plausible analytics.
- Security and docs: xlsx 0.18.5 on the parse path (CVE-2023-30533, CVE-2024-22363; Dependabot #8,
  #10); the CSP allowed `unsafe-eval`, which nothing needs; THIRD-PARTY-NOTICES said Redactorium had
  no license and pointed at a CRA path, and pdf.js and SheetJS (Apache-2.0) shipped without their
  license text; "five tools" in five places; README's `file://` claim; VERIFYING's lazy-fetch,
  offline and rebuild steps; SECURITY's clipboard-write and secret-scanning lines.
- Confirmed sound: no request left the site in any flow (local and live), record hashes are right,
  the record holds no sample values, fakes never derive from the originals.

**What changed** (working tree on `main` `2e91b15`, nothing committed):
- Engine (`redactorium/frontend/src/redactorium/lib/`): `textScan.js` finds kinds inside text as
  exact spans (no lookbehind; checksums for cards, IBANs, NHS; label-gated DOB, names, passports,
  licenses, bare SSNs, ZIPs). `detector.js` returns rows: a whole-cell column, or one row per kind
  found in text, scanning every row. `transformers.js` rewrites only matched spans; hashing is
  HMAC-SHA-256 with a random key per run unless the user enters one; fakes are consistent per
  value; fake ZIPs sit below 00501, fake passports and licenses are zero-led; IP generalizing
  handles IPv4 with ports and compressed IPv6 and redacts anything else; short card and IBAN values
  are masked whole. `parsers.js`: a first row that is data is treated as data; an unclosed CSV quote
  is refused; BOM, delimiter and line endings survive; the first visible sheet is read with dates as
  dates; PDFs keep lines and page breaks, a scan says so, pdf.js runs with `isEvalSupported:false`.
  `docxHandler.js` is rewritten: every text part, alt text, hyperlink targets and the title are
  treated; comments, tracked changes, author/company/manager, customXml, custom properties and
  document variables are removed; embedded files and charts are named as unread; replacements are
  spliced into runs, so untouched text keeps its formatting. `exporters.js`: record v0.2.0
  (`detectors_run`, `found_in`, `document_cleaning`, `sheets`, `limits`), file names cleaned of
  detected values, PDF creation date in UTC, `.md` and `.log` keep their extension. Plain citations
  and names in `piiPatterns.js`; ZIP needs a ZIP column or label; custom rules drop `g`/`y`.
- UI: the shared `FindingsTable` (single file and batch) with in-text rows and a count line; plain
  treatment names (Keep, Redact, Replace with a code, Make less exact, Swap for fakes); cards below a
  1074px frame; one boundary aside per file; an empty-document state; load errors under the drop
  zone; Back to treatments; equal button pairs; a two-column Advanced; a rebuilt custom-rules panel;
  batch with drag and drop and one zip of clean files, records and a manifest; focus management;
  16px phone controls; sample values from reserved ranges.
- Build: xlsx 0.20.3 from the SheetJS CDN (the reviewer's verified patch 1), 49 unused
  dependencies and 72 unreachable files removed (patch 5b), `THIRD-PARTY-LICENSES.txt` written from
  the bundle by a plugin in `vite.config.mjs`, a CSP with no `unsafe-eval` and `connect-src 'none'`,
  41 engine tests (`npm test`, node:test, no new dependencies) added to `redactorium-ci.yml`.
- Shell and docs: the Redactorium Home card (its pinned copy in `scripts/checks.mjs` updated), the
  meta description, a changelog entry dated September 25, 2026, README, SECURITY, VERIFYING,
  ARCHITECTURE, MANIFEST, THIRD-PARTY-NOTICES, both Redactorium READMEs, and DESIGN-SYSTEM §3 plus a
  §7 note marking the design changes as proposed until the tuck.

**After the article's reader panel (same night).** Four simulated readers of the Ghost draft
(subagent personas: a support lead, an operations coordinator, a software engineer, privacy
counsel) asked questions that led to five tool fixes, made before the article describes the
behavior:
- Swap for fakes could hand two different people the same fake (6 area codes x 100 numbers for
  phones, so a clash was likely by about 30 people; a later batch file replayed the first file's
  draws and clashed on every value). Now a clash is redrawn, a later batch file draws a fresh
  stream, fake phones use any valid area code (555-0100 to 555-0199 is fiction in all of them),
  and fake emails carry six digits. Kinds with a short published list (test cards, IBANs, the NHS
  test number) still repeat, as the README says.
- Make less exact kept a phone number's last four digits, the part that identifies the line (and
  a common identity check). It now keeps the country and area code and masks the last seven.
- Word pictures (`word/media/`) passed through without a word. They are now listed as not read,
  on the page and in the record's `not_read_and_left_as_is`.
- The PDF notice said hidden text stays behind. It does not: pdf.js extracts white text, text
  under a black box and invisible scan layers, and the clean PDF prints them as ordinary text
  (proved with a hand-built PDF). The notice now says so.
- Timing a 200,000-row export showed its `customer_id` column (C100000 style) labeled "Passport
  number": any six to nine letters and digits passed, and so did the driver's license shape. Both
  now need a column named for them, as ZIP codes already did.

**Verification** (rerun on the final build, after the reader-panel fixes).
- `redactorium/frontend`: 41/41 tests, lint clean, build clean and reproducible (two rebuilds,
  byte-identical).
- Root `npm run gate`: exit 0 (design gate, typecheck, tests, 128 static checks, rendered checks at
  four widths, 16 states, style census unchanged).
- End to end in the staged Toolkit (headless Chromium, local server): 58/58. The sample flow and
  both downloads; twelve of the reviewers' fixtures (text, log, two PDFs, two Word files, notes and
  patients CSVs, a headerless CSV, two workbooks, IPv6) with no email or SSN left in any clean file;
  corrupt DOCX and PDF, a malformed CSV, an empty file and an unsupported type; a batch zip with
  three records and a manifest; 1034, 390 and 320px with no overflow; zero console errors and zero
  requests off the local origin.
- A hand-built PDF with white text, text under a black box and invisible text: all three come out
  as visible text in the clean PDF, and the page's notice says so.
- Size: a 21 MB export of 200,000 rows took 1.8s from drop to download, and a 50 MB log 6.6s (this
  desktop, headless Chromium), with no real email left in either. The export's `customer_id` column
  is no longer read as passports.
- Proofs 3a, 4a, 4b, Home and changelog inspected. Unrelated proofs that re-render on this rig
  (pixel-identical, a 0.4% caret difference, a 28px scroll offset) were restored. Staged
  Redactorium hash `0472be9b26bfd9b47bf9843a9c00bdf0be9a3dcff7065e13ddca315c7ca50c0a`.

**Open, Ben's call.**
1. The tuck: commit, push, deploy. Workers Builds deploys `main`, so a pull request first (as with
   the Vite migration) gets Redactorium CI and a preview build before the release. Update the
   changelog date if the release lands after September 25.
2. Copy to approve: the Home card line, the intro strip, the treatment names, the plain citations.
3. Not done: workbooks beyond the first visible sheet (the page says so); unlabeled names in prose
   (the article says so); one treatment covers every match of a kind in a document, and a custom
   rule loses an overlap to a built-in one (score 0.85 against up to 0.98), so nobody can keep their
   own support address while treating the customers' (letting custom rules win would allow it);
   Make less exact still keeps an SSN's last four (the IRS truncation display), your call; a user's own catastrophic regex can still freeze their tab; third-party
   license files for SafeSeed, SafeList and the Wizards; `_headers` hardening (frame-ancestors,
   HSTS: first confirm no advokatfrida.com page frames the Toolkit); Cloudflare's injected hidden
   link (the first tab stop and the one CSP console error on the shell) is a Cloudflare setting;
   `tool-sources.json` still says `private-source-control-only` and BRIEF/MANIFEST call the repo
   private; the `verify-log/` redirect stub; sonner style hashes would let the CSP drop
   `'unsafe-inline'`.

## 2026-09-23 - AF-16 approved for release

Ben reviewed the final scrolling correction below and approved: **looks great.
tuck please**. This supersedes the local-only boundary and authorizes commit,
push, merge, deployment and live verification for Toolkit and Survival Guide.
Task: [AF-16](https://app.notion.com/p/3e50f293ed9d814caef8de144b3d880c).

Independent review caught Redactorium notifications falling below the outer
viewport after its iframe grew. The shell now supplies the visible viewport
inset; embedded Sonner positioning accounts for the existing desktop zoom and
phone offsets. Standalone notifications remain unchanged. Independent recheck
found no remaining blockers; desktop and 390px geometry was verified. The
four-width regression check also requires the notification inside the viewport.
Mobile results use cards, so that check does not wait for the hidden desktop table.

**Released and verified.** Runtime commit `3cde3424bd71c531c0cfb58c196bb371ec45895e`
was fast-forwarded and pushed to main. Cloudflare production build
`294a9a60-0cfb-4e10-aa47-9f301ac86483` succeeded, releasing Worker version
`c373290d-5b1b-4866-9b11-39f5793549b2` at https://toolkit.advokatfrida.com/.
GitHub CI `35942755400`, CodeQL `35942755272`, SafeSeed `35942755397`,
Redactorium `35942755222`, SafeList `35942755266` and PWC `35942755206` passed.
The complete local gate passed, including notification visibility at 1440,
1034, 390 and 320px, 16 state proofs and the style census.

At `2026-09-24T01:25:50.821Z`, 28 served files matched their committed bytes:
shell, manifest, all four tool entrypoints and Redactorium's complete asset tree.
Only the observed hidden Cloudflare /cdn-cgi/content anchor is removed from HTML
for comparison. Live browser inspection confirmed the footer's document position
stays constant while the expanded changelog scrolls, then appears after its final
entry. SafeSeed and Redactorium have zero inner page overflow; sample results grow
Redactorium's frame and keep the notification visible. Desktop/phone proofs were
inspected. The sibling Guide release `4806965` is also live and verified.

Rollback version: `3ac7f2bb-8039-450c-901b-783fdbe624f6`. The following closeout
commit changes documentation only; a resulting connected Cloudflare build serves
the same public bytes. AF-16 holds the final closeout and branch-pruning receipt.
No implementation work remains for AF-16. The unrelated untracked .claude/
directory remains untouched. Main website, shop, Ghost, DNS and analytics are
outside this release. Earlier local-only notes below are historical.

## 2026-09-23 - Shared footer ready locally for Ben's review

Ben requested a publication footer on every Toolkit route, consistent with the main
site and Survival Guide. The shell now supplies an ink-band footer with a larger
Advokat Frida nameplate and About, Contact, Privacy and RSS links. It is outside
all tool frames. The final scrolling correction below also updates the tools'
embed layouts, rebuilt artifacts and provenance manifest.

Design, syntax, unit, static, four-viewport and 16 state checks passed. The only
initial gate failure was four new footer type/control tuples; the exact additions
were reviewed, documented in DESIGN-SYSTEM.md, and added to style-baseline.json.
The style census then passed. After the final scrolling correction below,
the complete gate was rerun successfully and the proofs were regenerated.

**Local review only.** Ben explicitly selected Keep local for review for this batch.
Do not commit, push or deploy it without his next release instruction. Preview:
http://127.0.0.1:4177/#home . The sibling Guide preview is on port 4193. The existing
untracked .claude directory is unrelated and remains untouched.

Ben's review correction: the footer must follow the document, not stay pinned
while an expanded changelog scrolls. The shell now grows with Home content, the
desktop sidebar stays sticky, and the footer follows the entire changelog or
tool viewport. Route changes reset the outer document scroll to the top. This
correction remains local under the same AF-16 review boundary. Design, syntax,
unit and fresh four-viewport rendered checks pass. The expanded-changelog scroll,
footer after the last entry, and tool-switch scroll reset were verified directly.
The sidebar's height also accounts for the existing large-display zoom steps.

**Final scrolling correction.** The first correction gave the page and each
tool their own scrollbar. The next attempt fit the footer beneath a fixed tool
viewport, and Ben correctly rejected it as floating again. Both approaches are
superseded: the outer page now owns scrolling on every route. A ResizeObserver
fits each same-origin iframe to its body's natural height, including shrinking
back after a long result. Each tool's embed CSS removes its viewport-height
minimum; bounded data previews use a parent-viewport variable to avoid resize
feedback. Footer positioning is ordinary page flow after the complete content.
Tool logic, copy and artwork are unchanged; the layout CSS was rebuilt in each
source folder and staged through build-tools, including new provenance hashes.

Direct browser review confirmed SafeSeed's footer below the initial viewport,
moving into view only at the bottom, and following an added/removed column
(frame 1000 -> 1057 -> 1000px at the review width). Redactorium's sample results
grow its frame from 626 to 1104px and push the footer below the screen. Phone
and result-state proofs were inspected. Tool-folder checks/builds pass; the
full Toolkit gate passes, including design, syntax, 128 static checks, four
viewports, 16 states and style census. Rendered checks now assert content-fitting
frames and the footer after content. Still local review only: no commit, push
or deployment.

## 2026-09-22 - PWC US state expansion approved for release

Ben completed practitioner review and approved the current version, explicitly requesting Tuck
and deployment. The approved PWC artifact remains byte-identical at SHA-256
`684bff2d7765255380de84917f10984002a91998e50f22908677d08067f800b4` (1,716,596 bytes).
The subsequent changelog request adds the September 22 entry to the Toolkit Home and a linked
`privacy-wizards-council/CHANGELOG.md`; it does not modify the approved tool artifact.

Two new US paths cover applicability and duties for the twenty-state comprehensive-law cohort.
Independent histories, unknown-fact results, combined records and the requested finder, answer,
checklist, Authority, Next determination and wrapping changes are detailed in
`docs/review/pwc-us-state-review.md`, alongside source and independent-review receipts.
Per-source provenance remains as authored; version-level practitioner approval does not silently
change every source's status or enable calendar export.

The tool gate passes 75 tests plus registry/style/build/artifact checks. The Toolkit gate passes
128 static checks, four viewport checks, 16 state proofs and the style census. Release follows
the existing Cloudflare Workers Builds connection from `main`, not a Ghost theme upload.

Notion AF-9 is the release task. Follow-on work is now split into
[breach notifications](https://app.notion.com/p/3e30f293ed9d81ff95b9dd4ab5ccd5d0) and
[DPIA/assessments](https://app.notion.com/p/3e30f293ed9d81e9b9bded87615a63b4) as Backlog,
with [remaining shared usability](https://app.notion.com/p/3e30f293ed9d817bba7ccf0d02eaf3c7)
as Idea. The original expansion research links to these and is labeled historical.
No schema or status choices changed. Other Toolkit tasks remain parked pending Ben's check-in.

**Released.** Commit `e9e606e6aea68f5b9cbff72a62eed9deaa577abe` fast-forwarded to main.
Cloudflare build `b108d897-a248-4d5b-ad9b-a2c5617c5c1a` succeeded. GitHub Toolkit CI
`35796755618`, PWC CI `35796755619` and CodeQL `35796755740` all passed. The live manifest
lists the approved hash. Served PWC and Home HTML equal the committed files after removing
exactly one observed Cloudflare-injected hidden `/cdn-cgi/content` link from each response.
The normalized Home SHA-256 is
`f04006aeab6c50de14321f631b39315146e3403e31e02bd3b779fa29a6ff9ab8`.

**Live verification.** The alphabetical 18-topic finder, California/Texas progression and
stacked unresolved outcomes were exercised in the production browser. Desktop 1440px and
phone 390px results were inspected directly; the phone tool frame measured zero horizontal
overflow. The September 22 Home changelog was opened and inspected on mobile. Local final
proofs also confirm the distinct action, Authority and Next determination treatments.

**Closed out.** AF-9 is Done; AF-10 breach and AF-11 DPIA are Backlog; AF-12 shared usability
is Idea. The research page retains its historical material with a current task map at the top.
Ben's earlier Tuck-skill request is implemented at `.agents/skills/tuck/SKILL.md`: Notion
instead of Linear, no new review status, and actual repository deployment routing. Validation
passed. Workspace hygiene passed in report-only mode with unrelated existing warnings.

**Restart/resume.** The merged `codex/pwc-expansion` branch was pruned locally and remotely;
its clean detached worktree remains at the release commit to preserve the local preview.
Primary `af-toolkit` retains only the pre-existing untracked `.claude/` directory. No other
Toolkit work has started. After a Codex restart, use the live Toolkit or run `node server.mjs`
from the primary checkout if a local preview is needed. The next action is Ben's choice of
backlog work or the requested check-in before another Toolkit task.

---

## 2026-09-14 - Privacy Wizards: the build reads content/ (W1.0 part 2)

Tucked on Ben's word through a pull request from `wizards-registry-switchover`, because it
changes the build pipeline. Linear: ADVO-198.

The build no longer extracts the registry from the legacy `wizards.html`.
`scripts/registry/generate.mjs` validates `content/` and writes
`src/lib/data/registry.generated.js` (`SOURCES`, `WIZARDS`, `REGISTRY_SHA256`) and
`manifest.generated.js`. `npm run registry` runs it, and dev, build and test run it first. A
content error stops the build with the list of errors.

**What changed**
- `extract-legacy-data.mjs`, `migrate-legacy.mjs` and `legacy.generated.js` are deleted. The
  font faces are now the committed `src/styles/fonts.css`.
- The record's hash line reads "Registry SHA-256", the content registry hash `a1cafbd9…`. The
  manifest version is `af-pwc-vnext-2026-09-14`, and the manifest hash changed with it and
  because sources are ordered by id.
- Publication: an unpublished path is left out of the finder and the next determinations, and
  its link opens nothing (`publishedWizardIds`, `finderWizardIds`, `finderGroups`,
  `relatedWizardIds`, `parseWizardHash`). Only a literal `true` publishes. A published path that
  cites a draft or superseded source fails validation, and such a source never opens from the
  text of any path.
- Tests: the registry tests prove the generated modules equal the content files. In
  `council.test.js` the graph counts, the manifest version, publication, the review state and the
  check dates come from the content files, so a draft source for an unpublished path, Ben's first
  practitioner review or a re-stamped check date no longer fails them. The sixteen baseline paths
  must stay published.
- Build output: Privacy Wizards CI fails when the committed registry modules or
  `dist/wizards.html` differ from its rebuild, and the Toolkit gate checks that each staged copy
  was staged from the committed artifact (`scripts/canonical.mjs` holds the shared
  normalization). The step caught this rig on its first run: the working copy of `index.html` is
  CRLF, and vite-plugin-singlefile left a stray blank line where it removes the module script, so
  the artifact was a byte longer than CI's. `vite.config.js` now normalises the template, and a
  CRLF checkout builds CI's bytes. A stale `node_modules` was reinstalled too, but it was not the
  cause.
- Docs: `content/README.md` (the switch-over banner is gone; marker and excerpt rules added),
  `BASELINE.md` (a registry source section with both hashes), `BEHAVIOR-DELTAS.md` PWC-NEXT-009,
  and the tool README.

**Proof that nothing changed.** Captured before the switch: every path and source from the
legacy extraction, and the resolution of every citation in every text block. After it, the paths
and sources are identical and all 1,507 citation resolutions are byte-identical. The built
artifact differs from the live one throughout, because the bundled sources are now in id order,
and also in the record label, the manifest version and hashes, and the publication filter.

**Review (PR #14).** The usage limit stopped the ten finder agents before they reported, so the
finder angles ran in this session and one independent sweep agent looked for gaps. Fifteen
findings: fourteen fixed with tests or checks, and the dev server's content watch documented in
`content/README.md` instead. ADVO-198 carries the list.

**Verification.** Tool gate after `npm ci`: 55 vitest, style audit, build and artifact check
(`ebe2caa9…`). Restaged, then the root gate: design gate, typecheck, tests, 128 static checks (the
three new staged-copy checks among them), rendered QA, every canvas state proof, style census.
Behaviour rig: 68 of 68 at 1440 and 390. The browser probe with Breach severity unpublished passed
against the engine-driven finder with zero page errors, and the files were restored and
hash-checked. All 1,507 citation resolutions still match the legacy extraction. In a scratch
worktree each new guard was shown to fire: the CI freshness step on output that was not
recommitted, the staged-copy check on a rebuild without a restage, generation on a quoted publish
flag, and the artifact check without the font faces.

**Merged and live.** PR #14 fast-forwarded to `main` at `94f34d4` after CI passed, the new
freshness step included. On toolkit.advokatfrida.com, `tool-sources.json` listed `ebe2caa9…`
within a minute of the push, and the served tool equals that artifact byte for byte once
Cloudflare's hidden `/cdn-cgi/content` link is removed. In a browser on the live site the finder
offered the sixteen published paths, the breach path ran to an outcome, and the downloaded record
named `Registry SHA-256: a1cafbd9…` and `af-pwc-vnext-2026-09-14` with no legacy label, with zero
page errors.

**Next.** Wave 1 content is written straight into `content/`: W1.1 the US state cohort (the
recovered July drafts are in `.local-working/advo-73-july-2026/`), W1.2 the breach clocks, W1.3
DPIA and assessments.

## 2026-09-14 - Privacy Wizards 2.1.0: review fixes, merged and live (PR #13)

The tuck's independent review of PR #13 (`f8e5f42` authored depth, `5336ed7` content files
part 1) ran ten finder angles and a sweep, and verified every candidate with a probe. It
confirmed fifteen defects. All are fixed, with tests, in `419c706`; ADVO-197 carries the list.
Ben saw the four pending-law notes summarised in chat before he called the tuck, which closes
the first open item in the entry below.

**What the fixes change**
- *Citations* (`src/lib/engine/mentions.js`, `src/lib/data/mentions.js`). The EU or UK provision
  follows the node's cites first, then the clause's regime words, then the node's UK reading;
  "Art. 22" beside "Arts. 22A–22D" is the original article. A defined term links only where the
  node cites law of its jurisdiction. Lettered articles other than 22A–22D, paragraphs an excerpt
  source lacks (read from its citation), and short instrument names marked `instrument: true`
  for a provision the path does not cite stay plain. The paragraph locator follows marker chains
  line by line and searches a bilingual source's English rendering first. No lookbehind anywhere;
  a unit test reads the files to keep it that way.
- *The card* (`src/lib/Mentions.svelte`). Show the whole text pins the card and moves focus into
  it; the window click reads the dispatch path; focus never unpins; Escape refocuses only from
  inside the block; a changed block or a step change drops the open card; the card is measured at
  its final width. The question card and its answer group take the plain question as their name.
- *`council.js`*. Own-key lookups (`#constructor` threw), abbreviation-aware `sentenceBreaks` for
  the lead, tag stripping to a fixed point with one-pass entities (the two CodeQL alerts), scoped
  pending-law notes, jurisdiction-filtered next determinations (`related.js`: sale-share adds
  dsar, cookies adds legal-basis), and the record's answer note nested under the answer.
- *Registry and gates*. `validateContent` checks the path graph; sources sort by id; the style
  audit reads every component; the draft status dot matches its label.
- *Docs*. DESIGN-SYSTEM's citation entries; REVIEW-GATE's artboard exception (3C, 4E and 4F follow
  Ben's calls); BEHAVIOR-DELTAS renumbered (the 2.1.0 entries are PWC-NEXT-006 to 008, and part 2
  takes 009); the QA record's "Review fixes" section.

**Verification.** Tool gate (52 vitest, style audit, build, artifact check); root gate green;
both review probes refuted every finding with zero page errors; behaviour rig 68 of 68; a before
and after resolution of every mention in every path (16 links dropped and 4 moved to the UK
text, each intended); the whole-text card measured inside the frame at 1440 and 390. CI on
`419c706`: CodeQL, Gate, check, Analyze and Workers Builds all pass. Fast-forwarded to `main` and live on toolkit.advokatfrida.com: `tool-sources.json` lists
`33c28fcd…` for the Wizards artifact, and a browser run on the live site showed the whole-text card
pinned, the plain group label, Rights request triage after sale-share, and zero page errors. The
served tool equals the artifact apart from a hidden `/cdn-cgi/content` link Cloudflare adds after
`<body>` with a new id on every request, so served bytes never hash like the artifact; `.html` tool
URLs also redirect to the extensionless path, so a check with curl needs `-L`.

**Probes and rigs** (gitignored, `.local-working/`): `review-probe-browser.mjs`,
`review-probe-data.mjs`, `review-fix-shots.mjs`, `review-fix-fit.mjs`, `review-fix-live.mjs`,
`pwc-wave0-verify.mjs`.

**Deferred from the review** (real, not blocking): search does not index cited source
citations, so "art. 33" finds nothing; the pending-law notes live outside the registry and its
hash; each citation block adds its own window listeners, and the rail renders every source text
up front; some duplicated text-button styles and dead CSS remain; the citation components have no
style-bible receipt.

**Open.** (1) The finder placeholder still reads "Try breach, DPIA, cookies, AI risk…", a copy
call. (2) W1.0 part 2 is next, on its own branch.

## 2026-09-14 - Privacy Wizards: privacy-first plan, decisions, content files (W1.0 part 1)

Ben re-pointed the Council's expansion at privacy rather than AI and answered the plan's four
calls (Linear doc *Privacy Wizards Council: expansion research (2026-09-13)*, section 6):
one jurisdiction input at the top of multi-regime paths; all 2026 US states; Ben is reviewer of
record, with his review as the last gate on each rebuilt path (breach and DPIA first; how he is
credited in this public repo is still open); the two AI Act paths stay on date maintenance only.

**Finder.** `privacy-wizards-council/src/lib/data/categories.js`: Cross-border transfer replaces
AI Act risk tier in the five common rows (changelog bullets in the tool and on Home). Proof
`proofs/states/3c-wizards-finder.png` and the local shell both show it.

**W1.0 part 1: the registry as authored files.** `privacy-wizards-council/content/` now holds
`registry.json` (manifest version, paths in finder order, `published` flags), 16 files under
`wizards/`, 139 under `sources/<jurisdiction>/` (the included text as a list of lines plus a
`review` block that stays out of the content hash), and a README for authors.
`scripts/registry/content.mjs` reads, validates and builds the same shapes the engine imports;
`scripts/registry/migrate-legacy.mjs` did the one-time split and refuses to overwrite.
`tests/unit/registry.test.js` (8 tests) proves the files equal the legacy extraction byte for
byte (paths in order, sources including bodies, manifest entries, published list, check notes),
that the built registry passes the engine's graph checks, and that a review-status change does
not change a source's content hash. **The build still reads `wizards.html`**: nothing the page
renders changed.

**W1.0 part 2 waits on the 2.1.0 commit**, so the two land as separate, reviewable commits
(package.json and council.js carry both). Part 2: generate the data modules from `content/`,
rename the import, relabel the record line "Registry SHA-256", bump the manifest version (source
order becomes canonical, so the manifest hash changes by design), derive the pinned counts in
`council.test.js`, retire `extract-legacy-data.mjs` (commit the font CSS), update BASELINE.md,
add PWC-NEXT-009, drop the README's pending banner.

**Verification.** Folder check: 44 vitest across three files, style audit, build,
verify-artifact (`dist/wizards.html` sha256 `16ee17fa…`). Restaged; root gate green, census
unchanged.

**Open.** (1) A commit on `main` deploys through Pages, so the four pending-law notes in
`motion.js` want Ben's read before the tuck. (2) The finder placeholder still reads "Try
breach, DPIA, cookies, AI risk…"; swapping the example is a copy call. (3) Wave 1 content
(W1.1 state cohort, W1.2 breach clocks, W1.3 DPIA and assessments) is authored into `content/`
after part 2; the recovered July drafts are in `.local-working/advo-73-july-2026/`.

## 2026-09-13 - Privacy Wizards: the authored depth reaches the page (0.4.3, tool 2.1.0)

Ben asked for "Wave 0" of the Council expansion research (Linear doc *Privacy Wizards
Council: expansion research (2026-09-13)*, Toolkit rollout project). Measured before the
change: 140 of the 224 authored help and reasoning texts were cut at their first sentence
with no way to the rest; the 24 outcomes that carry a clock showed no reasoning at all (the
clock line took the qualifier's place); 78 option notes never rendered; the 139 verbatim
source texts were unreachable (`openSources()` had no trigger since the Toolkit redesign);
and the per-path `verifiedAsOf` stamp never showed. No decision node, option, citation or
source record changed; the registry hash is unchanged.

**What changed** (`privacy-wizards-council/`, all in the design system's own disclosure
shape, DESIGN-SYSTEM §3 Disclosure / Authority row / Next determination, recorded there):

- Question: the aside keeps the help's first sentence; `Why this question?` opens the rest,
  so no sentence appears twice. Options carry their authored note as the 13px sub-line.
- Determination: `Read the rest of the reasoning` under the verdict block, or `Read the
  reasoning` (the whole text) where a clock line is the qualifier. The aside states
  "sources last checked <date>" from `verifiedAsOf`.
- Authority rail: each source is a disclosure — label, dotted status label (amber = automated
  check only), then the citation, `Open the official text ↗`, and the included text as plain
  paragraphs (`sourceTextPlain` in `council.js`). The dead source layer and its functions
  are gone.
- `What may change`: dated pending-law notes (`src/lib/data/motion.js`, four notes on the
  Digital Omnibus proposal for breach/EU, DPIA, cookies, RoPA, each citing the EDPB-EDPS
  Joint Opinion 2/2026). Annotations only; PWC-NEXT-007 in `docs/BEHAVIOR-DELTAS.md`.
- Finder: `Browse all` groups by category (`.group-label`); search matches synonyms
  (`src/lib/data/search.js`: SAR, GPC, 72 hours, sub-processor, deepfake...).
- `Next determination`: one chooser row under every outcome (`src/lib/data/related.js`);
  the row is now a component, `src/lib/WizardRow.svelte`, shared with the finder.
- Record: `Sources checked`, the answer notes, `## What may change`, and each source's
  included text as a blockquote.

**Verification.** Folder gate: 24 vitest (6 new), style audit, build, verify-artifact
(`dist/wizards.html` sha256 `3e8660f13efa…`, 1.09 MB). Restaged; root gate green end to end.
Census: every new run reuses a baseline tuple; the one retired control tuple (the old
authority link) was pruned with `--update` in this change. State proofs: `4f` now draws the
disclosures, the dated aside, the next-determination row and the dotted authority rows;
`3c` and `4e` are unchanged (question 2 has no option notes and a short help). Behaviour
rig `.local-working/pwc-wave0-verify.mjs` (gitignored): 40/40 at 1440 and 390 — synonym
search, grouped browse, option notes, both disclosures, the pending-law source link, the
check date, six authority rows opening to text, the next-determination hand-off closing
every disclosure, zero overflow, zero console errors. Shots reviewed at both widths.

**Inline citations (2026-09-14, Ben: "hover over each mention of an article… a small popup
card").** Every article, section, guidance, case and defined-term mention in the question,
help, verdict line, reasoning, actions and pending-law notes is now a `button.cite` that opens
a citation card in place: source label, formal citation, dotted review status, the cited
paragraph when the mention names one (`Art. 33(1)` opens paragraph 1; `controller` opens Art.
4(7)) or the whole text otherwise, `Show the whole text`, `Open the official text ↗`, and a ×.
Hover opens after 140ms and closes 220ms after the pointer leaves; click pins; focus opens;
Escape, the × or a click elsewhere closes and focus returns to the mention without reopening.
The card flips above the mention when the frame has no room below and never exceeds the block
width. Resolution lives in `privacy-wizards-council/src/lib/engine/mentions.js` with the
curated names and defined terms in `src/lib/data/mentions.js`, and it is conservative: the
regime family comes from the wizard (GDPR paths, AI Act paths), the UK setting from the node's
own citations, and a mention that does not map to exactly one registry source stays plain
text. Across all 1,024 text blocks 1,530 mentions resolve; the unresolved rest (GDPR Arts. 55,
56, 27; Annex I; WP242; Guidelines 05/2020…) have no registry source, which is the next
content job, not a resolver gap. Answer rows carry no citations (a button cannot hold a
button). DESIGN-SYSTEM §3 gains *Inline citation* and *Citation card*; the census baseline
gains the two 15px citation tuples (the only new ones the drawn states render). Verification:
36 vitest (12 new, including a sweep of every text block), full gate green, behaviour rig
now 60 checks at 1440 and 390 (hover, pin, keyboard, Escape, ×, frame fit, citations in the
actions and the reasoning), zero console errors. PWC-NEXT-008 in `BEHAVIOR-DELTAS.md`.

**Open.** (1) The four pending-law notes deserve Ben's read before deploy; drop any he
does not want. (2) The question card's right edge still stops short of the progress track
(nitpick 3); it matches the artboard, untouched. (3) The one console error seen live on
2026-09-13 (an inline style vs `style-src 'self'`) did not reproduce against the staged
shell; recheck on the live site after deploy. (4) Nothing is committed; the tuck word
commits, pushes, and Pages deploys from `main` (ARCHITECTURE.md). (5) ADVO-73's July prep:
the merged `advo-73-registry-prep.md` lived in a Temp scratchpad and is gone, but the run's
workflow journal survived and was snapshotted on 2026-09-14 to
`.local-working/advo-73-july-2026/` (gitignored, not backed up): per-regime drafts plus
trap-coverage and statutory-accuracy verdicts for Indiana, Kentucky, Rhode Island, Oregon and
the CCPA 2025 regulations, and the workflow script. The merged IN/KY/RI divergence rows and
the later RI fixes survive only in the ADVO-73 Linear comments. Re-verify everything against
primary text before use. (6) Before any new path: wizard content is still authored inside the
legacy `privacy-wizards-council/wizards.html` and extracted by `scripts/extract-legacy-data.mjs`,
which hardcodes the enabled-path allowlist, the manifest version and every source's
`automated-check-only` status; the unit tests pin the path and node counts. Moving the registry
into authored data files is the recommended first content job.

## 2026-09-11 - Redactorium: Vite replaces Create React App

The last tool on react-scripts 5 (behind craco) moved to Vite 7, which the rest of the Toolkit
already used. Ben's call after the CI review: CRA has no maintained release and most of the
tree's advisories lived inside it. Source changes are small -- `index.html` to the package root,
`App.js`/`index.js` to `.jsx`, a 30-line `vite.config.mjs` (base `./`, the `@/` alias, outDir
`build`, module-preload polyfill off for the CSP), and `eslint.config.mjs` keeping the React hooks
rules CRA used to enforce as `npm run lint`. craco, its plugin folder, the emergent.sh tarball and
the Yarn-only `resolutions` block (inert under npm; two pins named vulnerable versions) are gone.
react-router-dom 7.15.0 -> 7.18.3 and the js-yaml lockfile fix landed with it. Audit 26 moderate+
-> 1 (xlsx 0.18.5, which SheetJS no longer patches on npm); lockfile 1589 -> 557 packages.

Two gate checks had hard-coded the CRA layout rather than the contract: `checks.mjs` read
`static/js` and `static/css` by name (now walks the staged tree, same scope) and `design-gate.mjs`
ran its CSS `url(https://…)` scan case-insensitively over JavaScript, so react-router 7.18's
`new URL("http://localhost")` -- the dummy base for its open-redirect fix -- read as a stylesheet
load (now case-sensitive). Verification: the same Playwright flow against the old and new staged
builds, on the tool page and in the shell iframe, identical (22 detections, same labels, the
finished record, both downloads, no console/page/request errors); then the full gate green
including the three Redactorium canvas proofs and the census. Shipped through a pull request so
CI and the Cloudflare preview build ran before merge.

Still open in that tree: the `src/assets/fonts` 600/700 files are byte copies of the 400 files
(rendering unchanged, the bytes always were); xlsx stays on 0.18.5 until someone decides between
the SheetJS CDN tarball and a different library.

## 2026-09-06 - SafeList: the header shapes real exports use (ADVO-172, step 1)

Column detection had only ever met the two sample files. `core.js` gains `nameColumns(header)`
(first, last, full, company; exact names win over looser matches) and `app.js` uses it instead of its
own patterns, so the header logic is unit-tested. `test/core.test.mjs` covers a sales-engagement
people export with two email columns (the personal address is matched too), a marketing-automation
unsubscribe export whose flag columns never read as addresses, a quoted CRM report with opt-out flags,
and an API-style header without spaces. 23 tests green, folder check and repo gate green. Ben's real
header rows, when he has them, get added the same way.

## 2026-09-06 - the fox in the tab (0.4.2)

The shell declared no icon, so Chrome showed its globe. `public/favicon-32.png`, `favicon-64.png` and
`apple-touch-icon.png` are rendered from the site's own fox badge (the 1024px Ghost original, stepwise
canvas downscale in Chromium via `.local-working/make-favicons.mjs`) and the head declares them. Same
mark as advokatfrida.com's tab (Ben, 2026-09-06).

## 2026-09-04 (late) - the intro strip and the category hues (ADVO-177, ADVO-178)

**The strip.** The step-flow band from DESIGN-SYSTEM §3 is the first thing in every tool's first
state: SafeSeed (under the mode switch, generate/edit only), SafeList (its band moved from the foot
of the landing to the top), Redactorium (the `How it works` disclosure and its citations line are
gone; the band sits above the Single file / Batch switch, Ben's call; `Custom rules` keeps its toggle), Privacy Wizards (above
the finder). Numbers are `01 02 03` at 22px/700 in `--forest` in the body face; one 16/700 title
and one 14px `--soft` line per step; one row, about 110px. Copy approved by Ben on 2026-09-04
(the Wizards' first line lost its "Sixteen determinations"; Redactorium's first line was corrected
from a wrong formats list to what the step does).

**The hues.** `wizardIconColor` now answers by category (Incidents red, Data use amber, Governance
indigo, Rights and people teal, AI systems forest) and the chooser glyph carries it; the
determination header's large icon follows. DESIGN-SYSTEM §1 says colour means one thing: status,
tier, or category; never identity or chrome. Version 0.4.1.

**Also in this pass.** The Wizards style audit (its own gate, not the Toolkit one) had been red since the
0.3.1 button work on a raw `#fff`; `--on-forest` is the token now. SafeSeed's three dormant workflows
are lifted to the repository root as `safeseed-ci.yml` (path-filtered, the Action contract runs from
`./safeseed`), `safeseed-release.yml` (stable Releases tagged `safeseed-vX.Y.Z`, both hosted gates
required, OIDC trusted publishing from the protected `npm` environment) and a repository-wide
`codeql.yml`; SafeList, Redactorium and the Wizards get path-filtered CI of their own; the root README
says what runs when. On GitHub: the `npm` environment (Ben as required reviewer, tags `safeseed-v*`
only) and a tag ruleset for `safeseed-v*` exist since tonight. Ben's side before the release: enable
immutable releases on af-toolkit and point npm's trusted publisher for `safeseed` at
`advokat-frida/af-toolkit` + `safeseed-release.yml` + environment `npm` (ADVO-173).

## 2026-09-04 (night) - the Objection Oracle retires

**Retired (Ben).** The Objection Oracle leaves the Toolkit: `objection-oracle/` (source, tests,
build), the staged `public/tools/objection-oracle.html` and its licence, the rail item, Home card,
route and view, its three canvas states (3E/4H/4I) and its four viewport proofs. Every count that
said five says four; `scripts/checks.mjs` no longer asserts the Oracle artifact; the design gate
loses its one hex exception (the ball's shading) and the ball was the only sanctioned circle besides
the fox mark. The style baseline was regenerated without the Oracle's tuples. Version 0.4.0.

**The rail (Ben, same evening).** The sidebar and mobile nameplates read `ADVOKAT FRIDA` alone
(Anton 21 / 16; the `TOOLKIT` sub-line is gone) and link out to The Dispatch; the first rail item
is `AF Toolkit` behind Lucide `wrench` (was `Home` behind `house`). `Back to The Dispatch` stays
at the foot of the rail as the visible fallback, since a hovered link's status URL can cover it.
Ben pasted this ask into a second Claude session first; that session drafted the edits in this
checkout, then backed them out, and this session made them and committed them with the
retirement, gate green on the combined tree.
`scripts/checks.mjs` pins all three.

**Site side.** Ben removes the Ship It post and deletes the `objection-oracle` repo himself. The
website's tooling dropped its ship-it entries (tool layout, GitHub CTA, repoint ops, taxonomy,
preflight S12) in the same pass. The article embed contract in the previous entry is history: no
tool speaks `af-objection-oracle-resize` any more, and no article embeds a tool.

**Decide.** The group holds one tool, the Privacy Wizards Council. What fills the second slot is an
open product question (Linear).

## 2026-09-04 (evening) - public flip, archives, the rail's exit, the essay embed contract

**Public.** Ben flipped `advokat-frida/af-toolkit` public. Frida then set the description and
homepage (the old description called the repo private), turned on secret scanning with push
protection, Dependabot alerts and security fixes, private vulnerability reporting, and a ruleset
on `main` that blocks force-pushes and deletion without requiring pull requests (the tuck flow
pushes to `main` directly). `SECURITY.md` and `CLAUDE.md` describe the public, hosted state.

**Archives.** `privacy-wizards-council`, `objection-oracle`, `build-a-prompt` archived, their
frozen workspace folders removed after each remote was verified archived. Ben deleted
`tanjaminben/redactorium` himself; the workspace clone `advokat-frida/redactorium` is the only
copy of its 15-commit history and stays until he says otherwise. `advokat-frida/safeseed` waits:
its npm package and the `advokat-frida/safeseed@v0.4.0` Action reference resolve there until this
repo tags a release (the ADVO-162 remainder). SafeSeed's own metadata (package, README badge,
issues, advisories) already points here.

**The rail's exit (Ben).** `Back to The Dispatch`, Lucide `arrow-left`, pinned to the bottom of
the rail above a hairline; DESIGN-SYSTEM §3 Sidebar records it. The Home nameplate is
`AF Toolkit` over `The privacy practitioner's Swiss Army knife.`, and the tab reads `Home · AF Toolkit`
(Ben settled on it after two other names the same evening; `scripts/checks.mjs` pins both lines).

**Article embed contract.** The Ship It essay on advokatfrida.com embeds
`/tools/objection-oracle.html` in an iframe and sizes it from a
`{type:'af-objection-oracle-resize', height}` message, exactly as it sized the old inline copy.
The Oracle's embed build now posts that message when framed (ResizeObserver on the document);
the Toolkit shell ignores it. Only the Oracle speaks it, being the only tool an article embeds.

**Wizards.** The chooser row's arrow now follows the copy instead of sitting at the far edge of
the row (Ben: too much white space between).

**Site pass (website repo, ADVO-166/167/168).** Front-page Toolkit hero, rail removed; SafeSeed
and Wizards posts repointed at the Toolkit with two buttons each; forwarders at the old asset
URLs; the SafeSeed demo synced from `safeseed/demo` here. Details in the website repo's HANDOFF.

**Next.** ADVO-177 intro strip on every tool (copy needs Ben's sign-off), ADVO-178 Wizards
category hues (Ben's yes needed), ADVO-162 workflows + first tagged release, ADVO-169 nav (Ben).

## 2026-09-04 - desktop scale, the rendered-style census, one type rhythm (0.3.1)

**Ben's three asks, in order.** The Toolkit read small with dead space on a desktop monitor; then a
thorough UI/UX consistency review of the flagship, set as a regression baseline so every new tool
gets the same scrutiny; then "standardize the principles" (fonts, sizes, line-height) while layouts
may differ. All three shipped in this commit. Linear: ADVO-176.

**Desktop scale.** Type roles are fixed px by design, so a larger root font moved nothing. The
composition scales instead: `zoom` 1.08 / 1.18 / 1.30 on the shell chrome and each tool's embedded
root, keyed to the *frame* width inside the tools (1252 / 1528 / 1900) so they land on the same
windows as the shell's 1500 / 1800 / 2200. The rail widens a few px *before* each zoom step, or the
frame would narrow at the exact width the tool's own breakpoint fires and the two could never agree.
Bounded previews grow with the window (`max(440px, 100dvh - 320px)`). Verified at 13 widths, zero
shell/tool mismatch. Nothing changes below 1500px.

**The census.** `scripts/style-census.mjs` drives the 19 canvas states (exported from
`state-proofs.mjs`, one list) and records what the browser painted: every text run's type tuple,
every control's shape, every color, radius and shadow, for the shell and the tool frame. It found
what the static gate cannot: SafeSeed's remove button in Arial, a hairline mixed from a different
ink on 333 borders in three tools, a synthesized 800 weight, two whites on primaries, two mono
stacks (macOS would have shown different fonts per tool), and a 16px paper strip under
Redactorium's header from a collapsed margin (`display: flow-root` fixed it). All fixed at the
source. `npm run qa:census` now ends the gate and CI; it fails on any tuple outside
`docs/design/style-baseline.json`, which changes only via `--update` in a reviewed change.
`design-gate.mjs` also locks `rgb()/rgba()` to the token bases now. State proofs park the pointer
before each shot so hover never poses as a drawn state. Review record:
`docs/design/reviews/2026-09-04-consistency.md`.

**One rhythm.** Six line-height tokens (`--lh-display 1.1 / heading 1.2 / body 1.55 / row 1.5 /
helper 1.45 / label 1.4`) declared at each tool's source and referenced by every role rule;
DESIGN-SYSTEM §2 carries the table. Controls consolidated to §3: one text-action padding, one
input and select shape, the named 40px **row control** (the only sanctioned height under 44), the
mode toggle at 13, Redactorium's task heading at 19 (its embedded `h2` rule had outranked the
class). Rendered type roles 77 → 48; control variants 35 → 32; families 6 → 4; non-token colors
1 → 0.

**Open.** E from the review: SafeList's checked-list preview needs a sideways-scroll cue. Skip
links still come in three styles (keyboard-only; consolidate with the next control pass). The
Redactorium toast title is a synthesized 500 from the toaster's own CSS.

**Deploy.** A push to `main` deploys via Workers Builds; live check reads the new artifact hashes
from `tool-sources.json` at the edge.

## 2026-09-03 (night) - renamed to af-toolkit, CI made green, documentation pass

**Renamed.** `advokat-frida/the-toolkit` is now `advokat-frida/af-toolkit` (Ben's call; the old
name redirects on GitHub). Local folder, git remote, safe.directory exception, workspace CLAUDE.md
and README, hygiene.mjs's recognised list, launch.json, the /advokat skill, and the vault canon all
repointed. The Cloudflare **Worker** keeps the name `the-toolkit` on purpose: renaming it would
rebind the custom domain and the git connection for a string no visitor sees. `wrangler.jsonc`
says so where someone would otherwise "fix" it.

**CI had never once passed.** Every push since the repository was created was red and nobody was
watching. Three separate causes, all now fixed:

1. *Line endings.* `.gitattributes` stores LF; the Windows working copy staged CRLF, so
   `tool-sources.json` recorded hashes that matched on exactly one machine. `objection-oracle.html`
   hashed `b7ad144f` locally and `29bf0c96` in git and at the edge. `build-tools.mjs` now
   normalizes text to LF before writing or hashing, in both the single-file and tree paths, and
   `checks.mjs` asserts no staged text file carries a CR.
2. *A gitignored source artifact.* The manifest pointed at `redactorium/frontend/build`, which
   never exists in a fresh checkout, so "source artifact exists" could not pass. It is now declared
   a generated intermediate; the staged tree stays hash-verified.
3. *npm audit.* Called a retired registry endpoint, returned 400 "Invalid package tree" (the
   lockfile still said `the-toolkit` 0.1.1 against package.json's `af-toolkit` 0.3.0), then timed
   the job out on the retry. Lockfile regenerated; audit replaced by Dependabot plus an offline
   assertion that the shell ships zero runtime dependencies.

**Licensing.** MIT at the root and in `redactorium/` (the one tool shipping unlicensed).
`TRADEMARKS.md` draws the line MIT cannot. `checks.mjs` asserts every tool records MIT.

**GitHub scaffolding.** Dependabot for npm and the SHA-pinned actions (it opened four PRs within
minutes), a pull request template pointing at the review gate, issue templates for bugs and tool
ideas. CI now runs the rendered half too: Chromium, four viewports, every drawn state, images
uploaded as an artifact.

**Documentation.** Every folder has a README. New: `CONTRIBUTING.md`, `docs/ARCHITECTURE.md`,
`docs/VERIFYING.md`. Redactorium's README replaced a 30-byte file reading "Here are your
Instructions".

**Two claims corrected rather than polished.** "No runtime dependencies at all" was false - the
shell ships zero but Redactorium bundles React and the Wizards bundle Svelte; the honest claim is
that nothing is fetched from anyone else's domain at runtime. And the CI step that byte-compared
committed proofs was removed: Chromium hints text differently on Linux than on Windows, so they
cannot match across platforms and the check failed the build while proving nothing. Every document
that repeated either claim was corrected.

**Open, filed as ADVO-175:** `redactorium/backend/` is a dead FastAPI + MongoDB template, plus
`memory/`, `test_reports/` and `test_result.md` from the prototype generator. In a product whose
pitch is "there is no backend", that is the worst thing a sceptic could find. Not deleted, because
deleting tracked source is Ben's call; named plainly in the Redactorium README meanwhile.

## CURRENT BATON — Toolkit rollout (spec'd 2026-09-03, green light pending)

The rollout is spec'd in Linear as the ADVO project **Toolkit rollout: toolkit.advokatfrida.com**
(https://linear.app/ducket/project/toolkit-rollout-toolkitadvokatfridacom-4c49feb0c8fa). Fifteen
issues in four milestones; each names its lane (Opus / Fable / Ben), files, and acceptance.

**Next session (Opus) starts here, in order, on Ben's green light:** ADVO-160 (MIT license + brand
notice) → ADVO-161 (full-history secret scan) → ADVO-162 (root CI with the rendered gate, per-tool
workflows) → ADVO-163 (unlist SafeList for 0.3) → ADVO-164 (Pages, Route A git-connected: Ben connects the repo in the
Cloudflare dashboard and adds the custom domain; Opus adds `_headers` and verifies) → ADVO-165 (public flip, Ben's word). Then Phase 1 on the website repo: ADVO-166
(front-page hero, **Fable**), ADVO-167 (repoint the tool posts), ADVO-168 (forwarding stubs),
ADVO-169 (nav, Ben). Phase 2: ADVO-170 (launch article, **Fable**), ADVO-171 (canon). Phase 3:
ADVO-172 (SafeList 0.4), ADVO-173 (SafeSeed 0.4.0 from the monorepo), ADVO-174 (Esri fork after Pete).

Standing: every change passes the gate and the review gate; commit and push only on Ben's tuck
word; the public flip, DNS, Pages project, publishing and sending are Ben's separate authorizations.

**Live as of 2026-09-03, fixed.** Ben created a Worker named `af-toolkit` (not a Pages project),
onboarded `toolkit.advokatfrida.com`, and manually deployed three times; one upload took
`privacy-wizards-council/` as the asset directory, so the subdomain served that folder's unbuilt
Vite source. Corrected diagnosis: the Worker is NOT git-connected (Settings > Build shows
`Git repository: [Connect]`), so there was never a Workers Builds root directory to blame.

Fixed by adding `wrangler.jsonc` at the repo root (static-assets-only Worker; the Worker resource keeps the name
`the-toolkit` because renaming it would rebind the domain and the git link for no visible gain,
`assets.directory: ./public/`, `not_found_handling: "none"`) plus `public/_headers`, then running
`npx wrangler deploy` from the repo root. Version `ebeffbfb`. Verified against the live domain by
content: old PWC source 404s; `toolkit.css`, `toolkit.js`, `tool-sources.json`, the fox mark and
every `tools/*.html` byte-identical to the repo; font magic bytes `774f4632`; `_headers` applied;
Home, SafeSeed, Redactorium and Privacy Wizards all render in Chrome at the live URL.

Committed as `a171e44` (tuck, 2026-09-03). Ben connected the repo (Settings > Build: root `/`,
build command cleared by Frida in his browser, deploy `npx wrangler deploy`, branch `main`, previews
on). The push produced version `8d0ee754` 29 seconds later with no human step; live bytes equal the
git blobs. ADVO-164 Done. New defect on ADVO-162: the provenance manifest hashes are computed on
CRLF working-copy bytes and will not match a Linux checkout or the edge (fix: normalize to LF in
`build-tools.mjs`, restage).

Open, in ADVO-164's comments: the Worker is still direct-upload, so pushes to main do NOT redeploy
(Ben must hit Connect in Settings > Build; a Worker can be attached to a repo after the fact, unlike
Pages); Cloudflare injects a hidden `cdn-cgi/content` anchor into every HTML response, which is
inert but modifies pages the Toolkit claims ship as built and breaks byte-equality checks; and the
deploy published SafeList, since main still carries five tools (ADVO-163 unlists it).


## 2026-09-02 - SafeList: the fifth tool, built and wired into the shell

Ben picked the next flagship: a send list checked against the marketing suppression list, for
sales and marketing people who today do it with a VLOOKUP. Proposal: the Google Doc "Toolkit
proposal: SafeList" in Ben's Drive. Named SafeList by Ben (Strikethrough, List Scrubber 2000 and
List-erine retired); "safe" is defined once and never rendered as a status.

Built today in `safelist/` (its own folder, Oracle-shaped: `src/core.js` engine + `src/app.js`
page + `chrome/` byte-exact family chrome + `tools/build.mjs` → `dist/safelist.html` and
`dist/safelist-embed.html`):

- Two drop zones (send list, suppression list; file or paste), email column found by content and
  confirmed in one line, list-origin dropdown, matching rules behind a disclosure, `Check one
  address`, a three-step band.
- Freshness gate: a suppression file older than 24 hours by its file date blocks the check, no
  override. Ben's call (2026-09-02): the seal concept from the proposal is dropped; lists are
  one-offs obtained through marketing's request process, and the tool refuses yesterday's export.
- Review table: one row per match (address, domain rule, or duplicate) with `Keep contact` /
  `Remove contact`; Keep asks for a reason; `Remove the rest`; Finish stays aria-disabled and
  focuses the first undecided row.
- Done: every kept row in a 440px preview, then the record block (checked against, matched on,
  rules, origin, file fingerprints, kept contacts with reasons, removed count) with the
  `hash · timestamp` line and Download checked list / Download record / Start another list.
- Record: kept contacts named, removed contacts as SHA-256 fingerprints only, so the record is
  never a second copy of the suppression list.
- Samples: `samples/cadence-audience.csv` (40 rows, Sales Engagement shape),
  `samples/suppression-list.csv` (62 addresses + 1 domain rule, Marketing Cloud shape), and the
  generated `cadence-audience.checked.csv` (31 rows) + `safelist-record.json` / `.txt`. The nine
  matches cover exact, case, whitespace, plus-tag, display-name, and domain-rule variants, plus
  one duplicate row.
- Verified: 17/17 engine tests (`node --test`), build, `tools/run-sample.mjs`, and
  `harness/shots.mjs` (Playwright walk of every state → `shots/`, 0 network violations).

Wired in after Ben walked the mock ("this looks good"): stage entry in `scripts/build-tools.mjs`
(`safelist/dist/safelist-embed.html` → `public/tools/safelist.html`, MIT copied), route in
`toolkit.js`, nav item and Home card with the Lucide `mail-x` glyph, a `Manage data / SafeList`
breadcrumb view, state proofs 5A–5D, static checks at 125, `qa:visual` anchors, the artifact radius
scope, the embedded-layout audit selectors, version 0.3.0 and a changelog entry. Ben's ordering
rule (2026-09-02): the rail and Home are in working order, not alphabetical — Manage data reads
SafeSeed, SafeList, Redactorium — and `checks.mjs` now enforces that order. The boundary sentence
beside the button reads "This check removes…" rather than naming the tool, since the shell owns
names; its final wording stays Ben's call. Full gate green: design gate 16 files, 125/125 static,
rendered at four viewports, every state including 5A–5D.

Ben's first look inside the shell (2026-09-02): the checked-list preview's `FIRST NAME` header
wrapped to two lines, and he asked why the email column wore a different face from the rest and
from SafeSeed's table. Answer recorded in DESIGN-SYSTEM.md's record-block rule: a **file preview
is rendered as data** (mono throughout, header row included, nothing wraps) because the header row
is part of the file, with SafeSeed's generated preview as the reference; an **interface table**
(Redactorium's findings, SafeList's review) keeps Archivo caps headers, body text, and mono on the
identifier column only. SafeList's preview now follows SafeSeed's grammar exactly; the review table
is unchanged. Gate re-run green.

Shipped: `39398ad` on `origin/main` (tuck, 2026-09-02). Review: Ben walked the mock and the wired
version in this session; Frida's review is the gate plus the judgment checklist against the proofs.

## 2026-09-01 - Canvas fidelity pass (every artboard, every state)

Ben's mid-tuck review said the first push diverged from the design canvas in more places than the
three it named. This pass rendered all twenty artboards of *Toolkit - Redesign* with the real
webfonts, drove the running build into each of the seventeen drawn states at the artboard
geometry (1360x800), and fixed every visible difference at the source.

What changed, per tool:

- Redactorium: mode toggle reads `Single file | Batch` without icons and disappears once a file
  is loaded; drop zone at the drawn depth with `Custom rules` and `How it works` as one link row
  beneath it; findings table cut to the five drawn columns (examples, reviewer notes, weaker
  matches, and the presets bar left the row - presets now sit inside the advanced disclosure
  under the apply row); treatments named `Keep / Hash / Redact / Generalize / Synthetic-swap`;
  record state is the shared record block (Rows / Transformed / Detectors / Signed, one
  `hash · timestamp` line, `Download clean file` / `Download record` / `Start another file`)
  with no preview table, no PDF/ZIP buttons, no `Edit treatments`.
- SafeSeed: column rows are 45px data rows (type as text, dotted tier label, x), rows and seed
  sit inline beside `Generate`, the explainer line is gone; the preview shows four rows under a
  plain mono header with one-line aside and no hints; the mode toggle hides on the result; the
  verify result reads `verified against`, shows hashes as 12…6 with the full value on hover, and a
  `Generated` timestamp (receipts now carry `generatedAt`); the verify button is `Verify`.
- Privacy Wizards: 48px search box; question flow is select-then-`Next` with `Back` as a text
  action and a `Question n of N` progress bar (N = longest run still ahead); selected facts,
  sources-so-far, and why-this-question left the question view; determinations use a forest
  verdict block whose sub-line is the clock or the summary lead, keep the two-column
  actions/authority layout, and end on `Download determination` + `Change an answer`; the
  standalone-only topline is hidden in embed.
- Build-A-Prompt: parts are one-line rows that open independently (number, title, summary,
  arrow); part 01 carries eyebrow labels, parts 02-05 show bare controls; Evidence is a real
  field (the pasted material becomes the prompt's Subject, the request stays the request);
  Guardrails is an inline checklist (the advanced Safety kit was redundant and went); the aside
  uses the canvas copy; `Save or share setup` / `Start over` text actions are gone; focus ring
  is forest.
- Objection Oracle: the ball keeps its 8 through the ruling (the answer window is gone), the
  ruling shows `Next action` and `Owner` (outcomes gained an owner line, the receipt an `OWNER:`
  line), `See the full ruling` is gone (the receipt text stays for copy and the harness), the
  ask button stays primary and focuses the first unanswered question when pressed early, and
  the stage sits at the drawn inset.
- Shell: choosing the rail item of the tool already on screen posts `{toolkit: "reset"}`; all
  every tool returns to its first state (this replaces the per-tool `Start over` lines the
  canvas does not draw).

Cut to match the canvas (say the word and any of these gets a designed home first): reviewer
notes and example popovers on findings rows; PDF record and evidence ZIP downloads; the
transformed-preview table; SafeSeed's twelve-row preview; the Wizards' selected-facts summary,
sources panel on questions, `Copy outcome`, and `Run this path again`; Build-A-Prompt's
`Save or share setup` (still reachable under Advanced setup) and the advanced Safety kit tab.

Standing law updated: `docs/design/DESIGN-SYSTEM.md` gained the record block, findings table,
part row, checklist, the explicit wizard selection model, the shell reset message, and the rule
that the drawn state is the law; `REVIEW-GATE.md` gained `qa:states` (now the last gate step)
and the state-fidelity checkbox. `scripts/state-proofs.mjs` writes `proofs/states/`.

Ben's first look at his own 1,680px-wide pane added four fixes: every embedded stage now caps at
the canvas pane (1130px, centered) instead of stretching, which also lines the Redactorium toggle
up with the drop card and gives the Oracle button its drawn width; the Oracle's deliberating
state sits beside the ball instead of centered in the far column; SafeSeed's preview shows every
generated row in a 440px scroll region with a sticky header (the four-row sample read as a
lightweight tool - it never was, the CSV always carried every row). Ben then cut SafeSeed's
Rows / Seed / Columns / Signed band from the result as adding nothing the heading, table, and
receipt do not already say; the design system's record block now allows a stat band only where
it carries numbers the surface does not already state. He also called the Oracle's full-column
`Ask the oracle` button (drawn that way on artboard 3E) far too wide; primaries are now intrinsic
width everywhere, and the design system says so.

Later the same evening Ben dropped Build-A-Prompt from the Toolkit ("i dont find it useful"): its
nav entry, Home card, view, staged artifact, license copy, proofs, pipeline entry, checks, and the
`build-a-prompt/` source folder are gone from this repository (git history keeps it; the
standalone `advokat-frida/build-a-prompt` repo and the frozen workspace folder remain until Ben
archives them; the live advokatfrida.com tool page is untouched and is his separate call). The
`Work with AI` group went with it - the Toolkit is now four tools in two groups.

Ben's second look (his pane, annotated screenshots) drove one more round, all at the source:

- Privacy Wizards: every authority now links to its official text - 44 sources gained URLs
  (EUR-Lex consolidated GDPR by `#art_N`, CJEU judgments by CELEX, Cal. Civ. Code sections,
  NY GBL, ILGA, uscode.house.gov, EDPB and WP29 landing pages or PDFs, the Ninth Circuit PDF,
  LII for TransUnion); only the CNIL Google/Facebook cookie decision is still unlinked (no
  stable URL found). The aside and the actions now sit under "What you must do" instead of
  under the two-column grid, so the authority column no longer opens a gap; option cards show
  labels only (the per-option advice line gave the determination away).
- Redactorium: the batch header is the title alone (eyebrow and explainer gone); HMAC signing
  and the `Verify a signed log` page are removed entirely (route, page, libs, shell header
  action, batch key row, advanced field) - the record is the SHA-256 content hash and the batch
  archive holds a clean file plus a JSON record per input; `How it works` is the kit's numbered
  step-flow band; custom-rule placeholders use a US-style Employee ID example instead of the
  Norwegian one; `Apply treatments` keeps its primary look and points at the first treatment
  when nothing is selected.
- SafeSeed: the tier legend is always open as `SafeSeed fields`; the verify zones carry Lucide
  `file-spreadsheet` and `receipt` glyphs; `Verify` and `Generate` keep the primary look and
  move focus to what is missing.
- Objection Oracle: the ruling reads as a record - verdict, a "what it means" paragraph, `Next
  action` / `Owner` / `Close it out` rows with eyebrow labels, and a "based on your answers"
  recap; the copied receipt gained `WHAT IT MEANS` and `CLOSE IT OUT` lines.
- Design system: a primary never greys out (aria-disabled + focus what is missing); paired drop
  zones carry a naming glyph; the step-flow band is a component.

Ben closed two loops after the tuck: the standalone Build-A-Prompt repo and its live page stay as
they are. The CNIL source now links to the page he chose (the 1 September 2025 decision, EUR 325M
for Gmail ads and account-creation cookies); the entry's label and text still describe the 2022
EUR 150M cookie-banner decision, flagged for his call.

The state-proof driver freezes the page clock (Playwright `page.clock.setFixedTime`), so the
timestamped record and verify-result proofs are byte-identical across runs and a gate run no longer
leaves the tree dirty.

Verified: every tool's own gate (safeseed chrome contract, redactorium CI build, wizards 17 tests
+ style audit + artifact contract, build-a-prompt full check, oracle 33 tests + browser harness);
full repo gate green; every drawn state screenshotted at 1360x800 and compared against the
artboard renders by eye.

## 2026-08-31 - Consistency pass after Ben's review (follow-up to the consolidation)

Ben flagged three real defects in the pushed build: reintroduced standalone-page fluff ("SafeSeed:
In-Browser App" + explanatory ledes), inconsistent and outdated per-tool chrome (mixed
headers/footers; Members Den and Playbooks no longer exist; Shop is now The Mercantile), and
Build-A-Prompt's redundant Suggested chips, none of which are in the design canvas.

Fixed at the source, all five tools:

- One canonical standalone chrome everywhere, matching the live advokatfrida.com nav: Toolkit ·
  Field Guides · Frida's Desk · The Mercantile · About + Subscribe chip; the canonical colophon.
  Redactorium's bespoke masthead/footer replaced with the same bar; Oracle gained the chip and the
  Anton nameplate; the SafeSeed Vite entry skeleton (the pre-hydration fallback that showed the old
  chrome) was updated too.
- Every standalone intro stripped to nameplate + changelog: no eyebrows, no promise/lede lines, no
  dek. "SafeSeed: In-Browser App" is now just "SafeSeed" (title tag included).
- Build-A-Prompt: Suggested chips and the suggested-setup note removed; part rows are plain, as
  drawn.
- Chrome contracts updated to the current truth (safeseed verify-chrome, bap + pwc verify-artifact:
  Members Den/Playbooks banned, The Mercantile required, lede checks retired).

Verified: all five standalone pages screenshotted at 1440 with the identical bar/colophon and no
stale labels; toolkit tabs re-shot chrome-free; full repo gate green (design gate, static 123/123,
rendered at four viewports); tool gates green (safeseed chrome contract, bap 19, pwc 17, oracle 33).

## 2026-08-31 - Consolidation + the approved redesign

Ben's call: one repository. The five tool sources moved in as top-level folders (safeseed,
redactorium, privacy-wizards-council, build-a-prompt, objection-oracle); the standalone repos are
superseded and await Ben's separate archive decision. The old cross-repo sync
(`scripts/sync-tools.mjs`) was replaced by `scripts/build-tools.mjs`, which stages each folder's
built artifact with schemaVersion-3 provenance.

The approved Claude Design package *Toolkit - Redesign* was implemented in full:

- Shell: sidebar brand cap (fox mark), grouped navigation (Manage data / Decide / Work with AI),
  grouped Home cards (numbers, accent hues, card buttons, and the AF header tile retired), 56px
  breadcrumb tool headers, changelog as one bottom line.
- Tools restyled at the source, each with a native embed mode (`?embed=1`) replacing the CSS
  adapters: SafeSeed staged generate flow with preset pills + dotted assurance labels + stat band +
  receipt language; Build-A-Prompt lands directly in the composer; Privacy Wizards chooser rows +
  one-question flow + verdict-block determinations (and it posts its active determination into the
  shell breadcrumb); Objection Oracle five-questions-in-one-list + verdict ruling (new embed build
  target restored); Redactorium centered drop zone, 4a findings table, 4b record state.
- The design package became standing law: docs/design/DESIGN-SYSTEM.md + REVIEW-GATE.md, enforced
  mechanically by scripts/design-gate.mjs inside `npm run gate`.

Verified: design gate clean; static QA 123/123; rendered QA green at all four viewports with fresh
proofs/; tool gates green (safeseed 127 lib tests + chrome verification, bap 19 + audits, pwc 17 +
audits, oracle 33 + full browser harness). Working-tree state reviewed but NOT committed - the tuck
gate is Ben's.

Known follow-ups: redactorium/frontend has no package-lock.json (node_modules copied verbatim from
the pre-consolidation install; generate a lockfile deliberately); the objection-oracle folder
carried in the uncommitted content-refinement WIP (question wording, trimmed response banks,
RUBRIC_VERSION) from its old working tree - kept intentionally; SafeSeed UI now says "receipt"
(downloads `.receipt.json`) while the library/SPEC keep "run record" naming; the superseded GitHub
repos still exist until Ben archives them.

## 2026-08-27 - Private repository graduation

The reviewed Toolkit candidate graduated from `studio/active` into the dedicated `af-toolkit`
integration-shell repository. The shell owns Home, navigation, visual adapters, local serving,
provenance, and QA. The five integrated tools remain source-owned in their individual repositories.

The current release boundary is private source control only. No website sync, Ghost change, theme
deployment, public release, DNS, analytics, or package publication is part of this checkpoint.

Next change: update a tool in its source repository, review and commit that source build, run the
explicit Toolkit sync, then repeat the full static, rendered, and literal visual gate.
