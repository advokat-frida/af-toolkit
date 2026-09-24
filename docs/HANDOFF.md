# HANDOFF

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
