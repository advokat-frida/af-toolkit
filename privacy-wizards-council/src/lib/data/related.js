// Next determination: the path a reader most often needs after this one. One row per
// outcome, never more than two. Keys and values are wizard ids in legacy.generated.js.
export const RELATED = {
  breach: ['severity'],
  severity: ['breach'],
  'sale-share': ['cookies'],
  'legal-basis': ['special-category'],
  'special-category': ['legal-basis'],
  transfer: ['role'],
  dpia: ['role'],
  role: ['dpo'],
  dpo: ['ropa'],
  ropa: ['dpia'],
  dsar: ['role'],
  children: ['cookies'],
  cookies: ['sale-share'],
  adm: ['ai-risk'],
  'ai-role': ['ai-risk'],
  'ai-risk': ['ai-role']
};
