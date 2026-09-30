# PWC US state expansion: approved release

Prepared September 21, 2026 (source checks completed September 22 UTC). Ben completed practitioner review, approved this version, and explicitly requested Tuck and deployment on September 22. Branch: `codex/pwc-expansion`, based on `d970f9223036b463f180d5b0be6f6f639dab9b23`. Release completion and live verification are recorded in `docs/HANDOFF.md` and Notion AF-9.

## What is ready

Two new paths cover the twenty comprehensive state privacy laws currently in effect: applicability, and material differences after coverage is established. The applicability path has 298 nodes and 96 questions; the duties path has 211 nodes and 42 questions. State selection starts independent histories. Results give each selected state equal weight; editing one state invalidates its later answers and preserves the others. Unknown answers produce missing facts, an owner and a reason the fact matters. Download/copy contains all selected state results and their own facts and sources.

The duties comparison covers sensitive data and minors, sale/targeted advertising and universal opt-outs, consumer rights, assessments, and cure/enforcement. Twenty additional enforcement sources close the cure-period requirement in the September W1.1 research. Cure rules retain notice triggers, discretion, conditions and sunsets. They are not presented as delayed compliance dates. The source register now has 301 entries, including 162 new US state entries. New entries are `automated-check-only`, with no practitioner reviewer or review date asserted.

Ben's UI corrections are part of this candidate:

- Answers describe facts and examples. Selected-answer instructions and interpretations appear in the final outcome and record, and are removed when the relevant answer changes. Eight instruction/conclusion suffixes were also removed from answer labels.
- The state flow has no selected-state recap, duplicate completion counter, or automated-check qualifier beside its source date. It names the state once per result. Heading/subtext gaps, validation/reset messages, adjacent question disclosures, verdict padding, action labels and state separators now use deliberate spacing.
- The finder shows all 18 published topics by default, with alphabetically ordered categories and titles. Resetting a search restores the complete catalog.
- Short source notices use the full available result-column width. ROPA links directly to the ICO controller and processor XLSX templates and CNIL's current French ODS template. The official documentation pages and all three file responses were checked on September 22; file requests returned 200. Links survive in the downloaded Markdown determination.
- Required/next actions are grouped in one paper checklist card per determination, including state results. Row dividers are removed; native checkboxes have 44px targets. Temporary checks clear when the result is left and do not alter the determination or export. Inline citations and resource links operate separately.
- The Authority rail is now visually distinct from the paper checklist: the existing forest-wash fill and a slim forest top rule, sized to its contents. Reasoning sits directly below the verdict, avoiding stacked margins; both desktop panels align at the top. Result text uses pretty wrapping and verdict headings use balanced wrapping, without fixed line breaks. Desktop measurement confirms a 4px verdict-to-disclosure gap and zero difference between card tops. Expanded reasoning and sources remain keyboard-operable. Result frames at 902px, 363px and 293px had no horizontal overflow.
- Ben's AI Art. 99(3) follow-up exposed a remaining 70ch cap on question helper text. The exact sentence was reproduced with the citation stranded while 1066px of space was available. Helpers now use that width and balance their lines; ordinary pretty wrapping alone still failed in a narrower panel. Direct inspection confirmed the exact sentence on one desktop line, then balanced lines in 626px and 322px frames, with the fine amount and citation together and no horizontal overflow. The prohibited-use and provider outcomes were also inspected with reasoning expanded. The style census now includes the existing PWC forest-wash token's computed color, newly visible as the Authority panel fill; no new raw color was introduced.
- Next determination now has its own navigation treatment: the existing indigo-soft tint and a 3px indigo left rule, with separators only between choices. ROPA's single follow-up and the California assessment's two follow-ups were inspected on desktop and at a measured 322px frame width, without horizontal overflow. Keyboard activation opened the intended DPIA question. The existing indigo-soft tint's computed color is now included in the reviewed style census.

The bounded breach corrections distinguish suspected incidents from GDPR awareness and replace unsupported indefinite record retention with an appropriate retention period. Two AI source identities/provenance entries were refreshed without changing their bodies or claiming a full AI-content review. See [source maintenance](pwc-source-maintenance.md).

## Evidence

- Primary-source author and independent reviews: [applicability](pwc-us-applicability-sources.md), [duties](pwc-us-divergence-sources.md), [duties cross-review](pwc-us-divergence-cross-review.md), and [cure first ten](pwc-cure-first-ten.md) / [cure second ten](pwc-cure-second-ten.md). Both cure review lenses finished before integration. The integration clarifies Florida's 45 days as time to cure; no period or condition changed.
- [Answer-guidance receipt](pwc-answer-guidance-correction.md): independent replay of all 594 complete baseline paths, 3,929 authored citation contexts, 210 selected actions, 479 notes, and 521 answer-edit truncations. The later Article 5 citation widening is intentional and separately tested.
- `privacy-wizards-council: npm run check`: **75 tests passed**, style audit, registry build, portable build and artifact verification passed.
- Toolkit `npm run gate`: passed design, syntax, root test, **128 static checks**, rendered checks at **1440, 1034, 390 and 320 pixels**, **16 state proofs**, and style census. The palette scanner now distinguishes the official Delaware `#12D-111` URL fragment from a CSS color; no palette exception was added.
- Direct browser inspection covered the factual breach choice and outcome; empty-answer/reset feedback; the state selector; California risk assessments followed by unresolved Indiana/Texas results; changing one state's answers; Colorado cure followed by unresolved Texas; source disclosures; copy and the download action; and the standalone flow. The corrected component was inspected at a measured 390px and 316px, with no horizontal overflow. Message separation measured 20px, heading/subtext 10px, verdict padding 16px with zero trailing paragraph margin, action-label gap 6px, and state separation 24px. Expanded question disclosures use full width and retain 44px targets.
- The normal Toolkit browser gate reported no page errors. The in-app browser's separate inspection log recorded a MutationObserver error on reload while the UI continued to function; it did not reproduce in the gate. No claim that every inspection-tool log is empty is made.
- Regenerated PWC proofs were visually inspected. `git diff --check` passes. Other tools' staged hashes are unchanged; the primary checkout still has only its pre-existing untracked `.claude/` directory.
- September 22 follow-up inspection: ROPA and California assessment checklist cards, keyboard check/uncheck, citation independence, checks resetting after answer edits, and the complete alphabetical finder. ROPA had no horizontal overflow at measured 400px and 322px frame widths. The source notice fits one line in the 706px desktop result column. The checklist input adds one reviewed native-checkbox control tuple to the style census; it uses the existing ink token and body role.

Portable/staged PWC artifact SHA-256: `684bff2d7765255380de84917f10984002a91998e50f22908677d08067f800b4` (1,716,596 bytes). Registry SHA-256: `18697f33d32ad2e803192b09fdcd60fdcf90c3f8e9b935fbb33fa9546bdd1e20`. Source manifest SHA-256: `a5be901fa1e8dcc1b7d76b3e297c003fc754fc8afd0af181b6319f8e046caab7`.

## Practitioner review (completed September 22)

Ben's approval: "practitioner review is completed and this version is approved. please tuck and deploy." The reviewed artifact hash below remains unchanged. This is version-level approval; individual source provenance and disabled calendar semantics are preserved.

Open the local Toolkit at `http://127.0.0.1:5199/#privacy-wizards` and search for “US state”. Review these consequential forks:

1. California: adjusted revenue threshold and buy/sell/share count, exemptions, and risk-assessment duties versus later submissions/ADMT dates.
2. Texas/Nebraska: small-business coverage and retained limited duties; Colorado: below-threshold biometric/minors rules.
3. Rhode Island: broad website/online-service notice route versus the full-law thresholds and exemptions.
4. Cure: Colorado's minors-only exception, New Hampshire discretion, New Jersey's July 1 sunset, Maryland's alleged-violation cutoff and Texas's documentary/consumer-notice conditions.
5. Select several states, leave one fact unknown, then edit another state and export. Confirm the wording supports the practitioner decision without implying that selection establishes applicability.

The twenty-state scope is the comprehensive-law cohort, not every US privacy obligation. State-specific exemptions and evolving amendments remain part of the legal review. A completed interview or an automated source check does not establish practitioner approval.

## Remaining work

Practitioner review is complete. Release and source-control closeout are authorized. Broader [breach notification](https://app.notion.com/p/3e30f293ed9d81ff95b9dd4ab5ccd5d0) and [DPIA/assessment](https://app.notion.com/p/3e30f293ed9d81e9b9bded87615a63b4) work are separate Backlog tasks. [Remaining shared usability improvements](https://app.notion.com/p/3e30f293ed9d817bba7ccf0d02eaf3c7) are Idea only. Other Toolkit tasks remain parked until the requested check-in.
