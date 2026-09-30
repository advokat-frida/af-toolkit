# PWC source maintenance, 2026-09-22

This is a bounded primary-source check supporting the PWC candidate. It is an automated check, not practitioner review or release approval. No AI wizard verification date was changed, and no new AI path was added.

## AI Act Article 6 and the amending regulation

The [authentic Regulation (EU) 2026/1744](https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng), Article 1(8), inserts Article 6 paragraphs 1a–1c. The Official Journal publication is dated 24 July 2026. Article 4 makes entry into force the third day after publication, 27 July 2026. EUR-Lex identifies the [27 July 2026 consolidated AI Act](https://eur-lex.europa.eu/eli/reg/2024/1689/2026-07-27/eng) as its current consolidated version; the authentic amending regulation supplies the legal authority.

The Article 6 check covered the included paragraphs 1–4, including the safety-component clauses in 1a–1c. The existing abridged body was preserved. The companion omnibus record was checked for its official identity, publication and entry-into-force dates, the Article 6 insertion, and Article 113 application dates. Its remaining included summaries were preserved, not newly audited in this maintenance pass.

Changes:

- `privacy-wizards-council/content/sources/eu/eu-ai-act-art-6.json`: precise amending citation, current consolidated provenance, retrieval date 2026-09-22, and amendment effective date 2026-07-27.
- `privacy-wizards-council/content/sources/eu/eu-ai-act-omnibus-2026.json`: official regulation number in the label and citation, authentic Official Journal provenance, retrieval date 2026-09-22, and effective date 2026-07-27. The obsolete pending-publication wording was replaced. Its body remains unchanged.

Both records remain `automated-check-only`; `reviewDate`, `reviewer`, and `reviewerRole` remain null. Retrieval records source access and does not claim practitioner review of every AI result.

## Existing Article 113 record

Read `privacy-wizards-council/content/sources/eu/eu-ai-act-art-113.json`. Its stated dates for Chapter III Sections 1–3, except Article 6(5), already match Article 1(40) of the [amending regulation](https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng): 2 December 2027 for Article 6(2)/Annex III systems and 2 August 2028 for Article 6(1)/Annex I systems. Enactment and application remain distinct. This source record was not edited.

## Breach awareness clause

Directly retrieved [EDPB Guidelines 9/2022, version 2.0](https://www.edpb.europa.eu/system/files/2023-04/edpb_guidelines_202209_personal_data_breach_notification_v2.0_en.pdf), paragraphs 31–35, and [GDPR Article 33](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng).

The existing awareness clause in `privacy-wizards-council/content/sources/eu/guide-edpb-9-2022-breach.json` matches paragraph 31's reasonable-certainty threshold. Paragraph 34 permits a short initial investigation before awareness is established, with prompt investigation expected; paragraph 35 addresses notification once awareness exists. Full forensic closure is not the trigger. Article 33(1) sets the notification period from awareness, subject to its risk exception; Article 33(4) permits phased information.

This was a review of the awareness clause only, not all other claims in the included EDPB summary. The clause needed no correction. The source body, retrieval date, and review metadata were therefore left unchanged. The suspected-incident outcome's title and advice are handled separately by the implementing task; this receipt does not assert that mere suspicion starts the statutory clock.

## Validation and boundary

### Breach-record retention correction

The rendered EU no-notification outcome also exposed an inherited instruction to retain the register indefinitely. A separate bounded primary-source check of EDPB Guidelines 9/2022 v2.0, paragraph 124 (pages 26–27), GDPR Article 5(1)(e) and Article 33(5) found that blanket instruction unsupported. GDPR fixes no period, but a record containing personal data needs an appropriate retention period that supports accountability and respects storage limitation. Paragraph 124 distinguishes records containing no personal data. The outcome now states that rule. No whole-wizard or whole-source verification date was advanced.

The existing Article 5 source body already contains the whole article, but its citation named only paragraph 2. The citation now names Article 5 so that the existing storage-limitation paragraph can resolve correctly. Its body and review metadata are unchanged.

The two edited JSON files were parsed and checked against their pre-edit source bodies and review-status fields. No source body, practitioner-review status, AI wizard date, generated module, staged artifact, or release state was changed by this maintenance subtask. The main PWC task owns registry regeneration and the integrated gate.
