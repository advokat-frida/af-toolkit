# tests

One file, deliberately.

`shell.test.mjs` runs every assertion in [`../scripts/checks.mjs`](../scripts/checks.mjs) and fails
with the list of any that did not pass. The checks live in `scripts/` rather than here because the
static QA report runs the identical list; there is one source of truth for what "correct" means,
and two ways to read it.

```bash
npm test
```

Each tool folder keeps its own tests next to its own source, which is where the interesting ones
are: SafeSeed's catalogue invariants, SafeList's matching engine, the Wizards' determinations, the
Oracle's decision table. This directory is only for the shell and the provenance chain.

## What the checks cover

Shell structure (one view and one nav entry per route, one H1 per view, every frame titled), the
approved redesign contract (brand cap, groups, breadcrumb headers, retired chrome staying retired),
the working order of the rail, the design tokens, the provenance manifest and every artifact hash,
the embed wiring, font presence and hashes, Redactorium's bundle hygiene, LF-only staged text, MIT
on every tool, and zero runtime dependencies.

If you are adding a rule, add it as an assertion here rather than as a sentence in a document.
Documents get skimmed; assertions fail builds.
