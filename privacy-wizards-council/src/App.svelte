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
    editAnswer,
    eligibleOptions,
    historyContext,
    parseWizardHash,
    sourceIdsForState,
    sourceStatusLabel,
    tierLabel,
    validateGraph,
    wizardReviewState
  } from './lib/engine/council.js';
  import { categories, categoryForWizard, commonWizardIds } from './lib/data/categories.js';
  import { changelog, formatChangelogDate, newestChangelogDate } from './lib/data/changelog.js';
  import { wizardIcon, wizardIconColor } from './lib/icons.js';

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
  let outcomeSection = 'decision';
  let decisionExpanded = false;
  let history = [];
  let sourceLayerOpen = false;
  let sourceTrigger;
  let libraryMessage = '';
  let runMessage = '';
  let copyMessage = '';
  let fallback = null;

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

  onMount(() => {
    handleHash(location.hash || '');
    window.addEventListener('hashchange', () => handleHash(location.hash || ''));
  });

  function filterWizardIds(currentSearch, currentCategory, currentShowAll) {
    const term = currentSearch.trim().toLowerCase();
    if (term) {
      return Object.entries(WIZARDS)
        .filter(([id, item]) => {
          const category = categoryForWizard(id)?.label || '';
          return [id, item.title, item.q, item.tag, category, ...(item.jurisdictions || [])].join(' ').toLowerCase().includes(term);
        })
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
    outcomeSection = 'decision';
    decisionExpanded = false;
    history = [];
    sourceLayerOpen = false;
    runMessage = '';
    copyMessage = '';
    fallback = null;
    if (updateHash) setWizardHash(id);
    postShellContext(next.title);
    focusTask();
  }

  function changeDetermination() {
    postShellContext('');
    selectedWizardId = null;
    currentNodeId = null;
    outcomeId = null;
    outcomeSection = 'decision';
    decisionExpanded = false;
    history = [];
    sourceLayerOpen = false;
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
    outcomeSection = 'decision';
    decisionExpanded = false;
    history = [];
    sourceLayerOpen = false;
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
    currentNodeId = result.currentNodeId;
    outcomeId = result.outcomeId;
    if (outcomeId) {
      outcomeSection = 'decision';
      decisionExpanded = false;
    }
    sourceLayerOpen = false;
    runMessage = '';
    focusTask(outcomeId ? 'outcome-heading' : 'question-heading');
  }

  function goBack() {
    if (!history.length) return;
    const entry = history[history.length - 1];
    history = history.slice(0, -1);
    currentNodeId = entry.nodeId;
    outcomeId = null;
    outcomeSection = 'decision';
    decisionExpanded = false;
    sourceLayerOpen = false;
    runMessage = 'The later answer was removed.';
    focusTask();
  }

  function editSelectedFact(index) {
    const result = editAnswer(wizard, history, index);
    if (!result.ok) return;
    history = result.history;
    currentNodeId = result.currentNodeId;
    outcomeId = null;
    outcomeSection = 'decision';
    decisionExpanded = false;
    sourceLayerOpen = false;
    runMessage = `${result.removed} selected answer${result.removed === 1 ? '' : 's'} removed so the path can be rebuilt from that question.`;
    focusTask();
  }

  function openSources(event) {
    sourceTrigger = event.currentTarget;
    sourceLayerOpen = true;
    tick().then(() => document.getElementById('sources-heading')?.focus());
  }

  function closeSources() {
    sourceLayerOpen = false;
    tick().then(() => sourceTrigger?.focus());
  }

  function plainText(html) {
    const holder = document.createElement('div');
    holder.innerHTML = html || '';
    return holder.textContent || '';
  }

  function sourcePlainText(html) {
    const holder = document.createElement('div');
    holder.innerHTML = html || '';
    for (const br of holder.querySelectorAll('br')) br.replaceWith(document.createTextNode('\n'));
    for (const block of holder.querySelectorAll('p, blockquote, li, h1, h2, h3, h4, h5, h6')) block.append(document.createTextNode('\n\n'));
    return (holder.textContent || '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function decisionLead(text) {
    const value = String(text || '').trim();
    if (value.length <= 340) return value;
    const boundary = value.match(/[.!?](?=\s+[A-Z])/);
    return boundary?.index !== undefined ? value.slice(0, boundary.index + 1) : `${value.slice(0, 337).trimEnd()}…`;
  }

  function copyOutcomeText() {
    const text = `${outcome.title}\n\n${outcome.summary}\n\nWhat to do next\n${(outcome.actions || []).map((item) => `- ${item}`).join('\n')}`;
    copyText(text, 'Outcome');
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
      <li><a href="https://advokatfrida.com/tag/fridas-desk/">Frida’s Desk</a></li>
      <li><a href="https://advokatfrida.com/tag/field-guides/">Field Guides</a></li>
      <li><a href="https://advokatfrida.com/tag/toolkit/">Toolkit</a></li>
      <li><a href="https://advokatfrida.com/members/">Members Den</a></li>
      <li><a href="https://shop.advokatfrida.com/">Shop</a></li>
      <li><a href="https://advokatfrida.com/about/">About</a></li>
    </ul>
  </nav>
</header>
{/if}

<main class:is-embed={EMBED}>
  {#if !EMBED}
  <section class="orientation" aria-labelledby="page-title">
    <p class="eyebrow">Guided privacy decisions</p>
    <h1 id="page-title">Privacy Wizards Council</h1>
    <p class="promise">Choose the decision you’re making. The wizard will ask for the facts and show the authority behind the result.</p>
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
      <label class="sr-only" for="finder">What are you trying to decide?</label>
      <div class="search-wrap"><span class="search-glyph" aria-hidden="true">{@html searchIcon}</span><input id="finder" type="search" bind:value={search} on:input={() => { activeCategory = null; showAll = true; }} placeholder="Try breach, DPIA, cookies, AI risk…" /></div>
      {#if search}<p class:empty={filteredWizardIds.length === 0} class="search-feedback" role="status">{filteredWizardIds.length ? `${filteredWizardIds.length} matching ${filteredWizardIds.length === 1 ? 'determination' : 'determinations'}.` : 'No matching determination. Try a shorter term or reset the finder.'}</p>{/if}

      <div class="library-heading">
        {#if search || activeCategory || showAll}<button type="button" class="text-button" on:click={resetFinder}>Reset finder</button>{:else}<button type="button" class="text-button" on:click={() => (showAll = true)}>Browse all {Object.keys(WIZARDS).length}</button>{/if}
      </div>

      <div class="wizard-list">
        {#each filteredWizardIds as id}
          {@const item = WIZARDS[id]}
          <button type="button" class="wizard-row" on:click={() => openWizard(id)}>
            <span class="wizard-glyph" aria-hidden="true">{@html wizardIcon(id)}</span>
            <span class="wizard-copy"><strong>{item.title}</strong><small>{item.q || item.tag} · {(item.jurisdictions || []).join(' / ')}</small></span>
            <span class="card-arrow" aria-hidden="true">→</span>
          </button>
        {:else}
          <div class="empty-state"><h3>No determination matches that search.</h3><p>Try a shorter term or reset the finder.</p><button type="button" class="button secondary" on:click={resetFinder}>Reset finder</button></div>
        {/each}
      </div>
    </section>
  {:else}
    <section class="determination-shell">
      <div class="determination-topline">
        <button type="button" class="text-button" on:click={changeDetermination}>← Change determination</button>
        <button type="button" class="text-button" on:click={copyWizardLink}>Copy wizard link</button>
      </div>
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

            {#if history.length}
              <details class="selected-facts">
                <summary>Selected facts ({history.length})</summary>
                <ol>
                  {#each history as entry, index}
                    <li><div><small>{entry.question}</small><strong>{entry.answer}</strong></div><button type="button" class="text-button" on:click={() => editSelectedFact(index)}>Edit from here</button></li>
                  {/each}
                </ol>
              </details>
            {/if}

            {#if currentNode}
              <article class="question-card" aria-labelledby="question-heading">
                <p class="question-count">Question {history.length + 1}</p>
                <h3 id="question-heading" tabindex="-1">{currentNode.q}</h3>
                <div class="answer-list" role="list">
                  {#each currentOptions as option, index}
                    <button type="button" class="answer-card" on:click={() => chooseAnswer(index)}>
                      <span><strong>{option.label}</strong>{#if option.desc}<small>{option.desc}</small>{/if}</span>
                    </button>
                  {/each}
                </div>
                {#if currentNode.help}<p class="question-aside">{decisionLead(currentNode.help)}</p>{/if}
                <div class="question-tools">
                  {#if currentNode.help && decisionLead(currentNode.help) !== currentNode.help}<details class="why-disclosure"><summary>Why this question?</summary><p>{currentNode.help}</p></details>{/if}
                  <button bind:this={sourceTrigger} type="button" class="text-button" on:click={openSources}>Sources used so far ({usedSourceIds.length})</button>
                </div>
              </article>
            {:else if outcome}
              <article class={`outcome-card tier-${outcome.tier}`} aria-labelledby="outcome-heading">
                <div class="verdict-block">
                  <strong class="verdict-title" id="outcome-heading" tabindex="-1">{outcome.title}</strong>
                  {#if outcome.clock}<span class="verdict-sub">{outcome.clock}</span>{/if}
                </div>

                <p class="outcome-summary">{decisionExpanded ? outcome.summary : decisionLead(outcome.summary)}</p>
                {#if decisionLead(outcome.summary) !== outcome.summary}<button type="button" class="text-button reasoning-toggle" aria-expanded={decisionExpanded} on:click={() => (decisionExpanded = !decisionExpanded)}>{decisionExpanded ? 'Show concise decision' : 'Read complete authored reasoning'}</button>{/if}

                <div class="outcome-grid">
                  {#if outcome.actions?.length}
                    <section class="next-actions" aria-labelledby="actions-heading">
                      <p class="field-label" id="actions-heading">What you must do</p>
                      <ol>{#each outcome.actions as action}<li>{action}</li>{/each}</ol>
                    </section>
                  {/if}
                  {#if usedSources.length}
                    <section class="authority-list" aria-labelledby="authority-heading">
                      <p class="field-label" id="authority-heading">Authority</p>
                      <ul>
                        {#each usedSources as item}
                          <li>{#if item.source.provenance}<a href={item.source.provenance} target="_blank" rel="noopener noreferrer">{item.source.label} ↗</a>{:else}<span>{item.source.label}</span>{/if}</li>
                        {/each}
                      </ul>
                      <button bind:this={sourceTrigger} type="button" class="text-button" on:click={openSources}>Review sources on this path ({usedSourceIds.length})</button>
                    </section>
                  {/if}
                </div>

                <p class="outcome-aside">{reviewState.practitionerReviewed ? `Legal sources reviewed through ${reviewState.reviewedThrough}. Verify the cited official text before filing.` : 'Automated source check. Verify the cited official text and review the determination before filing it.'}</p>

                {#if reviewState.available}
                  <div class="exit-actions"><button type="button" class="button primary" on:click={downloadRecord}>Download determination</button><button type="button" class="button secondary" on:click={copyOutcomeText}>Copy outcome</button><button type="button" class="text-button" on:click={goBack}>Change an answer</button></div>
                {:else}
                  <div class="blocked-exits"><p><strong>Exports locked.</strong> This path contains a draft, missing, or superseded source record.</p></div>
                {/if}
                <div class="outcome-tools"><button type="button" class="text-button" on:click={startOver}>Run this path again</button><button type="button" class="text-button" on:click={changeDetermination}>Run another determination</button></div>
              </article>
            {/if}

            {#if fallback}
              <div class="fallback-panel"><label for="copy-fallback">Select and copy {fallback.label.toLowerCase()}</label><textarea id="copy-fallback" readonly rows="10" value={fallback.text}></textarea></div>
            {/if}

            {#if currentNode}<nav class="run-nav" aria-label="Determination controls"><button type="button" class="button secondary" disabled={!history.length} on:click={goBack}>← Back</button><button type="button" class="text-button danger-text" on:click={startOver}>Start over</button></nav>{/if}
          </section>

          <aside class:open={sourceLayerOpen} class="source-layer" aria-labelledby="sources-heading">
            {#if sourceLayerOpen}
              <div class="source-head"><div><p class="step-label">Contextual authority</p><h3 id="sources-heading" tabindex="-1">Sources used so far</h3></div><button type="button" class="icon-button" aria-label="Close sources" on:click={closeSources}>×</button></div>
              <p class="source-intro">These sources are cited by the current question and completed path. Their review status is shown separately from the changelog.</p>
              <div class="source-list">
                {#each usedSources as item}
                  <article class="source-card">
                    <div class="source-meta"><span>{item.source.kind || 'authority'} · {item.source.juris || 'scope not recorded'}</span><span class={`source-status status-${item.manifest?.status}`}>{sourceStatusLabel(item.manifest?.status || 'draft')}</span></div>
                    <h4>{item.source.label}</h4>
                    <p class="citation">{item.source.citation}</p>
                    <p class="why-source">Why it matters here: this authority is cited by the current question, a selected fact, or the draft outcome.</p>
                    {#if item.source.provenance}<a class="official-link" href={item.source.provenance} target="_blank" rel="noopener noreferrer">Open official text ↗</a>{/if}
                    <details class="source-text"><summary>Read included source text</summary><div class="source-body">{sourcePlainText(item.source.body)}</div></details>
                  </article>
                {/each}
              </div>
              <button type="button" class="button secondary close-sources" on:click={closeSources}>Close sources</button>
            {/if}
          </aside>
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
