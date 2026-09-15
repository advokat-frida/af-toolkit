import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SOURCES, WIZARDS } from '../../src/lib/engine/council.js';
import { contextFor, familyOf, mentionCard, paragraphFor, tokenize } from '../../src/lib/engine/mentions.js';
import { DEFINED_TERMS, NAMED_MENTIONS } from '../../src/lib/data/mentions.js';

const links = (text, context) => tokenize(text, context).filter((s) => s.sourceId).map((s) => [s.text, s.sourceId, s.para]);
const eu = contextFor('breach', WIZARDS.breach.nodes['q-eu-risk']);
const ukNode = contextFor('breach', WIZARDS.breach.nodes['o-uk-ico-only']);
const ai = contextFor('ai-role', WIZARDS['ai-role'].nodes[WIZARDS['ai-role'].start]);
const cookies = contextFor('cookies', WIZARDS.cookies.nodes[WIZARDS.cookies.start]);

describe('inline citations resolve conservatively', () => {
  it('context_reads_the_family_and_the_uk_setting_from_the_node', () => {
    expect(eu.family).toBe('GDPR');
    expect(eu.uk).toBe(false);
    expect(ukNode.uk).toBe(true);
    expect(ai.family).toBe('AI Act');
  });

  it('gdpr_articles_resolve_with_their_paragraph', () => {
    expect(links('under GDPR Art. 4(12) and Art. 33(1)', eu)).toEqual([
      ['GDPR Art. 4(12)', 'gdpr-art-4', '(12)'],
      ['Art. 33(1)', 'gdpr-art-33', '(1)']
    ]);
    expect(links('see Art. 6(1)(f) and Art. 6(3)', eu)).toEqual([
      ['Art. 6(1)(f)', 'gdpr-art-6', '(1)(f)'],
      ['Art. 6(3)', 'gdpr-art-6-3', '(3)']
    ]);
    expect(links('Arts. 38–39 and Art. 12–22', eu).map((l) => l[1])).toEqual(['gdpr-art-38']);
  });

  it('uk_context_prefers_uk_gdpr_and_explicit_uk_mentions_never_get_eu_text', () => {
    expect(links('document under Art. 33(5)', ukNode)).toEqual([['Art. 33(5)', 'uk-gdpr-art-33', '(5)']]);
    expect(links('UK GDPR Art. 33(3) applies', eu)).toEqual([['UK GDPR Art. 33(3)', 'uk-gdpr-art-33', '(3)']]);
    expect(links('UK GDPR Art. 32 mirrors the EU provision', ukNode)).toEqual([]);
    expect(links('Review Art. 32 controls', ukNode)).toEqual([['Art. 32', 'gdpr-art-32', null]]);
    expect(links('UK GDPR Arts. 22A–22D and Art. 22C', eu).map((l) => l[1])).toEqual(['uk-gdpr-art-22a-d', 'uk-gdpr-art-22a-d']);
  });

  it('articles_without_a_registry_source_stay_plain', () => {
    expect(links('an Art. 27 representative does not create a lead SA (Art. 56)', eu)).toEqual([]);
    expect(links('Art. 60a, Art. 95 and Art. 43(3)', ai)).toEqual([]);
    expect(links('Art. 55 sits in Chapter V', ai)).toEqual([['Art. 55', 'eu-ai-act-ch5-gpai', null]]);
    expect(links('Article 29 Working Party said', eu)).toEqual([]);
  });

  it('ai_act_articles_resolve_in_ai_paths_only', () => {
    expect(links('Art. 27(4) and Art. 3(3) and Art. 53(1)(b)', ai)).toEqual([
      ['Art. 27(4)', 'eu-ai-act-art-27', '(4)'],
      ['Art. 3(3)', 'eu-ai-act-art-3-roles', '(3)'],
      ['Art. 53(1)(b)', 'eu-ai-act-ch5-gpai', '(1)(b)']
    ]);
    expect(links('AI Act Art. 50 applies', eu)).toEqual([['AI Act Art. 50', 'eu-ai-act-art-50', null]]);
    expect(links('Annex III systems', ai)).toEqual([['Annex III', 'eu-ai-act-annex-iii', null]]);
  });

  it('eprivacy_and_dsa_mentions_resolve_by_prefix_or_the_cookies_override', () => {
    expect(links('ePrivacy Art. 5(3) and DSA Art. 28(2)', cookies)).toEqual([
      ['ePrivacy Art. 5(3)', 'eprivacy-art-5', '(3)'],
      ['DSA Art. 28(2)', 'dsa-art-28', '(2)']
    ]);
    expect(links('the Art. 5(3) rule', cookies)).toEqual([['Art. 5(3)', 'eprivacy-art-5', '(3)']]);
    expect(links('accountability under Art. 5(2)', contextFor('dpia'))).toEqual([['Art. 5(2)', 'gdpr-art-5', '(2)']]);
  });

  it('us_sections_resolve_to_their_statutes', () => {
    expect(links('Cal. Civ. Code § 1798.82(h) and §1798.140(ad)(2)(A) and § 1798.81.5', eu)).toEqual([
      ['Cal. Civ. Code § 1798.82(h)', 'ca-1798-82', '(h)'],
      ['§1798.140(ad)(2)(A)', 'ccpa-1798-140', '(ad)(2)(A)']
    ]);
    expect(links('NY GBL § 899-aa(2)(a) and § 899-bb and 23 NYCRR § 500.17', eu).map((l) => l[1])).toEqual(['ny-shield-aa', 'ny-shield-bb', 'nydfs-500-17']);
    expect(links('IL PIPA Sec. 10(e)(2); BIPA Sec. 15(a); Sec. 20', eu).map((l) => l[1])).toEqual(['il-pipa-10', 'il-bipa-15', 'il-bipa-20']);
    expect(links('11 CCR § 7025(b) and CCR § 7023', eu).map((l) => l[1])).toEqual(['ccr-7025']);
    expect(links('COPPA § 6502 and 16 CFR § 312.4(b)', eu)).toEqual([
      ['COPPA § 6502', 'coppa-6502', null],
      ['16 CFR § 312.4(b)', 'coppa-rule-312', null]
    ]);
    expect(links('BDSG § 38(1)', contextFor('dpo')).map((l) => l[1])).toEqual(['bdsg-38']);
  });

  it('uk_sections_guidance_cases_and_names_resolve', () => {
    expect(links('DPA 2018 s.9 and DPA 2018 s. 157 and DPA 2018 Sch 1 Part 1 para 2 + s.11', eu).map((l) => l[1])).toEqual(['uk-dpa-2018-s9', 'uk-dpa-2018-s157', 'uk-dpa-2018-s10-sch1', 'uk-dpa-2018-s10-sch1']);
    expect(links('PECR reg. 6 and reg 6', cookies).map((l) => l[1])).toEqual(['uk-pecr-reg-6', 'uk-pecr-reg-6']);
    expect(links('EDPB Guidelines 9/2022 and Guidelines 05/2020 and Article 29 WP Opinion 04/2012', eu).map((l) => l[1])).toEqual(['guide-edpb-9-2022-breach', 'wp29-wp194']);
    expect(links('VB v NAP (C-340/21) and C-210/16 and Schrems II', eu).map((l) => l[1])).toEqual(['case-vb-nap', 'case-vb-nap', 'case-schrems-ii']);
    expect(links('WP248 and the DUAA and ENISA', eu).map((l) => l[1])).toEqual(['guide-wp29-wp248-dpia', 'uk-duaa-2025', 'enisa-severity-2013']);
  });

  it('defined_terms_link_once_per_block_and_only_in_their_family', () => {
    const text = 'The controller tells the processor; the sub-processor and the controller wait. Joint controllers share.';
    expect(links(text, eu)).toEqual([
      ['controller', 'gdpr-art-4', '(7)'],
      ['processor', 'gdpr-art-4', '(8)'],
      ['Joint controllers', 'gdpr-art-26', null]
    ]);
    const shared = new Set();
    expect(tokenize('The controller decides.', eu, shared).filter((s) => s.sourceId)).toHaveLength(1);
    expect(tokenize('The controller records it.', eu, shared).filter((s) => s.sourceId)).toHaveLength(0);
    expect(links('the controller and the deployer', ai)).toEqual([['deployer', 'eu-ai-act-art-3-roles', null]]);
    expect(links('a personal data breach under Art. 4(12)', eu)).toEqual([
      ['personal data breach', 'gdpr-art-4', '(12)'],
      ['Art. 4(12)', 'gdpr-art-4', '(12)']
    ]);
  });

  it('every_curated_alias_and_term_points_at_a_registry_source', () => {
    for (const entry of NAMED_MENTIONS) expect(SOURCES[entry.id], entry.id).toBeTruthy();
    for (const term of DEFINED_TERMS) expect(SOURCES[term.id], term.id).toBeTruthy();
  });

  it('every_resolved_mention_across_all_wizard_text_points_at_an_existing_source_of_a_plausible_family', () => {
    let resolved = 0;
    let blocks = 0;
    for (const [wizardId, wizard] of Object.entries(WIZARDS)) {
      for (const node of Object.values(wizard.nodes)) {
        const context = contextFor(wizardId, node);
        const texts = [node.q, node.help, node.summary, node.clock, ...(node.actions || [])].filter(Boolean);
        for (const text of texts) {
          blocks += 1;
          for (const segment of tokenize(text, context)) {
            if (!segment.sourceId) continue;
            resolved += 1;
            expect(SOURCES[segment.sourceId], `${wizardId}: ${segment.text}`).toBeTruthy();
            const family = familyOf(segment.sourceId);
            if (context.family === 'GDPR' && family === 'AI Act') expect(segment.text, `${wizardId}: ${segment.text}`).toMatch(/^AI Act|^Annex III/);
            if (context.family === 'AI Act') expect(['GDPR', 'UK GDPR'].includes(family) && !/^(UK )?GDPR/.test(segment.text), `${wizardId}: ${segment.text}`).toBe(false);
          }
        }
      }
    }
    expect(blocks).toBeGreaterThan(900);
    expect(resolved).toBeGreaterThan(900);
  });

  it('paragraph_focus_finds_numbered_and_bracketed_markers', () => {
    expect(paragraphFor('gdpr-art-4', '(12)').focus).toMatch(/^\(12\) 'personal data breach'/);
    expect(paragraphFor('gdpr-art-33', '(1)').focus).toMatch(/^1\. /);
    expect(paragraphFor('gdpr-art-33', '(9)').focus).toBe(null);
    const card = mentionCard('gdpr-art-4', '(7)');
    expect(card.label).toContain('Art. 4');
    expect(card.focus).toMatch(/^\(7\) 'controller'/);
    expect(card.full.length).toBeGreaterThan(card.focus.length);
  });

  it('paragraph_focus_follows_nested_combined_lettered_and_bilingual_markers', () => {
    expect(paragraphFor('ccpa-1798-135', '(c)(4)').focus).toMatch(/^\(c\)\(4\) /);
    expect(paragraphFor('gdpr-art-33', '(3)(a)').focus).toMatch(/^3\. [\s\S]*\n\(a\) /);
    expect(paragraphFor('gdpr-art-33', '(3)').focus).toMatch(/\n\(d\) /);
    expect(paragraphFor('gdpr-art-6', '(1)(f)').focus).toMatch(/^1\. [\s\S]*\(f\) /);
    expect(paragraphFor('gdpr-art-5', '(2)').focus).toMatch(/^2\. The controller/);
    expect(paragraphFor('uk-gdpr-art-33', '(3)').focus).toMatch(/^3\. /);
    expect(paragraphFor('ny-shield-aa', '(8)').focus).toMatch(/^8\.\(a\)/);
    expect(paragraphFor('eu-ai-act-art-5', '(1a)').focus).toMatch(/^1a\. /);
    expect(paragraphFor('bdsg-38', '(1)').focus).toMatch(/^\(1\) In addition to Article 37/);
  });

  it('a_wrong_card_is_worse_than_none', () => {
    const transfer = contextFor('transfer', WIZARDS.transfer.nodes['q-adequacy']);
    // A lettered article is a different provision.
    expect(links('UK GDPR Arts. 45A–45B and Art. 45B', transfer)).toEqual([]);
    // An excerpt source opens only for the paragraphs it holds.
    expect(links('Art. 3(1) and Art. 3(12) and Art. 3(4)', ai)).toEqual([['Art. 3(4)', 'eu-ai-act-art-3-roles', '(4)']]);
    expect(links('Art. 5(1)(f) and Art. 5(2)', contextFor('dpia')).map((l) => l[0])).toEqual(['Art. 5(2)']);
    // A short instrument name links only where the path cites the provision it stands for.
    expect(links('PECR applies', contextFor('breach', WIZARDS.breach.nodes['q-uk-risk']))).toEqual([]);
    expect(links('PECR applies', cookies)).toEqual([['PECR', 'uk-pecr-reg-6', null]]);
    // A definition opens only where the node cites law of its jurisdiction.
    expect(links('biometric data', contextFor('breach', WIZARDS.breach.nodes['o-bipa-breach']))).toEqual([]);
    expect(links('notify the DPO', ukNode)).toEqual([['DPO', 'uk-gdpr-art-37', null]]);
  });

  it('eu_or_uk_follows_the_node_cites_then_the_clause_then_the_node', () => {
    const dpia = contextFor('dpia', WIZARDS.dpia.nodes['q-other-risk']);
    expect(links("UK note: the ICO's Art. 35(4) list governs.", dpia)).toEqual([['Art. 35(4)', 'uk-gdpr-art-35', '(4)']]);
    expect(links("Check the SA's Art. 35(4) list.", dpia)).toEqual([['Art. 35(4)', 'gdpr-art-35', '(4)']]);
    expect(links('Art. 35(3) (GDPR and UK GDPR alike) lists three categories.', dpia)).toEqual([['Art. 35(3)', 'gdpr-art-35', '(3)']]);
    expect(links('WP248 (or ICO-list) criteria; assess under Art. 35(7)(c).', dpia).filter((l) => l[1].includes('art-35'))).toEqual([['Art. 35(7)(c)', 'gdpr-art-35', '(7)(c)']]);
    // A node that cites only the EU article keeps it, whatever else the sentence mentions.
    const severity = contextFor('severity', WIZARDS.severity.nodes['o-high']);
    expect(links('it carries the Art. 33 determination and the UK branches', severity)).toEqual([['Art. 33', 'gdpr-art-33', null]]);
    // Art. 22 beside Arts. 22A–22D is the original article.
    const role = contextFor('role', WIZARDS.role.nodes['o-controller']);
    expect(links('The Art. 22 regime is restructured into Arts. 22A–22D in the UK', role).map((l) => l[1])).toEqual(['gdpr-art-22', 'uk-gdpr-art-22a-d']);
  });

  it('no_regex_lookbehind_ships_to_older_safari', () => {
    for (const file of ['../../src/lib/engine/mentions.js', '../../src/lib/data/mentions.js', '../../src/lib/engine/council.js']) {
      expect(readFileSync(new URL(file, import.meta.url), 'utf8'), file).not.toMatch(/\(\?<[!=]/);
    }
  });
});
