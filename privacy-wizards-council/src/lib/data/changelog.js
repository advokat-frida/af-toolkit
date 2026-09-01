export const changelog = [
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
