# HANDOFF

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
