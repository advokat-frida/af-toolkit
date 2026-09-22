import { answerQuestion, buildRecord, editAnswer, WIZARDS } from './council.js';
import { validateJurisdictionRoutes } from './jurisdiction-routes.js';
export { validateJurisdictionRoutes, maxQuestionsRemaining } from './jurisdiction-routes.js';

export function beginJurisdictions(wizard, selected) {
  if (validateJurisdictionRoutes(wizard).length) throw new Error('The jurisdiction routes are invalid.');
  if (!Array.isArray(selected) || !selected.length || new Set(selected).size !== selected.length
    || selected.some(id => !wizard.jurisdictionRoutes?.some(route => route.id === id))) {
    throw new Error('Choose at least one listed jurisdiction, once each.');
  }
  return wizard.jurisdictionRoutes.filter(route => selected.includes(route.id)).map(route => ({
    id: route.id, label: route.label,
    currentNodeId: wizard.nodes[route.start].type === 'question' ? route.start : null,
    outcomeId: wizard.nodes[route.start].type === 'outcome' ? route.start : null,
    history: []
  }));
}

function updateRun(runs, id, update) {
  const index = runs.findIndex(run => run.id === id);
  if (index < 0) throw new Error('That jurisdiction was not selected.');
  const result = update(runs[index]);
  if (!result.ok) throw new Error('That answer could not be applied.');
  return runs.map((run, i) => i === index ? { ...run, history: result.history, currentNodeId: result.currentNodeId, outcomeId: result.outcomeId } : run);
}

export function answerJurisdiction(wizard, runs, id, optionIndex) {
  if (!Number.isInteger(optionIndex) || optionIndex < 0) throw new Error('Choose a listed answer.');
  return updateRun(runs, id, run => answerQuestion(wizard, run.currentNodeId, optionIndex, run.history));
}

export function editJurisdiction(wizard, runs, id, historyIndex) {
  if (!Number.isInteger(historyIndex) || historyIndex < 0) throw new Error('Choose a selected fact.');
  return updateRun(runs, id, run => editAnswer(wizard, run.history, historyIndex));
}

export function buildJurisdictionRecord({ wizardId, runs, date = new Date() }) {
  const wizard = WIZARDS[wizardId];
  if (!wizard?.jurisdictionRoutes || !runs?.length || runs.some(run => !run.outcomeId)) throw new Error('Complete every selected jurisdiction before exporting.');
  const lines = [`# ${wizard.title}`, '', `Selected jurisdictions: ${runs.map(run => run.label).join(', ')}`, '', 'Each jurisdiction is a separate determination on its selected facts. Other laws may apply.', ''];
  for (const run of runs) {
    lines.push(`## ${run.label}`, '', buildRecord({ wizardId, history: run.history, outcomeId: run.outcomeId, date }).replace(/^# /gm, '### ').replace(/^## /gm, '#### '));
    const missing = wizard.nodes[run.outcomeId].missingFacts || [];
    if (missing.length) lines.push('', '### Facts still needed', '', ...missing.map(item => `- ${item.fact}\n  - Ask: ${item.owner}\n  - Why: ${item.why}`));
    lines.push('', '---', '');
  }
  return lines.join('\n');
}
