export const categories = [
  { id: 'incidents', label: 'Incidents', wizardIds: ['breach', 'severity'] },
  { id: 'data-use', label: 'Data use', wizardIds: ['sale-share', 'legal-basis', 'special-category', 'transfer'] },
  { id: 'governance', label: 'Governance', wizardIds: ['dpia', 'role', 'dpo', 'ropa'] },
  { id: 'rights-people', label: 'Rights & people', wizardIds: ['dsar', 'children', 'cookies', 'adm'] },
  { id: 'ai-systems', label: 'AI systems', wizardIds: ['ai-role', 'ai-risk'] }
];

// The five rows the finder shows before a search. Privacy first (Ben, 2026-09-14):
// Cross-border transfer replaced AI Act risk tier.
export const commonWizardIds = ['breach', 'dpia', 'dsar', 'cookies', 'transfer'];

export function categoryForWizard(id) {
  return categories.find((category) => category.wizardIds.includes(id));
}
