# PWC US state divergence: primary-source evidence

Candidate as of **2026-09-22 UTC**. Sources remain **draft**. This is a bounded decision aid for confirmed coverage, not a comprehensive legal opinion or a practitioner-reviewed release. No compliance or green outcome is generated. The twenty-state cohort is currently effective comprehensive laws, not a count of every enacted future law.

## Runtime contract

`jurisdictionRoutes` maps each state to an independent coverage question, then a use question and cited outcomes. No applicability facts are imported. Every unknown answer terminates in `warn` with a named missing fact, owner and reason. SBA sensitive-sale paths are separate for Minnesota, Nebraska and Texas. Florida, Rhode Island, Colorado and Montana have other limited-duty routes. Delaware has a separate assessment-count question. Answer choices describe facts; legal consequences and next actions appear in outcomes.

Possible maintenance fields: `coverageBasis`, `useCase`, `sensitiveRule`, `saleAdRule`, `rightsScope`, `responseDays`, `extensionDays`, `appealDays`, `assessmentTrigger`, `activityDateBoundary`, `futureChange`, `sourceIds`, `missingFacts`. Unknown values must remain null; preserve operators and dates, and never infer a negative duty from absent information.

## State evidence

### California (CA)

- **Sensitive data:** California uses a right to limit certain uses and disclosures of sensitive personal information, rather than a general prior-consent rule for every sensitive-data use. [Civil Code §1798.121; 11 CCR §7027](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.121.&lawCode=CIV).
- **Sale and targeted advertising:** Sale and sharing for cross-context behavioral advertising trigger opt-out duties. Sharing can qualify without money changing hands. [Civil Code §§1798.120, 1798.135; 11 CCR §§7025–7026, 7070–7071](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=3.&part=4.&lawCode=CIV&title=1.81.5).
- **Consumer rights:** Support access/knowledge, deletion, correction, portability and the distinct sale/sharing and sensitive-use choices. Employee and B2B exemptions expired after 2022. [Civil Code §§1798.105–1798.135; 11 CCR §§7021, 7026–7027; CPPA business FAQ](https://cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf).
- **Risk assessments:** New covered processing from January 1, 2026 needs a prior risk assessment. The first regulator submission is later; that does not postpone the assessment. [11 CCR §§7150, 7155, 7157, 7200](https://cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf).
- **Additional authority:** The statutory exemptions for employment-related information and business-to-business transactions expired on December 31, 2022. This does not remove specific statutory data exemptions. [CPPA FAQ: employee and business-to-business exemptions](https://cppa.ca.gov/faq.html).

### Colorado (CO)

- **Sensitive data:** Obtain consent before processing or selling sensitive data. Known-child processing requires parent or guardian consent. [C.R.S. §6-1-1308(7), §§6-1-1308.5, 6-1-1314](https://olls.info/crs/crs2026-title-06.htm).
- **Sale and targeted advertising:** Consumers can opt out of sale, targeted advertising and significant-effect profiling. Qualifying universal opt-out mechanisms have been required for sale/targeted ads since July 1, 2024. [C.R.S. §§6-1-1306(1)(a), 6-1-1308.5](https://olls.info/crs/crs2026-title-06.htm).
- **Consumer rights:** Provide access, correction, deletion, portability and the specified opt-outs. Colorado's appeal schedule differs from the common 60-day model. [C.R.S. §6-1-1306(1)–(3)](https://olls.info/crs/crs2026-title-06.htm).
- **Risk assessments:** Assess covered heightened-risk processing before it begins, including targeted advertising, sale, sensitive data and qualifying risky profiling. [C.R.S. §§6-1-1309, 6-1-1309.5](https://olls.info/crs/crs2026-title-06.htm).
- **Limited coverage:** A below-threshold biometric or minor-specific provision does not establish full-law coverage. [C.R.S. §6-1-1304(1)(a)(II), (1)(b)](https://olls.info/crs/crs2026-title-06.htm).

### Connecticut (CT)

- **Sensitive data:** The July 2026 text requires both reasonable necessity for sensitive processing and consumer consent. Sensitive-data sale also requires consent. [Conn. Gen. Stat. §42-520(a)(1)(D), (H), effective July 1, 2026](https://www.cga.ct.gov/2026/sup/chap_743jj.htm).
- **Sale and targeted advertising:** Sale/targeted advertising opt-outs and qualifying universal opt-out signals apply. The current text prohibits sale and targeted advertising for known or willfully disregarded consumers aged 13–17. [Conn. Gen. Stat. §§42-518(a), 42-520(a)(1)(I), (c), effective July 1, 2026](https://www.cga.ct.gov/2026/sup/chap_743jj.htm).
- **Consumer rights:** Alongside access, correction, deletion, portability and opt-outs, the July 2026 law adds access to inferences, third-party sale-recipient lists and specific profiling-review rights. [Conn. Gen. Stat. §42-518(a)–(f), effective July 1, 2026](https://www.cga.ct.gov/2026/sup/chap_743jj.htm).
- **Risk assessments:** In addition to data protection assessments for specified high-risk processing, significant-decision profiling has a separate impact-assessment requirement for activities created or generated on or after August 1, 2026. [Conn. Gen. Stat. §42-522](https://www.cga.ct.gov/2026/sup/chap_743jj.htm).

### Delaware (DE)

- **Sensitive data:** Sensitive processing requires consent; known-child sensitive processing must comply with COPPA. [6 Del. C. §12D-106(a), version effective until January 1, 2027](https://www.delcode.delaware.gov/title6/c012d/index.html).
- **Sale and targeted advertising:** Sale, targeted advertising and qualifying profiling have opt-outs. Known or willfully disregarded consumers aged 13–17 require consent for sale or targeted advertising. [6 Del. C. §§12D-104(a), 12D-106(a), (e), current through 2026](https://www.delcode.delaware.gov/title6/c012d/index.html).
- **Consumer rights:** Current rights include access, correction, deletion, portability and categories of third parties to which data was disclosed. [6 Del. C. §12D-104, version effective until January 1, 2027](https://www.delcode.delaware.gov/title6/c012d/index.html).
- **Risk assessments:** Delaware has a separate assessment threshold: control or processing of at least 100,000 consumers' data, excluding solely payment-transaction data. [6 Del. C. §12D-108(a), (f)](https://www.delcode.delaware.gov/title6/c012d/index.html).

### Florida (FL)

- **Sensitive data:** Sensitive-data processing requires consent. The statute separately specifies authorization for known children aged 13–17 and COPPA treatment for children under 13. [Fla. Stat. §501.71(2)(d)](https://www.flsenate.gov/Laws/Statutes/2025/501.71).
- **Sale and targeted advertising:** The covered consumer can opt out of sale, targeted advertising and significant-effect profiling, with additional choices for sensitive-data collection and voice/facial-recognition collection. [Fla. Stat. §501.705(2)](https://www.flsenate.gov/Laws/Statutes/2025/501.705).
- **Consumer rights:** Access, correction, deletion and portability sit alongside Florida's broader collection opt-outs. The response extension is only 15 days. [Fla. Stat. §§501.705–501.707](https://www.flsenate.gov/Laws/Statutes/2025/501.706).
- **Risk assessments:** Assess targeted advertising, sale, sensitive data, qualifying risky profiling and other heightened-risk processing. [Fla. Stat. §501.713](https://www.flsenate.gov/Laws/Statutes/2025/501.713).
- **Limited coverage:** §501.715 has a separate sensitive-data sale rule for persons meeting §501.702(9)(a)1.–3.; full Digital Bill of Rights coverage is not the only relevant route. [Fla. Stat. §501.715; §501.702(9)(a)1.–3.](https://www.flsenate.gov/Laws/Statutes/2025/501.715).
- **Additional authority:** Controllers must provide a conspicuous internal appeal process and give a written decision and reasons within 60 days after receiving an appeal. [Fla. Stat. §501.707](https://www.flsenate.gov/Laws/Statutes/2025/501.707).

### Indiana (IN)

- **Sensitive data:** Sensitive-data processing requires consumer consent, with COPPA treatment for known-child data. [Ind. Code §24-15-4-1(5)](https://iga.in.gov/ic/2026/Title_24/Article_15.pdf).
- **Sale and targeted advertising:** Consumers can opt out of sale, targeted advertising and qualifying significant-effect profiling. [Ind. Code §§24-15-3-1(b)(5), 24-15-4-4](https://iga.in.gov/ic/2026/Title_24/Article_15.pdf).
- **Consumer rights:** Correction is limited to data the consumer previously provided. For the copy right, the controller may provide a representative summary instead of the data. [Ind. Code §24-15-3-1(b)–(d)](https://iga.in.gov/ic/2026/Title_24/Article_15.pdf).
- **Risk assessments:** Assess sale, targeted advertising, sensitive data and qualifying high-risk activities created or generated after December 31, 2025. [Ind. Code §24-15-6-1](https://iga.in.gov/ic/2026/Title_24/Article_15.pdf).

### Iowa (IA)

- **Sensitive data:** For nonexempt sensitive-data processing, Iowa requires clear notice and an opportunity to opt out, rather than a general opt-in consent requirement. [Iowa Code §715D.4(2)](https://www.legis.iowa.gov/docs/code/715D.pdf).
- **Sale and targeted advertising:** The rights section expressly lists a sale opt-out, but not a targeted-advertising right. The controller-duty section nevertheless requires targeted-advertising disclosure and a manner to exercise an opt-out. [Iowa Code §§715D.3(1)(d), 715D.4(5)](https://www.legis.iowa.gov/docs/code/715D.pdf).
- **Consumer rights:** Iowa does not enumerate a correction right. Deletion and portability are narrower and concern data provided by the consumer, subject to statutory limits. [Iowa Code §715D.3](https://www.legis.iowa.gov/docs/code/715D.pdf).
- **Risk assessments:** This chapter does not impose a dedicated data protection assessment duty. That observation is limited to this statute and is not a conclusion that the activity is low risk. [Iowa Code chapter 715D, especially §715D.4](https://www.legis.iowa.gov/docs/code/715D.pdf).

### Kentucky (KY)

- **Sensitive data:** Sensitive-data processing requires consent, with COPPA treatment for known-child data. [KRS §367.3617(1)(e), version effective before July 1, 2027](https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=55839).
- **Sale and targeted advertising:** Consumers can opt out of sale, targeted advertising and profiling in furtherance of decisions producing legal or similarly significant effects. [KRS §§367.3615(1)(e), 367.3617(4)](https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=55838).
- **Consumer rights:** Provide confirmation/access, correction, deletion, portability of previously provided data and the statutory opt-outs. [KRS §367.3615](https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=55838).
- **Risk assessments:** The current assessment duty applies to processing activities created or generated on or after June 1, 2026. [KRS §367.3621, as amended by 2025 Ky. Acts ch.13 §2](https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=56649).

### Maryland (MD)

- **Sensitive data:** Sensitive-data collection, processing and sharing must be strictly necessary for a specific product or service requested by the consumer. Selling sensitive data is prohibited. [Md. Code, Commercial Law §14-4707(a)(1)–(2); 2026 Md. Laws ch.874](https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcl&enactments=false&section=14-4707).
- **Sale and targeted advertising:** Sale and targeted advertising have opt-outs, but sensitive-data sales and sale/targeted advertising for consumers the controller knew or should have known are under 18 are prohibited. [Md. Code, Commercial Law §§14-4705(b)(7), 14-4707(a); 2026 Md. Laws ch.874](https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcl&enactments=false&section=14-4707).
- **Consumer rights:** Access, correction, deletion, portability and specified opt-outs include a right to categories of third parties receiving data. [Md. Code, Commercial Law §14-4705](https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcl&enactments=false&section=14-4705).
- **Risk assessments:** Regular assessments cover heightened-risk processing, including an assessment for each algorithm used. Necessity and proportionality are express factors. [Md. Code, Commercial Law §14-4710](https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcl&enactments=false&section=14-4710).
- **Additional authority:** Effective July 1, 2026, Chapter 874 expands precise-geolocation and sensitive-data definitions and adds qualified restrictions on personal-data sales connected to civil immigration enforcement. Read the enacted amendment with the 14-470x codification; the base web page may not display this overlay. [2026 Maryland Laws ch.874 (HB711), §§1–2](https://mgaleg.maryland.gov/2026RS/chapters_noln/Ch_874_hb0711T.pdf).

### Minnesota (MN)

- **Sensitive data:** Sensitive processing requires consumer consent; known-child processing uses parental consent under COPPA. [Minn. Stat. §325M.16, subd.2(d)–(e)](https://www.revisor.mn.gov/statutes/cite/325M.16).
- **Sale and targeted advertising:** Sale, targeted advertising and significant-effect profiling have opt-outs. Qualifying universal opt-out signals must be supported. [Minn. Stat. §§325M.14, subds.1(f), 3; 325M.16, subd.2(f)](https://www.revisor.mn.gov/statutes/cite/325M/full).
- **Consumer rights:** Minnesota adds specific third-party lists and a right to question significant profiling decisions, obtain reasons, review data and secure correction/re-evaluation when based on inaccurate data. [Minn. Stat. §325M.14, subds.1, 4–5](https://www.revisor.mn.gov/statutes/cite/325M.14).
- **Risk assessments:** Document privacy policies and the responsible privacy contact, maintain the data inventory, and assess specified heightened-risk activities. [Minn. Stat. §§325M.16, subd.2(c); 325M.18](https://www.revisor.mn.gov/statutes/cite/325M.18).
- **Limited coverage:** An SBA-defined small business that conducts business in Minnesota or targets Minnesota residents must obtain prior consent before selling a consumer's sensitive data. [Minn. Stat. §325M.17](https://www.revisor.mn.gov/statutes/cite/325M.17).

### Montana (MT)

- **Sensitive data:** Sensitive processing requires consent; known-child sensitive data must be processed under COPPA. [Mont. Code Ann. §30-14-2812(2)(b)](https://mca.legmt.gov/bills/mca/title_0300/chapter_0140/part_0280/section_0120/0300-0140-0280-0120.html).
- **Sale and targeted advertising:** Sale, targeted advertising and qualifying profiling have opt-outs. The main controller rule requires consent for sale/targeted ads where consumers aged 13–15 are known or willfully disregarded. [Mont. Code Ann. §§30-14-2808, 30-14-2809, 30-14-2811–2812](https://mca.legmt.gov/bills/mca/title_0300/chapter_0140/part_0280/section_0120/0300-0140-0280-0120.html).
- **Consumer rights:** Provide access, correction, deletion, a copy of provided data and specified opt-outs. Access responses must describe, rather than disclose, protected identifiers listed in the statute. [Mont. Code Ann. §30-14-2808](https://mca.legmt.gov/bills/mca/title_0300/chapter_0140/part_0280/section_0080/0300-0140-0280-0080.html).
- **Risk assessments:** Assess heightened-risk targeted advertising, sales, sensitive processing and qualifying profiling created or generated after January 1, 2025. [Mont. Code Ann. §30-14-2814](https://mca.legmt.gov/bills/mca/title_0300/chapter_0140/part_0280/section_0140/0300-0140-0280-0140.html).
- **Limited coverage:** Specific online-minor provisions can apply outside full-law coverage. That limited route needs its own analysis. [Mont. Code Ann. §§30-14-2802, 30-14-2811, 30-14-2818–2819](https://mca.legmt.gov/bills/mca/title_0300/chapter_0140/part_0280/section_0110/0300-0140-0280-0110.html).
- **Additional authority:** Online services, products and features for known or willfully disregarded minors have additional reasonable-care and consent conditions, including targeted advertising, sale, significant profiling, purpose, retention, engagement design and precise geolocation. Child consent uses the parent or guardian. [Mont. Code Ann. §30-14-2811](https://mca.legmt.gov/bills/mca/title_0300/chapter_0140/part_0280/section_0110/0300-0140-0280-0110.html).

### Nebraska (NE)

- **Sensitive data:** Full-law controllers need consent for sensitive-data processing, with COPPA treatment for a known child's data. [Neb. Rev. Stat. §87-1112](https://nebraskalegislature.gov/laws/statutes.php?statute=87-1112).
- **Sale and targeted advertising:** Sale, targeted advertising and significant-effect profiling have opt-outs. The Act provides an authorized-agent and qualifying technology route. [Neb. Rev. Stat. §§87-1107, 87-1111, 87-1113](https://nebraskalegislature.gov/laws/laws-index/chap87-full.html).
- **Consumer rights:** Support access, correction, deletion, portability of provided data and specified opt-outs. [Neb. Rev. Stat. §§87-1107–87-1109](https://nebraskalegislature.gov/laws/laws-index/chap87-full.html).
- **Risk assessments:** Assess targeted advertising, sale, sensitive data, qualifying risky profiling and other heightened-risk processing. [Neb. Rev. Stat. §87-1116](https://nebraskalegislature.gov/laws/statutes.php?statute=87-1116).
- **Limited coverage:** An SBA small business covered by this limited provision must obtain prior consumer consent before selling sensitive data. [Neb. Rev. Stat. §87-1118](https://nebraskalegislature.gov/laws/statutes.php?statute=87-1118).

### New Hampshire (NH)

- **Sensitive data:** Sensitive processing requires consent; sensitive data concerning a known child must be processed under COPPA. [RSA §507-H:6, I(d)](https://www.gc.nh.gov/rsa/html/LII/507-H/507-H-mrg.htm).
- **Sale and targeted advertising:** Sale, targeted advertising and qualifying solely automated profiling have opt-outs. Universal opt-out mechanisms have applied since January 1, 2025. [RSA §§507-H:4, I(f), 507-H:6, I(g), V](https://www.gc.nh.gov/rsa/html/LII/507-H/507-H-mrg.htm).
- **Consumer rights:** Provide confirmation/access, correction, deletion, portability and the statutory opt-outs. [RSA §507-H:4](https://www.gc.nh.gov/rsa/html/LII/507-H/507-H-mrg.htm).
- **Risk assessments:** Assess targeted advertising, sale, sensitive processing and qualifying profiling created or generated after July 1, 2024. [RSA §507-H:8](https://www.gc.nh.gov/rsa/html/LII/507-H/507-H-mrg.htm).

### New Jersey (NJ)

- **Sensitive data:** Sensitive-data processing requires consent; known-child sensitive data uses COPPA treatment. [P.L.2023, c.266 §9(a)(4)](https://pub.njleg.gov/Bills/2022/AL23/266_.HTM).
- **Sale and targeted advertising:** Sale, targeted advertising and qualifying profiling have opt-outs. Known or willfully disregarded consumers aged 13–16 require consent for sale, targeted advertising and significant-effect profiling. [P.L.2023, c.266 §§3, 8, 9(a)(7)](https://pub.njleg.gov/Bills/2022/AL23/266_.HTM).
- **Consumer rights:** Support access, correction, deletion, portability and statutory opt-outs. New Jersey uses a 45-day internal appeal decision period. [P.L.2023, c.266 §§3–5](https://pub.njleg.gov/Bills/2022/AL23/266_.HTM).
- **Risk assessments:** Conduct an assessment before covered heightened-risk processing involving personal data acquired on or after the law's effective date. [P.L.2023, c.266 §9(b)](https://pub.njleg.gov/Bills/2022/AL23/266_.HTM).

### Oregon (OR)

- **Sensitive data:** Sensitive processing requires prior consent. Current law separately prohibits sale of qualifying precise location data; consent does not override that sale ban. [ORS §646A.578(2)(b), (d)](https://www.oregonlegislature.gov/bills_laws/ors/ors646A.html).
- **Sale and targeted advertising:** From January 1, 2026, sale and targeted advertising/significant profiling are prohibited for consumers the controller knows or willfully disregards are under 16. Qualifying precise-location sales are also prohibited. [ORS §§646A.574, 646A.578(2)(c)–(d), (5); HB2008 (2025)](https://www.oregonlegislature.gov/bills_laws/ors/ors646A.html).
- **Consumer rights:** Oregon includes specific third-party lists, correction and deletion including derived data, alongside access/copy and opt-out rights. [ORS §§646A.574–646A.576](https://www.oregonlegislature.gov/bills_laws/ors/ors646A.html).
- **Risk assessments:** Assess heightened-risk targeted advertising, sale, sensitive processing and qualifying profiling. Retain assessments for at least five years. [ORS §646A.586](https://www.oregonlegislature.gov/bills_laws/ors/ors646A.html).

### Rhode Island (RI)

- **Sensitive data:** Sensitive processing requires consent, including the statute's consent and COPPA requirements for known children. [R.I. Gen. Laws §6-48.1-4(c)–(e)](https://webserver.rilegislature.gov/Statutes/TITLE6/6-48.1/6-48.1-4.htm).
- **Sale and targeted advertising:** Covered customers can opt out of sale, targeted advertising and profiling in furtherance of solely automated decisions with legal or similarly significant effects. [R.I. Gen. Laws §6-48.1-5(a)(5)](https://webserver.rilegislature.gov/Statutes/TITLE6/6-48.1/6-48.1-5.htm).
- **Consumer rights:** Support confirmation/access, correction, deletion, portability and the statutory opt-outs. [R.I. Gen. Laws §§6-48.1-5–6](https://webserver.rilegislature.gov/Statutes/TITLE6/6-48.1/6-48.1-6.htm).
- **Risk assessments:** Assess heightened-risk sale, targeted advertising, sensitive processing and qualifying risky profiling created or generated after January 1, 2026. [R.I. Gen. Laws §6-48.1-7](https://webserver.rilegislature.gov/Statutes/TITLE6/6-48.1/6-48.1-7.htm).
- **Limited coverage:** The commercial website/online-service information-sharing provision has separate scope from the full controller thresholds. [R.I. Gen. Laws §6-48.1-3](https://webserver.rilegislature.gov/Statutes/TITLE6/6-48.1/6-48.1-3.htm).

### Tennessee (TN)

- **Sensitive data:** Sensitive processing requires consumer consent, with COPPA treatment for known-child sensitive data. [Tenn. Code Ann. §47-18-3305(a)(5)](https://www.capitol.tn.gov/Archives/Joint/publications/TNCodeBills/2025/TNCodeBill_Volume1_2025.pdf).
- **Sale and targeted advertising:** Consumers can opt out of sale, targeted advertising and qualifying significant-effect profiling. [Tenn. Code Ann. §§47-18-3304(a)(2)(E), 47-18-3305(d)](https://www.capitol.tn.gov/Archives/Joint/publications/TNCodeBills/2025/TNCodeBill_Volume1_2025.pdf).
- **Consumer rights:** Support confirmation/access, correction, deletion, portability and statutory opt-outs, with an internal appeal. [Tenn. Code Ann. §47-18-3304](https://www.capitol.tn.gov/Archives/Joint/publications/TNCodeBills/2025/TNCodeBill_Volume1_2025.pdf).
- **Risk assessments:** Assess targeted advertising, sale, sensitive processing and specified heightened-risk activities. A voluntary privacy program may support an affirmative defense under separate conditions. [Tenn. Code Ann. §§47-18-3307, 47-18-3314](https://www.capitol.tn.gov/Archives/Joint/publications/TNCodeBills/2025/TNCodeBill_Volume1_2025.pdf).

### Texas (TX)

- **Sensitive data:** Full-law controllers need consent for sensitive processing, with COPPA treatment for known-child data. [Tex. Bus. & Com. Code §541.101(b)(4)](https://tcss.legis.texas.gov/resources/BC/htm/BC.541.htm).
- **Sale and targeted advertising:** Sale, targeted advertising and qualifying significant-effect profiling have opt-outs. Sensitive/biometric data sales carry additional prominent notices. [Tex. Bus. & Com. Code §§541.051, 541.055, 541.102](https://tcss.legis.texas.gov/resources/BC/htm/BC.541.htm).
- **Consumer rights:** Support confirmation/access, correction, deletion, portability of provided data and statutory opt-outs. [Tex. Bus. & Com. Code §§541.051–541.053](https://tcss.legis.texas.gov/resources/BC/htm/BC.541.htm).
- **Risk assessments:** Assess targeted advertising, sale, sensitive processing, qualifying risky profiling and other heightened-risk processing. [Tex. Bus. & Com. Code §541.105](https://tcss.legis.texas.gov/resources/BC/htm/BC.541.htm).
- **Limited coverage:** An SBA small business covered by §541.107 must obtain prior consumer consent before selling sensitive data. [Tex. Bus. & Com. Code §541.107](https://tcss.legis.texas.gov/resources/BC/htm/BC.541.htm).

### Utah (UT)

- **Sensitive data:** Utah generally uses clear notice and an opportunity to opt out for sensitive processing, rather than a general prior opt-in requirement. [Utah Code §13-61-302(3)](https://le.utah.gov/xcode/Title13/Chapter61/C13-61_2022050420231231.pdf).
- **Sale and targeted advertising:** Consumers have sale and targeted-advertising opt-outs. Utah does not enumerate the general significant-profiling opt-out used in many other states. [Utah Code §§13-61-201, 13-61-302](https://le.utah.gov/xcode/Title13/Chapter61/C13-61_2022050420231231.pdf).
- **Consumer rights:** Current Utah law includes correction. Older comparison charts saying Utah has no correction right are stale. Deletion and portability remain limited to provided data. [Utah Code §§13-61-201, 13-61-203, current version including 2025 ch.468](https://le.utah.gov/xcode/Title13/Chapter61/C13-61_2022050420231231.pdf).
- **Risk assessments:** This chapter does not impose a dedicated data protection assessment duty. That is not a low-risk finding or a determination under other laws. [Utah Code chapter 13-61](https://le.utah.gov/xcode/Title13/Chapter61/C13-61_2022050420231231.pdf).

### Virginia (VA)

- **Sensitive data:** Sensitive processing requires consent; known-child data has COPPA and additional child-specific conditions in the current code. [Va. Code §59.1-578(A)(5), (C)](https://law.lis.virginia.gov/vacodefull/title59.1/chapter53/).
- **Sale and targeted advertising:** Sale, targeted advertising and qualifying significant-effect profiling have opt-outs. Current child-specific provisions require their own review. [Va. Code §§59.1-577(A)(5), 59.1-578](https://law.lis.virginia.gov/vacodefull/title59.1/chapter53/).
- **Consumer rights:** Support confirmation/access, correction, deletion, portability of provided data and the statutory opt-outs. [Va. Code §59.1-577](https://law.lis.virginia.gov/vacodefull/title59.1/chapter53/).
- **Risk assessments:** Assess targeted advertising, sale, sensitive processing and qualifying heightened-risk activities. Current law also specifies assessments for online services directed to known children. [Va. Code §59.1-580](https://law.lis.virginia.gov/vacodefull/title59.1/chapter53/).

## Version traps and review boundaries

- California: the CPPA URL named `ccpa_statute_eff_20260101.pdf` currently returns the 103-page regulations compilation. Its §§7000+ are regulations, not Civil Code text. Statutory provisions use LegInfo. The approved rulemaking text and agency announcement separately confirm the phased dates.
- Colorado: the current 2026 code at `olls.info` is linked from the official General Assembly [2026 CRS titles download](https://content.leg.colorado.gov/agencies/office-legislative-legal-services/2026-crs-titles-download). It is not an unsupported secondary tracker.
- Connecticut: the 2026 supplement prints pre- and post-July 1 versions. Use the current July version of §§42-518 and 42-520. July amendments change sensitive necessity and the 13–17 sale/targeted-advertising treatment. PA26-76 §72 adds a narrow DOT-related geolocation exception to §42-517; applicability review owns that scope condition.
- Delaware and Kentucky: official pages also print future January 1, 2027 and July 1, 2027 versions respectively. Future versions were not silently substituted into current branches.
- Iowa: §715D.3's list lacks correction and a separate targeted-advertising right, while §715D.4(5) expressly mentions targeted-advertising opt-out disclosure. That tension is an actionable warning, not permission to omit the control.
- Maryland: current sections are 14-470x, not original bill numbering 14-460x. The enacted July 2026 Chapter 874 overlay must be read with the base codification. It does not create a blanket ban on every government disclosure. The 2024 Act's April 2026 transitional language must be read with the precise referenced section, not generalized to every duty.
- Minnesota: current codification is 325M.10–.21. Preserve specific-recipient and profiling-review rights, revocation timing, inventory and small-business sensitive-sale rules.
- Oregon: sensitive consent does not override current precise-location sales or known/willfully-disregarded under-16 prohibitions. Avoid the incorrect broader claim that Oregon bans every sensitive-data sale. Current code incorporates 2025 HB2008, effective January 1, 2026.
- Tennessee: the enrolled chapter uses section 47-18-320x numbering; current codification is part 33. Runtime sources cite the official 2025 Code Bill, pages 1096–1107, after checking the original enactment.
- Utah: the current chapter includes the 2025 correction amendment and separately prints future 2027 vehicle provisions. An old no-correction chart is not authority.
- Virginia: child and social-media provisions can require a separate operative-law/court-order check. This comparison does not pronounce them enforceable or inapplicable based solely on codified text.

## Retrieval and review record

Primary legislative or regulator text was fetched in this run with web tools and, when those returned an internal error, PowerShell `Invoke-WebRequest` plus local PDF/text extraction. Source JSON records retrievedDate `2026-09-22`; unknown source effective dates are null. Summaries are editorial paraphrases. No secondary tracker supplies legal authority.

Independent adversarial cross-review was completed on September 22, 2026 by the separate applicability-source agent after the current Connecticut corrections. It found no remaining material duty or timing error across all twenty routes. The author has left every source draft and `verifiedAsOf` null for the parent to apply the project review process. Ben's practitioner review remains the release gate. Response-period summaries identify baseline request clocks; statutory exceptions, authentication conditions and distinct opt-out deadlines remain applicable. No calendar deadline is generated by this path.


Tennessee current codification cross-check: [Official 2025 Code Bill](https://www.capitol.tn.gov/Archives/Joint/publications/TNCodeBills/2025/TNCodeBill_Volume1_2025.pdf), §§47-18-3304 (rights), 3305 (duties), 3307 (assessments), 3314 (affirmative defense), pages 1096–1107. Fetched September 22, 2026.

Connecticut July 2026 cross-check: §42-518(a)(1), (6)–(7) now expressly covers inferences, significant automated-profiling review (with a housing-specific correction/re-evaluation right) and sale-recipient lists. §42-522(c), (g)(2) adds significant-decision profiling impact assessments for activities created/generated on or after August 1, 2026. These current requirements are now in the runtime candidate. [Official 2026 supplement](https://www.cga.ct.gov/2026/sup/chap_743jj.htm).

## Independent applicability cross-review

The divergence author independently traversed all twenty applicability routes and checked their numerical operators, measuring-period statements, exemptions and residual-duty outcomes against the primary texts retrieved in this run. No incorrect numeric threshold/operator was identified. The Indiana 2026 statute was successfully retrieved as a 522,238-byte PDF and supplied to the applicability author to replace its regulator-summary-only gap; its 2025 amendment adds qualified government-contract, utility/service-company and insurance-fraud nonprofit exclusions. The applicability author owns those edits and their final evidence. Minor citation-array duplicates were observed and should be deduplicated during integration. This review is automated legal QA, not practitioner approval.

## Divergence cross-review receipt

Independent reviewer: `pwc_applicability_sources` (automated legal QA, not practitioner review), September 22, 2026. Reviewed all twenty route outcomes and independently confirmed the material current CT, CA, FL, KY, UT, IA, MN, RI, MT, NH, TX and NE distinctions, plus the actual current Indiana statutory source. Findings after the author corrections: no remaining material duty/timing error. Practitioner review and release authority remain with Ben.
