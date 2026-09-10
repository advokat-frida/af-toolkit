# AF Toolkit

>**Privacy team**: Use fake data instead of real customer records. Redact before you send it. Honor opt-outs before the campaign goes out.
>
>**Business**: Okay, but *how?*
>
>**Privacy team**: 🤔

---

Familiar? We know the pain all too well. 

Everyone knows the requirements; almost nobody has been handed the thing to do it. We do the ritual where everyone meets, agrees that privacy is important, and make a decent attempt to resolve it on a Friday afternoon before it comes one with the carpet.

![The Toolkit](proofs/desktop-1440-home.png)

## The tools

| | What it does | Who asks for it | Preview |
|---|---|---|---|
| **SafeSeed** | Generates fake personal data that is fake by construction, with a receipt proving it | Anyone who needs a realistic test dataset | ![SafeSeed](proofs/desktop-1440-safeseed.png) |
| **SafeList** | Checks a send list against your opt-outs, one decision per match, with a record | Whoever is about to email a few thousand people on Thursday | ![SafeList](proofs/desktop-1440-safelist.png) |
| **Redactorium** | Finds personal data in a file and lets you hash, redact, generalize or swap it | Anyone sharing a spreadsheet, a log, or a PDF outside the team | ![Redactorium](proofs/desktop-1440-redactorium.png) |
| **Privacy Wizards Council** | Sixteen guided determinations that cite their sources at every step | The person who has to answer "does this need a DPIA?" today | ![Privacy Wizards Council](proofs/desktop-1440-privacy-wizards.png) |

## Run it yourself

Node 22 or newer.

```bash
npm ci
npm start
```

Open `http://127.0.0.1:4177/` which serves the committed snapshot in `public/`.

You can also just open a tool's built HTML file directly from disk. They are single files by design, and they work from `file://` with no server at all.

## What is in here

| Path | What it is |
|---|---|
| [`public/`](public/) | The shell people actually use, plus every staged tool artifact. **Generated in part** |
| [`safeseed/`](safeseed/) | Tool source: deterministic synthetic data, as a library, a CLI, and a browser generator |
| [`safelist/`](safelist/) | Tool source: send list checked against the opt-outs |
| [`redactorium/`](redactorium/) | Tool source: file sanitation, React front end |
| [`privacy-wizards-council/`](privacy-wizards-council/) | Tool source: guided determinations, Svelte |
| [`scripts/`](scripts/) | The gate, and the staging pipeline that puts tools into `public/` |
| [`docs/`](docs/) | How it is built and why: architecture, the design system, the review gate |
| [`proofs/`](proofs/) | Committed screenshots of every screen at every size, reviewed by eye on every change |

## What runs when

Every push and pull request runs the Toolkit gate (`ci.yml`): design gate, typecheck, structural and provenance checks, static QA, rendered QA at four viewports, state proofs, and the style census, with the proofs uploaded as an artifact. A change under `safeseed/` also runs SafeSeed's own gate (`safeseed-ci.yml`): its release-aligned checks, the dogfooded CLI fixtures, the demo rebuild with byte-fresh single files, and the Action contract on Linux, Windows and macOS. `codeql.yml` analyses the whole repository on push, pull request and a weekly schedule. Publishing a stable GitHub Release tagged `safeseed-vX.Y.Z` runs `safeseed-release.yml`, which verifies the tagged source against both gates and, after approval in the protected `npm` environment, publishes the package to npm with provenance; no token is stored anywhere.

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md). The short version: the design system is not a suggestion, the gate has to be green, and a new tool has to answer a real "how do I do that?" rather than merely being a good idea.

## Licence

MIT, in [`LICENSE`](./LICENSE), for all of it. The Advokat Frida name, the fox, and the visual identity are not covered, for the reasons in [`TRADEMARKS.md`](./TRADEMARKS.md). Third-party notices are in [`THIRD-PARTY-NOTICES.md`](./THIRD-PARTY-NOTICES.md).
