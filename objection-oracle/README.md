# Objection Oracle

**Five blunt questions that tell you whether the objection holding up your release is real.**

Review has a failure mode. Someone says "I'm not comfortable with this", nobody wants to be the
person who overrode a privacy concern, and a release sits for a week while everyone waits for a
feeling to resolve itself. Sometimes that objection is a genuine blocker. Often it is a preference
wearing a lanyard, and preferences do not hold releases.

So: five questions, each answerable yes or no, and one of four rulings. It is a magic eight-ball,
because the point is to be a little undignified about a conversation that has been taking itself
too seriously.

| Ruling | What it means |
|---|---|
| **Ship it** | Nobody can name the requirement or the harm. That is a preference. File the note and go |
| **Next version** | Real and specific, but nothing a user does changes, and it is reversible. It earns a ticket, not a delay |
| **Fix it, then ship** | A supported problem with a targeted fix. Fix that one thing; do not reopen the rest |
| **Hard stop** | Supported, no narrow fix, and the harm would not reverse. Rare, and it should be |

The ruling comes with why, what it means, the next action, who owns it, and how to close it out —
because "ship it" alone is not a thing you can put in a thread.

## It is deterministic

The same five answers always give the same ruling. Randomness picks the phrasing and nothing else;
the decision tree is in [`SPEC.md`](SPEC.md) and the logic is in
[`src/core.js`](src/core.js), which you can read in one sitting.

That matters because a triage tool that varied its answer would be a horoscope. This one is a
lookup table with a sense of humour.

## Source map

| Path | What it is |
|---|---|
| `SPEC.md` | The product rules and the decision tree, in full |
| `src/core.js` | The questions, the outcome logic, and the response banks |
| `src/app.js` | Interaction, animation, accessibility, copy behaviour |
| `src/page-body.html`, `src/page.css` | The page |
| `chrome/` | Family chrome, copied byte-exact. Do not hand-edit; re-copy if the flagship moves |
| `tools/build.mjs` | Assembles the standalone and embed builds |
| `harness/` | Browser, outcome, accessibility, and network-isolation checks |
| `shots/` | Reference captures kept in-repo so QA needs no website checkout |
| `QA.md` | The verification record |

## Build and check

```bash
npm install
npm run browser:install     # Chromium for the harness
npm run build               # dist/objection-oracle.html + the embed build
npm test
npm run harness
```

The build produces a standalone HTML file with no external requests, no analytics, and no browser
storage. The harness drives the whole tool and asserts the network kill switch counted zero
attempts — the check that makes "it does not phone home" a build failure rather than a claim.

## Licence

MIT. Take it. The decision tree is the interesting part and it is four rules long.
