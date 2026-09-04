# proofs

Committed screenshots. Every screen, every size, every drawn state.

- `<viewport>-<route>.png` — the rendered QA pass at 1440×1000, 1034×917, 390×844 and 320×700.
- `states/<artboard>-<name>.png` — one image per state the design canvas draws, at 1360×800.
- `visual-qa.json` — the measurements behind the rendered pass.

## Why they are in git

Because a screenshot nobody looks at is not a test. These are committed so a change to them shows
up in a diff, in a pull request, next to the code that caused it. "Did this change how anything
looks?" becomes a question you can answer by scrolling.

The state proofs run under a fixed clock, so screens that show a timestamp reproduce byte for byte
on a rerun. Before that pin, every run rewrote the files and the signal was worthless.

They do **not** reproduce across platforms. Chromium hints and antialiases text differently on
Linux than on Windows, so the same commit yields different bytes on a CI runner. That is why CI
uploads these as an artifact instead of byte-comparing them: the comparison is only meaningful on
one machine, and pretending otherwise would fail every build for no reason.

## When they change

A diff here is either a change you meant or a regression you did not. Open the new image at full
size and look at it. That is the entire ritual, and skipping it defeats the point of storing them.

Regenerate with `npm run qa:visual` and `npm run qa:states`.
