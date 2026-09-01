# Behavior deltas

This ledger separates approved product changes from accidental engine drift. The current work is a
local candidate only. Ben has not approved a public release.

## BAP-NEXT-001 — Outcome-first entry

- Legacy: the opening screen exposes the complete configuration console and an empty generated prompt.
- vNext: the work request is the first task; a five-part composer appears only after a meaningful
  request is supplied.
- Reason: reduce initial choice overload while teaching the prompt structure through use.
- Compatibility: prompt inputs and governance controls remain available in layered editing.
- Evidence: local browser and literal-size visual states.
- Changelog: required for a public release; this changes the primary task flow.
- Ben approval: local implementation authorized 2026-08-20; public release not approved.

## BAP-NEXT-002 — Five-part review model

- Legacy: role, subject, tone, job, format, and governance controls are independent workbench panels.
- vNext: Outcome, Context, Evidence, Guardrail, and Format become the visible editing model; legacy
  advanced controls remain under Advanced setup.
- Reason: make the prompt inspectable as a work product rather than a settings console.
- Compatibility: authored legacy governance copy is preserved by the extracted engine.
- Evidence: engine contract tests plus generated-prompt readback.
- Changelog: required.
- Ben approval: local implementation authorized; final wording and public release unapproved.

## BAP-NEXT-003 — Remove fixed mobile minibar

- Legacy: a fixed narrow-screen summary can cover the interface.
- vNext: normal-flow navigation and a full-width review state on narrow screens.
- Reason: prevent content obstruction and duplicate navigation.
- Compatibility: no data or export contract changes.
- Evidence: 390x844 and 320x700 literal-size inspection.
- Changelog: not required alone; include within the vNext task-flow entry.
- Ben approval: local implementation authorized.

## BAP-NEXT-004 — Organization persistence is opt-in

- Legacy: every organization-brief edit is written to browser local storage when available.
- vNext: organization values begin as tab-only state. The user must explicitly choose to remember
  the brief on the device; turning that choice off removes the stored key while leaving the active
  tab values intact.
- Reason: reusable definitions and house rules may expose internal or matter context on a shared
  browser profile even when they never enter a share URL.
- Compatibility: an existing non-empty `af_bap_org_v1` brief is loaded and shown as remembered so
  legacy data is neither discarded nor silently hidden.
- Evidence: storage contract tests plus manual browser verification of opt-in, opt-out, reload, and
  clear states.
- Changelog: required for a public release.
- Ben approval: local implementation authorized; public release not approved.

## Invariants, not deltas

- Share links remain versioned allow-listed structure only.
- Saved setups remain name + local timestamp + allow-listed structure only.
- Subject, generated prompt, organization brief, warnings, and custom free text never enter those
  payloads.
- Legacy v1 links remain readable; malformed, unknown-version, and decoded payloads over 8 KiB fail
  safely without echoing fragment input.
