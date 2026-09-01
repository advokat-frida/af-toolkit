# Shipped baseline

Captured before the vNext local redesign on 2026-08-20.

- Repository head: `8746e97d471f41681c924aed27b2436b1550a51e`
- Portable artifact: `wizards.html`
- SHA-256: `F11481B073DCBEB749F291EC0A02CB840E2A69A3B47DE41772CBEAD15CD9D632`
- Git blob: `50f61eeb5f8277b77148ef3a6b7a6e50308f7c15`

The legacy HTML remains untouched in the repository root. vNext authoring lives in `src/`; the local
portable candidate is built to `dist/wizards.html`.

## Compatibility invariants

- Existing `wizards.html#<wizard-id>` links continue to name one wizard only.
- Answers, path history, outcome, timestamps, and anchor values never enter the URL.
- Authored `SOURCES` and `WIZARDS` registries are extracted without rewriting their text.
- No runtime network, accounts, analytics, cookies, or backend.

## vNext release decision

The 2026-08-21 public release keeps this exact baseline runnable while displaying its
`automated-check-only` status. Availability does not mean practitioner review. Draft, missing, or
superseded relied-on sources still block a path, and calendar reminders remain unavailable until
both the path and clock semantics receive practitioner review.
