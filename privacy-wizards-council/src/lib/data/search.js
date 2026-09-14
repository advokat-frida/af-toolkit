// Finder synonyms: the words practitioners type that the titles do not contain.
// Matching is case-insensitive substring; keep entries short and literal.
export const SEARCH_ALIASES = {
  breach: ['incident', '72 hours', 'notify', 'notification', 'ransomware', 'leak', 'hack', 'attorney general', 'regulator'],
  severity: ['how bad', 'harm', 'risk score', 'ENISA', 'impact'],
  'sale-share': ['sell', 'selling', 'share', 'sharing', 'targeted advertising', 'opt out', 'opt-out', 'GPC', 'Global Privacy Control', 'do not sell', 'CPRA', 'ad tech'],
  'legal-basis': ['lawful basis', 'legitimate interest', 'consent', 'contract', 'Art. 6', 'Article 6', 'LIA', 'balancing test'],
  'special-category': ['sensitive', 'health', 'biometric', 'Art. 9', 'Article 9', 'criminal', 'genetic', 'religion', 'sexual orientation'],
  transfer: ['international', 'SCC', 'standard contractual clauses', 'adequacy', 'DPF', 'Data Privacy Framework', 'Schrems', 'TIA', 'transfer impact assessment', 'export', 'third country'],
  dpia: ['impact assessment', 'risk assessment', 'Art. 35', 'Article 35', 'high risk', 'PIA', 'prior consultation'],
  role: ['controller', 'processor', 'vendor', 'sub-processor', 'subprocessor', 'DPA', 'data processing agreement', 'Art. 28', 'joint controller', 'supplier'],
  dpo: ['data protection officer', 'Art. 37', 'Article 37', 'appoint', 'designate'],
  ropa: ['records of processing', 'register', 'Art. 30', 'Article 30', 'RoPA', 'inventory', 'data map'],
  dsar: ['SAR', 'DSAR', 'subject access', 'access request', 'erasure', 'deletion', 'delete', 'right to be forgotten', 'portability', 'rectification', 'rights request', 'one month', '45 days', 'objection'],
  children: ['kids', 'minors', 'COPPA', 'age', 'parental consent', 'teen', 'under 13', 'under 16', "children's code", 'age assurance'],
  cookies: ['tracking', 'pixel', 'SDK', 'consent banner', 'ePrivacy', 'PECR', 'GPC', 'analytics', 'tag manager', 'fingerprint', 'local storage'],
  adm: ['automated decision', 'profiling', 'Art. 22', 'Article 22', 'algorithm', 'scoring', 'credit', 'ADMT', 'human review'],
  'ai-role': ['provider', 'deployer', 'importer', 'distributor', 'AI Act', 'value chain', 'authorised representative', 'authorized representative', 'fine-tune'],
  'ai-risk': ['high-risk', 'high risk', 'Annex III', 'prohibited', 'GPAI', 'AI Act', 'transparency', 'deepfake', 'chatbot', 'risk tier', 'emotion recognition']
};
