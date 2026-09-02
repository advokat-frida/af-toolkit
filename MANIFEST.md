# Manifest

Status: consolidated single-repository build, redesigned to the approved design package
(2026-08-31). Private source control only.

## Product files

- `public/index.html` — the shell: grouped sidebar with the fox brand cap, Home, five breadcrumb
  tool views.
- `public/toolkit.css` — the design-system stylesheet (tokens in `:root`).
- `public/toolkit.js` — routing, persistent tool frames, focus management, mobile chooser, and the
  origin-checked breadcrumb-context listener.
- `server.mjs` — loopback-only static server.
- `assets/frida-fox-forest.png` — brand-mark master (served copy at
  `public/assets/frida-fox-forest.png`).

## Tool sources

One top-level folder per tool: `redactorium/`, `safeseed/`, `privacy-wizards-council/`,
`objection-oracle/`. Each carries its own build and gate.

## Generated files

- `public/tools/` — staged tool artifacts.
- `public/licenses/` — copied license texts.
- `public/tool-sources.json` — schemaVersion 3 provenance: source folder, artifact, hashes,
  licenses, font hashes.

Regenerate with `npm.cmd run build:tools` (or `build:tools:full`). Do not hand-edit.

## Verification (this build)

- Design gate: palette, font, copy, radius, and external-request scans pass over `public/`.
- Static QA: 123/123 checks pass — shell structure, redesign contract (brand cap, groups,
  breadcrumbs, retired chrome), provenance hashes, embed wiring, font presence, Redactorium bundle
  hygiene.
- Rendered QA: passes at 1440×1000, 1034×917, 390×844, and 320×700 — five cards and three groups on
  Home, 230px rail, 56px tool headers, first useful control visible on open, no document or
  embedded horizontal scroll, skip-link first, focus lands on the active tool heading, mobile
  chooser traps focus and closes on Escape. Fresh screenshots in `proofs/`.
- Tool gates: safeseed lib tests 127/127 + demo chrome verification; privacy-wizards-council tests 17/17 + style audit + artifact
  verification; objection-oracle tests 33/33 + full browser harness (desktop, mobile,
  reduced-motion) including the network kill-switch.
- Manual visual review: the redesign states (Home, five tool landings, SafeSeed edit/result/verify,
  Privacy Wizards finder/question/determination, Oracle
  landing/questions/ruling, Redactorium drop/findings/record) were each screenshotted at literal
  size and compared against the approved design canvas.

## External-state boundary

Authorized target: the private `advokat-frida/the-toolkit` repository. No public release, website
sync, Ghost change, theme deployment, publication, DNS, analytics, or announcement is included.
