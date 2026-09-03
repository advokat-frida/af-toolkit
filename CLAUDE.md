# Advokat Frida Toolkit repository

This is the **one repository** for the Advokat Frida Toolkit: the shell application and every
tool's source, consolidated 2026-08-31. The former standalone repos (safeseed,
privacy-wizards-council, objection-oracle, redactorium) are superseded — each tool
now lives here as its own top-level folder and is developed here.

## Layout

- `public/` — the shell (index.html, toolkit.css, toolkit.js) plus **staged, generated** artifacts:
  `public/tools/`, `public/licenses/`, `public/tool-sources.json`. Never hand-edit the generated
  paths. `public/fonts/` and `public/assets/` are committed shell assets.
- `safeseed/`, `safelist/`, `redactorium/`, `privacy-wizards-council/`, `objection-oracle/`
  — one folder per tool: its full source, tests, docs, and build. Each folder keeps its own gate
  (`check`/`qa`/harness) and its own CLAUDE/AGENTS notes where it has them.
- `scripts/` — shell QA + the staging pipeline. `scripts/build-tools.mjs` stages each tool's built
  artifact into `public/tools/` and writes the provenance manifest (`--build` runs each tool's
  build first).
- `docs/design/` — **the design package**: `DESIGN-SYSTEM.md` (standing principles) and
  `REVIEW-GATE.md` (the review gate). These govern every surface; `docs/TOOLKIT-CANON.md` is
  historical and points here.

Build-A-Prompt was dropped from the Toolkit on 2026-09-01 (Ben: not useful); its standalone repo
is a separate archive decision.

## Working rules

- Load the parent Advokat Frida `advokat` skill before AF work. Product decisions:
  `docs/TOOLKIT-BRIEF.md`. Design: `docs/design/DESIGN-SYSTEM.md`.
- Change a tool in its folder, run that folder's own gate, then `npm run build:tools` (or
  `build:tools:full`) to restage, then the repo gate below. Staging is deliberate — editing a tool
  folder never silently changes `public/tools/`.
- A new tool enters only through `docs/design/REVIEW-GATE.md` §Adding a new tool.

## Gate

Before commit or push: `npm run gate` (design-gate → typecheck → tests → static QA → rendered QA →
state proofs), then inspect the regenerated `proofs/` screenshots at literal size and compare
`proofs/states/` against the canvas artboards. A failed hash, test, gate rule,
or manual visual state blocks the release.

## Release boundary

Private source control only. A commit or push here does not authorize a public repository, website
or Ghost change, theme deployment, publication, DNS, analytics, announcement, or package release.
Archiving the superseded GitHub repos is Ben's call, made separately.
