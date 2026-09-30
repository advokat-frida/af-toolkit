# Shipped baseline

Captured before the vNext local redesign on 2026-08-20.

- Repository head: `8746e97d471f41681c924aed27b2436b1550a51e`
- Portable artifact: `wizards.html`
- SHA-256: `F11481B073DCBEB749F291EC0A02CB840E2A69A3B47DE41772CBEAD15CD9D632`
- Git blob: `50f61eeb5f8277b77148ef3a6b7a6e50308f7c15`

The legacy HTML remains untouched in the repository root. vNext authoring lives in `src/` and
`content/`; the local portable candidate is built to `dist/wizards.html`.

## Compatibility invariants

- Existing `wizards.html#<wizard-id>` links continue to name one wizard only.
- Answers, path history, outcome, timestamps, and anchor values never enter the URL.
- The authored `SOURCES` and `WIZARDS` text was carried into `content/` without rewriting.
- No runtime network, accounts, analytics, cookies, or backend.

## vNext release decision

The 2026-08-21 public release keeps this exact baseline runnable while displaying its
`automated-check-only` status. Availability does not mean practitioner review. Draft, missing, or
superseded relied-on sources still block a path, and calendar reminders remain unavailable until
both the path and clock semantics receive practitioner review.

## Registry source

From the W1.0 part 2 switch-over (2026-09-14) the build reads `content/` through
`scripts/registry/generate.mjs`, and nothing reads the legacy `wizards.html` at build. At the
switch-over every path and source in `content/` equalled the extraction from this baseline byte
for byte, and every citation in every path resolved the same. The legacy registry hash
`11250ac35555835903fcaa20f3f1ecef567ae3283c459e736e825cbd005359d2` and the first content
registry hash `a1cafbd97b46b0bd7fa2d6e717d7ae0898f3534bba65956918152f10936bacea` describe the
same data. The legacy file stays here as the shipped baseline.
