// Law in motion: a pending instrument that would change an outcome if it were adopted.
// These are annotations, shown under "What may change" on the outcomes they touch. They
// never alter a determination; the cited law applies until an amending act is adopted and
// applies. Each note carries the date it was last checked and the official document it
// rests on. `outcomeIds: null` means every outcome of the wizard.
const OMNIBUS_OPINION = {
  label: 'EDPB-EDPS Joint Opinion 2/2026 on the Digital Omnibus proposal',
  url: 'https://www.edpb.europa.eu/system/files/2026-02/edpb_edps_jointopinion_202602_digitalomnibus_en.pdf'
};

export const MOTION = [
  {
    id: 'omnibus-breach',
    wizardIds: ['breach'],
    outcomeIds: ['o-investigate', 'o-eu-no-notify', 'o-eu-sa-only', 'o-eu-full-notify', 'o-eu-disproportionate'],
    checked: '2026-09-13',
    scope: 'EU',
    text: "The Commission's Digital Omnibus proposal of 19 November 2025 would limit supervisory-authority notification to breaches likely to result in a high risk and extend the deadline from 72 to 96 hours. It is a proposal in the legislative procedure, not law: Art. 33 as cited applies until an amending regulation is adopted and applies.",
    source: OMNIBUS_OPINION
  },
  {
    id: 'omnibus-dpia',
    wizardIds: ['dpia'],
    outcomeIds: null,
    checked: '2026-09-13',
    scope: 'EU',
    text: "The Commission's Digital Omnibus proposal of 19 November 2025 would replace the national Art. 35(4) lists with one EU-level list of processing that requires a DPIA. It is a proposal, not law: the supervisory authority's list cited here stands until an amending regulation is adopted and applies.",
    source: OMNIBUS_OPINION
  },
  {
    id: 'omnibus-cookies',
    wizardIds: ['cookies'],
    outcomeIds: null,
    checked: '2026-09-13',
    scope: 'EU',
    text: "The Commission's Digital Omnibus proposal of 19 November 2025 would move the consent rule for cookies and similar technologies from the ePrivacy Directive into the GDPR and require sites to honor machine-readable browser signals. It is a proposal, not law: Art. 5(3) ePrivacy and the national rules cited here apply until an amending regulation is adopted and applies.",
    source: OMNIBUS_OPINION
  },
  {
    id: 'omnibus-ropa',
    wizardIds: ['ropa'],
    outcomeIds: null,
    checked: '2026-09-13',
    scope: 'EU',
    text: "The Commission's Digital Omnibus proposal of 19 November 2025 would widen the Art. 30(5) exemption to organizations with fewer than 750 employees unless their processing is likely to result in a high risk. It is a proposal, not law: the 250-employee threshold cited here applies until an amending regulation is adopted and applies.",
    source: OMNIBUS_OPINION
  }
];
