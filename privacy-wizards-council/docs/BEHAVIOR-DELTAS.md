# Behavior deltas

This ledger separates approved product changes from accidental legal-content drift. Ben explicitly
authorized the v2 public release on 2026-08-21 after confirming that the decision and source
registries had not changed. That authorization accepts the existing automated-check-only baseline;
it does not convert any source or path into a practitioner-reviewed determination.

## PWC-NEXT-001 — One finder, one staged question

- Legacy: the library is duplicated across navigation and stage while citations remain permanently
  visible.
- vNext: one searchable library opens one determination; the active state presents one question and
  contextual why/source layers.
- Reason: make the current decision dominant without deleting authored context.
- Compatibility: wizard and source registries are mechanically extracted from the shipped artifact.
- Evidence: graph checks and literal-size visual states.
- Changelog: required for a public release.
- Ben approval: public v2 presentation release authorized 2026-08-21; decision content remains the
  unchanged production baseline.

## PWC-NEXT-002 — Legal review state is explicit without disabling the published baseline

- Legacy: UI may say "Sources verified as of" even when its own stamp describes automated checking or
  no counsel review.
- vNext: source state is one of `draft`, `automated-check-only`, `practitioner-reviewed`, or
  `superseded`. The exact 16-path legacy production baseline remains runnable with its
  `automated-check-only` status visible; any path containing a draft, missing, or superseded source
  fails closed. Only a fully practitioner-reviewed path may claim **Legal sources reviewed through**.
- Reason: automated integrity checks are not specialist legal review, but the redesign did not
  introduce or alter the published legal content. Disabling the unchanged public baseline would turn
  inherited review debt into an unrelated UI-release blocker.
- Compatibility: no substantive outcome is changed or silently blessed. The current extracted set
  remains `automated-check-only`, outcome copy and dated records state that status, and no
  practitioner-review date is fabricated.
- Evidence: exact legacy registry hash, full graph/source traversal, visible automated-only state,
  and rejection fixtures for draft or superseded enabled sources.
- Changelog: required because this changes availability and trust language.
- Ben approval: on 2026-08-21, after confirming the source and decision registries were unchanged,
  Ben explicitly instructed deployment. Accepted risk: the existing automated-only baseline remains
  public and must be independently verified before reliance.

## PWC-NEXT-003 — Calendar is a reviewed reminder only

- Legacy: descriptive ICS exports may imply a legal deadline and expose matter detail to a calendar.
- vNext: the future action is `Download calendar reminder (.ics)`, defaults to a neutral title,
  previews the sync boundary, excludes answers/outcome facts, and remains unavailable for unreviewed
  or indeterminate rules.
- Reason: make the legal and privacy boundary accurate.
- Compatibility: legacy clock text remains visible in authored outcomes; no unreviewed ICS is emitted.
- Evidence: export eligibility tests and file readback once a reviewed clock manifest exists.
- Changelog: required when enabled publicly.
- Ben approval: required change authorized locally; reviewed clock semantics remain open.

## PWC-NEXT-004 — Path eligibility changes require separate approval

- Legacy: at least one DPIA branch offers a choice inconsistent with an earlier answer.
- vNext candidate: the engine supports path predicates and deterministic downstream invalidation, but
  no legacy option is removed until its old/new path, authority, reviewer, and Ben approval are recorded.
- Reason: UI cleanup cannot silently change legal guidance.
- Compatibility: extracted legacy choices remain intact in this local candidate.
- Evidence: graph contract and behavior-delta fixture when an approved correction exists.
- Changelog: decision deferred until a substantive correction is approved.
- Ben approval: not yet approved.

## PWC-NEXT-005 — Outcome content is layered, not discarded

- Legacy: verdict, complete reasoning, every next action, clock text, legal status, exports, and
  source controls appear in one continuous outcome slab.
- vNext: the outcome opens on the decision and one exact authored lead sentence. Complete authored
  reasoning, actions and timing, and review/source status are deliberate adjacent layers.
- Reason: a legal result needs context, but presenting every kind of context simultaneously makes
  the answer harder to find and easier to abandon.
- Compatibility: no authored reasoning, action, clock, citation, or review metadata is removed or
  rewritten. Only presentation and default disclosure state change.
- Evidence: representative DPIA path at 390x844 and 1440x1000, including every tab, source layer,
  and downstream-answer invalidation.
- Changelog: required for a public release.
- Ben approval: public layered presentation authorized 2026-08-21.

## Security hardening, not a legal-content delta

- Included source bodies render as inert text with their paragraph breaks preserved. v2 no longer
  injects extracted source markup through an unescaped HTML rendering path.
- Search feedback is reactively derived from the current term; nonsense input visibly produces zero
  results and a recovery instruction.
