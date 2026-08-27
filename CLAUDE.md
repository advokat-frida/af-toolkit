# Advokat Frida Toolkit repository

This repository is one integration-shell application. It does not replace or absorb the source
repositories for Redactorium, SafeSeed, Privacy Wizards Council, Build-A-Prompt, or Objection Oracle.

## Ownership

- `public/index.html`, `public/toolkit.css`, `public/toolkit.js`, `server.mjs`, integration adapters,
  and Toolkit-specific tests are owned here.
- `public/tools/`, `public/fonts/`, `public/licenses/`, and `public/tool-sources.json` are generated,
  tracked distribution artifacts. Never hand-edit them.
- Functional changes to a tool happen in its authoritative repository, pass that repository's gate,
  and then enter the Toolkit through `npm run sync` with reviewed hashes and provenance.
- Do not add source trees, Git histories, or submodules for the integrated tools.

## Canon

Load the parent Advokat Frida `advokat` skill before AF work. The product decisions are in
`docs/TOOLKIT-BRIEF.md`; the visual system is in `docs/TOOLKIT-CANON.md`; the canonical style-bible
receipt captured for this release is in `docs/style-bible-receipts/advokat-frida-toolkit.json`.

## Gate

Before commit or push, run `npm run typecheck`, `npm test`, `npm run build:web`, and
`npm run qa:visual`. Inspect the exact generated screenshots at literal size. A failed source hash,
test, rendered check, security check, or manual visual state blocks the release.

## Release boundary

The current repository is private source control only. A commit or push here does not authorize a
public repository, website or Ghost change, theme deployment, publication, DNS, analytics,
announcement, package release, or change to an upstream tool repository.
