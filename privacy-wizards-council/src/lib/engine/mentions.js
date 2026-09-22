// Inline citations: turn the article, section, guidance, case and term mentions inside the
// authored text into links to the source registry, so the reader opens the text where the
// mention is instead of leaving the tool. Resolution is conservative: a mention that does
// not map to exactly one registry source stays plain text. A wrong card would cost more
// than a missing one.
//
// No lookbehind assertions here or in data/mentions.js: Safari before 16.4 rejects them when
// it parses the script, and the whole tool would fail to load. A pattern that needs a left
// boundary captures it as its first group instead and says so with `lead: true`.
import { SOURCE_MANIFEST } from '../data/manifest.generated.js';
import { SOURCES, WIZARDS } from '../data/registry.generated.js';
import { ARTICLE_OVERRIDES, DEFINED_TERMS, NAMED_MENTIONS } from '../data/mentions.js';
import { sentenceBreaks, sourceTextPlain, wizardSourceIds } from './council.js';

const own = (object, key) => Boolean(object) && Object.prototype.hasOwnProperty.call(object, key);
// Only a source a published path may rely on opens from the text. A draft or superseded record
// stays plain, so unreviewed text never reaches a reader through a citation card.
const LINKABLE = new Set(['automated-check-only', 'practitioner-reviewed']);
const exists = (id) => Boolean(id) && own(SOURCES, id) && LINKABLE.has(SOURCE_MANIFEST[id]?.status);

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

const pathCitations = new Map();
function citedByPath(wizardId) {
  if (!own(WIZARDS, wizardId)) return null;
  if (!pathCitations.has(wizardId)) pathCitations.set(wizardId, new Set(wizardSourceIds(WIZARDS[wizardId])));
  return pathCitations.get(wizardId);
}

// What the text around a mention takes for granted: the wizard's regime family, whether the
// node reads in a UK context (it cites UK GDPR sources and no EU ones), what the node and the
// whole path cite, and the jurisdictions of the law the node cites.
export function contextFor(wizardId, node = null) {
  const wizard = own(WIZARDS, wizardId) ? WIZARDS[wizardId] : null;
  const family = String(wizardId || '').startsWith('ai-') ? 'AI Act' : 'GDPR';
  const cites = nodeCites(node);
  const uk = cites.some((id) => id.startsWith('uk-gdpr-')) && !cites.some((id) => id.startsWith('gdpr-art-'));
  return {
    wizardId: wizardId || null,
    family,
    uk,
    jurisdictions: wizard?.jurisdictions || [],
    cites: new Set(cites),
    citedJuris: new Set(cites.map((id) => SOURCES[id]?.juris).filter(Boolean)),
    pathCites: citedByPath(wizardId)
  };
}

// Paragraph chains: "(1)(f)" as written after an article or section number, as tokens.
const chainTokens = (text) => [...String(text || '').matchAll(/\(([0-9A-Za-z]{1,4})\)/g)].map((match) => match[1]);
function paraChain(text) {
  const tokens = chainTokens(text);
  return tokens.length ? tokens.map((token) => `(${token})`).join('') : null;
}

// A source that holds only some paragraphs of its provision lists them in its citation, right
// after its own number: "Art. 3(3)-(8), (23), (63)", "Art. 5(2)", "§ 1798.145(h)(3)". A mention
// of a paragraph outside that list would open unrelated text, so it stays plain.
const coverage = new Map();
function coveredChains(sourceId) {
  if (coverage.has(sourceId)) return coverage.get(sourceId);
  const citation = String(SOURCES[sourceId]?.citation || '');
  const head = citation.match(/(?:Arts?\.|§)\s?[\d.]*\d/);
  const list = head && citation.slice(head.index + head[0].length).match(/^(?:\([0-9A-Za-z]{1,4}\))+(?:\s?(?:[-–]|,)\s?(?:\([0-9A-Za-z]{1,4}\))+)*/);
  let chains = null;
  if (list) {
    chains = [];
    for (const part of list[0].split(/\s?,\s?/)) {
      const range = part.match(/^\((\d+)\)\s?[-–]\s?\((\d+)\)$/);
      if (range) for (let n = Number(range[1]); n <= Number(range[2]); n += 1) chains.push([String(n)]);
      else chains.push(chainTokens(part));
    }
  }
  coverage.set(sourceId, chains);
  return chains;
}

function covers(sourceId, para) {
  const chains = coveredChains(sourceId);
  if (!chains || !para) return true;
  const tokens = chainTokens(para);
  return chains.some((chain) => chain.every((token, index) => tokens[index] === undefined || tokens[index] === token));
}

// EU or UK text for a mention whose words leave the regime open. The most specific signal
// wins: the node cites only one of the two provisions; the clause around the mention names
// only one regime; the node reads in a UK context. With no UK source, the EU text opens.
const UK_MARKERS = /\bUK\b|\bICO\b|\bDPA 2018\b|\bPECR\b|\bDUAA\b|United Kingdom|Information Commission/;
const EU_MARKERS = /\bEU\b|\bEEA\b|\bEDPB\b|\bCJEU\b|\bSAs?\b|European|Member States?\b|supervisory authorit|\bGDPR and UK GDPR\b|\bUK GDPR and (?:the )?GDPR\b/;

function regimeId(context, clause, euId, ukId) {
  const cites = context.cites;
  if (cites && cites.has(ukId) !== cites.has(euId)) return cites.has(ukId) && exists(ukId) ? ukId : exists(euId) ? euId : null;
  const ukHint = UK_MARKERS.test(clause);
  const uk = ukHint !== EU_MARKERS.test(clause) ? ukHint : Boolean(context.uk);
  if (uk && exists(ukId)) return ukId;
  return exists(euId) ? euId : null;
}

function resolveArticle(prefix, numberText, paras, context, clause) {
  const parsed = numberText.match(/^(\d+)([A-Da-d])?$/);
  if (!parsed) return null;
  const number = Number(parsed[1]);
  const para = paraChain(paras);
  let family = context.family;
  if (/^UK GDPR/i.test(prefix)) family = 'UK GDPR';
  else if (/^GDPR/i.test(prefix)) family = 'GDPR';
  else if (/^AI Act/i.test(prefix)) family = 'AI Act';
  else if (/^ePrivacy/i.test(prefix)) family = 'ePrivacy';
  else if (/^DSA/i.test(prefix)) family = 'DSA';
  const explicit = Boolean(prefix);

  // A lettered article is a different provision from its base number. The only lettered
  // articles the registry holds are the UK GDPR's Arts. 22A to 22D.
  if (parsed[2]) return number === 22 && (family === 'GDPR' || family === 'UK GDPR') ? { id: 'uk-gdpr-art-22a-d', para } : null;
  if (family === 'ePrivacy') return number === 5 ? { id: 'eprivacy-art-5', para } : null;
  if (family === 'DSA') return number === 28 ? { id: 'dsa-art-28', para } : null;
  if (family === 'AI Act') {
    let id = `eu-ai-act-art-${number}`;
    if (number === 3) id = 'eu-ai-act-art-3-roles';
    if (number >= 51 && number <= 55) id = 'eu-ai-act-ch5-gpai';
    return { id, para };
  }
  const overrides = !explicit && own(ARTICLE_OVERRIDES, context.wizardId) ? ARTICLE_OVERRIDES[context.wizardId] : null;
  const override = overrides && own(overrides, number) ? overrides[number] : null;
  if (override && para && override.para.test(para) && exists(override.id)) return { id: override.id, para };
  const ukId = number === 22 ? 'uk-gdpr-art-22a-d' : `uk-gdpr-art-${number}`;
  if (family === 'UK GDPR') return exists(ukId) ? { id: ukId, para } : null; // an explicit UK mention never gets the EU text
  const euId = number === 6 && para && /^\((2|3)\)/.test(para) ? 'gdpr-art-6-3' : `gdpr-art-${number}`;
  if (explicit) return { id: euId, para };
  // "Art. 22" beside "Arts. 22A–22D" is the original article the UK replaced.
  if (number === 22 && /\b22A\b/.test(clause)) return { id: euId, para };
  return { id: regimeId(context, clause, euId, ukId), para };
}

const guidanceIndex = new Map();
const caseIndex = new Map();
for (const [id, source] of Object.entries(SOURCES)) {
  if (!exists(id)) continue;
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
const namePattern = nameIndex.length ? new RegExp(`(^|[^\\w-])(${nameIndex.map((n) => escapeRegex(n.name)).join('|')})(?![\\w-])`, 'g') : null;
const nameById = new Map(nameIndex.map((n) => [n.name, n.id]));
const instrumentIds = new Set(NAMED_MENTIONS.filter((entry) => entry.instrument).map((entry) => entry.id));

// An instrument known by its short name ("PECR", "BIPA") is recorded as one provision of it.
// The bare name links only in a path that cites that provision; elsewhere the text may mean
// another part of the instrument (PECR reg 5A in the breach path, not reg 6).
function resolveName(name, context) {
  const id = nameById.get(name) || null;
  if (id && instrumentIds.has(id) && context.pathCites && !context.pathCites.has(id)) return null;
  return { id };
}

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
const UK_BARE_SECTION = /(^|[^\w.])s\.\s?(9|10|11|14|123|157)\b(?![\w.])/g;
const PECR = /(?:PECR\s+)?\breg\.?\s?6\b/g;
const GUIDANCE = /(?:EDPB\s+|Article 29 WP\s+|WP29\s+)?(Guidelines|Recommendations|Opinion)\s+(\d{1,2})\/(\d{4})\b/g;
const CASE = /\bC-(\d+)\/(\d+)(?: P)?\b/g;

function ukSection(section) {
  const map = { 9: 'uk-dpa-2018-s9', 10: 'uk-dpa-2018-s10-sch1', 11: 'uk-dpa-2018-s10-sch1', 14: 'uk-dpa-2018-s14', 123: 'uk-dpa2018-s123', 157: 'uk-dpa-2018-s157' };
  return map[Number(section)] || null;
}

// The rule set. Each rule finds matches and resolves them; `null` from resolve means the span
// is consumed as plain text, so an inner, shorter pattern cannot mis-link it.
function rules(context, text, clauseAt) {
  const list = [
    { re: GUIDANCE, resolve: (m) => ({ id: guidanceIndex.get(`${Number(m[2])}/${m[3]}`) || null }) },
    { re: ARTICLE_29_WP, resolve: () => null },
    { re: ARTICLE, resolve: (m) => resolveArticle(m[1] || '', m[2], m[3], context, clauseAt(m.index)) },
    { re: CAL, resolve: (m) => ({ id: exists(`ccpa-1798-${m[1]}`) ? `ccpa-1798-${m[1]}` : `ca-1798-${m[1]}`, para: paraChain(m[2]) }) },
    { re: NY, resolve: (m) => ({ id: `ny-shield-${m[1]}`, para: paraChain(m[2]) }) },
    { re: NYDFS, resolve: () => ({ id: 'nydfs-500-17' }) },
    { re: CCR, resolve: (m) => ({ id: `ccr-${m[1]}`, para: paraChain(m[2]) }) },
    { re: IL_PIPA, resolve: (m) => ({ id: 'il-pipa-10', para: paraChain(m[1]) }) },
    { re: IL_BIPA, resolve: (m) => ({ id: `il-bipa-${m[1]}`, para: paraChain(m[2]) }) },
    { re: COPPA_STATUTE, resolve: () => ({ id: 'coppa-6502' }) },
    // One source holds all of Part 312, so a paragraph after a section number could sit in
    // any section of it: the card opens on the whole text.
    { re: COPPA_RULE, resolve: () => ({ id: 'coppa-rule-312' }) },
    { re: BDSG, resolve: (m) => (context.wizardId === 'dpo' || /BDSG/.test(m[0]) ? { id: 'bdsg-38', para: paraChain(m[1]) } : null) },
    { re: UK_DPA, resolve: (m) => ({ id: m[1] ? ukSection(m[1]) : m[2] === '1' ? 'uk-dpa-2018-s10-sch1' : m[2] === '2' ? 'uk-dpa-2018-sch2' : null }) },
    { re: PECR, resolve: () => ({ id: 'uk-pecr-reg-6' }) },
    { re: CASE, resolve: (m) => ({ id: caseIndex.get(`C-${m[1]}/${m[2]}`) || null }) }
  ];
  if (/DPA 2018/.test(text)) list.push({ re: UK_BARE_SECTION, lead: true, resolve: (m) => ({ id: ukSection(m[2]) }) });
  if (namePattern) list.push({ re: namePattern, lead: true, resolve: (m) => resolveName(m[2], context) });
  return list;
}

// Split a block of authored text into plain segments and resolved mentions. `termsSeen` may
// be shared across sibling blocks (the actions of one outcome) so a defined term links once
// per group rather than once per line.
export function tokenizeWithLinks(text, context = contextFor(null), termsSeen = new Set()) {
  const value = String(text || '');
  const segments = [];
  let cursor = 0;
  // Authored resource links only: HTTPS, a plain label, and no embedded HTML.
  for (const match of value.matchAll(/\[([^\]\r\n]+)\]\((https:\/\/[^\s)]+)\)/g)) {
    let url;
    try { url = new URL(match[2]); } catch { continue; }
    if (url.protocol !== 'https:' || url.username || url.password) continue;
    segments.push(...tokenize(value.slice(cursor, match.index), context, termsSeen));
    segments.push({ text: match[1], href: url.href });
    cursor = match.index + match[0].length;
  }
  segments.push(...tokenize(value.slice(cursor), context, termsSeen));
  return segments;
}

export function tokenize(text, context = contextFor(null), termsSeen = new Set()) {
  const value = String(text || '');
  if (!value) return [];
  const breaks = sentenceBreaks(value);
  // The clause around a position: its sentence, cut at semicolons, so "(Art. 22; UK: Arts.
  // 22A–22D)" keeps the UK signal on the UK half.
  const clauseAt = (index) => {
    let start = 0;
    let end = value.length;
    for (const cut of breaks) {
      if (cut <= index) start = cut;
      else {
        end = cut;
        break;
      }
    }
    const before = value.lastIndexOf(';', index - 1);
    const after = value.indexOf(';', index);
    if (before >= start) start = before + 1;
    if (after >= 0 && after < end) end = after;
    return value.slice(start, end);
  };
  const candidates = [];
  for (const rule of rules(context, value, clauseAt)) {
    rule.re.lastIndex = 0;
    for (const match of value.matchAll(rule.re)) {
      const lead = rule.lead ? match[1] || '' : '';
      const start = match.index + lead.length;
      const end = match.index + match[0].length;
      if (start === end) continue;
      const resolved = rule.resolve(match);
      const id = exists(resolved?.id) && covers(resolved.id, resolved.para) ? resolved.id : null;
      candidates.push({ start, end, text: value.slice(start, end), id, para: id ? resolved.para || null : null });
    }
  }
  // Defined terms: first occurrence per block (or per shared group), family-gated, only where
  // no rule matched, and only where the node cites law of the definition's jurisdiction: the
  // GDPR's "biometric data" is not the Illinois or California meaning.
  for (const term of DEFINED_TERMS) {
    if (!term.families.includes(context.family)) continue;
    const key = `${term.id}:${term.para || ''}`;
    if (termsSeen.has(key)) continue;
    const flags = term.pattern.flags.includes('g') ? term.pattern.flags : `${term.pattern.flags}g`;
    for (const match of value.matchAll(new RegExp(term.pattern.source, flags))) {
      const lead = term.lead ? match[1] || '' : '';
      const start = match.index + lead.length;
      const end = match.index + match[0].length;
      if (start === end || candidates.some((c) => c.start < end && start < c.end)) continue;
      const id = term.ukId ? regimeId(context, clauseAt(start), term.id, term.ukId) : exists(term.id) ? term.id : null;
      if (!id || !context.citedJuris?.has(SOURCES[id].juris)) continue;
      candidates.push({ start, end, text: value.slice(start, end), id, para: term.para || null, term: true });
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

// The markers a line of included text opens with, as tokens: "1." "1a." "(a)" "1.(b)" "(a) (1)".
const MARKER = /^\s?(?:(\d{1,3}[a-z]{0,2})\.(?=\s|\(|$)|\(([0-9A-Za-z]{1,4})\))/;
function lineTokens(line) {
  const tokens = [];
  let rest = line;
  for (let match = rest.match(MARKER); match; match = rest.match(MARKER)) {
    tokens.push(match[1] || match[2]);
    rest = rest.slice(match[0].length);
  }
  return tokens;
}

const kindOf = (token) => (/^\d+[a-z]*$/.test(token) ? 'number' : /^[a-z]+$/.test(token) ? 'lower' : /^[A-Z]+$/.test(token) ? 'upper' : 'other');
const startsWith = (tokens, chain) => chain.every((token, index) => tokens[index] === token);

// Find the line a chain points at. A line may carry the whole chain ("(c)(4)", "8.(a)"), or
// the chain may descend through separate lines ("3." then "(a)"). Each step searches only
// inside its parent: a line opening with a marker of the parent's kind ends the parent.
function locate(lines, chain) {
  const parents = [];
  const ends = new Set();
  let from = 0;
  for (let depth = 0; depth < chain.length; depth += 1) {
    const rest = chain.slice(depth);
    let parent = -1;
    for (let index = from; index < lines.length; index += 1) {
      const { tokens } = lines[index];
      if (!tokens.length) continue;
      if (ends.has(kindOf(tokens[0]))) break;
      if (startsWith(tokens, rest)) return { parents, index };
      if (parent < 0 && tokens[0] === rest[0]) parent = index;
    }
    if (parent < 0) return null;
    parents.push(parent);
    ends.add(kindOf(rest[0]));
    from = parent + 1;
  }
  return { parents, index: parents.pop() };
}

// The cited line, what belongs to it (unmarked continuation lines and deeper markers), and the
// parent lines above it, with "[…]" where lines were skipped.
function focusText(lines, found, chain) {
  const ends = new Set(chain.map(kindOf));
  const body = [lines[found.index].text];
  for (let index = found.index + 1; index < lines.length; index += 1) {
    const { tokens, text } = lines[index];
    if (tokens.length && !startsWith(tokens, chain) && ends.has(kindOf(tokens[0]))) break;
    body.push(text);
  }
  while (body.length > 1 && /^\[(?:\.\.\.|…)\]$/.test(body[body.length - 1])) body.pop();
  const head = [];
  let last = -1;
  for (const index of found.parents) {
    if (last >= 0 && index > last + 1) head.push('[…]');
    head.push(lines[index].text);
    last = index;
  }
  if (last >= 0 && found.index > last + 1) head.push('[…]');
  return [...head, ...body].join('\n');
}

// The paragraph a mention points at, from the source's plain text. In a source that gives an
// unofficial English rendering after the original, the English is searched first.
export function paragraphFor(sourceId, para) {
  const source = exists(sourceId) ? SOURCES[sourceId] : null;
  const plain = sourceTextPlain(source?.body);
  if (!plain) return { focus: null, full: '' };
  const chain = chainTokens(para);
  if (!chain.length) return { focus: null, full: plain };
  const lines = plain.split(/\n+/).map((text) => text.trim()).filter(Boolean).map((text) => ({ text, tokens: lineTokens(text) }));
  const english = lines.findIndex((line) => /^\[Unofficial English/i.test(line.text));
  const sets = english >= 0 ? [lines.slice(english + 1), lines.slice(0, english)] : [lines];
  for (const set of sets) {
    const found = locate(set, chain);
    if (found) return { focus: focusText(set, found, chain), full: plain };
  }
  return { focus: null, full: plain };
}

export function mentionCard(sourceId, para) {
  if (!exists(sourceId)) return null;
  const source = SOURCES[sourceId];
  const { focus, full } = paragraphFor(sourceId, para);
  return { id: sourceId, label: source.label, citation: source.citation, provenance: source.provenance || source.url || null, note: source.note ? sourceTextPlain(source.note) : null, kind: source.kind || 'authority', juris: source.juris || '', para: focus ? para : null, focus, full };
}
