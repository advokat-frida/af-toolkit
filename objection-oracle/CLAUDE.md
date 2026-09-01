# Objection Oracle

This private repository is the single source of truth for the Objection Oracle
standalone Advokat Frida tool tracked in Linear as ADVO-108.

Before changing visual chrome or adding a component, read the canonical contract:

`C:\Users\Ben\Documents\Projects\advokat-frida\website\advokat-frida-theme\FAMILY-CHROME.md`

Rules:

- Keep the tool a single, self-contained HTML file under `dist/`.
- Keep all decision logic in `src/core.js`; UI code may render a ruling but may
  not reinterpret it.
- Keep the five questions binary and in their approved order.
- Re-shaking may select another response from the same outcome bank only.
- No external resource requests, analytics, persistence, or user-entered text.
- Use only FAMILY-CHROME tokens and the approved component anatomy.
- Do not publish, deploy, or transfer the artifact into the website repository
  without Ben's separate approval.
- Changes are test-first. Run unit, build, browser, accessibility, isolation,
  responsive, and manual visual verification before handoff.
