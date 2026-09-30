# PWC US applicability: source and decision evidence

Local candidate, not released. Primary-source checkpoint: **2026-09-22 UTC**. Authoring lens: applicability and exemption logic. Independent cross-review completed by the divergence author across all twenty routes: no wrong threshold/operator found. The review confirmed the current-law and remaining-duty distinctions listed below; duplicate same-state citations were corrected. Practitioner review remains Ben's final gate. All new source records are `draft`; `verifiedAsOf` is `null`.

This evidence supports `privacy-wizards-council/content/wizards/us-applicability.json` and the uniquely prefixed `pwc-us-<state>-scope*.json` source records. The implementation uses the existing authored question graph. It does not introduce a numeric rule evaluator or change the existing sixteen paths.

## Scope and method

The selected cohort is the twenty routes effective by January 1, 2026: CA, CO, CT, DE, FL, IN, IA, KY, MD, MN, MT, NE, NH, NJ, OR, RI, TN, TX, UT and VA. Florida is deliberately labeled as a narrow controller regime. “Twenty routes” does not mean twenty total enacted privacy laws as of September 2026. Sector laws, biometric statutes, consumer-health statutes outside the comprehensive laws, breach laws, federal duties, and later-effective state laws need separate assessment.

Primary text was retrieved from legislature/code publishers and official attorneys general, using browser retrieval or public HTTP/PDF extraction where a site's text renderer failed. Existing draft material was not treated as legal authority. Source bodies are labeled editorial paraphrases. No source body is presented as a quotation of law. Unknown metadata remains null; a fetched date does not imply practitioner approval.

The decision structure separates:

1. Resident/business connection and the defined consumer population.
2. A whole-entity exclusion, with every statutory qualifier met.
3. Specific record/activity exclusions; partial exclusions do not exempt the organization.
4. Exact thresholds, related-entity routes, and any below-threshold duties.
5. A scoped result or an explicit unresolved fact, with its owner and legal significance.

Answer labels are factual Yes/No/Not sure choices or state names. Actions are on outcomes. Every Not sure answer immediately reaches a warning with `missingFacts: [{fact, owner, why}]`. No low-count or exemption outcome says that all privacy laws are inapplicable.

## Threshold comparison ledger

`>=` is inclusive; `>` is strict. `AND` and `OR` are intentional. A zero-percent or one-dollar sale revenue may satisfy an “any revenue/discount” limb, but does not satisfy a stated >20%, >25% or >50% limb. Each state's sale definition and its exceptions must be applied before calculating that limb. “Consumer” is not a synonym for every person or every database row.

| State | Current decision expression | Measuring period |
| --- | --- | --- |
| California | Direct business: nexus AND for-profit/benefit AND collection AND purpose/means AND (prior-year gross revenue > 26,625,000 OR annual buy/sell/share count >= 100,000 consumers/households OR annual sale/share revenue >= 50%). OR qualifying controlled/common-brand/PI-sharing entity; OR qualifying >=40% joint venture/partnership; OR voluntary certification. | Revenue: preceding calendar year as of January 1. Transaction count and sale/share revenue: annual. |
| Colorado | Nexus AND (calendar-year consumer count >=100,000 OR (consumer count >=25,000 AND any sale revenue/discount)). Separate biometric and specified minors routes bypass those counts. | 100,000 limb: during a calendar year. The 25,000-plus-sale limb does not separately state a lookback; do not silently substitute preceding calendar year. |
| Connecticut | (CT-business/targeting AND prior-calendar-year non-payment-only consumer count >=35,000) OR sensitive-consumer-data processing other than payment-only processing OR offering consumers' personal data for sale in trade/commerce. Apply current entity/data exclusions independently. | 35,000 route: preceding calendar year. Sensitive-data and offering-for-sale routes have no minimum count or revenue-share test. |
| Delaware | Nexus AND (prior-calendar-year non-payment-only count >=35,000 OR (count >=10,000 AND sale/gross-revenue >20%)). Current through December 31, 2026 only. | Preceding calendar year. |
| Florida | Direct controller: for-profit/benefit AND FL business AND collection AND purpose/means AND global-gross-annual-revenue >1bn AND (online-ad share >=50% OR qualifying smart-speaker/virtual-assistant business OR app platform >=250,000 apps). Controlled/controlling entities separately included. Separate §501.703 scope/exemptions. §501.715 uses only definition9(a)1–3. | Global gross annual revenue; no numeric resident-count limb. |
| Indiana | Nexus AND, during a calendar year, (consumer count >=100,000 OR (count >=25,000 AND sale/gross-revenue >50%)). Current 2026 statutory text verified, including the 2025 entity-exclusion amendment. | During the applicable calendar year. |
| Iowa | Nexus AND, during a calendar year, (consumer count >=100,000 OR (count >=25,000 AND sale/gross-revenue >50%)). | During a calendar year. |
| Kentucky | Nexus AND, during a calendar year, (consumer count >=100,000 OR (count >=25,000 AND sale/gross-revenue >50%)). | During a calendar year. |
| Maryland | Nexus AND (prior-calendar-year non-payment-only count >=35,000 OR (count >=10,000 AND sale/gross-revenue >20%)). | Preceding calendar year. |
| Minnesota | Nexus AND (calendar-year non-payment-only count >=100,000 OR (count >=25,000 AND sale/gross-revenue >25%)), subject to exclusions, SBA small-business exception and postsecondary deferral. Small-business sensitive-sale rule survives. | 100,000 limb: during a calendar year. The 25,000-plus-sale limb does not separately state a measuring period. |
| Montana | Nexus AND (non-payment-only count >=25,000 OR (count >=15,000 AND sale/gross-revenue >25%)). Section 2803 supplies no express annual period. Specified minors provisions have a separate below-threshold route. | §30-14-2803 does not state an annual or preceding-calendar-year period. Do not manufacture one; confirm counting methodology with the legal owner. |
| Nebraska | (NE business OR product/service consumed by NE residents) AND personal-data processing/sale AND NOT qualifying SBA small business. Qualifying small business + sensitive-data sale -> prior consent. Entity/data exclusions independent. | No fixed annual consumer-volume test. Apply the federal small-business definition as it existed January 1, 2024. |
| New Hampshire | Nexus AND, during a one-year period, (non-payment-only unique-consumer count >=35,000 OR (unique-consumer count >=10,000 AND sale/gross-revenue >25%)). | During a one-year period. The statute does not call it the preceding calendar year. |
| New Jersey | Nexus AND, during a calendar year, (non-payment-only count >=100,000 OR (count >=25,000 AND any sale revenue/discount)). | During a calendar year. |
| Oregon | Nexus AND, during a calendar year, (non-payment-only count >=100,000 OR (count >=25,000 AND sale/annual-gross-revenue >=25%)). OR the statutory motor-vehicle manufacturer/affiliate vehicle-use-data route, subject to exclusions. | During a calendar year; sale limb uses annual gross revenue. |
| Rhode Island | For-profit RI business/targeting AND (prior-calendar-year non-payment-only customer count >=35,000 OR (count >=10,000 AND sale/gross-revenue >20%)) for §4. Separate §3 commercial-website/ISP/controller disclosure rules must not inherit §4's counts. | Preceding calendar year for §6-48.1-4. Do not export these thresholds to §6-48.1-3. |
| Tennessee | Statutory business/targeting nexus AND revenue >25m AND ((consumer count >=25,000 AND sale/gross-revenue >50%) OR calendar-year consumer count >=175,000). Nexus wording differs from the AG's OR paraphrase; unresolved negative nexus -> warning. | 175,000 limb: during a calendar year. §47-18-3303 states >$25m revenue and >50% gross revenue without separately naming a period; AG describes the general gate as annual. |
| Texas | (TX business OR product/service consumed by TX residents) AND personal-data processing/sale AND NOT qualifying SBA small business. Qualifying small business + sensitive-data sale -> prior consent. Entity/data exclusions independent. | No fixed annual consumer-volume test. SBA classification depends on the applicable industry, size measure and affiliation rules. |
| Utah | Nexus AND annual revenue >=25m AND (calendar-year count >=100,000 OR (count >=25,000 AND sale/gross-revenue >50%)). | Revenue is annual; 100,000 limb is during a calendar year. The 25,000-plus-sale limb does not separately state a lookback. |
| Virginia | Nexus AND (calendar-year count >=100,000 OR (count >=25,000 AND sale/gross-revenue >50%)). | 100,000 limb: during a calendar year. The 25,000-plus-sale limb does not separately state a measuring period. |

## State-by-state evidence

### California

- **General-law start / current checkpoint:** 2023-01-01. The $26,625,000 adjustment took effect January 1, 2025. Verify the next odd-year adjustment before a 2027 assessment.
- **Business/resident connection:** Does the entity do business in California?
- **Count population:** California residents, including employment and business-contact data; the transaction-count limb also counts households. It counts buying, selling or sharing, not processing alone.
- **Rule:** Direct business: nexus AND for-profit/benefit AND collection AND purpose/means AND (prior-year gross revenue > 26,625,000 OR annual buy/sell/share count >= 100,000 consumers/households OR annual sale/share revenue >= 50%). OR qualifying controlled/common-brand/PI-sharing entity; OR qualifying >=40% joint venture/partnership; OR voluntary certification.
- **Entity exclusions:** A direct business must be organized for profit or owners’ financial benefit, collect consumers’ personal information (itself or on its behalf), and determine purposes and means, alone or jointly. Related entities, qualifying joint ventures and voluntary certification are separate routes.
- **Data exclusions:** Exemptions are attached to particular data or activities under §1798.145. HIPAA/CMIA, qualifying clinical research, GLBA/CFIPA, FCRA and DPPA are not a general exemption for every record held by the organization. Employment and business-contact data are not generally excluded. Some exemptions preserve §1798.150 security-breach liability.
- **Primary scope:** [Cal. Civ. Code § 1798.140(d), (i)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.140.).
- **Primary exclusions:** [Cal. Civ. Code § 1798.145](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.145.).

Additional authorities used by this route:

- [CPPA 2025 CCPA monetary adjustments; Civ. Code §1798.185(a)(5)](https://cppa.ca.gov/announcements/2024/20241217.html): Effective January 1, 2025, the adjusted annual-gross-revenue amount in the business definition is $26,625,000. The statute uses a strict greater-than comparison; equality does not satisfy that revenue limb. The adjustment does not change the 100,000-consumer/household or 50%-sale/share limbs. (`pwc-us-ca-scope-adjustment`)
- [Cal. Civ. Code §1798.140(d)(2)–(4)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.140.): An entity is also a business if it controls or is controlled by a qualifying direct business, shares common branding with it, and receives consumers' personal information shared by that business. All three conditions matter. A joint venture or partnership composed of businesses, each holding at least a 40% interest, is a separate route. A person doing business in California can also voluntarily certify to the Agency that it agrees to comply. These routes cannot be replaced by a simple under-the-revenue-threshold exit. (`pwc-us-ca-scope-related`)

Graph entry: `ca-nexus`. General positive result: `ca-covered`. Relevant source family: `pwc-us-ca-scope*`. All source text is draft pending independent review.

### Colorado

- **General-law start / current checkpoint:** 2023-07-01. Current 2026 codification includes biometric coverage effective July 1, 2025 and minors provisions effective October 1, 2025; these bypass general volume thresholds.
- **Business/resident connection:** Does the controller conduct business in Colorado OR produce or deliver commercial products or services intentionally targeted to Colorado residents?
- **Count population:** Colorado residents acting individually or as a household; ordinary consumer counts exclude commercial and employment roles. Biometric and minors provisions require separate checks.
- **Rule:** Nexus AND (calendar-year consumer count >=100,000 OR (consumer count >=25,000 AND any sale revenue/discount)). Separate biometric and specified minors routes bypass those counts.
- **Entity exclusions:** Qualifying GLBA financial institutions and their affiliates, air carriers, and specified national securities associations have entity exclusions. There is no general nonprofit or HIPAA-covered-entity exclusion; government data is excluded only for a noncommercial purpose.
- **Data exclusions:** §6-1-1304(2) excludes specified HIPAA, health-research, GLBA, FCRA-regulated activity, DPPA, FERPA, COPPA-compliant, employment and other listed data. Check each record and the conditions. A job role alone does not resolve the separate biometric provisions.
- **Primary scope:** [C.R.S. § 6-1-1304](https://olls.info/crs/crs2026-title-06.htm).
- **Primary exclusions:** [C.R.S. § 6-1-1304](https://olls.info/crs/crs2026-title-06.htm).

Additional authorities used by this route:

- [C.R.S. §§6-1-1304(1), 6-1-1308.5, 6-1-1314](https://olls.info/crs/crs2026-title-06.htm): Current §6-1-1304 separately reaches processing of biometric identifiers or biometric data regardless of volume. When only this route establishes coverage, the Act applies only to that biometric processing. The listed minors provisions apply to controllers conducting Colorado business or delivering intentionally targeted commercial products/services even below the general thresholds. The online-service duties require assessment of actual knowledge or willful disregard that the consumer is a minor. Employment records are ordinarily excluded, but §6-1-1314 separately addresses employer biometric collection and permitted conditions. A low general consumer count does not resolve those duties. (`pwc-us-co-scope-special`)

Graph entry: `co-nexus`. General positive result: `co-covered`. Relevant source family: `pwc-us-co-scope*`. All source text is draft pending independent review.

### Connecticut

- **General-law start / current checkpoint:** 2026-07-01. PA26-64 and PA26-100 contain changes taking effect October 1, 2026. They are future law at this September 22 checkpoint and require a refresh before that date.
- **Business/resident connection:** Does the assessment involve personal data of Connecticut consumers?
- **Count population:** Connecticut residents in an individual or household context, excluding employment and commercial roles. The 35,000 limb and sensitive-data limb exclude processing solely to complete a payment transaction.
- **Rule:** (CT-business/targeting AND prior-calendar-year non-payment-only consumer count >=35,000) OR sensitive-consumer-data processing other than payment-only processing OR offering consumers' personal data for sale in trade/commerce. Apply current entity/data exclusions independently.
- **Entity exclusions:** The July 1, 2026 version lists government bodies; specified government contractors processing consumer health data on their behalf; nonprofits; political committees; higher education; national securities associations; HIPAA covered entities/business associates; tribal government; air carriers; insurance entities; qualifying banks/credit unions and affiliates subject to the stated financial-activity, examination and privacy-program conditions; and specified regulated securities entities. GLBA status alone no longer creates a universal entity exemption.
- **Data exclusions:** Use the July 1, 2026 §42-517(b), plus PA26-76 §72. Listed health/research, FCRA-regulated activity, DPPA, FERPA, Farm Credit, employment-role, airline and GLBA data remain conditional data exemptions. PA26-76 adds narrowly defined deidentified or aggregated DOT transportation geolocation data.
- **Primary scope:** [Conn. Gen. Stat. §§ 42-515 to 42-517 (effective July 1, 2026)](https://cga.ct.gov/2026/sup/chap_743jj.htm).
- **Primary exclusions:** [Conn. Gen. Stat. §§ 42-515 to 42-517 (effective July 1, 2026)](https://cga.ct.gov/2026/sup/chap_743jj.htm).

Additional authorities used by this route:

- [PA26-76 §72; Conn. Gen. Stat. §42-517(b)(19)](https://www.cga.ct.gov/2026/act/Pa/pdf/2026PA-00076-R00SB-00477-PA.PDF): Effective July 1, 2026, a narrow exemption covers precise geolocation data deidentified or aggregated from personal data and collected, used, processed, shared or transferred by or to the Department of Transportation for the listed transportation-planning, traffic, highway-safety, infrastructure or public-sector-research purposes. It is not an exemption for identifiable location data generally. (`pwc-us-ct-scope-dot`)

Graph entry: `ct-nexus`. General positive result: `ct-covered`. Relevant source family: `pwc-us-ct-scope*`. All source text is draft pending independent review.

### Delaware

- **General-law start / current checkpoint:** 2025-01-01. The code shows a separate January 1, 2027 version: thresholds become 10,000 and 5,000 plus >20%, with additional changes. Do not apply it to a 2026 answer.
- **Business/resident connection:** Does the person conduct business in Delaware OR produce products or services targeted to Delaware residents?
- **Count population:** Delaware residents acting individually or as a household, excluding employment and commercial roles. Exclude payment-only consumers from the 35,000 limb.
- **Rule:** Nexus AND (prior-calendar-year non-payment-only count >=35,000 OR (count >=10,000 AND sale/gross-revenue >20%)). Current through December 31, 2026 only.
- **Entity exclusions:** Government bodies are excluded but institutions of higher education are carved out of that exclusion. Qualifying GLBA financial institutions and affiliates, specified national securities/futures associations, and nonprofits dedicated exclusively to insurance-crime prevention are excluded. There is no general nonprofit, higher-education or HIPAA-entity exemption.
- **Data exclusions:** §12D-103(c) excludes specified health/research, regulated credit, DPPA, FERPA, Farm Credit and employment-role data. A HIPAA relationship does not exclude unrelated records. Document why each claimed category meets the statutory conditions.
- **Primary scope:** [6 Del. C. §§ 12D-102, 12D-103 (effective until January 1, 2027)](https://www.delcode.delaware.gov/title6/c012d/index.html).
- **Primary exclusions:** [6 Del. C. §§ 12D-102, 12D-103 (effective until January 1, 2027)](https://www.delcode.delaware.gov/title6/c012d/index.html).

Graph entry: `de-nexus`. General positive result: `de-covered`. Relevant source family: `pwc-us-de-scope*`. All source text is draft pending independent review.

### Florida

- **General-law start / current checkpoint:** 2024-07-01. Separate §501.715 sale-of-sensitive-data duties can apply without the $1 billion or business-model criteria.
- **Business/resident connection:** Does it conduct business in Florida OR produce a product or service used by Florida residents, AND process or engage in the sale of personal data?
- **Count population:** Florida residents or domiciliaries acting in an individual or household context; not commercial or employment roles. General controller coverage is not a resident-volume test.
- **Rule:** Direct controller: for-profit/benefit AND FL business AND collection AND purpose/means AND global-gross-annual-revenue >1bn AND (online-ad share >=50% OR qualifying smart-speaker/virtual-assistant business OR app platform >=250,000 apps). Controlled/controlling entities separately included. Separate §501.703 scope/exemptions. §501.715 uses only definition9(a)1–3.
- **Entity exclusions:** §501.703 excludes government entities, qualifying GLBA financial institutions, HIPAA covered entities/business associates, nonprofits, and postsecondary institutions. Section 501.703 also excludes purely personal/household processing and specified ad-measurement-only processing.
- **Data exclusions:** §501.704 and the GLBA-data exclusion in §501.703 apply to specified records and processing, including protected health and regulated credit data. They do not make every dataset held by an otherwise covered entity exempt.
- **Primary scope:** [Fla. Stat. § 501.702(9)](https://www.flsenate.gov/Laws/Statutes/2025/501.702).
- **Primary exclusions:** [Fla. Stat. § 501.703](https://www.flsenate.gov/Laws/Statutes/2025/501.703).

Additional authorities used by this route:

- [Fla. Stat. §501.704](https://www.flsenate.gov/Laws/Statutes/2025/501.704): Section 501.704 exempts specified protected-health, health-research, patient-safety, regulated credit, DPPA, FERPA, Farm Credit, employment-role and other listed data subject to their statutory conditions. An exemption for some data does not extend to unrelated data or every activity of the holder. (`pwc-us-fl-scope-data`)
- [Fla. Stat. §501.715](https://www.flsenate.gov/Laws/Statutes/2025/501.715): A person meeting §501.702(9)(a)1–3 must not sell sensitive personal data without prior consumer consent; this provision does not require the billion-dollar or specified business-model criteria. The section prescribes a sensitive-data sale notice. If the sensitive data belongs to a known child, it requires affirmative authorization for a child between13 and18, or COPPA compliance for a known child under13. Check age, knowledge and the precise statutory sensitive-data definition. (`pwc-us-fl-scope-sensitive-sale`)

Graph entry: `fl-nexus`. General positive result: `fl-covered`. Relevant source family: `pwc-us-fl-scope*`. All source text is draft pending independent review.

### Indiana

- **General-law start / current checkpoint:** 2026-01-01. Effective January 1, 2026. Current IC 24-15-1 statutory text was retrieved and checked, including P.L.236-2025 §5.
- **Business/resident connection:** Does it conduct business in Indiana OR produce products or services targeted to Indiana residents?
- **Count population:** Indiana consumers in their individual/household role, not commercial or employment roles. The statute's consumer definition, not an undifferentiated database of residents, controls the count.
- **Rule:** Nexus AND, during a calendar year, (consumer count >=100,000 OR (count >=25,000 AND sale/gross-revenue >50%)). Current 2026 statutory text verified, including the 2025 entity-exclusion amendment.
- **Entity exclusions:** IC 24-15-1-1(b) excludes government entities and contractors only while acting on their behalf within the contract; GLBA financial institutions and affiliates; HIPAA covered entities/business associates; qualifying nonprofits; higher education; defined public utilities and affiliated service companies; and 501(c)(4) insurance-crime/fraud organizations with a memorandum of understanding with statewide law enforcement.
- **Data exclusions:** IC 24-15-1-2 excludes specified HIPAA, Part2, health-research, patient-safety, deidentified-health, same-manner health, public-health-only, FCRA-regulated, DPPA, FERPA, Farm Credit and employment-role/emergency-contact/benefits information. Each category retains its holder, purpose or handling conditions. GLBA data is independently excluded in IC 24-15-1-1(b)(2).
- **Primary scope:** [Ind. Code §§24-15-1-1, 24-15-1-2, 24-15-2-8, 24-15-2-18](https://iga.in.gov/ic/2026/Title_24/Article_15.pdf).
- **Primary exclusions:** [Ind. Code §§24-15-1-1, 24-15-1-2, 24-15-2-8, 24-15-2-18](https://iga.in.gov/ic/2026/Title_24/Article_15.pdf).

Graph entry: `in-nexus`. General positive result: `in-covered`. Relevant source family: `pwc-us-in-scope*`. All source text is draft pending independent review.

### Iowa

- **General-law start / current checkpoint:** 2025-01-01. Current 2026 code fetched; no future applicability version applied.
- **Business/resident connection:** Does it conduct business in Iowa OR produce products or services targeted to consumers who are Iowa residents?
- **Count population:** Iowa residents in their individual/household role, excluding commercial and employment roles. There is no payment-only deduction in the 100,000 threshold.
- **Rule:** Nexus AND, during a calendar year, (consumer count >=100,000 OR (count >=25,000 AND sale/gross-revenue >50%)).
- **Entity exclusions:** Government bodies, qualifying GLBA financial institutions/affiliates, persons subject to and complying with HIPAA/HITECH regulations, nonprofits and higher-education institutions are excluded. Satisfy the named statutory conditions, including HIPAA compliance, rather than relying on an industry label.
- **Data exclusions:** §715D.2 separately excludes specified health/research, regulated credit, DPPA, FERPA, Farm Credit and employment-role, emergency-contact and benefits data. A partial exemption does not remove unrelated consumer data.
- **Primary scope:** [Iowa Code § 715D.2](https://www.legis.iowa.gov/docs/code/715D.2.pdf).
- **Primary exclusions:** [Iowa Code § 715D.2](https://www.legis.iowa.gov/docs/code/715D.2.pdf).

Graph entry: `ia-nexus`. General positive result: `ia-covered`. Relevant source family: `pwc-us-ia-scope*`. All source text is draft pending independent review.

### Kentucky

- **General-law start / current checkpoint:** 2026-01-01. Use current KRS367.3613 (id56648). The chapter also displays July 1, 2027 versions of other provisions; those are not current at this checkpoint.
- **Business/resident connection:** Does it conduct business in Kentucky OR produce products or services targeted to Kentucky residents?
- **Count population:** Kentucky residents acting in an individual context, excluding employment and commercial roles. No payment-only deduction in the 100,000 limb.
- **Rule:** Nexus AND, during a calendar year, (consumer count >=100,000 OR (count >=25,000 AND sale/gross-revenue >50%)).
- **Entity exclusions:** Government bodies, qualifying GLBA financial institutions/affiliates, HIPAA covered entities/business associates, nonprofits and higher education are excluded. Additional narrowly defined exclusions cover specified insurance-fraud/first-responder nonprofits and small telephone/Tier III wireless/municipal-utility entities that do not sell or share data with third parties.
- **Data exclusions:** KRS367.3613 separately excludes GLBA data, specified health/research, regulated credit, DPPA, FERPA, Farm Credit and employment-role data. The current section includes the 2025 amendment for same-manner provider information and compliant limited datasets.
- **Primary scope:** [KRS 367.3613](https://apps.legislature.ky.gov/law/Statutes/statute.aspx?id=56648).
- **Primary exclusions:** [KRS 367.3613](https://apps.legislature.ky.gov/law/Statutes/statute.aspx?id=56648).

Graph entry: `ky-nexus`. General positive result: `ky-covered`. Relevant source family: `pwc-us-ky-scope*`. All source text is draft pending independent review.

### Maryland

- **General-law start / current checkpoint:** 2025-10-01. The Act took effect October 1, 2025. Section 2 of the enacted law limits original §14-4612's application to processing activities from April 1, 2026; do not turn this into a universal entity exclusion. Current codification is Subtitle47, not the original bill's Subtitle46. July2026 sensitive-data changes affect later obligations.
- **Business/resident connection:** Does it conduct business in Maryland OR provide products or services targeted to Maryland residents?
- **Count population:** Maryland residents acting individually or as a household, excluding employment and commercial roles. Deduct payment-only data only from the 35,000 limb.
- **Rule:** Nexus AND (prior-calendar-year non-payment-only count >=35,000 OR (count >=10,000 AND sale/gross-revenue >20%)).
- **Entity exclusions:** §14-4703 excludes government instrumentalities, specified national securities/futures associations, GLBA financial institutions/affiliates, and nonprofits whose processing is solely for the listed insurance-fraud or catastrophic-event first-responder purposes. There is no general nonprofit, higher-education or HIPAA-covered-entity exemption.
- **Data exclusions:** §14-4703 separately excludes GLBA data and specified health/research, FCRA-regulated, DPPA, FERPA, Farm Credit and employment-role data. A covered entity's unrelated marketing or customer data needs its own analysis; HIPAA is not a blanket entity exemption.
- **Primary scope:** [Md. Code, Com. Law § 14-4702](https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcl&section=14-4702&enactments=false).
- **Primary exclusions:** [Md. Code, Com. Law § 14-4703](https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcl&section=14-4703&enactments=false).

Graph entry: `md-nexus`. General positive result: `md-covered`. Relevant source family: `pwc-us-md-scope*`. All source text is draft pending independent review.

### Minnesota

- **General-law start / current checkpoint:** 2025-07-31. Postsecondary institutions regulated by the Office of Higher Education need not comply until July 31, 2029. Small businesses still face §325M.17 sensitive-data-sale consent duties.
- **Business/resident connection:** Does the legal entity conduct business in Minnesota OR produce products or services targeted to Minnesota residents?
- **Count population:** Minnesota residents acting in an individual/household context, excluding commercial or employment roles. Deduct payment-only data from the 100,000 limb.
- **Rule:** Nexus AND (calendar-year non-payment-only count >=100,000 OR (count >=25,000 AND sale/gross-revenue >25%)), subject to exclusions, SBA small-business exception and postsecondary deferral. Small-business sensitive-sale rule survives.
- **Entity exclusions:** Government and tribal bodies, qualifying banks/credit unions and financial affiliates, insurance entities/financial affiliates, and nonprofits established to prevent insurance fraud have specific exclusions. General nonprofit and HIPAA-entity exemptions do not exist. SBA small businesses and deferred higher-education compliance are checked separately.
- **Data exclusions:** §325M.12 lists protected health and research information, same-manner provider records, compliant limited datasets, GLBA and regulated credit data, and other specific exclusions. Check conditions by record. Student technology-provider obligations under §13.32 are not cleared by this route.
- **Primary scope:** [Minn. Stat. § 325M.12](https://www.revisor.mn.gov/statutes/cite/325M.12).
- **Primary exclusions:** [Minn. Stat. § 325M.12](https://www.revisor.mn.gov/statutes/cite/325M.12).

Additional authorities used by this route:

- [Minn. Stat. §325M.17](https://www.revisor.mn.gov/statutes/cite/325M.17): A small business as defined by the US SBA under 13 CFR Part121 that conducts business in Minnesota or targets products/services to Minnesota residents must obtain a consumer's prior consent before selling the consumer's sensitive data. Section 325M.20 enforcement applies. The provision took effect July 31, 2025; postsecondary institutions regulated by the Office of Higher Education are not required to comply until July 31, 2029. (`pwc-us-mn-scope-small-business`)

Graph entry: `mn-nexus`. General positive result: `mn-covered`. Relevant source family: `pwc-us-mn-scope*`. All source text is draft pending independent review.

### Montana

- **General-law start / current checkpoint:** 2025-10-01. Current 25,000/15,000 thresholds replaced 50,000/25,000 on October 1, 2025. Sections 2811,2818,2819 can apply below the general thresholds.
- **Business/resident connection:** Does it conduct business in Montana OR produce products or services targeted to Montana residents?
- **Count population:** Montana residents acting individually or as a household, excluding commercial and employment roles. Deduct payment-only data from the 25,000 limb.
- **Rule:** Nexus AND (non-payment-only count >=25,000 OR (count >=15,000 AND sale/gross-revenue >25%)). Section 2803 supplies no express annual period. Specified minors provisions have a separate below-threshold route.
- **Entity exclusions:** §30-14-2804 excludes government bodies, insurance-fraud nonprofits, higher education, specified securities associations, qualifying banks/credit unions and financial affiliates, HIPAA covered entities/business associates, and qualifying insurance entities. There is no general nonprofit exemption and no universal GLBA entity exemption.
- **Data exclusions:** §30-14-2804 excludes specified GLBA, health/research, regulated credit, DPPA, FERPA, Farm Credit and employment-role data. Check statutory conditions before excluding a dataset.
- **Primary scope:** [MCA § 30-14-2803](https://mca.legmt.gov/bills/mca/title_0300/chapter_0140/part_0280/section_0030/0300-0140-0280-0030.html).
- **Primary exclusions:** [MCA § 30-14-2804](https://mca.legmt.gov/bills/mca/title_0300/chapter_0140/part_0280/section_0040/0300-0140-0280-0040.html).

Additional authorities used by this route:

- [MCA §§30-14-2803(2), 30-14-2811](https://mca.legmt.gov/bills/mca/title_0300/chapter_0140/part_0280/section_0110/0300-0140-0280-0110.html): Controllers offering an online service, product or feature to a consumer they actually know, or willfully disregard, is a minor must assess the reasonable-care, consent, retention, geolocation, design-feature and messaging safeguards in §30-14-2811. Section 30-14-2803(2) applies the named minors provisions without the general 25,000/15,000 thresholds to the stated Montana business or intentionally targeted commercial activity. (`pwc-us-mt-scope-minors`)
- [MCA §30-14-2819](https://mca.legmt.gov/bills/mca/title_0300/chapter_0140/part_0280/section_0190/0300-0140-0280-0190.html): From October 1, 2025, the specified online offerings to known minors require a documented data-protection assessment when they pose heightened risk, plus review for material change and a risk-mitigation plan when the assessment identifies that risk. This applies to processing activities created or generated after October 1, 2025. (`pwc-us-mt-scope-minors-assessment`)
- [MCA §30-14-2818](https://mca.legmt.gov/bills/mca/title_0300/chapter_0140/part_0280/section_0180/0300-0140-0280-0180.html): A processor must follow the controller's instructions and assist with the duties and assessments in §§30-14-2811 and2819. The contract must meet §30-14-2813(2). Actual conduct, including deciding purposes and means, determines whether the person is a controller or processor. (`pwc-us-mt-scope-minors-processor`)

Graph entry: `mt-nexus`. General positive result: `mt-covered`. Relevant source family: `pwc-us-mt-scope*`. All source text is draft pending independent review.

### Nebraska

- **General-law start / current checkpoint:** 2025-01-01. A qualifying small business must still obtain prior consumer consent before selling sensitive data under §87-1118.
- **Business/resident connection:** Does it conduct business in Nebraska OR produce a product or service consumed by Nebraska residents, AND process or engage in the sale of personal data?
- **Count population:** Nebraska consumers acting in an individual or household context. There is no fixed consumer-volume or universal revenue threshold.
- **Rule:** (NE business OR product/service consumed by NE residents) AND personal-data processing/sale AND NOT qualifying SBA small business. Qualifying small business + sensitive-data sale -> prior consent. Entity/data exclusions independent.
- **Entity exclusions:** Government entities, qualifying GLBA financial institutions and affiliates, HIPAA covered entities/business associates, nonprofits, higher education and the listed electricity/natural-gas utilities are excluded. SBA small-business status is a separate check, with a surviving consent duty.
- **Data exclusions:** §87-1104 separately excludes specified health/research, regulated credit, DPPA, FERPA, Farm Credit and employment-role information. GLBA data is independently excluded in §87-1103.
- **Primary scope:** [Neb. Rev. Stat. § 87-1103](https://nebraskalegislature.gov/laws/statutes.php?statute=87-1103).
- **Primary exclusions:** [Neb. Rev. Stat. § 87-1104](https://nebraskalegislature.gov/laws/statutes.php?statute=87-1104).

Additional authorities used by this route:

- [Neb. Rev. Stat. §87-1118](https://nebraskalegislature.gov/laws/statutes.php?statute=87-1118): A person within §87-1103(1)(c)'s small-business exception may not sell sensitive personal data without the consumer's prior consent. The penalty in §87-1124 applies. A small-business classification therefore does not clear a sensitive-data sale. (`pwc-us-ne-scope-small-business`)

Graph entry: `ne-nexus`. General positive result: `ne-covered`. Relevant source family: `pwc-us-ne-scope*`. All source text is draft pending independent review.

### New Hampshire

- **General-law start / current checkpoint:** 2025-01-01. Current applicability text fetched; no future amendment applied.
- **Business/resident connection:** Does it conduct business in New Hampshire OR produce products or services targeted to New Hampshire residents?
- **Count population:** Unique New Hampshire consumers acting in an individual/household context, excluding commercial and employment roles. Deduct payment-only data from the 35,000 limb.
- **Rule:** Nexus AND, during a one-year period, (non-payment-only unique-consumer count >=35,000 OR (unique-consumer count >=10,000 AND sale/gross-revenue >25%)).
- **Entity exclusions:** §507-H:3 excludes government bodies, nonprofits, higher education, specified national securities associations, qualifying GLBA financial institutions and HIPAA covered entities/business associates.
- **Data exclusions:** §507-H:3 separately excludes GLBA data, health/research and limited datasets, regulated credit, DPPA, FERPA, Farm Credit, employment-role, specified airline and listed-chemical information. Each exclusion has conditions and is not a general data-industry exemption.
- **Primary scope:** [RSA 507-H:2](https://gc.nh.gov/rsa/html/LII/507-H/507-H-2.htm).
- **Primary exclusions:** [RSA 507-H:3](https://gc.nh.gov/rsa/html/LII/507-H/507-H-3.htm).

Graph entry: `nh-nexus`. General positive result: `nh-covered`. Relevant source family: `pwc-us-nh-scope*`. All source text is draft pending independent review.

### New Jersey

- **General-law start / current checkpoint:** 2025-01-15. Enacted P.L.2023,c.266 took effect January 15, 2025. The revenue/discount limb has no minimum sale percentage.
- **Business/resident connection:** Does the controller conduct business in New Jersey OR produce products or services targeted to New Jersey residents?
- **Count population:** New Jersey residents acting only in an individual/household context, excluding commercial and employment roles. Deduct payment-only data from the 100,000 limb.
- **Rule:** Nexus AND, during a calendar year, (non-payment-only count >=100,000 OR (count >=25,000 AND any sale revenue/discount)).
- **Entity exclusions:** §56:8-166.13 excludes qualifying GLBA financial institutions/affiliates, specified secondary-market institutions, insurance institutions and government bodies. There is no general nonprofit or HIPAA-covered-entity exclusion.
- **Data exclusions:** The same section separately excludes HIPAA protected health data, GLBA data, permitted Motor Vehicle Commission sales, FCRA-authorized consumer-reporting-agency data and qualifying human-subject research data. The activity and holder requirements matter.
- **Primary scope:** [N.J.S.A. §§ 56:8-166.4, 56:8-166.5, 56:8-166.13](https://pub.njleg.state.nj.us/Bills/2022/PL23/266_.HTM).
- **Primary exclusions:** [N.J.S.A. §§ 56:8-166.4, 56:8-166.5, 56:8-166.13](https://pub.njleg.state.nj.us/Bills/2022/PL23/266_.HTM).

Graph entry: `nj-nexus`. General positive result: `nj-covered`. Relevant source family: `pwc-us-nj-scope*`. All source text is draft pending independent review.

### Oregon

- **General-law start / current checkpoint:** 2024-07-01. Nonprofits became covered July 1, 2025. Current §646A.572(1)(b) bypasses volume thresholds for motor-vehicle manufacturers and affiliates processing consumer vehicle-use data.
- **Business/resident connection:** Does it conduct business in Oregon OR provide products or services to Oregon residents?
- **Count population:** Oregon residents acting individually or as a household, excluding commercial or employment roles. Deduct payment-only data from the 100,000 limb.
- **Rule:** Nexus AND, during a calendar year, (non-payment-only count >=100,000 OR (count >=25,000 AND sale/annual-gross-revenue >=25%)). OR the statutory motor-vehicle manufacturer/affiliate vehicle-use-data route, subject to exclusions.
- **Entity exclusions:** §646A.572 excludes public bodies/corporations; qualifying banks and directly financial affiliates/subsidiaries; insurers (not mere self-insurance), insurance producers/consultants and licensed third-party administrators; and insurance-fraud nonprofits. Noncommercial publishing/news activity has a separate activity exclusion. There is no general nonprofit or HIPAA-entity exemption.
- **Data exclusions:** Specified HIPAA, health/research, Part2, patient-safety, same-manner records, employment/contract-role, FCRA, GLBA, DPPA, FERPA and preempted airline data are excluded subject to conditions. §646A.572(3) permitted-purpose processing is limited by necessity, proportionality, security and burden-of-proof requirements; it is not a blanket entity exemption.
- **Primary scope:** [ORS 646A.570, 646A.572](https://www.oregonlegislature.gov/bills_laws/ors/ors646a.html).
- **Primary exclusions:** [ORS 646A.570, 646A.572](https://www.oregonlegislature.gov/bills_laws/ors/ors646a.html).

Graph entry: `or-nexus`. General positive result: `or-covered`. Relevant source family: `pwc-us-or-scope*`. All source text is draft pending independent review.

### Rhode Island

- **General-law start / current checkpoint:** 2026-01-01. Effective January 1, 2026. Below-threshold commercial websites and internet-service providers still need a separate §6-48.1-3 assessment.
- **Business/resident connection:** Is it a for-profit entity conducting business in Rhode Island OR producing products or services targeted to Rhode Island residents?
- **Count population:** Rhode Island customers in their individual/household context, excluding commercial and employment roles. Deduct payment-only data from the 35,000 limb.
- **Rule:** For-profit RI business/targeting AND (prior-calendar-year non-payment-only customer count >=35,000 OR (count >=10,000 AND sale/gross-revenue >20%)) for §4. Separate §3 commercial-website/ISP/controller disclosure rules must not inherit §4's counts.
- **Entity exclusions:** §6-48.1-3(d) excludes government bodies, nonprofits, higher education, specified national securities associations, qualifying GLBA financial institutions and HIPAA covered entities/business associates.
- **Data exclusions:** §6-48.1-3(e) separately excludes GLBA data, specified health/research, regulated credit, DPPA, FERPA, Farm Credit and employment-role data. §6-48.1-3 also creates website/online duties that are separate from §6-48.1-4's numeric thresholds.
- **Primary scope:** [R.I. Gen. Laws § 6-48.1-4(a)](https://webserver.rilegislature.gov/Statutes/TITLE6/6-48.1/6-48.1-4.htm).
- **Primary exclusions:** [R.I. Gen. Laws § 6-48.1-3](https://webserver.rilegislature.gov/Statutes/TITLE6/6-48.1/6-48.1-3.htm).

Graph entry: `ri-nexus`. General positive result: `ri-covered`. Relevant source family: `pwc-us-ri-scope*`. All source text is draft pending independent review.

### Tennessee

- **General-law start / current checkpoint:** 2025-07-01. Current recodification is Part33, §47-18-3303. The AG paraphrases the nexus with OR; this draft retains the statute's narrower wording and sends ambiguity to legal review.
- **Business/resident connection:** Does it conduct business in Tennessee producing products or services that target Tennessee residents?
- **Count population:** Tennessee consumers acting individually or as a household, excluding commercial and employment roles. Do not substitute total global database records.
- **Rule:** Statutory business/targeting nexus AND revenue >25m AND ((consumer count >=25,000 AND sale/gross-revenue >50%) OR calendar-year consumer count >=175,000). Nexus wording differs from the AG's OR paraphrase; unresolved negative nexus -> warning.
- **Entity exclusions:** §47-18-3311 excludes government bodies, qualifying GLBA financial institutions/affiliates, licensed insurance companies transacting insurance business, licensed insurance producers, HIPAA covered entities/business associates, nonprofits and higher-education institutions.
- **Data exclusions:** §47-18-3311 separately excludes specified health/research and limited-dataset information, regulated credit, GLBA, DPPA, FERPA, Farm Credit, employment-role, public/peer-reviewed scientific or statistical research, and listed-chemical data. Each category has its own holder, activity or handling conditions.
- **Primary scope:** [Tenn. Code Ann. §§ 47-18-3303, 47-18-3311](https://www.capitol.tn.gov/Archives/Joint/publications/TNCodeBills/2025/TNCodeBill_Volume1_2025.pdf).
- **Primary exclusions:** [Tenn. Code Ann. §§ 47-18-3303, 47-18-3311](https://www.capitol.tn.gov/Archives/Joint/publications/TNCodeBills/2025/TNCodeBill_Volume1_2025.pdf).

Graph entry: `tn-nexus`. General positive result: `tn-covered`. Relevant source family: `pwc-us-tn-scope*`. All source text is draft pending independent review.

### Texas

- **General-law start / current checkpoint:** 2024-07-01. §541.107 still prohibits a qualifying small business from selling sensitive personal data without prior consumer consent.
- **Business/resident connection:** Does it conduct business in Texas OR produce a product or service consumed by Texas residents, AND process or engage in the sale of personal data?
- **Count population:** Texas consumers acting individually or as a household, excluding employment and commercial roles. No fixed consumer-volume or universal revenue test applies.
- **Rule:** (TX business OR product/service consumed by TX residents) AND personal-data processing/sale AND NOT qualifying SBA small business. Qualifying small business + sensitive-data sale -> prior consent. Entity/data exclusions independent.
- **Entity exclusions:** §541.002 excludes government entities, qualifying GLBA financial institutions, HIPAA covered entities/business associates, nonprofits, higher education and specified electric-utility, power-generation and retail-electric entities. Do not assume every affiliate is itself a qualifying financial institution.
- **Data exclusions:** §541.003 separately excludes specified health/research, regulated credit, DPPA, FERPA, Farm Credit and employment-role information; §541.002 separately excludes GLBA data. Check the exact conditions before excluding records.
- **Primary scope:** [Tex. Bus. & Com. Code §§ 541.001 to 541.003, 541.107](https://tcss.legis.texas.gov/resources/BC/htm/BC.541.htm).
- **Primary exclusions:** [Tex. Bus. & Com. Code §§ 541.001 to 541.003, 541.107](https://tcss.legis.texas.gov/resources/BC/htm/BC.541.htm).

Graph entry: `tx-nexus`. General positive result: `tx-covered`. Relevant source family: `pwc-us-tx-scope*`. All source text is draft pending independent review.

### Utah

- **General-law start / current checkpoint:** 2023-12-31. The fetched PDF explicitly identifies January 1, 2027 as its supersession date. Refresh before using this assessment in 2027.
- **Business/resident connection:** Does the controller or processor conduct business in Utah OR produce a product or service targeted to consumers who are Utah residents?
- **Count population:** Utah consumers acting individually or as a household, excluding commercial and employment roles. No payment-only deduction in the 100,000 limb.
- **Rule:** Nexus AND annual revenue >=25m AND (calendar-year count >=100,000 OR (count >=25,000 AND sale/gross-revenue >50%)).
- **Entity exclusions:** Government entities and contractors acting on their behalf, tribes, higher education, nonprofit corporations, HIPAA covered entities/business associates, qualifying GLBA financial institutions/affiliates and air carriers are excluded. Purely personal/household processing is separately excluded.
- **Data exclusions:** §13-61-102 separately excludes specified health/research, same-manner health records, regulated credit, GLBA, DPPA, FERPA, Farm Credit and employment-role information. Verify the regulated activity and record conditions.
- **Primary scope:** [Utah Code § 13-61-102 (May 1, 2024 version, effective until January 1, 2027)](https://le.utah.gov/xcode/Title13/Chapter61/C13-61-S102_2024050120240501.pdf).
- **Primary exclusions:** [Utah Code § 13-61-102 (May 1, 2024 version, effective until January 1, 2027)](https://le.utah.gov/xcode/Title13/Chapter61/C13-61-S102_2024050120240501.pdf).

Graph entry: `ut-nexus`. General positive result: `ut-covered`. Relevant source family: `pwc-us-ut-scope*`. All source text is draft pending independent review.

### Virginia

- **General-law start / current checkpoint:** 2023-01-01. Current code retrieved September 22, 2026; no future applicability amendment applied.
- **Business/resident connection:** Does it conduct business in Virginia OR produce products or services targeted to Virginia residents?
- **Count population:** Virginia consumers acting individually or as a household, excluding employment and commercial roles. No payment-only deduction in the 100,000 limb.
- **Rule:** Nexus AND (calendar-year count >=100,000 OR (count >=25,000 AND sale/gross-revenue >50%)).
- **Entity exclusions:** Government bodies, qualifying GLBA financial institutions, HIPAA covered entities/business associates, statutory nonprofit organizations and higher-education institutions are excluded. Verify the Act's nonprofit definition rather than assuming every entity with a nonprofit label qualifies.
- **Data exclusions:** §59.1-576 separately excludes GLBA data, specified health/research, regulated credit, DPPA, FERPA, Farm Credit and employment-role, emergency-contact and benefits records. A partial data exclusion does not cover unrelated records.
- **Primary scope:** [Va. Code § 59.1-576](https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-576/).
- **Primary exclusions:** [Va. Code § 59.1-576](https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-576/).

Graph entry: `va-nexus`. General positive result: `va-covered`. Relevant source family: `pwc-us-va-scope*`. All source text is draft pending independent review.

## Current overlays and future-law quarantine

- **California:** the [CPPA adjustment effective January 1, 2025](https://cppa.ca.gov/announcements/2024/20241217.html) supplies $26,625,000; [§1798.140(d)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.140.) supplies the strict greater-than operator. A short agency FAQ's looser “or more” wording must not change the statute. Related-business, >=40% venture and certification routes remain explicit. Employment/B2B data is not blanket-exempt. [§1798.145](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.145.) preserves §1798.150 in specified exemptions.
- **Colorado:** the official [2026 title index](https://content.leg.colorado.gov/agencies/office-legislative-legal-services/2026-crs-titles-download) links the [current Title6 text](https://olls.info/crs/crs2026-title-06.htm). Do not omit the July2025 biometric and October2025 minors routes or turn ordinary employee-record exclusions into an employer-biometric clearance.
- **Connecticut:** use the **July 1, 2026 version** of [§§42-516/517](https://cga.ct.gov/2026/sup/chap_743jj.htm). The 35,000 route is only one route; sensitive processing and offering data for sale have no minimum count. [PA26-76 §72](https://www.cga.ct.gov/2026/act/Pa/pdf/2026PA-00076-R00SB-00477-PA.PDF) is already effective and adds a narrow DOT deidentified/aggregated geolocation exclusion. The [legislature's 2026 privacy summary](https://www.cga.ct.gov/2026/rpt/pdf/2026-R-0081.pdf) identifies PA26-64/PA26-100 changes for **October 1, 2026**. Those require a refresh before October1; they are not silently applied to this September22 snapshot.
- **Delaware:** [current code](https://www.delcode.delaware.gov/title6/c012d/index.html) includes both the through-2026 and from-2027 versions. Keep 35,000 / 10,000 + >20% for 2026. The January 1, 2027 version reduces counts and changes other scope provisions.
- **Kentucky:** current [KRS367.3613](https://apps.legislature.ky.gov/law/Statutes/statute.aspx?id=56648) includes the 2025 amendment. The chapter's July2027 provisions are not current law for this snapshot.
- **Maryland:** current scope is [§14-4702](https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcl&section=14-4702&enactments=false), with [§14-4703](https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcl&section=14-4703&enactments=false) exclusions. Old Subtitle46 links can resolve to unrelated subject matter. [2024 Chapter455 §§2,4](https://mgaleg.maryland.gov/2024RS/chapters_noln/Ch_455_sb0541E.pdf) sets October 1, 2025 commencement and specifically limits original §14-4612 prospectively to processing from April 1, 2026; do not restate that as a universal organization exemption. The separate divergence review owns [2026 Chapter874](https://mgaleg.maryland.gov/2026RS/chapters_noln/Ch_874_hb0711T.pdf)'s current sensitive-data changes.
- **Minnesota:** [§325M.12](https://www.revisor.mn.gov/statutes/cite/325M.12) and [§325M.17](https://www.revisor.mn.gov/statutes/cite/325M.17) preserve small-business sensitive-sale consent and the precise Office-of-Higher-Education deferral to July 31, 2029.
- **Montana:** [§30-14-2803](https://mca.legmt.gov/bills/mca/title_0300/chapter_0140/part_0280/section_0030/0300-0140-0280-0030.html) uses current 25,000 / 15,000 + >25% and a separate minors route; the previous 50,000/25,000 counts must not survive into the candidate.
- **Oregon:** [current §646A.572](https://www.oregonlegislature.gov/bills_laws/ors/ors646a.html) includes the motor-vehicle manufacturer/affiliate route, an inclusive 25% revenue limb, narrowly listed financial/insurance exclusions, and noncommercial news/publishing activity. General nonprofit coverage began July 1, 2025.
- **Utah:** the [currently effective applicability PDF](https://le.utah.gov/xcode/Title13/Chapter61/C13-61-S102_2024050120240501.pdf) explicitly says it is superseded January 1, 2027. That future version has not replaced the current 2026 gate.
- **Future cohort:** [Louisiana Act502 §2](https://legis.la.gov/Legis/ViewDocument.aspx?d=1480202) is effective January 1, 2027. [Vermont Act145](https://legislature.vermont.gov/Documents/2026/Docs/ACTS/ACT145/ACT145%20As%20Enacted.pdf) is effective January 1, 2028. Other 2026 enactments, including Alabama/Oklahoma reports encountered during the sweep, are not treated as verified current members of this twenty-state cohort; a future-law inventory remains separate work.

## Explicit unresolved facts and review limits

1. **Indiana retrieval gap resolved:** Python/browser requests initially returned a JavaScript shell. Native PowerShell `Invoke-WebRequest` retrieved the actual [Indiana Code2026 PDF](https://iga.in.gov/ic/2026/Title_24/Article_15.pdf) (522,238 bytes; PDF magic and successful pypdf extraction). Independently checked IC 24-15-1-1 and1-2, including the 2025 additions for government contractors, utility service companies and qualified501(c)(4) insurance-fraud organizations. The former verification-only stops have been replaced with scoped entity/data results. Sources remain draft pending the separate review gate.
2. **Tennessee nexus:** the [official codification PDF](https://www.capitol.tn.gov/Archives/Joint/publications/TNCodeBills/2025/TNCodeBill_Volume1_2025.pdf), p1096, has “conduct business ... producing products or services ... target residents” wording. The [AG announcement](https://www.tn.gov/attorneygeneral/news/2025/4/30/pr25-25.html) uses an OR paraphrase. A negative nexus answer remains unresolved rather than becoming an exclusion. Revenue period ambiguity is also stated. Exemptions are §47-18-3311, pp1104–1106, not §3310.
3. **Periods not supplied by the statute:** Montana's scope section does not specify a calendar-year count. Colorado, Minnesota, Virginia and Utah state a calendar-year period in the larger limb but do not repeat it in the smaller sale limb. These distinctions are disclosed instead of assuming all states use the preceding calendar year. The question asks the literal predicate; an uncertain measurement goes to a warning.
4. **Florida related entity:** the graph identifies statutory control, then returns a scoped warning for the related entity's separate territorial/exemption facts when these have not all been established in that branch. The direct controller route and below-billion sensitive-sale route produce meaningful determinations. No common-brand-only shortcut is used.
5. **Rhode Island below-count websites:** the candidate identifies the independent §3 route and the missing collection/storage/sale and exemption facts. It does not apply §4's counts to §3, and does not assume every website sells personal information.
6. **Exemption lists are conditional:** the concise cards summarize the categories needed by this path; the linked statute controls the exact qualifications. Mixed health/commercial data, partial-purpose exemptions, regulated affiliates and nonprofit subclasses require evidence from the relevant record owner. A user selecting Not sure receives a concrete missing-fact result, never an optimistic exclusion.
7. **Current-law scope, not every obligation:** positive scope is followed by role and obligation assessment. This path does not encode every action under each statute, every injunction or litigation status, every sector law, or a complete future-law inventory. Those limits do not change the exact threshold branches it does encode.

## Adversarial review cases

| Scenario | Expected path behavior |
| --- | --- |
| CA exactly $26,625,000; no other direct threshold; no related/venture/certification route | Revenue limb false; evaluate remaining direct and alternative business routes before finding no business status. |
| CA below revenue, controlled by covered business + common branding + receiving shared consumer PI | Related route can establish business status; data exclusions still checked. |
| CA 100,000 records only processed, not bought/sold/shared | The transaction-count limb alone is not met. |
| CT 1 consumer, statutory sensitive data, not payment-only, no exemption | Current sensitive-data route can establish scope. |
| CT offers consumer data for sale but has completed no sale and earns no sale revenue | Current offered-for-sale route still needs assessment; no percentage cutoff. |
| DE exactly35,000 non-payment-only consumers in prior year | Inclusive count meets 2026 first limb; January2027 limits are quarantined. |
| MD or DE ordinary nonprofit holding non-exempt consumer marketing data | No blanket nonprofit or HIPAA-entity exemption. |
| CO below100,000 but25,000 plus any sale discount | General smaller limb can apply; >25% must not be imported. |
| CO low volume, statutory biometrics; or MT low volume, known minors online offering | Preserve separate biometric/minor obligations. |
| FL $1bn exactly, or >$1bn with none of the three business models | Direct controller test fails; still check related entity and §501.715 routes. |
| TX/NE/MN qualified SBA small business selling sensitive data | Consent duty survives; do not return general no-duties clearance. |
| NH35,000 non-payment-only unique consumers in the statutory one-year period | First limb inclusive; deduplicate people; do not insist on a prior-calendar-year period. |
| NJ25,000 consumers plus any sale revenue/discount | Smaller limb can apply without a percentage floor. |
| OR25,000 consumers with exactly25% annual gross revenue from sale | Inclusive revenue limb true; >25% would be wrong. |
| OR low-volume manufacturer/affiliate processing consumer vehicle-use data | Separate route bypasses general counts; exemptions still checked. |
| RI small commercial website/ISP with RI customers | §3 separately assessed; §4 threshold failure cannot close the whole Act. |
| TN revenue exactly$25m versus UT annual revenue exactly$25m | TN strict floor fails; UT inclusive floor passes, subject to each state's other conditions. |
| Any decisive question = Not sure | Immediate warning with missing fact, owner and reason; no cross-state answer inheritance. |

## Candidate verification and handoff

The authored graph has 298 nodes, 96 questions and twenty jurisdiction routes. A direct structural check verified: every node is reachable; no cycles; every target resolves; every Not sure answer directly reaches a warning with populated fact/owner/why; and all non-root citations are confined to their state. Sources remain draft. There are no answer-description actions in the new path.

Parent owns registry inclusion, UI/engine changes, rendering and full test gates. The independent divergence author completed a cross-review of all twenty routes and found no wrong threshold/operator; same-state citation duplicates were removed. The Indiana source-access gap was resolved with a current statutory PDF and its new exemption qualifiers were incorporated. Remaining promotion steps: resolve or explicitly retain the above gaps; apply independent corrections; record the two review lenses; only then consider automated-check-only status and a source checkpoint. Practitioner-reviewed status requires Ben's actual review. No commit, push, deployment or publication was performed by this author.
