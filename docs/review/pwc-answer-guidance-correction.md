# PWC answer guidance correction

Ben, September 21, 2026: answer choices should describe objective facts; instructions belong on the final outcome. This supplements AF9's PWC implementation acceptance criteria.

The implementation moves selected-branch advice and interpretation into resultActions/resultNotes. They appear in the final outcome and exported record, and are invalidated when the relevant answer is changed. Factual definitions and examples remain beside choices. Scope and provisional-result notes remain visible at the outcome. Eight instruction/conclusion suffixes were removed from labels: three breach notification, one ADM, and four children's privacy choices. Their outcomes already carry those determinations.

The suspected-breach result distinguishes prompt investigation from the GDPR awareness trigger. The existing source dates were not bumped for this bounded correction. Primary-source evidence is in pwc-source-maintenance.md.

## Removed organizational-impact tails

Independent review found these inherited tails unsupported by the selected facts. The severity input establishes harm to individuals; it cannot establish an organizational penalty or enforcement outcome. The privacy severity/likelihood model and individual-harm definitions remain unchanged. Original moved text is retained here solely as review evidence, not runtime advice.

- **Negligible (Very Low) — minimal or no adverse impact**: Organizational-impact context from the selected rubric: No regulatory or material consequence for the organization. This is not a prediction of enforcement or penalties.
- **Minor (Low) — limited, short-term impact**: Organizational-impact context from the selected rubric: Isolated complaints or minor cost; no regulatory interest. This is not a prediction of enforcement or penalties.
- **Moderate (Moderate) — noticeable but recoverable**: Organizational-impact context from the selected rubric: Moderate cost, a possible regulatory inquiry, or limited reputational damage. This is not a prediction of enforcement or penalties.
- **Major (High) — significant, lasting impact**: Organizational-impact context from the selected rubric: Significant fines, regulatory action, or material reputational harm. This is not a prediction of enforcement or penalties.
- **Severe (Very High) — critical, potentially irreversible**: Organizational-impact context from the selected rubric: Maximum penalties, enforcement, litigation, or existential reputational damage. This is not a prediction of enforcement or penalties.

## Review and validation

The runtime reviewer independently checked placement, branch-specific reasoning, edit invalidation and export behavior. The replay covered all 594 complete baseline paths, retained 210 selected actions and 479 notes, preserved 3,929 authored citation contexts, and checked 521 answer-edit truncations. Integrated test and visual results are recorded in pwc-us-state-review.md. This is a local candidate; no practitioner approval or release is implied.

## State-flow presentation correction

Ben's follow-up removes the redundant selected-state recap, completed-results counter and automated-check qualifier beside the source date. Headings and validation/reset messages receive clear separation; closed question disclosures sit together. Results use consistent state gaps, compact verdict padding and action spacing, and one state-name label. The source metadata and exported record still carry the actual review status. These rules are recorded in the Toolkit design system.
