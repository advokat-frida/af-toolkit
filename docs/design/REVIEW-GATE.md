# The Toolkit review gate

Every change to a Toolkit surface — and every tool that wants in — passes this gate before it is
committed. The gate has a mechanical half (scripts) and a judgment half (this checklist). Both
halves block; neither substitutes for the other.

## Mechanical (must exit 0)

```
npm run gate
```

which runs, in order:

1. `design-gate` (`scripts/design-gate.mjs`) — palette lock, font lock, banned-phrase scan,
   radius audit, external-request scan across `public/` shell files and staged tool artifacts.
2. `typecheck` — syntax check over shell scripts.
3. `test` — shell unit tests.
4. `build:web` (`static-qa`) — structural checks over `public/`.
5. `qa:visual` — rendered screenshots at 1440×1000, 1034×917, 390×844, 320×700.

A tool's own repository-folder gate (its `check`/`qa` script) runs before its artifact is staged.

## Judgment — layout and design

Review the actual rendered screens at literal size, every state, before signing off:

- [ ] Tokens: no color outside `DESIGN-SYSTEM.md` §1; status hues used semantically only.
- [ ] Type: every text node maps to a §2 role. No new sizes, no synthesized weights, Anton only
      on nameplates, mono only on generated data.
- [ ] Components: buttons, toggles, tables, stat bands, verdict blocks, asides, wizard steps,
      chooser rows match §3 exactly — including paired-button sizing and the 44px floor.
- [ ] Shell contract: the tool renders chrome-free inside the shell; the 56px breadcrumb header
      names it; it does not repeat its own name, tagline, or a second application card around
      its whole workflow.
- [ ] Alignment: repeated rows share one optical size; nothing stranded (a text column's right
      edge does not float in space beside full-width siblings); panels stretch to equal height
      where they sit side by side; nothing occludes what it labels.
- [ ] Density: the first useful control is visible on open at 1440×1000; no dead half-screens;
      no promotional spacing.
- [ ] States: empty, loading, error, longest-content, and done states all reviewed — not just
      the happy path. Fallbacks get the same scrutiny.
- [ ] Responsive: 1440, 1034, 390, 320 — no clipping, no horizontal document scroll, no control
      hidden behind fixed chrome, no one-word final line in key copy.
- [ ] Keyboard: skip link works, focus visible, focus lands on the active view after switching,
      Escape closes the mobile chooser and focus returns.

## Judgment — copy

- [ ] Zero fluff: every line either orients or advances the task (§5).
- [ ] Zero redundancy: no fact or caveat stated twice on one surface; no per-card repeated
      disclaimers.
- [ ] Zero explanatory nonsense: nothing restates what the interface already shows.
- [ ] Buttons say the verb. No `Open tool` / `Learn more` / `Submit`.
- [ ] Boundary statements are concrete and action-local; no trust theater.
- [ ] Plain language a practitioner parses in one read; no aphorisms, no cryptic noun fragments.

## Adding a new tool

1. The tool arrives as its own top-level folder (its full source home — code, tests, docs,
   build). Kebab-case, matching any prior repo name.
2. It adopts the design system at the source and ships a portable artifact its folder's own
   gate verifies.
3. `scripts/build-tools.mjs` gains its stage entry (artifact path, license, embed adapter if it
   needs chrome hidden); `public/index.html` gains its route, nav entry, and Home card — inside
   the group where it belongs (`Manage data` / `Decide` / `Work with AI`, or a new group that
   earns its name).
4. The full gate above runs; the reviewer walks the judgment checklists against the rendered
   screens.
5. `public/tool-sources.json` records the artifact hash and provenance; the changelog gains one
   entry; `README.md` gains one line.

No step is skippable, including for "small" tools. The system stays consistent because entry is
strict.
