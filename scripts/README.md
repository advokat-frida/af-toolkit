# scripts

The gate, and the pipeline that puts tools into `public/`. Everything here is plain Node with no
dependencies beyond Playwright for the rendered checks.

| Script | What it does |
|---|---|
| `build-tools.mjs` | Stages each tool's built artifact into `public/tools/`, normalizes text to LF, hashes it, and writes `public/tool-sources.json`. `--build` runs each tool's own build first |
| `design-gate.mjs` | Palette, fonts, banned copy, radii, and external-request scans across the shell and every staged artifact |
| `checks.mjs` | The structural and provenance checks. Exported so both the test run and the static QA report use exactly the same list |
| `static-qa.mjs` | Runs `checks.mjs` and prints a pass/fail line per check |
| `syntax-check.mjs` | Parses every shell script. Cheap, and catches the typo before a browser has to |
| `visual-qa.mjs` | Real Chromium at 1440, 1034, 390 and 320. Asserts the structural contract and no horizontal overflow, writes `proofs/` |
| `state-proofs.mjs` | Drives every drawn state and screenshots it at 1360×800 under a fixed clock |
| `style-census.mjs` | Drives the same states and records what actually rendered: every type role, control variant, color, radius and shadow, counted. `--check` fails on anything not in `docs/design/style-baseline.json`; `--update` rewrites the baseline in a reviewed change |
| `audit-embedded-layout.mjs` | Dumps computed geometry and typography per tool. A debugging aid, not part of the gate |

## The two that matter most

**`build-tools.mjs`** is the provenance chain. It is the only thing that writes `public/tools/`,
and the hashes it records are what anyone verifying a served file compares against. It normalizes
text to LF before writing or hashing, because a hash that only matches on one operating system is
worse than no hash: it looks like proof and isn't.

**`checks.mjs`** is the contract. If a rule is worth having, it belongs here as an assertion rather
than in a document nobody rereads. It currently asserts, among other things, that every tool
records its MIT licence, that no staged text file contains a carriage return, and that the
application ships zero runtime dependencies.

## The fixed clock

`state-proofs.mjs` pins the page clock before driving anything. Several screens show a timestamp,
and without that pin every run produced different screenshots, so `proofs/` was permanently dirty
and nobody could tell a real visual regression from the time of day. With it, a rerun on one
machine reproduces the proofs byte for byte. (CI does not byte-compare them: Chromium hints text
differently on Linux, so CI proves every state is reachable and uploads the images for a reviewer.)

## The census

`design-gate.mjs` reads source text, so it can say "this hex is not a token". It cannot say "this
button is 4px shorter than every other button" or "this 15px/500 run appears once, in one tool".
`style-census.mjs` can, because it asks the rendered page. It drives every drawn state, records the
computed type, control, and paint tuples for the shell and the tool frame, and counts them across
tools. The report is the consistency review's evidence. The sorted set of distinct tuples is the
baseline, and `--check` fails the gate on any tuple the baseline does not contain, which means a
new tool cannot bring a new font size, weight, color, radius, or button shape into the Toolkit
without adding it to the baseline in the same change, where a reviewer sees it. Hover and focus
states are not censused; the pointer is parked on empty rail before each read.


```bash
npm run gate           # all of it, in order
npm run design-gate    # just the static scans, ~1s
npm test               # just the structural and provenance checks
npm run qa:visual      # just the rendered checks
npm run qa:states -- 5c-safelist-review  # a single state, while iterating
npm run qa:census                        # the rendered census against the baseline
npm run qa:census:report                 # the full census, counted, for a consistency review
```
