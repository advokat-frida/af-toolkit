<script>
  import { onMount, tick } from 'svelte';
  import {
    ENABLED_WIZARDS,
    MANIFEST_SHA256,
    MANIFEST_VERSION,
    SOURCE_MANIFEST,
    SOURCES,
    WIZARDS,
    answerQuestion,
    buildRecord,
    calendarEligibility,
    decisionLead,
    editAnswer,
    eligibleOptions,
    historyContext,
    motionNotes,
    parseWizardHash,
    relatedWizardIds,
    searchText,
    sourceIdsForState,
    sourceStatusLabel,
    sourceTextPlain,
    tierLabel,
    validateGraph,
    verifiedDate,
    wizardReviewState
  } from './lib/engine/council.js';
  import { categories, categoryForWizard, commonWizardIds } from './lib/data/categories.js';
  import { changelog, formatChangelogDate, newestChangelogDate } from './lib/data/changelog.js';
  import { wizardIcon, wizardIconColor } from './lib/icons.js';
  import { contextFor } from './lib/engine/mentions.js';
  import Mentions from './lib/Mentions.svelte';
  import { activeCite } from './lib/engine/cite-state.js';
  import WizardRow from './lib/WizardRow.svelte';

  // Lucide "search" (lucide-static 1.31.0, ISC) — the one non-wizard glyph on the finder.
  const searchIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>';

  const EMBED = new URLSearchParams(location.search).has('embed');

  function postShellContext(title) {
    if (!EMBED || window.parent === window) return;
    try {
      window.parent.postMessage({ toolkit: 'context', title: title || '' }, window.location.origin);
    } catch {
      // The shell simply keeps the default name.
    }
  }

  let search = '';
  let activeCategory = null;
  let showAll = false;
  let selectedWizardId = null;
  let currentNodeId = null;
  let outcomeId = null;
  let decisionExpanded = false;
  let helpExpanded = false;
  let motionExpanded = false;
  let history = [];
  let libraryMessage = '';
  let runMessage = '';
  let copyMessage = '';
  let fallback = null;
  let pendingIndex = null;

  const graph = validateGraph();

  $: changelogDate = newestChangelogDate(changelog);
  $: wizard = selectedWizardId ? WIZARDS[selectedWizardId] : null;
  $: reviewState = selectedWizardId ? wizardReviewState(selectedWizardId) : null;
  $: currentNode = wizard && currentNodeId ? wizard.nodes[currentNodeId] : null;
  $: outcome = wizard && outcomeId ? wizard.nodes[outcomeId] : null;
  $: currentOptions = currentNode ? eligibleOptions(currentNode, historyContext(history)) : [];
  $: usedSourceIds = wizard ? sourceIdsForState(wizard, history, currentNodeId, outcomeId) : [];
  $: usedSources = usedSourceIds.map((id) => ({ id, source: SOURCES[id], manifest: SOURCE_MANIFEST[id] })).filter((item) => item.source);
  $: calendarState = selectedWizardId && outcomeId ? calendarEligibility({ wizardId: selectedWizardId, outcomeId }) : null;
  $: filteredWizardIds = filterWizardIds(search, activeCategory, showAll);
  $: groupedLibrary = !search.trim() && !activeCategory && showAll
    ? categories.map((category) => ({ ...category, ids: category.wizardIds.filter((id) => WIZARDS[id]) }))
    : null;
  $: questionsAhead = wizard && currentNodeId ? longestQuestionRun(wizard, currentNodeId) : 0;
  $: questionTotal = history.length + questionsAhead;
  // The aside and the verdict qualifier show the lead; a disclosure carries only what is
  // left, so no sentence appears twice. A clocked outcome shows no lead, so its disclosure
  // carries the whole reasoning.
  $: helpLead = currentNode?.help ? decisionLead(currentNode.help) : '';
  $: helpRest = currentNode?.help ? restAfterLead(currentNode.help, helpLead) : '';
  $: reasoningLead = outcome ? decisionLead(outcome.summary) : '';
  $: reasoningRest = outcome ? (outcome.clock ? String(outcome.summary || '').trim() : restAfterLead(outcome.summary, reasoningLead)) : '';
  $: reasoningLabel = outcome?.clock ? 'Read the reasoning' : 'Read the rest of the reasoning';
  $: motion = selectedWizardId && outcomeId ? motionNotes(selectedWizardId, outcomeId) : [];
  $: related = selectedWizardId ? relatedWizardIds(selectedWizardId, outcomeId) : [];
  $: checkedDate = wizard ? verifiedDate(wizard) : null;
  // Inline citations: one context per node, and one shared term scope per group of blocks
  // (the help's lead and rest; the verdict line and the reasoning; the actions), recreated
  // together so a defined term links once per group.
  $: citeState = {
    node: currentNodeId || outcomeId,
    context: contextFor(selectedWizardId, currentNode || outcome),
    help: new Set(),
    reasoning: new Set(),
    actions: new Set()
  };

  onMount(() => {
    handleHash(location.hash || '');
    window.addEventListener('hashchange', () => handleHash(location.hash || ''));
    // The Toolkit shell posts a reset when its rail item for this tool is chosen again.
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.toolkit === 'reset') changeDetermination();
    });
  });

  // Longest run of questions still ahead on any eligible branch; the count can
  // only shrink as answers rule branches out.
  function longestQuestionRun(currentWizard, nodeId, seen = new Set()) {
    const node = currentWizard.nodes[nodeId];
    if (!node || node.type !== 'question' || seen.has(nodeId)) return 0;
    const visited = new Set(seen).add(nodeId);
    let deepest = 0;
    for (const option of node.opts || []) deepest = Math.max(deepest, longestQuestionRun(currentWizard, option.goto, visited));
    return 1 + deepest;
  }

  function restAfterLead(text, lead) {
    const value = String(text || '').trim();
    if (!lead || lead === value) return '';
    // A lead that was cut mid-sentence ends in an ellipsis; then the rest is the whole text.
    if (lead.endsWith('…')) return value;
    return value.slice(lead.length).trim();
  }

  // A step change closes what the last step had open, the citation card included.
  function closeDisclosures() {
    decisionExpanded = false;
    helpExpanded = false;
    motionExpanded = false;
    activeCite.set(null);
  }

  function selectAnswer(index) {
    pendingIndex = index;
  }

  function commitAnswer() {
    if (pendingIndex === null) {
      runMessage = 'Choose an answer first.';
      return;
    }
    const index = pendingIndex;
    pendingIndex = null;
    chooseAnswer(index);
  }

  function stepBack() {
    pendingIndex = null;
    if (history.length) goBack();
    else changeDetermination();
  }

  function filterWizardIds(currentSearch, currentCategory, currentShowAll) {
    const term = currentSearch.trim().toLowerCase();
    if (term) {
      return Object.entries(WIZARDS)
        .filter(([id, item]) => searchText(id, item, categoryForWizard(id)?.label || '').includes(term))
        .map(([id]) => id);
    }
    if (currentCategory) return categories.find((category) => category.id === currentCategory)?.wizardIds || [];
    return currentShowAll ? Object.keys(WIZARDS) : commonWizardIds;
  }

  function handleHash(hash) {
    const parsed = parseWizardHash(hash);
    if (parsed.status === 'ok') {
      openWizard(parsed.id, false);
      return;
    }
    if (parsed.status === 'invalid' || parsed.status === 'unknown') {
      postShellContext('');
      selectedWizardId = null;
      libraryMessage = 'That determination link could not be opened. Choose a determination from the library.';
      try {
        window.history.replaceState(null, document.title, location.href.split('#')[0]);
      } catch {
        // No attacker-controlled fragment is rendered.
      }
      return;
    }
    postShellContext('');
    selectedWizardId = null;
  }

  function setWizardHash(id) {
    if (location.hash !== `#${id}`) location.hash = id;
  }

  function focusTask(primaryId = 'question-heading') {
    tick().then(() => requestAnimationFrame(() => {
      const heading = document.getElementById(primaryId) || document.getElementById('determination-heading');
      if (!heading) return;
      heading.focus({ preventScroll: true });
      (heading.closest('.question-card, .outcome-card, .unavailable-card') || heading).scrollIntoView({ block: 'start', behavior: 'auto' });
    }));
  }

  function openWizard(id, updateHash = true) {
    const next = WIZARDS[id];
    if (!next) return;
    selectedWizardId = id;
    currentNodeId = next.start;
    outcomeId = null;
    closeDisclosures();
    history = [];
    runMessage = '';
    copyMessage = '';
    fallback = null;
    pendingIndex = null;
    if (updateHash) setWizardHash(id);
    postShellContext(next.title);
    focusTask();
  }

  function changeDetermination() {
    postShellContext('');
    pendingIndex = null;
    selectedWizardId = null;
    currentNodeId = null;
    outcomeId = null;
    closeDisclosures();
    history = [];
    try {
      historyReplaceBase();
    } catch {
      // file:// history behavior varies; no answer data is ever written.
    }
    tick().then(() => document.getElementById('finder')?.focus());
  }

  function historyReplaceBase() {
    window.history.replaceState(null, document.title, location.href.split('#')[0]);
  }

  function startOver() {
    if (!wizard) return;
    currentNodeId = wizard.start;
    outcomeId = null;
    closeDisclosures();
    history = [];
    pendingIndex = null;
    runMessage = 'Current answers cleared. The determination link still contains only the wizard ID.';
    focusTask();
  }

  function chooseAnswer(index) {
    const result = answerQuestion(wizard, currentNodeId, index, history);
    if (!result.ok) {
      runMessage = 'That answer could not be applied. The current path was left unchanged.';
      return;
    }
    history = result.history;
    pendingIndex = null;
    currentNodeId = result.currentNodeId;
    outcomeId = result.outcomeId;
    closeDisclosures();
    runMessage = '';
    focusTask(outcomeId ? 'outcome-heading' : 'question-heading');
  }

  function goBack() {
    if (!history.length) return;
    const entry = history[history.length - 1];
    history = history.slice(0, -1);
    pendingIndex = null;
    currentNodeId = entry.nodeId;
    outcomeId = null;
    closeDisclosures();
    runMessage = 'The later answer was removed.';
    focusTask();
  }

  function editSelectedFact(index) {
    const result = editAnswer(wizard, history, index);
    if (!result.ok) return;
    history = result.history;
    pendingIndex = null;
    currentNodeId = result.currentNodeId;
    outcomeId = null;
    closeDisclosures();
    runMessage = `${result.removed} selected answer${result.removed === 1 ? '' : 's'} removed so the path can be rebuilt from that question.`;
    focusTask();
  }

  function fallbackCopy(text, label) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    let worked = false;
    try {
      worked = document.execCommand('copy');
    } catch {
      worked = false;
    }
    textarea.remove();
    if (worked) copyMessage = `${label} copied.`;
    else {
      fallback = { text, label };
      copyMessage = 'Automatic copy was blocked. Select the text below and copy it manually.';
      tick().then(() => document.getElementById('copy-fallback')?.select());
    }
  }

  async function copyText(text, label) {
    fallback = null;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
      copyMessage = `${label} copied.`;
    } catch {
      fallbackCopy(text, label);
    }
  }

  function downloadRecord() {
    const record = buildRecord({ wizardId: selectedWizardId, history, outcomeId });
    const blob = new Blob([record], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `privacy-determination-${selectedWizardId}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    copyMessage = 'Decision record downloaded. The page cannot retrieve or delete the file afterward.';
  }

  function selectCategory(id) {
    activeCategory = activeCategory === id ? null : id;
    showAll = false;
    search = '';
  }

  function resetFinder() {
    search = '';
    activeCategory = null;
    showAll = false;
    tick().then(() => document.getElementById('finder')?.focus());
  }

  function copyWizardLink() {
    const link = `${location.href.split('#')[0]}#${selectedWizardId}`;
    copyText(link, 'Wizard link');
  }
</script>

<svelte:head>
  <meta name="description" content="Guided privacy determinations with visible source and review status." />
</svelte:head>

{#if !EMBED}
<header class="site-bar">
  <a class="bar-wordmark" href="https://advokatfrida.com/">Advokat Frida</a>
    <a class="chip-subscribe" href="https://advokatfrida.com/#/portal/signup">Subscribe</a>
  <nav class="bar-nav" aria-label="Sections">
    <ul class="nav">
      <li><a href="https://advokatfrida.com/tag/toolkit/">Toolkit</a></li>
      <li><a href="https://advokatfrida.com/tag/field-guides/">Field Guides</a></li>
      <li><a href="https://advokatfrida.com/tag/fridas-desk/">Frida’s Desk</a></li>
      <li><a href="https://shop.advokatfrida.com">The Mercantile</a></li>
      <li><a href="https://advokatfrida.com/about/">About</a></li>
    </ul>
  </nav>
</header>
{/if}

<main class:is-embed={EMBED}>
  {#if !EMBED}
  <section class="orientation" aria-labelledby="page-title">
    <h1 id="page-title">Privacy Wizards Council</h1>
    <details class="changelog">
      <summary>Changelog (last updated: {formatChangelogDate(changelogDate)})</summary>
      <div class="changelog-body">
        {#each changelog as entry}
          <div class="changelog-entry">
            <time datetime={entry.date}>{formatChangelogDate(entry.date)}{entry.version ? ` · ${entry.version}` : ''}</time>
            <strong>{entry.headline}</strong>
            <ul>{#each entry.bullets as bullet}<li>{bullet}</li>{/each}</ul>
          </div>
        {/each}
      </div>
    </details>
  </section>
  {/if}

  {#if !graph.ok}
    <section class="integrity-error" role="alert">
      <p class="status-kicker">Integrity stop</p>
      <h2>The decision graph did not pass its local checks.</h2>
      <p>No wizard can run until the broken start, branch, outcome, citation, or manifest reference is corrected.</p>
    </section>
  {:else if !selectedWizardId || !wizard || !reviewState}
    {#if libraryMessage}<div class="notice" role="status"><p>{libraryMessage}</p><button type="button" class="text-button" on:click={() => (libraryMessage = '')}>Dismiss</button></div>{/if}
    <section class="finder-stage" aria-labelledby="finder-heading">
      <h2 id="finder-heading" class="sr-only">Find a determination</h2>
      <section class="intro-steps" aria-label="How it works">
        <div><span class="intro-step-n">01</span><strong>Find your question</strong><span>Grouped by what you are deciding.</span></div>
        <div><span class="intro-step-n">02</span><strong>Answer one question at a time</strong><span>Each step names the article it turns on.</span></div>
        <div><span class="intro-step-n">03</span><strong>Read the determination</strong><span>Cited outcome and next steps.</span></div>
      </section>
      <label class="sr-only" for="finder">What are you trying to decide?</label>
      <div class="search-wrap"><span class="search-glyph" aria-hidden="true">{@html searchIcon}</span><input id="finder" type="search" bind:value={search} on:input={() => { activeCategory = null; showAll = true; }} placeholder="Try breach, DPIA, cookies, AI risk…" /></div>
      {#if search}<p class:empty={filteredWizardIds.length === 0} class="search-feedback" role="status">{filteredWizardIds.length ? `${filteredWizardIds.length} matching ${filteredWizardIds.length === 1 ? 'determination' : 'determinations'}.` : 'No matching determination. Try a shorter term or reset the finder.'}</p>{/if}

      <div class="library-heading">
        {#if search || activeCategory || showAll}<button type="button" class="text-button" on:click={resetFinder}>Reset finder</button>{:else}<button type="button" class="text-button" on:click={() => (showAll = true)}>Browse all {Object.keys(WIZARDS).length}</button>{/if}
      </div>

      <div class="wizard-list">
        {#if groupedLibrary}
          {#each groupedLibrary as group (group.id)}
            <p class="group-label">{group.label}</p>
            {#each group.ids as id (id)}
              <WizardRow {id} onOpen={openWizard} />
            {/each}
          {/each}
        {:else}
          {#each filteredWizardIds as id (id)}
            <WizardRow {id} onOpen={openWizard} />
          {:else}
            <div class="empty-state"><h3>No determination matches that search.</h3><p>Try a shorter term or reset the finder.</p><button type="button" class="button secondary" on:click={resetFinder}>Reset finder</button></div>
          {/each}
        {/if}
      </div>
    </section>
  {:else}
    <section class="determination-shell">
      {#if !EMBED}
      <div class="determination-topline">
        <button type="button" class="text-button" on:click={changeDetermination}>← Change determination</button>
        <button type="button" class="text-button" on:click={copyWizardLink}>Copy wizard link</button>
      </div>
      {/if}
      {#if EMBED}
        <h2 id="determination-heading" class="sr-only" tabindex="-1">{wizard.title}</h2>
      {:else}
      <header class="determination-header">
        <div class="title-cluster"><span class={`large-icon icon-${wizardIconColor(selectedWizardId)}`} aria-hidden="true">{@html wizardIcon(selectedWizardId)}</span><div><p class="step-label">{categoryForWizard(selectedWizardId)?.label}</p><h2 id="determination-heading" tabindex="-1">{wizard.title}</h2><p>{wizard.tag}</p></div></div>
        <div class={`legal-status status-${reviewState.status}`}><span>{sourceStatusLabel(reviewState.status)}</span><small>{reviewState.practitionerReviewed ? `Legal sources reviewed through ${reviewState.reviewedThrough}` : 'Published aid · not counsel-reviewed'}</small></div>
      </header>
      {/if}

      {#if copyMessage}<p class="action-message" role="status">{copyMessage}</p>{/if}
      {#if runMessage}<p class="action-message" role="status">{runMessage}</p>{/if}

      {#if !reviewState.available}
        <section class="unavailable-card" aria-labelledby="unavailable-heading">
          <p class="status-kicker">Unavailable · source status stop</p>
          <h3 id="unavailable-heading">This path cannot run from the current manifest.</h3>
          <p>At least one relied-on source is draft, missing, or superseded. Choose another determination while the source record is corrected.</p>
          {#if reviewState.automatedCheckNote}<p class="automated-note"><strong>Legacy automated-check note:</strong> {reviewState.automatedCheckNote}</p>{/if}
          <div class="unavailable-actions"><button type="button" class="button primary" on:click={changeDetermination}>Choose another determination</button></div>
        </section>
      {:else}
        <div class="run-grid">
          <section class="decision-stage">

            {#if currentNode}
              <!-- The heading holds citation cards, so the card and the answer group take the plain question as their name. -->
              <article class="question-card" aria-label={currentNode.q}>
                <div class="question-progress">
                  <p class="question-count">Question {history.length + 1} of {questionTotal}</p>
                  <span class="progress-track" aria-hidden="true"><span class="progress-fill" style={`width:${Math.round(((history.length + 1) / Math.max(questionTotal, 1)) * 100)}%`}></span></span>
                </div>
                <h3 id="question-heading" tabindex="-1"><Mentions text={currentNode.q} context={citeState.context} /></h3>
                <div class="answer-list" role="radiogroup" aria-label={currentNode.q}>
                  {#each currentOptions as option, index}
                    <button type="button" class="answer-card" class:selected={pendingIndex === index} role="radio" aria-checked={pendingIndex === index} on:click={() => selectAnswer(index)}>
                      <span><strong>{option.label}</strong>{#if option.desc}<small>{option.desc}</small>{/if}</span>
                    </button>
                  {/each}
                </div>
                {#if currentNode.help}
                  <p class="question-aside"><Mentions text={helpLead} context={citeState.context} scope={citeState.help} /></p>
                  {#if helpRest}
                    <details class="disclosure" bind:open={helpExpanded}>
                      <summary>Why this question?</summary>
                      <p class="disclosure-body"><Mentions text={helpRest} context={citeState.context} scope={citeState.help} /></p>
                    </details>
                  {/if}
                {/if}
                <div class="question-actions">
                  <button type="button" class="button primary" on:click={commitAnswer}>Next</button>
                  <button type="button" class="text-button" on:click={stepBack}>Back</button>
                </div>
              </article>
            {:else if outcome}
              <article class={`outcome-card tier-${outcome.tier}`} aria-labelledby="outcome-heading">
                <div class="verdict-block">
                  <strong class="verdict-title" id="outcome-heading" tabindex="-1">{outcome.title}</strong>
                  <span class="verdict-sub"><Mentions text={outcome.clock || reasoningLead} context={citeState.context} scope={citeState.reasoning} /></span>
                </div>

                <div class="outcome-grid">
                  <div class="outcome-main">
                    {#if reasoningRest}
                      <details class="disclosure" bind:open={decisionExpanded}>
                        <summary>{reasoningLabel}</summary>
                        <p class="disclosure-body"><Mentions text={reasoningRest} context={citeState.context} scope={citeState.reasoning} /></p>
                      </details>
                    {/if}
                    {#if outcome.actions?.length}
                      <section class="next-actions" aria-labelledby="actions-heading">
                        <p class="field-label" id="actions-heading">What you must do</p>
                        <ol>{#each outcome.actions as action}<li><Mentions text={action} context={citeState.context} scope={citeState.actions} /></li>{/each}</ol>
                      </section>
                    {/if}
                    {#if motion.length}
                      <details class="disclosure" bind:open={motionExpanded}>
                        <summary>What may change</summary>
                        {#each motion as note (note.id)}
                          <p class="disclosure-body motion"><Mentions text={`${note.text} Checked ${note.checked}.`} context={citeState.context} /></p>
                          <a class="motion-source" href={note.source.url} target="_blank" rel="noopener noreferrer">{note.source.label} ↗</a>
                        {/each}
                      </details>
                    {/if}
                    <p class="outcome-aside">{reviewState.practitionerReviewed ? `Legal sources reviewed through ${reviewState.reviewedThrough}. Verify the cited official text before filing.` : `Automated source check${checkedDate ? `, sources last checked ${checkedDate}` : ''}. Verify the cited official text before filing.`}</p>
                    {#if reviewState.available}
                      <div class="exit-actions"><button type="button" class="button primary" on:click={downloadRecord}>Download determination</button><button type="button" class="text-button" on:click={goBack}>Change an answer</button></div>
                    {:else}
                      <div class="blocked-exits"><p><strong>Exports locked.</strong> This path contains a draft, missing, or superseded source record.</p></div>
                    {/if}
                    {#if related.length}
                      <section class="next-determination" aria-labelledby="next-heading">
                        <p class="field-label" id="next-heading">Next determination</p>
                        <div class="wizard-list">
                          {#each related as id (id)}
                            <WizardRow {id} onOpen={openWizard} />
                          {/each}
                        </div>
                      </section>
                    {/if}
                  </div>
                  {#if usedSources.length}
                    <section class="authority-list" aria-labelledby="authority-heading">
                      <p class="field-label" id="authority-heading">Authority</p>
                      <ul>
                        {#each usedSources as item (item.id)}
                          <li>
                            <details class="authority-row">
                              <summary>
                                <span class="authority-label">{item.source.label}</span>
                                <span class="status-line"><span class={`status-dot dot-${item.manifest?.status || 'draft'}`} aria-hidden="true"></span>{sourceStatusLabel(item.manifest?.status || 'draft')}</span>
                              </summary>
                              <div class="authority-body">
                                <p class="citation">{item.source.citation}</p>
                                {#if item.source.provenance || item.source.url}<a class="official-link" href={item.source.provenance || item.source.url} target="_blank" rel="noopener noreferrer">Open the official text ↗</a>{/if}
                                {#if item.source.body}<p class="source-body">{sourceTextPlain(item.source.body)}</p>{/if}
                              </div>
                            </details>
                          </li>
                        {/each}
                      </ul>
                    </section>
                  {/if}
                </div>
              </article>
            {/if}

            {#if fallback}
              <div class="fallback-panel"><label for="copy-fallback">Select and copy {fallback.label.toLowerCase()}</label><textarea id="copy-fallback" readonly rows="10" value={fallback.text}></textarea></div>
            {/if}

          </section>
        </div>
      {/if}
    </section>
  {/if}
</main>

{#if !EMBED}
<footer class="colophon">
  <div class="colophon-inner">
    <div class="colophon-brand">
      <p class="colophon-name">Advokat Frida</p>
      <p class="colophon-desc">Privacy and AI governance, by design and in practice.<br />Analytics by Plausible, cookieless and aggregate, no ad-tech.</p>
    </div>
    <nav class="colophon-nav" aria-label="Footer">
      <ul>
        <li><a href="https://advokatfrida.com/about/">About</a></li>
        <li><a href="mailto:hello@advokatfrida.com">Contact us</a></li>
        <li><a href="https://advokatfrida.com/privacy/">Privacy</a></li>
        <li><a href="https://advokatfrida.com/rss/">RSS</a></li>
      </ul>
    </nav>
  </div>
</footer>
{/if}
