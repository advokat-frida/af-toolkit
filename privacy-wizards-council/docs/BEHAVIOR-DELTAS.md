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

## PWC-NEXT-005 — The authored depth reaches the page (2026-09-13)

- Legacy (Toolkit 0.4.x): the question aside showed the help's first sentence with no way to
  the rest; the verdict qualifier showed the reasoning's first sentence, or the clock line
  instead of any reasoning; option notes never rendered; the sources layer had no trigger, so
  the included source texts were unreachable; the per-path `verifiedAsOf` stamp was not shown.
- vNext: the same content behind disclosures (Why this question?, Read the full reasoning),
  option notes as the row sub-line, each authority row opening to its citation, official link
  and included text, and the check date on the outcome aside and in the record. The record
  also carries the answer notes and the included texts.
- Reason: a reader should not have to leave the tool to understand it (DESIGN-PRINCIPLES
  nitpick 7; ADVO-189).
- Compatibility: no decision node, option, citation, or source record changed; the registry
  hash is unchanged.
- Evidence: unit tests over the lead, the plain-text conversion, the record; the Toolkit gate.
- Ben approval: the Wave 0 unlock, on Ben's word, 2026-09-13.

## PWC-NEXT-006 — Pending-law notes are annotations, never outcomes (2026-09-13)

- vNext: `src/lib/data/motion.js` carries dated notes about a pending instrument that would
  change an outcome if adopted (today: four notes on the Commission's Digital Omnibus
  proposal, each citing the EDPB-EDPS Joint Opinion 2/2026). They render under `What may
  change` on the outcomes they touch and in the record.
- Boundary: a note never alters a determination and always says the cited law applies until
  an amending act is adopted and applies. Every note carries the date it was checked and an
  official document. A note without both fails the unit tests.
- Review: the notes describe a proposal, not the law the paths decide on; they still deserve
  Ben's read before deploy, and a stale note is removed rather than left to age.

## PWC-NEXT-007 — Inline citations open the cited text in place (2026-09-14)

- vNext: `src/lib/engine/mentions.js` turns the article, section, guidance, case and
  defined-term mentions inside the authored text into citations that open a card with the
  cited paragraph (or the whole text), the formal citation, the review status and the official
  link. Curated aliases and defined terms live in `src/lib/data/mentions.js`.
- Boundary: resolution is conservative. A mention resolves only when it maps to exactly one
  registry source within the wizard's regime family and the node's UK/EU context; anything else
  stays plain text (Art. 55 and Art. 56 of the GDPR, Annex I, WP242 and the like have no
  registry source and are not linked). An explicit "UK GDPR Art. N" never opens the EU text.
- Compatibility: no decision content, citation or source record changed; the registry hash is
  unchanged. The Authority rail keeps the full list.
- Evidence: unit tests over the rules and over every text block of every wizard (every
  resolved mention points at an existing source of a plausible family); the Toolkit gate; the
  behaviour rig (hover, pin, keyboard, Escape, ×, frame-width fit) at 1440 and 390.
- Ben approval: asked for on 2026-09-14 ("hover over each mention of an article… a small popup
  card"), built the same day.
