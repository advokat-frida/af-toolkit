# Objection Oracle

A five-question, deterministic release-triage tool dressed as a magic fortune
ball. It produces one of four rulings:

- Ship It
- Next Version
- Fix It, Then Ship
- Hard Stop

The tool is a private Advokat Frida prototype tracked in Linear as ADVO-108.
Publishing and website integration are deliberately out of scope.

## Run the checks

```powershell
npm.cmd install
npm.cmd run browser:install
npm.cmd run build
npm.cmd test
npm.cmd run harness
npm.cmd run capture
```

The build produces and commits `dist/objection-oracle.html`, a standalone HTML
file with no external requests, analytics, or browser persistence. Playwright
is a local development dependency; the browser-install command downloads the
Chromium binary used by the reproducible browser checks.

## Source map

- `SPEC.md`: product rules and deterministic decision tree
- `src/core.js`: questions, outcome logic, and response banks
- `src/app.js`: interaction, animation, accessibility, and copy behavior
- `src/page.css`: responsive visual treatment
- `harness/checks.mjs`: browser, outcome, accessibility, and privacy checks
- `harness/capture.mjs`: desktop, mobile, long-copy, and animation captures
- `shots/reference-bap-*.png`: reviewed flagship reference snapshots, retained
  in-repo so normal QA has no dependency on the website checkout
- `QA.md`: final verification record
