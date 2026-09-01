export const changelog = [
  {
    id: 'vnext-local-candidate',
    date: '2026-08-20',
    version: null,
    headline: 'A focused way to build and review a prompt',
    bullets: [
      'Start with the work you need done, then shape five inspectable prompt parts instead of configuring a full console up front.',
      'Advanced roles, workflows, guardrails, saved setups, and structure-only sharing remain available when they help; organization context now stays tab-only unless you explicitly remember it.',
      'The review surface keeps the full prompt selectable without making mobile users scroll through the whole prompt before reaching Copy, Download, and the provider boundary.'
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
