# Build-A-Prompt

[![license: MIT](https://img.shields.io/badge/license-MIT-2f6b3a)](LICENSE) &nbsp;[![live tool](https://img.shields.io/badge/live-advokatfrida.com-16140f)](https://advokatfrida.com/build-a-prompt/)

**A prompt builder that keeps the guardrails on.** Pick who the AI should think like, what it's about, how it should read, and what to do, and it writes a specific, lower-risk prompt. Want a subject seen through two sets of eyes? Add a second perspective and compare. Then copy it into ChatGPT, Claude, Gemini, or whatever you use.

Because "Fox Blocks" was one typo away from a trip to HR.

No backend, no accounts, and no telemetry. The authored vNext uses Svelte and Vite, then builds to
**one portable HTML file** that runs entirely in your browser. MIT licensed.

**▶ Current live tool: [advokatfrida.com/build-a-prompt](https://advokatfrida.com/build-a-prompt/)**

The live tool is still the shipped legacy version. The redesigned candidate is local-only and has
not been approved, committed, pushed, or deployed.

---

## This tool is built to be stolen

That isn't a bug, it's the whole design. Build-A-Prompt was never meant to be comprehensive — it's a *foundation*. If it's most of what your team needs, take it the rest of the way:

- **Fork the shipped baseline.** [`prompt-builder.html`](prompt-builder.html) remains the untouched
  legacy artifact.
- **Change the maintainable source.** The local redesign lives in [`src/`](src/) with engine and
  privacy-boundary tests under [`tests/`](tests/).
- **Carry one file.** `npm run build` produces `dist/prompt-builder.html`; the built artifact has no
  runtime server or third-party dependency.

We'd rather be the thing that taught you the move than the thing you keep coming back to.

## What it does

You compose a prompt from four load-bearing choices — a **role** (who the AI should think like), a **subject**, a **style** (how the output should read), and a **task** (what to actually do). Add a second role to get the same subject argued from two perspectives, side by side. The builder assembles those into a specific, scoped prompt that's less likely to wander or over-reach than a one-line ask, then hands it to you to paste into the assistant of your choice.

## Scope

This is a practitioner's on-ramp to a five-part prompt structure. It assembles the prompt; it does not run the prompt or evaluate the model's answer.

## Local vNext development

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run check
```

`npm.cmd run check` runs the engine/privacy-boundary tests, rebuilds the portable artifact, and
verifies that it contains no external runtime requests. See [`docs/BASELINE.md`](docs/BASELINE.md)
and [`docs/BEHAVIOR-DELTAS.md`](docs/BEHAVIOR-DELTAS.md) before comparing or changing behavior.

### Data boundary

- A work request and generated prompt stay in the current tab unless the user deliberately copies
  or downloads them.
- Saved and shared setups use an allow-listed structure only; they exclude the request, generated
  prompt, organization brief, custom free text, warnings, and timestamps.
- The optional organization brief starts as tab-only state. Remembering it in browser local storage
  is an explicit opt-in. Do not enter client, employee, secret, or otherwise sensitive matter detail.

## Part of the Advokat Frida toolkit

One of a shelf of small, standalone, MIT-licensed privacy and AI tools at **[advokatfrida.com/toolkit](https://advokatfrida.com/tag/toolkit/)**. Foundations, not fences.

## License

MIT — see [LICENSE](LICENSE). Fork it, change it, ship it; just keep the copyright notice the license asks for.
