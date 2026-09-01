# HANDOFF

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

The reviewed Toolkit candidate graduated from `studio/active` into the dedicated `the-toolkit`
integration-shell repository. The shell owns Home, navigation, visual adapters, local serving,
provenance, and QA. The five integrated tools remain source-owned in their individual repositories.

The current release boundary is private source control only. No website sync, Ghost change, theme
deployment, public release, DNS, analytics, or package publication is part of this checkpoint.

Next change: update a tool in its source repository, review and commit that source build, run the
explicit Toolkit sync, then repeat the full static, rendered, and literal visual gate.
