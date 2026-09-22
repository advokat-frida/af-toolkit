// Next determination: the path a reader most often needs after this one, never more than
// two. Keys and values are path ids in content/registry.json. An outcome drops a path that
// shares no jurisdiction with the law it cites (relatedWizardIds), so a second id serves the
// readers the first one does not.
export const RELATED = {
  'us-applicability': ['us-divergence'],
  'us-divergence': ['us-applicability', 'dsar'],
  breach: ['severity'],
  severity: ['breach'],
  'sale-share': ['cookies', 'dsar'],
  'legal-basis': ['special-category'],
  'special-category': ['legal-basis'],
  transfer: ['role'],
  dpia: ['role'],
  role: ['dpo'],
  dpo: ['ropa'],
  ropa: ['dpia'],
  dsar: ['role'],
  children: ['cookies'],
  cookies: ['sale-share', 'legal-basis'],
  adm: ['ai-risk'],
  'ai-role': ['ai-risk'],
  'ai-risk': ['ai-role']
};
