export const categories = [
  { id: 'incidents', label: 'Incidents', wizardIds: ['breach', 'severity'] },
  { id: 'data-use', label: 'Data use', wizardIds: ['sale-share', 'legal-basis', 'special-category', 'transfer'] },
  { id: 'governance', label: 'Governance', wizardIds: ['dpia', 'role', 'dpo', 'ropa'] },
  { id: 'rights-people', label: 'Rights & people', wizardIds: ['dsar', 'children', 'cookies', 'adm'] },
  { id: 'ai-systems', label: 'AI systems', wizardIds: ['ai-role', 'ai-risk'] }
];

export const commonWizardIds = ['breach', 'dpia', 'dsar', 'cookies', 'ai-risk'];

export function categoryForWizard(id) {
  return categories.find((category) => category.wizardIds.includes(id));
}
