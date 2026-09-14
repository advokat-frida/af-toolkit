export const changelog = [
  {
    id: 'authored-depth-reaches-the-page',
    date: '2026-09-13',
    version: '2.1.0',
    headline: 'The authored depth reaches the page',
    bullets: [
      'Every question keeps its one-line aside and opens the rest of the explanation under Why this question?; answer options show their authored notes.',
      'Every determination opens the rest of its reasoning under the verdict, and the outcomes whose clock line took its place open the whole of it.',
      'Each authority in the rail opens to its formal citation, the official link, and the included source text; its review status is a dotted label.',
      'Where a pending instrument would change an outcome, What may change names it, dated and sourced. The determination itself is unchanged.',
      'Browse all groups the sixteen paths by category, search matches common terms such as SAR, GPC and 72 hours, and each outcome names the next determination.',
      'The finder leads with privacy: Cross-border transfer replaces AI Act risk tier among the five common rows.',
      'The downloaded record carries the answer notes, the included source texts, and the date the sources were last checked.',
      'Every article, section, guidance, case and defined term named in a question, an explanation, a determination or an action is a citation: hover or tap it to read the cited paragraph where you are, with the official link one step away.'
    ]
  },
  {
    id: 'vnext-public-release',
    date: '2026-08-21',
    version: '2.0.0',
    headline: 'One decision at a time, with the review boundary in plain sight',
    bullets: [
      'A single finder now leads into one focused question instead of a permanent library, stage, and citations rail competing for attention.',
      'Outcomes separate the concise decision, complete authored reasoning, actions and timing, and legal review/source status instead of presenting one legal-text wall.',
      'The same 16 published decision paths and 139 source records remain available, with automated-check-only status stated separately from practitioner review.',
      'Copy and decision-record exits remain available; calendar reminders stay unavailable until the applicable clock rule receives practitioner review.'
    ]
  }
];

export function newestChangelogDate(entries = changelog) {
  return entries[0]?.date || '';
}

export function formatChangelogDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${date}T00:00:00Z`));
}
