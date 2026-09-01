# The Advokat Frida Toolkit

Build a polished local application shell that brings Redactorium, SafeSeed, Privacy Wizards
Council, Build-A-Prompt, and Objection Oracle into one navigable workspace.

The approved product and design decisions live in:

- `docs/TOOLKIT-BRIEF.md`
- `docs/design/DESIGN-SYSTEM.md` and `docs/design/REVIEW-GATE.md` (the design package)

Since 2026-08-31 this is the single repository for the Toolkit: every tool's source lives here as
its own top-level folder, each tool keeps its own gate, and `scripts/build-tools.mjs` stages the
built artifacts with recorded provenance and hashes.

Release boundary: private source control only. This repository may be committed and pushed to the
private `advokat-frida/the-toolkit` repository. No public release, website sync, Ghost change,
deployment, publication, DNS, analytics, or announcement is included.
