// Curated mention aliases, keyed by source id (a content/sources/ file name). Article and section
// numbers resolve by rule in engine/mentions.js; this table carries what rules cannot
// infer: case names, guidance short names, statutes known by an acronym, and the defined
// terms that open a definition. Names match whole words, case-sensitive; terms match
// case-insensitively and link only their first occurrence in a block of text.
//
// `instrument: true` marks a short name for a whole instrument that the registry records as
// one provision (PECR -> reg 6). The bare name links only in paths that cite that provision.
// No lookbehind assertions (see engine/mentions.js): a term that needs a left boundary
// captures it as group 1 and sets `lead: true`.

export const NAMED_MENTIONS = [
  // CJEU and national cases
  { id: 'case-schrems-ii', names: ['Schrems II'] },
  { id: 'case-schrems-i', names: ['Schrems I'] },
  { id: 'case-planet49', names: ['Planet49'] },
  { id: 'case-breyer', names: ['Breyer'] },
  { id: 'case-meta-bka', names: ['Meta Platforms v Bundeskartellamt', 'Meta v Bundeskartellamt', 'Bundeskartellamt', 'Meta Platforms'] },
  { id: 'case-fashion-id', names: ['Fashion ID'] },
  { id: 'case-iab-tcf', names: ['IAB Europe'] },
  { id: 'case-vb-nap', names: ['VB v NAP'] },
  { id: 'case-x-fab', names: ['X-FAB'] },
  { id: 'case-google-spain', names: ['Google Spain'] },
  { id: 'case-knltb', names: ['KNLTB'] },
  { id: 'case-schufa', names: ['SCHUFA'] },
  { id: 'case-dun-bradstreet', names: ['Dun & Bradstreet'] },
  { id: 'case-cothron-white-castle', names: ['Cothron v White Castle', 'Cothron'] },
  { id: 'case-patel-facebook', names: ['Patel v Facebook'] },
  { id: 'case-transunion-ramirez', names: ['TransUnion v Ramirez', 'TransUnion'] },
  { id: 'case-cnil-google-cookies', names: ['CNIL v Google', 'CNIL Google'] },
  // Guidance and standards
  { id: 'guide-wp29-wp248-dpia', names: ['WP248'] },
  { id: 'guide-wp29-wp243-dpo', names: ['WP243'] },
  { id: 'guide-wp29-wp251-adm', names: ['WP251'] },
  { id: 'wp29-wp194', names: ['WP194'] },
  { id: 'enisa-severity-2013', names: ['ENISA'] },
  { id: 'std-nist-800-30', names: ['NIST SP 800-30'] },
  { id: 'std-iso-27005', names: ['ISO/IEC 27005'] },
  { id: 'ico-aadc', names: ['Age Appropriate Design Code', "Children's code", 'AADC'] },
  { id: 'guide-ico-tra', names: ['TRA tool'] },
  // Statutes known by an acronym or a short name
  { id: 'uk-duaa-2025', names: ['Data (Use and Access) Act 2025', 'Data (Use and Access) Act', 'DUAA 2025', 'DUAA'] },
  { id: 'uk-pecr-reg-6', names: ['PECR reg. 6', 'PECR reg 6', 'PECR'], instrument: true },
  { id: 'il-bipa-15', names: ['BIPA'], instrument: true },
  { id: 'il-pipa-10', names: ['PIPA'], instrument: true },
  { id: 'coppa-rule-312', names: ['COPPA Rule'] },
  { id: 'coppa-6502', names: ['COPPA'] },
  { id: 'ny-shield-bb', names: ['SHIELD Act', 'SHIELD'], instrument: true },
  { id: 'nydfs-500-17', names: ['NYDFS'], instrument: true },
  { id: 'bdsg-38', names: ['BDSG'], instrument: true },
  { id: 'gdpr-recitals-75-76', names: ['Recitals 75-76', 'Recitals 75–76', 'Recital 75', 'Recital 76'] },
  { id: 'eu-ai-act-annex-iii', names: ['Annex III'] }
];

// Defined terms: one link per block of text, gated by the wizard's family so "controller" in
// an AI Act path is not sent to the GDPR definition, and by the node's cited jurisdictions.
// `ukId` names the UK GDPR provision to open instead where the sentence or node reads UK.
// Order matters: a longer term that contains a shorter one (joint controller / controller)
// is listed first.
export const DEFINED_TERMS = [
  { id: 'gdpr-art-4', para: '(12)', pattern: /\bpersonal[- ]data breach(?:es)?\b/i, families: ['GDPR'] },
  { id: 'gdpr-art-26', para: null, pattern: /\bjoint controllers?\b/i, families: ['GDPR'] },
  { id: 'gdpr-art-4', para: '(7)', pattern: /(^|[^\w-])controllers?\b/i, lead: true, families: ['GDPR'] },
  { id: 'gdpr-art-4', para: '(8)', pattern: /(^|[^\w-])processors?\b/i, lead: true, families: ['GDPR'] },
  { id: 'gdpr-art-4', para: '(14)', pattern: /\bbiometric data\b/i, families: ['GDPR'] },
  { id: 'gdpr-art-9', para: null, pattern: /\bspecial[- ]categor(?:y|ies)\b/i, families: ['GDPR'] },
  { id: 'gdpr-art-37', ukId: 'uk-gdpr-art-37', para: null, pattern: /\bdata protection officer\b|\bDPO\b/, families: ['GDPR'] },
  { id: 'gdpr-art-46', para: '(2)', pattern: /\bSCCs?\b|\bstandard contractual clauses\b/i, families: ['GDPR'] },
  { id: 'eu-ai-act-art-3-roles', para: null, pattern: /\b(?:providers?|deployers?|importers?|distributors?)\b/i, families: ['AI Act'] },
  { id: 'eu-ai-act-art-6', para: null, pattern: /\bhigh-risk\b/i, families: ['AI Act'] },
  { id: 'eu-ai-act-ch5-gpai', para: null, pattern: /\bGPAI\b|\bgeneral-purpose AI models?\b/i, families: ['AI Act'] }
];

// Per-wizard overrides for a bare article number whose regime the text leaves implicit.
export const ARTICLE_OVERRIDES = {
  cookies: { 5: { para: /^\(3\)/, id: 'eprivacy-art-5' } }
};
