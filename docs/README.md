# docs

| Document | What it is for |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | How the pieces fit: the shell, staging, hosting, and what is deliberately absent |
| [`VERIFYING.md`](VERIFYING.md) | How to check the promises rather than believe them |
| [`design/DESIGN-SYSTEM.md`](design/DESIGN-SYSTEM.md) | The standing design law: tokens, type, components, copy rules |
| [`design/REVIEW-GATE.md`](design/REVIEW-GATE.md) | What a human checks before anything lands, and how a new tool gets in |
| [`TOOLKIT-BRIEF.md`](TOOLKIT-BRIEF.md) | Product decisions and their reasons |
| [`HANDOFF.md`](HANDOFF.md) | The running log of what changed and why, newest first |
| [`TOOLKIT-CANON.md`](TOOLKIT-CANON.md) | Historical. Superseded by the design package; kept so old links resolve |

## Where to start

Reading the code: [`ARCHITECTURE.md`](ARCHITECTURE.md).

Checking whether to believe us: [`VERIFYING.md`](VERIFYING.md).

Changing something: [`design/DESIGN-SYSTEM.md`](design/DESIGN-SYSTEM.md), then
[`design/REVIEW-GATE.md`](design/REVIEW-GATE.md), then [`../CONTRIBUTING.md`](../CONTRIBUTING.md).

Working out why something is the way it is: [`HANDOFF.md`](HANDOFF.md). It is verbose on purpose.
Most of the odd decisions in this repository exist because something broke once, and the entry
says which thing.
