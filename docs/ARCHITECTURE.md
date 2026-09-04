# How the Toolkit is put together

Short version: five independent tools, each built to a single self-contained file, staged into one
folder, served as static files by a Worker that runs no code of ours. There is no backend anywhere
in this picture, and that is the entire design.

## The shape

```
safeseed/  safelist/  redactorium/  privacy-wizards-council/  objection-oracle/
    │          │            │                  │                      │
    └──────────┴────────────┴──────────────────┴──────────────────────┘
                                  │
                    scripts/build-tools.mjs   ← stages + hashes
                                  │
                               public/
                    ┌─────────────┴─────────────┐
              index.html                    tools/
              toolkit.css                   licenses/
              toolkit.js                    tool-sources.json
                                  │
                    Cloudflare Worker (static assets only)
                                  │
                    toolkit.advokatfrida.com
```

## Why one repository and not six

It used to be six. Every tool had its own repo, its own chrome, and its own slightly different
idea of what a button looked like. Consolidating them was not about convenience; it was the only
way to make one design system actually binding. A shared stylesheet across six repositories is a
suggestion. A gate that fails the build is a rule.

Each tool still owns its own source, tests, and build. They are folders, not a merged codebase.
You can develop one without touching the others.

## The shell

`public/index.html` is the whole application: a sidebar, a breadcrumb header, and an iframe. Each
tool loads into that frame as a same-origin document.

Two messages pass between them, both origin-checked:

- A tool may post `{toolkit: "context", title}` to name its current task in the breadcrumb. The
  Wizards use this to show which determination is open.
- The shell posts `{toolkit: "reset"}` when you click the rail item of the tool already on screen.
  Every tool answers by returning to its first state.

That is the entire protocol. Frames here are composition, not a security boundary — a staged tool
is trusted code inside the Toolkit's own origin. [`SECURITY.md`](../SECURITY.md) says so plainly
rather than implying otherwise.

## Staging, and why it is a separate step

`scripts/build-tools.mjs` copies each tool's built artifact into `public/tools/`, rewrites asset
paths for the Toolkit's origin, normalizes text to LF, hashes the result, and writes
`public/tool-sources.json`.

It does **not** run automatically. Editing a tool does not change what the shell serves until you
say `npm run build:tools`. That sounds like friction and is actually the thing that stops a
half-finished tool from riding along in someone else's commit.

Line endings matter more than they sound like they should. This repository stores LF, but a
Windows working copy staged CRLF for a while, so the recorded hashes matched on exactly one
machine and nowhere else — not in CI, not on the edge. Everything is normalized to LF before it is
written or hashed, and the gate asserts no staged text file contains a carriage return.

## Hosting

A Cloudflare Worker configured in [`wrangler.jsonc`](../wrangler.jsonc) with `assets.directory`
pointing at `public/` and no `main` script. There is no server code. Cloudflare serves the files
and nothing else.

`not_found_handling` is `none` on purpose. Every route in the shell is a hash route, so every path
that reaches the edge is a real file. If a missing file returned the shell with a 200, that HTML
would be cached under the missing asset's key and a broken deploy would look healthy. Better to
404 loudly.

`public/_headers` sets `nosniff`, `no-referrer`, and `same-origin` everywhere, `no-store` on the
staged tools and the manifest so a release is never held stale, and a long immutable cache on
fonts, whose filenames change when their contents do.

Deploys are git-connected: push to `main`, Cloudflare builds and ships. There is no build command,
because `public/` is already the verified snapshot.

## The gate

`npm run gate`, in order:

1. **Design gate** — palette, fonts, banned copy, radii, and external requests across every shell
   file and staged artifact.
2. **Typecheck** — syntax across the shell scripts.
3. **Tests** — the structural and provenance checks in `scripts/checks.mjs`.
4. **Static QA** — the same checks, reported.
5. **Rendered QA** — a real browser at 1440, 1034, 390 and 320, asserting the structural contract
   and no horizontal overflow.
6. **State proofs** — every drawn state driven and screenshotted at 1360×800, under a fixed clock
   so timestamped screens reproduce byte for byte.

CI runs all six and uploads the images. It does **not** byte-compare them against the committed
proofs: Chromium hints and antialiases text differently on Linux than on the Windows machine that
generated them, so they never match across platforms, and a check asserting otherwise would fail
every build while proving nothing. What CI does prove is that every drawn state is still
reachable — `qa:states` exits non-zero if a state cannot be driven, which is the failure that
actually means something broke. Comparing pixels stays a local discipline, on one machine, by a
person looking at the diff.

## What is deliberately absent

No backend. No database. No accounts. No analytics, first or third party.

The shell itself ships **zero runtime dependencies**, and the gate asserts that count is zero
rather than trusting a scan of a tree we do not have. The tools are a more nuanced claim and it is
worth stating precisely: Redactorium bundles React, the Wizards bundle Svelte, and those libraries
are compiled into their artifacts. What is true of all of them is that **nothing is fetched from
anyone else's domain at runtime** — fonts, icons and data are vendored into the file, and each
single-file build carries a network kill switch whose violation count the harness asserts is zero.

"We wrote every line" would be a lie. "Nothing you do here reaches a third party" is the promise,
and it is the one that can be checked.
