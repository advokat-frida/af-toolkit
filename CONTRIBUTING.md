# Contributing

Thanks for looking. A few things are worth knowing before you spend an evening on something.

## The bar for a new tool

The Toolkit is not a collection of privacy-adjacent utilities. Every tool in it exists because a
privacy person gives a specific piece of advice, gets asked *how*, and has no answer.

> Use synthetic data. — How? — SafeSeed.
> Redact that before you share it. — How? — Redactorium.
> Honour the opt-outs before you send. — How? — SafeList.

That is the test. Not "is this useful", not "would this be clever". Someone asks you how, and
today you say you don't know.

Two more things have to be true. It has to work with **nothing leaving the browser** — no server,
no API key, no upload. And it has to be useful to somebody who has never heard the word
compliance, because the tools that get used are the ones a marketer or an analyst can open
without a glossary.

If you have one, [open a tool idea](../../issues/new?template=tool_idea.yml) before you build it.
Cheaper for everyone.

## Changing an existing tool

Each tool lives in its own top-level folder and owns its source, tests, and build. The flow is
always the same:

```bash
cd <tool>          # make the change here, never in public/
npm run check      # or that folder's own gate; see its README
cd ..
npm run build:tools    # restage into public/
npm run gate           # the repository gate
```

`public/tools/` and `public/tool-sources.json` are **generated**. Editing them directly is the one
mistake that wastes the most time, because the gate will notice and you will not know why.

Staging is deliberately a separate step. Editing a tool never silently changes what the shell
serves; you have to say so.

## The gate

```bash
npm run gate
```

Design gate, typecheck, tests, static QA, then a real browser at 1440, 1034, 390 and 320, then a
walk through every drawn state with screenshots into `proofs/`. The clock is fixed, so reruns on
the same machine reproduce the images byte for byte and a diff means something actually moved.
Across machines they will not match — font rendering differs by platform — so CI proves every
state is reachable and uploads the images rather than comparing pixels.

Green is necessary and not sufficient. The other half is
[`docs/design/REVIEW-GATE.md`](docs/design/REVIEW-GATE.md), which is a human looking at the
rendered screens at full size, in every state, including the ones nobody designs on purpose. A
fallback is a state, and a state ships.

## Design

[`docs/design/DESIGN-SYSTEM.md`](docs/design/DESIGN-SYSTEM.md) is not a mood board. It is the
palette, the type scale, and the component anatomy, and the gate enforces the mechanical half of
it. A tool that cannot meet it does not go in. There is no close-enough tier.

The part people underestimate is the copy rules. No fluff, no restating what the interface already
shows, no reassurance stacks about how seriously we take your privacy. If a line can be deleted
without losing information, it was decoration.

## Style

- Text files are LF. `.gitattributes` enforces it, and the gate asserts no staged artifact carries
  a carriage return, because the provenance hashes have to be identical on every machine.
- Icons are Lucide, copied byte-exact. No hand-drawn paths, no emoji in the interface.
- No runtime dependencies. Not "few". The gate asserts zero, and that is a feature we advertise.
- No network calls from a tool, ever. Each single-file build carries a kill switch that counts
  attempts, and the harness asserts the count is zero.

## Commits and pull requests

Write the commit message for whoever reads it in a year with no context. What changed, and why it
was wrong before. The pull request template asks what a reviewer should push back on; answering
that honestly is the most useful thing in it.

## Security

Do not open a public issue for a vulnerability. [`SECURITY.md`](SECURITY.md) has the private
route. And please do not attach real personal data to anything, ever — every tool ships sample
data for exactly this reason.
