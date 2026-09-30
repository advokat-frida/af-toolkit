<script>
  import { tick } from 'svelte';
  import { WIZARDS, SOURCES, decisionLead, eligibleOptions, historyContext, outcomeForState, relatedWizardIds, sourceIdsForState, sourceTextPlain, verifiedDate } from './engine/council.js';
  import { answerJurisdiction, beginJurisdictions, buildJurisdictionRecord, editJurisdiction, maxQuestionsRemaining } from './engine/jurisdictions.js';
  import { contextFor } from './engine/mentions.js';
  import { activeCite } from './engine/cite-state.js';
  import Mentions from './Mentions.svelte';
  import WizardRow from './WizardRow.svelte';
  import ActionChecklist from './ActionChecklist.svelte';

  export let wizardId;
  export let onOpen = () => {};

  let selected = [];
  let stateSearch = '';
  let runs = [];
  let activeId = null;
  let pending = null;
  let message = '';
  let copyFallback = '';

  $: wizard = WIZARDS[wizardId];
  $: matchingRoutes = wizard.jurisdictionRoutes.filter(route => `${route.label} ${route.id}`.toLowerCase().includes(stateSearch.trim().toLowerCase()));
  $: run = runs.find(item => item.id === activeId);
  $: node = run?.currentNodeId ? wizard.nodes[run.currentNodeId] : null;
  $: options = node ? eligibleOptions(node, historyContext(run.history)) : [];
  $: finished = runs.length > 0 && runs.every(item => item.outcomeId);
  $: followups = finished ? [...new Set(runs.flatMap(item => relatedWizardIds(wizardId, item.outcomeId)))] : [];
  $: currentSources = run && node ? sourceIdsForState(wizard, [], run.currentNodeId, null) : [];
  $: context = node ? contextFor(wizardId, node) : null;

  async function focusHeading(id) {
    activeCite.set(null);
    await tick();
    const heading = document.getElementById(id);
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  function begin() {
    try {
      runs = beginJurisdictions(wizard, selected);
      activeId = runs.find(item => !item.outcomeId)?.id || null;
      pending = null;
      message = '';
      copyFallback = '';
      focusHeading(activeId ? 'jurisdiction-question' : 'jurisdiction-results');
    } catch (error) { message = error.message; }
  }

  function selectState(id, checked) {
    selected = checked ? [...selected, id] : selected.filter(value => value !== id);
    message = '';
  }

  function next() {
    if (pending === null) { message = 'Choose an answer first.'; return; }
    try {
      runs = answerJurisdiction(wizard, runs, activeId, pending);
      pending = null;
      message = '';
      copyFallback = '';
      activeId = runs.find(item => !item.outcomeId)?.id || null;
      focusHeading(activeId ? 'jurisdiction-question' : 'jurisdiction-results');
    } catch (error) { message = error.message; }
  }

  function edit(id, index) {
    runs = editJurisdiction(wizard, runs, id, index);
    activeId = id;
    pending = null;
    copyFallback = '';
    message = 'Later answers for this state were cleared. Other state results are unchanged.';
    focusHeading('jurisdiction-question');
  }

  function back() {
    if (run.history.length) { edit(run.id, run.history.length - 1); return; }
    const index = runs.findIndex(item => item.id === activeId);
    const previous = runs.slice(0, index).findLast(item => item.history.length);
    if (previous) edit(previous.id, previous.history.length - 1);
    else changeStates();
  }

  function changeStates() {
    runs = [];
    activeId = null;
    pending = null;
    copyFallback = '';
    message = 'Answers cleared. Choose the states for a new determination.';
    focusHeading('jurisdiction-selector');
  }

  function record() { return buildJurisdictionRecord({ wizardId, runs }); }

  function download() {
    const blob = new Blob([record()], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `privacy-determination-${wizardId}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message = 'All selected state results downloaded. The file includes the facts you selected.';
  }

  async function copy() {
    const text = record();
    try {
      await navigator.clipboard.writeText(text);
      copyFallback = '';
      message = 'All selected state results copied.';
    } catch {
      copyFallback = text;
      message = 'Select the record below and copy it manually.';
      await tick();
      document.getElementById('jurisdiction-copy')?.select();
    }
  }
</script>

<section class="jurisdiction-run" aria-label="State privacy determination">
  {#if message}<p class="action-message" role="status">{message}</p>{/if}
  {#if !runs.length}
    <section class="question-card state-selector">
      <p class="step-label">Set the scope</p>
      <h3 id="jurisdiction-selector" tabindex="-1">Which states are you checking?</h3>
      <p>Select the states where the people whose data you handle live. Work through each state, then compare their results together.</p>
      <p class="question-aside">These paths cover the comprehensive state privacy laws currently in effect. A result does not rule out sector, breach, biometric or other privacy laws.</p>
      <label class="state-search-label" for="state-search">Find a state</label>
      <input id="state-search" class="state-search" type="search" placeholder="State name or abbreviation" bind:value={stateSearch} />
      <fieldset class="jurisdiction-choices">
        <legend class="sr-only">States to assess</legend>
        {#each matchingRoutes as route (route.id)}
          <label class="jurisdiction-choice" class:selected={selected.includes(route.id)}>
            <input type="checkbox" value={route.id} checked={selected.includes(route.id)} on:change={(event) => selectState(route.id, event.currentTarget.checked)} />
            <span>{route.label}</span>
          </label>
        {:else}
          <p class="state-selection-note" role="status">No matching state. Clear the search to see the full list.</p>
        {/each}
      </fieldset>
      <div class="question-actions">
        <button type="button" class="button primary" on:click={begin}>Check {selected.length || ''} {selected.length === 1 ? 'state' : 'states'}</button>
      </div>
      <p class="outcome-aside">Sources checked {verifiedDate(wizard) || 'date not recorded'}.</p>
    </section>
  {:else if !finished && node}
    <div class="jurisdiction-progress">
      <p class="step-label">{run.label} · State {runs.findIndex(item => item.id === activeId) + 1} of {runs.length}</p>
    </div>
    {#key run.currentNodeId}
    <article class="question-card" aria-label={node.q}>
      <p class="question-count">Question {run.history.length + 1} · At most {maxQuestionsRemaining(wizard, run.currentNodeId)} {maxQuestionsRemaining(wizard, run.currentNodeId) === 1 ? 'question' : 'questions'} left</p>
      <h3 id="jurisdiction-question" tabindex="-1"><Mentions text={node.q} {context} /></h3>
      <fieldset class="answer-list jurisdiction-answers">
        <legend class="sr-only">{node.q}</legend>
        {#each options as option, index}
          <label class="answer-card jurisdiction-answer" class:selected={pending === index}>
            <input type="radio" name={`answer-${run.id}-${run.currentNodeId}`} value={index} bind:group={pending} />
            <span><strong>{option.label}</strong>{#if option.desc}<small>{option.desc}</small>{/if}</span>
          </label>
        {/each}
      </fieldset>
      <div class="question-disclosures">
      {#if node.help}
        <details class="disclosure">
          <summary>Why this question?</summary>
          <p class="disclosure-body"><Mentions text={node.help} {context} /></p>
        </details>
      {/if}
      {#if currentSources.length}
        <details class="disclosure">
          <summary>Authority for this step</summary>
          <ul class="state-step-sources">
            {#each currentSources as id}
              <li><a href={SOURCES[id].provenance} target="_blank" rel="noopener noreferrer">{SOURCES[id].citation} ↗</a></li>
            {/each}
          </ul>
        </details>
      {/if}
      </div>
      <div class="question-actions">
        <button type="button" class="button primary" on:click={next}>Next</button>
        <button type="button" class="text-button" on:click={back}>Back</button>
      </div>
    </article>
    {/key}
  {:else if finished}
    <header class="state-results-heading">
      <h3 id="jurisdiction-results" tabindex="-1">Your state results</h3>
      <p class="outcome-aside">Sources checked {verifiedDate(wizard) || 'date not recorded'}.</p>
    </header>
    <div class="state-results">
      {#each runs as item (item.id)}
        {@const outcome = outcomeForState(wizard, item.history, item.outcomeId)}
        {@const outcomeContext = contextFor(wizardId, outcome)}
        {@const sources = sourceIdsForState(wizard, item.history, null, item.outcomeId)}
        {@const lead = decisionLead(outcome.summary)}
        {@const rest = lead === outcome.summary ? '' : lead.endsWith('…') ? outcome.summary : outcome.summary.slice(lead.length).trim()}
        <article class={`outcome-card state-result tier-${outcome.tier}`} aria-labelledby={`result-${item.id}`}>
          <p class="step-label">{item.label}</p>
          <div class="verdict-block">
            <h4 class="verdict-title" id={`result-${item.id}`}>{outcome.title.startsWith(`${item.label}: `) ? outcome.title.slice(item.label.length + 2) : outcome.title}</h4>
            <p class="verdict-sub"><Mentions text={lead} context={outcomeContext} /></p>
          </div>
          {#if rest}<details class="disclosure"><summary>Read the rest of the reasoning</summary><p class="disclosure-body"><Mentions text={rest} context={outcomeContext} /></p></details>{/if}
          {#if outcome.notes?.length}{#each outcome.notes as note, index}<p class="outcome-summary"><Mentions text={note} context={contextFor(wizardId, { cites: outcome.noteCites[index] })} /></p>{/each}{/if}
          {#if outcome.missingFacts?.length}
            <section class="state-missing" aria-label="Facts still needed">
              <p class="field-label">Facts still needed</p>
              <dl>{#each outcome.missingFacts as fact}<dt>{fact.fact}</dt><dd><strong>Ask:</strong> {fact.owner}<br /><strong>Why:</strong> {fact.why}</dd>{/each}</dl>
            </section>
          {/if}
          {#if outcome.actions?.length}
            <ActionChecklist id={`actions-${item.id}`} {wizardId} actions={outcome.actions} actionCites={outcome.actionCites} />
          {/if}
          <details class="disclosure selected-facts">
            <summary>Review or change {item.label} answers</summary>
            <ol>{#each item.history as fact, index}<li><span><strong>{fact.question}</strong><br />{fact.answer}</span><button type="button" class="text-button" aria-label={`Change answer ${index + 1} for ${item.label}`} on:click={() => edit(item.id, index)}>Change</button></li>{/each}</ol>
          </details>
          <details class="disclosure state-authority">
            <summary>{item.label} sources</summary>
            {#each sources as id}
              <section class="authority-body">
                <p><strong>{SOURCES[id].label}</strong><br />{SOURCES[id].citation}</p>
                <a class="official-link" href={SOURCES[id].provenance} target="_blank" rel="noopener noreferrer">Open the official text ↗</a>
                {#if SOURCES[id].note}<p>{SOURCES[id].note}</p>{/if}
                <p class="source-body">{sourceTextPlain(SOURCES[id].body)}</p>
              </section>
            {/each}
          </details>
        </article>
      {/each}
    </div>
    <div class="exit-actions state-export">
      <button type="button" class="button primary" on:click={download}>Download all state results</button>
      <button type="button" class="button secondary" on:click={copy}>Copy record</button>
      <button type="button" class="text-button" on:click={changeStates}>Start with different states</button>
    </div>
    {#if followups.length}
      <section class="next-determination" aria-label="Next determination">
        <p class="field-label">Next determination</p>
        <div class="wizard-list">{#each followups as id}<WizardRow {id} {onOpen} />{/each}</div>
      </section>
    {/if}
  {/if}
  {#if copyFallback}<div class="fallback-panel"><label for="jurisdiction-copy">All selected state results</label><textarea id="jurisdiction-copy" readonly rows="12" value={copyFallback}></textarea></div>{/if}
</section>
