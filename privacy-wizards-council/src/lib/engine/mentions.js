// Inline citations: turn the article, section, guidance, case and term mentions inside the
// authored text into links to the source registry, so the reader opens the text where the
// mention is instead of leaving the tool. Resolution is conservative: a mention that does
// not map to exactly one registry source stays plain text. A wrong card would cost more
// than a missing one.
import { SOURCES, WIZARDS } from '../data/legacy.generated.js';
import { ARTICLE_OVERRIDES, DEFINED_TERMS, NAMED_MENTIONS } from '../data/mentions.js';
import { sourceTextPlain } from './council.js';

export function familyOf(sourceId) {
  const id = String(sourceId || '');
  if (id.startsWith('uk-gdpr-')) return 'UK GDPR';
  if (id.startsWith('gdpr-')) return 'GDPR';
  if (id.startsWith('eu-ai-act-')) return 'AI Act';
  if (id.startsWith('eprivacy-')) return 'ePrivacy';
  if (id.startsWith('dsa-')) return 'DSA';
  if (id.startsWith('ccpa-') || id.startsWith('ccr-') || id.startsWith('ca-')) return 'California';
  if (id.startsWith('ny-') || id.startsWith('nydfs-')) return 'New York';
  if (id.startsWith('il-')) return 'Illinois';
  if (id.startsWith('coppa-')) return 'COPPA';
  if (id.startsWith('uk-')) return 'UK';
  if (id.startsWith('case-')) return 'case';
  if (id.startsWith('guide-') || id.startsWith('wp29-') || id.startsWith('ico-')) return 'guidance';
  return 'other';
}

function nodeCites(node) {
  const ids = [...(node?.cites || [])];
  for (const option of node?.opts || []) ids.push(...(option.cites || []));
  return ids;
}

// What the text around a mention takes for granted: the wizard's regime family and
// whether the node reads in a UK context (it cites UK GDPR sources and no EU ones).
export function contextFor(wizardId, node = null) {
  const wizard = WIZARDS[wizardId];
  const family = String(wizardId || '').startsWith('ai-') ? 'AI Act' : 'GDPR';
  const cites = nodeCites(node);
  const uk = cites.some((id) => id.startsWith('uk-gdpr-')) && !cites.some((id) => id.startsWith('gdpr-art-'));
  return { wizardId: wizardId || null, family, uk, jurisdictions: wizard?.jurisdictions || [] };
}

const exists = (id) => Boolean(id && SOURCES[id]);

function firstParagraph(paras) {
  const first = String(paras || '').match(/\(([^)]+)\)/);
  return first ? `(${first[1]})` : null;
}

function resolveArticle(prefix, numberText, paras, context) {
  const letter = numberText.match(/^(\d+)([A-Da-d])?$/);
  if (!letter) return null;
  const number = Number(letter[1]);
  const suffix = (letter[2] || '').toUpperCase();
  const para = firstParagraph(paras);
  let family = context.family;
  if (/^UK GDPR/i.test(prefix)) family = 'UK GDPR';
  else if (/^GDPR/i.test(prefix)) family = 'GDPR';
  else if (/^AI Act/i.test(prefix)) family = 'AI Act';
  else if (/^ePrivacy/i.test(prefix)) family = 'ePrivacy';
  else if (/^DSA/i.test(prefix)) family = 'DSA';
  const explicit = Boolean(prefix);

  if (family === 'ePrivacy') return number === 5 && exists('eprivacy-art-5') ? { id: 'eprivacy-art-5', para } : null;
  if (family === 'DSA') return number === 28 && exists('dsa-art-28') ? { id: 'dsa-art-28', para } : null;
  if (family === 'AI Act') {
    let id = `eu-ai-act-art-${number}`;
    if (number === 3) id = 'eu-ai-act-art-3-roles';
    if (number >= 51 && number <= 55) id = 'eu-ai-act-ch5-gpai';
    return exists(id) ? { id, para } : null;
  }
  // GDPR family: Arts. 22A to 22D exist only in the UK GDPR.
  if (number === 22 && suffix) return exists('uk-gdpr-art-22a-d') ? { id: 'uk-gdpr-art-22a-d', para } : null;
  const override = !explicit && ARTICLE_OVERRIDES[context.wizardId]?.[number];
  if (override && para && override.para.test(para) && exists(override.id)) return { id: override.id, para };
  const wantsUk = family === 'UK GDPR' || (!explicit && context.uk);
  if (wantsUk) {
    const ukId = number === 22 ? 'uk-gdpr-art-22a-d' : `uk-gdpr-art-${number}`;
    if (exists(ukId)) return { id: ukId, para };
    if (family === 'UK GDPR') return null; // an explicit UK mention never gets the EU text
  }
  if (number === 6 && para && /^\((2|3)\)/.test(para) && exists('gdpr-art-6-3')) return { id: 'gdpr-art-6-3', para };
  const id = `gdpr-art-${number}`;
  return exists(id) ? { id, para } : null;
}

const guidanceIndex = new Map();
const caseIndex = new Map();
for (const [id, source] of Object.entries(SOURCES)) {
  const label = String(source.label || '');
  if (id.startsWith('guide-') || id.startsWith('wp29-')) {
    const m = label.match(/\b(Guidelines|Recommendations|Opinion)\s+(\d{1,2})\/(\d{4})\b/);
    if (m) guidanceIndex.set(`${Number(m[2])}/${m[3]}`, id);
  }
  if (id.startsWith('case-')) {
    const m = label.match(/\bC-(\d+)\/(\d+)\b/);
    if (m) caseIndex.set(`C-${m[1]}/${m[2]}`, id);
  }
}

const nameIndex = [];
for (const entry of NAMED_MENTIONS) {
  if (!exists(entry.id)) continue;
  for (const name of entry.names) nameIndex.push({ id: entry.id, name });
}
nameIndex.sort((a, b) => b.name.length - a.name.length);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const namePattern = nameIndex.length ? new RegExp(`(?<![\\w-])(?:${nameIndex.map((n) => escapeRegex(n.name)).join('|')})(?![\\w-])`, 'g') : null;
const nameById = new Map(nameIndex.map((n) => [n.name, n.id]));

const ARTICLE = /(UK GDPR |GDPR |AI Act |ePrivacy(?: Directive)? |DSA )?Art(?:icle|s?\.)\s?(\d+[A-Da-d]?)((?:\s?\(\w+\))*)(?:\s?(?:–|-|to)\s?\d+[A-Da-d]?)?/g;
const ARTICLE_29_WP = /Article 29 (?:WP|Working Party)/g;
const CAL = /(?:Cal\. Civ\. Code\s+)?§{1,2}\s?1798\.(\d+)(?:\.\d+)?((?:\(\w+\))*)/g;
const NY = /(?:NY GBL\s+|GBL\s+)?§\s?899-(aa|bb)((?:\(\w+\))*)/g;
const NYDFS = /(?:23 NYCRR\s+)?§\s?500\.17\b/g;
const CCR = /(?:11 CCR\s+|CCR\s+)?§\s?(70\d\d|7150)\b((?:\(\w+\))*)/g;
const IL_PIPA = /(?:IL PIPA\s+|PIPA\s+)?Sec\.\s?10\b((?:\(\w+\))*)/g;
const IL_BIPA = /(?:BIPA\s+)?Sec\.\s?(15|20)\b((?:\(\w+\))*)/g;
const COPPA_STATUTE = /(?:15 U\.S\.C\.\s+)?§\s?6502\b/g;
const COPPA_RULE = /(?:16 CFR\s+)?(?:§{1,2}\s?312\.\d+|Part 312)\b((?:\(\w+\))*)/g;
const BDSG = /(?:BDSG\s+)?§\s?38\b((?:\(\d+\))*)/g;
const UK_DPA = /DPA 2018\s+(?:ss?\.\s?(\d+)|Sch(?:edule|\.)?\s?(\d)\b)/g;
const UK_BARE_SECTION = /(?<![\w.])s\.\s?(9|10|11|14|123|157)\b(?![\w.])/g;
const PECR = /(?:PECR\s+)?\breg\.?\s?6\b/g;
const GUIDANCE = /(?:EDPB\s+|Article 29 WP\s+|WP29\s+)?(Guidelines|Recommendations|Opinion)\s+(\d{1,2})\/(\d{4})\b/g;
const CASE = /\bC-(\d+)\/(\d+)(?: P)?\b/g;

function ukSection(section) {
  const map = { 9: 'uk-dpa-2018-s9', 10: 'uk-dpa-2018-s10-sch1', 11: 'uk-dpa-2018-s10-sch1', 14: 'uk-dpa-2018-s14', 123: 'uk-dpa2018-s123', 157: 'uk-dpa-2018-s157' };
  return map[Number(section)] || null;
}

// The rule set. Each rule finds matches and resolves them; `null` from resolve means the
// span is consumed as plain text (so an inner, shorter pattern cannot mis-link it).
function rules(context, text) {
  const list = [
    { re: GUIDANCE, resolve: (m) => ({ id: guidanceIndex.get(`${Number(m[2])}/${m[3]}`) || null, para: null }) },
    { re: ARTICLE_29_WP, resolve: () => ({ id: null }) },
    { re: ARTICLE, resolve: (m) => resolveArticle(m[1] || '', m[2], m[3], context) },
    { re: CAL, resolve: (m) => ({ id: exists(`ccpa-1798-${m[1]}`) ? `ccpa-1798-${m[1]}` : exists(`ca-1798-${m[1]}`) ? `ca-1798-${m[1]}` : null, para: firstParagraph(m[2]) }) },
    { re: NY, resolve: (m) => ({ id: `ny-shield-${m[1]}`, para: firstParagraph(m[2]) }) },
    { re: NYDFS, resolve: () => ({ id: 'nydfs-500-17', para: null }) },
    { re: CCR, resolve: (m) => ({ id: exists(`ccr-${m[1]}`) ? `ccr-${m[1]}` : null, para: firstParagraph(m[2]) }) },
    { re: IL_PIPA, resolve: (m) => ({ id: 'il-pipa-10', para: firstParagraph(m[1]) }) },
    { re: IL_BIPA, resolve: (m) => ({ id: `il-bipa-${m[1]}`, para: firstParagraph(m[2]) }) },
    { re: COPPA_STATUTE, resolve: () => ({ id: 'coppa-6502', para: null }) },
    { re: COPPA_RULE, resolve: () => ({ id: 'coppa-rule-312', para: null }) },
    { re: BDSG, resolve: (m) => (context.wizardId === 'dpo' || /BDSG/.test(m[0]) ? { id: 'bdsg-38', para: firstParagraph(m[1]) } : { id: null }) },
    { re: UK_DPA, resolve: (m) => ({ id: m[1] ? ukSection(m[1]) : m[2] === '1' ? 'uk-dpa-2018-s10-sch1' : m[2] === '2' ? 'uk-dpa-2018-sch2' : null, para: null }) },
    { re: PECR, resolve: () => ({ id: 'uk-pecr-reg-6', para: null }) },
    { re: CASE, resolve: (m) => ({ id: caseIndex.get(`C-${m[1]}/${m[2]}`) || null, para: null }) }
  ];
  if (/DPA 2018/.test(text)) list.push({ re: UK_BARE_SECTION, resolve: (m) => ({ id: ukSection(m[1]), para: null }) });
  if (namePattern) list.push({ re: namePattern, resolve: (m) => ({ id: nameById.get(m[0]) || null, para: null }) });
  return list;
}

// Split a block of authored text into plain segments and resolved mentions. `termsSeen`
// may be shared across sibling blocks (the actions of one outcome) so a defined term links
// once per group rather than once per line.
export function tokenize(text, context = contextFor(null), termsSeen = new Set()) {
  const value = String(text || '');
  if (!value) return [];
  const candidates = [];
  for (const rule of rules(context, value)) {
    rule.re.lastIndex = 0;
    for (const match of value.matchAll(rule.re)) {
      if (!match[0]) continue;
      const resolved = rule.resolve(match) || { id: null };
      candidates.push({ start: match.index, end: match.index + match[0].length, text: match[0], id: exists(resolved.id) ? resolved.id : null, para: resolved.para || null });
    }
  }
  // Defined terms: first occurrence per block (or per shared group), family-gated, and only
  // where no rule matched.
  for (const term of DEFINED_TERMS) {
    if (!term.families.includes(context.family) || !exists(term.id)) continue;
    const key = `${term.id}:${term.para || ''}`;
    if (termsSeen.has(key)) continue;
    const re = new RegExp(term.pattern.source, term.pattern.flags.includes('g') ? term.pattern.flags : `${term.pattern.flags}g`);
    for (const match of value.matchAll(re)) {
      const start = match.index;
      const end = start + match[0].length;
      const covered = candidates.some((c) => c.start < end && start < c.end);
      if (covered) continue;
      candidates.push({ start, end, text: match[0], id: term.id, para: term.para, term: true });
      termsSeen.add(key);
      break;
    }
  }
  candidates.sort((a, b) => a.start - b.start || b.end - a.end);
  const segments = [];
  let cursor = 0;
  for (const candidate of candidates) {
    if (candidate.start < cursor) continue; // overlapped by an earlier, longer match
    if (candidate.start > cursor) segments.push({ text: value.slice(cursor, candidate.start) });
    if (candidate.id) segments.push({ text: candidate.text, sourceId: candidate.id, para: candidate.para });
    else segments.push({ text: candidate.text });
    cursor = candidate.end;
  }
  if (cursor < value.length) segments.push({ text: value.slice(cursor) });
  // Merge adjacent plain segments, and two links to the same source separated only by
  // whitespace ("COPPA § 6502") into one link.
  const merged = [];
  for (const segment of segments) {
    const last = merged[merged.length - 1];
    const before = merged[merged.length - 2];
    if (last && !last.sourceId && !segment.sourceId) {
      last.text += segment.text;
    } else if (segment.sourceId && last && !last.sourceId && /^\s+$/.test(last.text) && before?.sourceId === segment.sourceId) {
      before.text += last.text + segment.text;
      before.para = before.para || segment.para;
      merged.pop();
    } else if (segment.sourceId && last?.sourceId === segment.sourceId) {
      last.text += segment.text;
      last.para = last.para || segment.para;
    } else {
      merged.push({ ...segment });
    }
  }
  return merged;
}

// The paragraph a mention points at, from the source's plain text: "(1)" and "1." markers.
export function paragraphFor(sourceId, para) {
  const source = SOURCES[sourceId];
  const plain = sourceTextPlain(source?.body);
  if (!plain) return { focus: null, full: '' };
  if (!para) return { focus: null, full: plain };
  const number = para.replace(/[()]/g, '');
  const paragraphs = plain.split(/\n\n+/).map((p) => p.trim());
  const focus = paragraphs.find((p) => p.startsWith(`${para} `) || p.startsWith(`${para}\n`) || p.startsWith(`${number}. `) || p.startsWith(`${para}(`)) || null;
  return { focus, full: plain };
}

export function mentionCard(sourceId, para) {
  const source = SOURCES[sourceId];
  if (!source) return null;
  const { focus, full } = paragraphFor(sourceId, para);
  return { id: sourceId, label: source.label, citation: source.citation, provenance: source.provenance || source.url || null, kind: source.kind || 'authority', juris: source.juris || '', para: focus ? para : null, focus, full };
}
