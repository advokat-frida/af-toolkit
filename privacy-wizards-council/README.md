# Privacy Wizards Council

[![license: MIT](https://img.shields.io/badge/license-MIT-2f6b3a)](LICENSE) &nbsp;[![live tool](https://img.shields.io/badge/live-advokatfrida.com-16140f)](https://advokatfrida.com/wizards/)

**The other PWC — the one that hands you an answer before an invoice.**

Guided determinations for the privacy questions that eat your afternoon: is this a notifiable breach, does it need a DPIA, which lawful basis, can this data leave the EU. Answer plainly, click through, and leave with the determination, the statutes and case law behind it, and a dated record you can file.

No backend, no accounts, and no telemetry. The authored vNext uses Svelte and Vite, then builds to
**one portable HTML file** containing every wizard and citation. Nothing is sent by the tool at
runtime. MIT licensed.

**▶ Current live tool: [advokatfrida.com/wizards](https://advokatfrida.com/wizards/)**

Version 2 keeps the exact published source and decision registries while replacing the crowded
three-zone workbench with one finder, one question at a time, and layered outcomes and sources.
Every path states its legal-review status; an automated cross-check is never described as counsel
review.

---

## This tool is built to be stolen

That isn't a bug, it's the whole design. The Council was never meant to be comprehensive — no tool should model every clause of every regime, and one that tried would just be a consulting firm with a website. It's a *foundation*. If it's most of what your team needs, take it the rest of the way:

- **Fork the shipped baseline.** [`wizards.html`](wizards.html) remains the untouched legacy
  artifact.
- **Change the maintainable source.** The local redesign lives in [`src/`](src/) with graph,
  legal-state, URL, export, and privacy tests under [`tests/`](tests/).
- **Carry one file.** `npm run build` produces `dist/wizards.html`; the built artifact has no runtime
  server or third-party dependency.

We'd rather be the thing that taught you the move than the thing you keep coming back to.

## What it does

Each wizard walks one determination as a short branching interview — the "it depends" answered honestly, with the *depends* made explicit. You answer plain-language questions; it lands on a determination, shows the statutes, guidance, and case law it rests on as you go, and gives you a dated record of the path you took. It covers a growing set of the recurring calls: breach notification, DPIA necessity, lawful basis, international transfers, EU AI Act role and risk tier, breach severity, and more.

## Review state

Every path shows its source status. Verify the cited official text and review the determination before filing it; paths with incomplete source coverage stay unavailable.

## Development

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run check
```

`npm.cmd run check` traverses all decision graphs, verifies source-manifest eligibility and URL/data
boundaries, rebuilds the portable artifact, and checks it for external runtime requests. See
[`docs/BASELINE.md`](docs/BASELINE.md) and [`docs/BEHAVIOR-DELTAS.md`](docs/BEHAVIOR-DELTAS.md).

### Legal and data boundary

- Automated link or graph checks are not legal review. Source states are `draft`,
  `automated-check-only`, `practitioner-reviewed`, or `superseded`.
- The 16 paths already published in the legacy tool remain available when their source records are
  `automated-check-only` or `practitioner-reviewed`. A draft, missing, or superseded relied-on source
  blocks its path.
- Only a fully practitioner-reviewed path may display **Legal sources reviewed through**. The
  published baseline currently makes no such claim.
- Wizard URLs carry only the wizard identifier. Answers, path history, outcomes, dates, and matter
  facts stay out of the URL and are not persisted.
- Outcome copy and dated records retain the visible review state. Calendar reminders remain locked
  until both the path and the applicable clock semantics receive practitioner review.

## Part of the Advokat Frida toolkit

One of a shelf of small, standalone, MIT-licensed privacy and AI tools at **[advokatfrida.com/toolkit](https://advokatfrida.com/tag/toolkit/)**. Foundations, not fences.

## License

MIT — see [LICENSE](LICENSE). Fork it, change it, ship it; just keep the copyright notice the license asks for.
