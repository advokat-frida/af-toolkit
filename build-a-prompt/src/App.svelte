<script>
  import { onMount, tick } from 'svelte';
  import {
    ALL_JOBS,
    FORMATS,
    GOV,
    GOV_ORDER,
    ORG_FIELDS,
    PERSPECTIVES,
    RECIPES,
    TAGS,
    TONES,
    applyStructure,
    assemblePrompt,
    captureStructure,
    currentJobs,
    decodeShareHash,
    defaultOrg,
    defaultState,
    effectiveGuardrails,
    encodeShareStructure,
    formatByLabel,
    inferSetup,
    jobByLabel,
    lintPrompt,
    markdownReceipt,
    orgDigest,
    orgHasData,
    perspectiveIndex,
    setupEntry,
    setupSummary,
    stripAuthoredEntities
  } from './lib/engine/prompt.js';
  import {
    clearAllSavedData,
    clearStore,
    loadOrg,
    loadSetups,
    saveOrg,
    saveSetups,
    storageAvailable
  } from './lib/storage/local.js';
  import { changelog, formatChangelogDate, newestChangelogDate } from './lib/data/changelog.js';

  const parts = [
    { id: 'outcome', label: 'Outcome', hint: 'The thing to make' },
    { id: 'context', label: 'Context', hint: 'The lens and reader' },
    { id: 'evidence', label: 'Evidence', hint: 'What the answer may rely on' },
    { id: 'guardrail', label: 'Guardrail', hint: 'What it must not invent or do' },
    { id: 'format', label: 'Format', hint: 'The usable shape' }
  ];

  const advancedSections = [
    { id: 'perspective', label: 'Perspectives' },
    { id: 'workflow', label: 'Workflow' },
    { id: 'topics', label: 'Topic angles' },
    { id: 'safety', label: 'Safety kit' },
    { id: 'org', label: 'Organization' },
    { id: 'saved', label: 'Save & share' }
  ];

  const recipeRequests = {
    twoways: 'Explain how this product works for a customer, then explain the same product from a legal-risk perspective.',
    dpa: 'Review the DPA clause below. Identify material risk, missing processor terms, negotiation points, and the decisions a human reviewer must make.\n\n[PASTE CLAUSE HERE]',
    reg: 'Summarize the regulation below for a smart non-specialist. Lead with who it affects, what changes, and what to do next.\n\n[PASTE TEXT HERE]',
    concept: 'Explain this privacy concept in plain language, with one concrete example and the most common misconception.\n\n[NAME THE CONCEPT]',
    risks: 'Find the privacy and AI-governance risks in this proposed feature. Separate confirmed facts, assumptions, and questions the team must answer.\n\n[DESCRIBE THE FEATURE]',
    policy: 'Review this privacy policy for unclear claims, missing disclosures, internal contradictions, and statements that need evidence.\n\n[PASTE POLICY HERE]',
    dpia: 'Draft a DPIA working document for this processing activity. Mark missing facts and decisions for human review.\n\n[DESCRIBE THE PROCESSING]',
    research: 'Research this topic and give me the answer first, the strongest evidence, what is contested, and what I should verify independently.\n\n[NAME THE TOPIC]',
    extractsum: 'Extract the important structured facts from the material below, then summarize what matters and what is missing.\n\n[PASTE MATERIAL HERE]'
  };

  const EMBED = new URLSearchParams(location.search).has('embed');

  let request = '';
  let recipesOpen = false;
  let recipeSearch = '';
  let state = defaultState();
  let org = defaultOrg();
  let rememberOrg = false;
  let openPart = 'outcome';
  let reviewOnly = false;
  let advancedOpen = false;
  let advancedSection = 'perspective';
  let storageOk = false;
  let storageMessage = '';
  let setups = [];
  let setupName = '';
  let shareOpen = false;
  let clearAllArmed = false;
  let actionMessage = '';
  let fallback = null;
  let shareMessage = '';

  $: prompt = assemblePrompt(state, org);
  $: warnings = lintPrompt(state);
  $: summaries = setupSummary(state);
  $: guardrails = effectiveGuardrails(state);
  $: activeWarnings = warnings.filter((warning) => warning.part === openPart);
  $: filteredRecipes = RECIPES.filter((recipe) => recipe.label.toLowerCase().includes(recipeSearch.trim().toLowerCase()));
  $: changelogDate = newestChangelogDate(changelog);

  onMount(() => {
    storageOk = storageAvailable();
    if (storageOk) {
      const orgResult = loadOrg();
      const setupResult = loadSetups();
      org = orgResult.value;
      rememberOrg = orgHasData(orgResult.value);
      setups = setupResult.value;
      if (!orgResult.ok || !setupResult.ok) storageMessage = 'Some saved browser data was unreadable. Your current work still runs in memory.';
    } else storageMessage = 'Browser storage is unavailable here. The tool still works, but organization data and named setups last only for this tab.';

    const decoded = decodeShareHash(location.hash || '');
    if (decoded.status === 'ok') {
      const applied = applyStructure(state, decoded.structure);
      if (applied) {
        state = applied;
        request = '';
        shareMessage = 'Shared setup loaded. The link contained preset structure only; no request, organization brief, generated prompt, or custom text travelled with it.';
      }
    } else if (decoded.status === 'invalid') {
      shareMessage = 'That setup link could not be read. Nothing from the fragment was displayed or applied.';
    }
  });

  function markReviewed(part) {
    state = { ...state, suggested: (state.suggested || []).filter((item) => item !== part) };
  }

  function updateState(patch, part, reviewed = true) {
    state = { ...state, ...patch };
    if (reviewed && part) markReviewed(part);
  }

  function untouchedBesidesRequest() {
    const reference = defaultState();
    reference.subject = state.subject;
    return JSON.stringify(captureStructure(reference)) === JSON.stringify(captureStructure(state));
  }

  function inferFromRequest() {
    const clean = (state.subject || '').trim();
    if (clean.length < 8 || !untouchedBesidesRequest()) return;
    const inferred = inferSetup(clean);
    if (JSON.stringify(captureStructure(inferred)) === JSON.stringify(captureStructure(state))) return;
    state = inferred;
    request = clean;
  }

  function applyRecipe(recipe) {
    request = recipeRequests[recipe.id] || '';
    let next = inferSetup(request);
    next.persA = perspectiveIndex(recipe.persA);
    next.compare = Boolean(recipe.persB);
    next.persB = recipe.persB ? perspectiveIndex(recipe.persB) : null;
    next.jobLabels = recipe.jobs ? recipe.jobs.slice() : [jobByLabel(recipe.job).label];
    next.jobsTouched = true;
    next.tone = recipe.tone;
    next.format = FORMATS[0].v;
    next.tags = {};
    for (const id of recipe.tags || []) next.tags[id] = true;
    next.recipe = recipe.id;
    state = next;
    recipesOpen = false;
    recipeSearch = '';
    openPart = 'outcome';
    actionMessage = `${recipe.label} loaded. Review the suggested setup before copying.`;
    tick().then(() => document.querySelector('[data-part="outcome"]')?.focus());
  }

  function openEditor(id) {
    openPart = id;
    reviewOnly = false;
    tick().then(() => document.querySelector(`[data-panel="${id}"] input, [data-panel="${id}"] textarea, [data-panel="${id}"] select`)?.focus());
  }

  function updateRequest(value) {
    request = value;
    updateState({ subject: value }, 'outcome');
  }

  function selectJob(label) {
    updateState({ jobLabels: [label], jobsTouched: true }, 'outcome');
  }

  function setPerspective(value) {
    if (value === 'custom') updateState({ customRoleOpen: true, persAcustom: state.persAcustom || '', persA: 0 }, 'context');
    else updateState({ persA: Number(value), persAcustom: '', customRoleOpen: false }, 'context');
  }

  function setTone(value) {
    if (value === 'custom') updateState({ customToneOpen: true, toneCustom: state.toneCustom || '' }, 'context');
    else updateState({ tone: value, toneCustom: '', customToneOpen: false }, 'context');
  }

  function setFormat(value) {
    if (value === 'custom') updateState({ customFormatOpen: true, formatCustom: state.formatCustom || '' }, 'format');
    else updateState({ format: value, formatCustom: '', customFormatOpen: false }, 'format');
  }

  function setEvidence(mode) {
    if (mode === 'provided') {
      const manual = { ...state.manual, G1: true };
      updateState({ providedOnly: true, manual }, 'evidence');
    } else {
      updateState({ providedOnly: false }, 'evidence');
    }
  }

  function toggleGuardrail(id, checked) {
    updateState({ manual: { ...state.manual, [id]: checked } }, 'guardrail');
  }

  function useRecommendedGuardrails() {
    updateState({ manual: {} }, 'guardrail');
  }

  function turnOnWarning(id) {
    toggleGuardrail(id, true);
    actionMessage = `${stripAuthoredEntities(GOV[id].plain)} is now on.`;
  }

  function showReview() {
    reviewOnly = true;
    tick().then(() => {
      const heading = document.getElementById('prompt-review-heading');
      heading?.focus();
      heading?.scrollIntoView({ block: 'start' });
    });
  }

  function returnToComposer() {
    reviewOnly = false;
    tick().then(() => document.querySelector(`[data-part="${openPart}"]`)?.focus());
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
    document.body.removeChild(textarea);
    if (worked) actionMessage = `${label} copied.`;
    else {
      fallback = { text, label };
      actionMessage = 'Automatic copy was blocked. Select the text below and copy it manually.';
      tick().then(() => document.getElementById('copy-fallback')?.select());
    }
  }

  async function copyText(text, label) {
    fallback = null;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
      actionMessage = `${label} copied.`;
    } catch {
      fallbackCopy(text, label);
    }
  }

  function download(name, text) {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    actionMessage = `${name} downloaded.`;
  }

  function localDate() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  function saveOrgState(next) {
    org = next;
    if (storageOk && rememberOrg && !saveOrg(org)) storageMessage = 'The organization brief could not be saved. Your active values remain in this tab.';
  }

  function setOrgPersistence(checked) {
    if (!storageOk) return;
    if (checked) {
      if (!saveOrg(org)) {
        rememberOrg = false;
        storageMessage = 'The organization brief could not be saved. Your active values remain in this tab.';
        return;
      }
      rememberOrg = true;
      actionMessage = 'Organization brief will be remembered in this browser. It still never enters a share link.';
      return;
    }
    if (!clearStore('af_bap_org_v1')) {
      rememberOrg = true;
      storageMessage = 'The saved organization brief could not be removed from browser storage.';
      return;
    }
    rememberOrg = false;
    actionMessage = 'Saved organization data removed. The active values remain in this tab until it closes.';
  }

  function clearOrganization() {
    if (storageOk && !clearStore('af_bap_org_v1')) storageMessage = 'Organization data could not be removed from browser storage.';
    org = defaultOrg();
    rememberOrg = false;
    actionMessage = 'Organization data cleared. Named setups were not deleted.';
  }

  function addSetup() {
    if (!storageOk) {
      storageMessage = 'Named setup saving is unavailable because this browser blocked local storage.';
      return;
    }
    const entry = setupEntry(setupName, state);
    const next = [...setups, entry].slice(-10);
    if (!saveSetups(next)) {
      storageMessage = 'The setup could not be saved. Your active prompt was not changed.';
      return;
    }
    setups = next;
    setupName = '';
    actionMessage = 'Setup saved locally. It contains the name, timestamp, and preset structure only.';
  }

  function loadSetup(entry) {
    const next = applyStructure(state, entry.s);
    if (!next) {
      storageMessage = 'That saved setup is invalid and was not applied.';
      return;
    }
    state = next;
    request = next.subject;
    actionMessage = `${entry.name} loaded. Your current request stayed in place; custom role, tone, and format text did not come from the setup.`;
  }

  function deleteSetup(index) {
    const next = setups.filter((_, itemIndex) => itemIndex !== index);
    if (storageOk && saveSetups(next)) {
      setups = next;
      actionMessage = 'Saved setup deleted. Organization data was not changed.';
    } else storageMessage = 'The saved setup could not be deleted.';
  }

  function shareUrl() {
    return `${location.href.split('#')[0]}${encodeShareStructure(state)}`;
  }

  function copyShareLink() {
    copyText(shareUrl(), 'Structure-only setup link');
  }

  function clearEverything() {
    if (!clearAllArmed) {
      clearAllArmed = true;
      actionMessage = 'Press “Confirm clear all saved data” to remove both the organization brief and named setups. Your active prompt stays open.';
      return;
    }
    if (storageOk && !clearAllSavedData()) {
      storageMessage = 'The browser did not confirm removal of all saved keys.';
      return;
    }
    org = defaultOrg();
    rememberOrg = false;
    setups = [];
    clearAllArmed = false;
    actionMessage = 'All saved browser data cleared. Your active prompt is still open.';
  }

  function startOver() {
    state = defaultState();
    request = '';
    openPart = 'outcome';
    reviewOnly = false;
    advancedOpen = false;
    fallback = null;
    actionMessage = 'Current prompt cleared. Saved organization data and named setups were left alone.';
    try {
      history.replaceState(null, document.title, location.href.split('#')[0]);
    } catch {
      // file:// environments may not allow history replacement; no data is added.
    }
    tick().then(() => document.getElementById('outcome-request')?.focus());
  }

  function setAdvancedSection(id) {
    advancedSection = id;
    tick().then(() => document.querySelector(`[data-advanced-panel="${id}"] input, [data-advanced-panel="${id}"] select, [data-advanced-panel="${id}"] textarea`)?.focus());
  }

  function updateWorkflow(index, label) {
    const jobs = state.jobLabels.slice();
    jobs[index] = label;
    updateState({ jobLabels: jobs, jobsTouched: true }, 'outcome');
  }

  function addWorkflowStep() {
    const unused = ALL_JOBS.find((job) => !state.jobLabels.includes(job.label));
    if (!unused || state.jobLabels.length >= 6) return;
    updateState({ jobLabels: [...state.jobLabels, unused.label], jobsTouched: true }, 'outcome');
  }

  function removeWorkflowStep(index) {
    if (state.jobLabels.length <= 1) return;
    updateState({ jobLabels: state.jobLabels.filter((_, itemIndex) => itemIndex !== index), jobsTouched: true }, 'outcome');
  }

  function toggleTag(id, checked) {
    const tags = { ...state.tags, [id]: checked };
    updateState({ tags }, 'evidence');
  }

  function toggleFacet(text) {
    const sentence = `Focus on: ${text}.`;
    let subject = state.subject;
    if (subject.includes(sentence)) subject = subject.replace(sentence, '').replace(/\.\s*$/, '.').replace(/\s{2,}/g, ' ').trim();
    else subject = `${subject.replace(/[\s.;]+$/, '')}${subject.trim() ? '. ' : ''}${sentence}`;
    request = subject;
    updateState({ subject }, 'evidence');
  }

  function setComparison(checked) {
    updateState({ compare: checked, persB: checked ? state.persB ?? perspectiveIndex('InfoSec analyst') : null, persBcustom: '' }, 'context');
  }
</script>

<svelte:head>
  <meta name="description" content="Build a governed, reviewable AI prompt locally in your browser." />
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

<main class="compose" class:is-embed={EMBED}>
  {#if !EMBED}
  <section class="orientation" aria-labelledby="page-title">
    <p class="eyebrow">A practical AI work tool</p>
    <h1 id="page-title">Build-A-Prompt</h1>
    <p class="promise">Describe what the AI needs to produce. We’ll turn it into a prompt you can inspect.</p>

    <details class="changelog">
      <summary>Changelog (last updated: {formatChangelogDate(changelogDate)})</summary>
      <div class="changelog-body">
        {#each changelog as entry}
          <div class="changelog-entry">
            <time datetime={entry.date}>{formatChangelogDate(entry.date)}{entry.version ? ` · ${entry.version}` : ''}</time>
            <strong>{entry.headline}</strong>
            <ul>
              {#each entry.bullets as bullet}<li>{bullet}</li>{/each}
            </ul>
          </div>
        {/each}
      </div>
    </details>
  </section>
  {/if}

  {#if shareMessage}
    <div class="notice share-note" role="status">
      <p>{shareMessage}</p>
      <button class="text-button" type="button" on:click={() => (shareMessage = '')}>Dismiss</button>
    </div>
  {/if}

  {#if actionMessage}<p class="action-message" role="status">{actionMessage}</p>{/if}
    <div class:review-only={reviewOnly} class="workspace">
      <section class="composer" aria-labelledby="composer-heading">
        <div class="workspace-head">
          <h2 id="composer-heading">The request</h2>
          <span class="workspace-head-actions">
            <button class="text-button" type="button" aria-expanded={recipesOpen} aria-controls="recipe-panel" on:click={() => (recipesOpen = !recipesOpen)}>Start from a common task</button>
            <button class="button secondary mobile-review" type="button" on:click={showReview}>Review prompt</button>
          </span>
        </div>

        {#if recipesOpen}
          <section id="recipe-panel" class="recipe-panel" aria-labelledby="recipe-heading">
            <div class="layer-head">
              <h3 id="recipe-heading">Common tasks</h3>
              <button class="icon-button" type="button" aria-label="Close common tasks" on:click={() => (recipesOpen = false)}>×</button>
            </div>
            <label class="sr-only" for="recipe-search">Find a task</label>
            <input id="recipe-search" type="search" bind:value={recipeSearch} placeholder="Try DPA, research, privacy…" />
            <div class="recipe-list">
              {#each filteredRecipes as recipe}
                <button type="button" class="recipe-row" on:click={() => applyRecipe(recipe)}>
                  <span><strong>{recipe.label}</strong><small>{recipeRequests[recipe.id]}</small></span>
                  <span aria-hidden="true">→</span>
                </button>
              {:else}
                <p class="empty-state">No common task matches that search. Clear the search or describe the deliverable in your own words.</p>
              {/each}
            </div>
          </section>
        {/if}

        <div class="part-list">
          {#each parts as part, index}
            <section class:open={openPart === part.id} class="part-card">
              <button
                type="button"
                class="part-summary"
                data-part={part.id}
                aria-expanded={openPart === part.id}
                aria-controls={`part-${part.id}`}
                on:click={() => (openPart === part.id ? null : openEditor(part.id))}
              >
                <span class="part-number">0{index + 1}</span>
                <span class="part-copy">
                  <span class="part-title-line"><strong>{part.label}</strong>{#if state.suggested?.includes(part.id)}<span class="suggested">Suggested</span>{/if}</span>
                  <small>{summaries[part.id]}</small>
                </span>
                <span class="part-state" aria-hidden="true">{openPart === part.id ? '' : '→'}</span>
                <span class="sr-only">{openPart === part.id ? 'Editing' : 'Edit'}</span>
              </button>

              {#if openPart === part.id}
                <div class="part-panel" id={`part-${part.id}`} data-panel={part.id}>
                  {#if part.id === 'outcome'}
                    <label for="outcome-request">Work request</label>
                    <textarea id="outcome-request" rows="5" value={state.subject} placeholder="Example: Review this DPA clause. Identify material risk, missing terms, negotiation points, and decisions for a human reviewer." on:input={(event) => updateRequest(event.currentTarget.value)} on:blur={inferFromRequest}></textarea>
                    <label for="primary-job">Primary job</label>
                    <select id="primary-job" value={currentJobs(state)[0]?.label} on:change={(event) => selectJob(event.currentTarget.value)}>
                      {#each ALL_JOBS as job}<option value={job.label}>{job.label}</option>{/each}
                    </select>
                  {:else if part.id === 'context'}
                    <div class="two-fields">
                      <div>
                        <label for="context-role">Professional perspective</label>
                        <select id="context-role" value={state.customRoleOpen || state.persAcustom ? 'custom' : String(state.persA)} on:change={(event) => setPerspective(event.currentTarget.value)}>
                          {#each PERSPECTIVES as perspective, perspectiveIndexValue}<option value={String(perspectiveIndexValue)}>{perspective.label}</option>{/each}
                          <option value="custom">Custom perspective…</option>
                        </select>
                      </div>
                      <div>
                        <label for="context-tone">How the answer should read</label>
                        <select id="context-tone" value={state.customToneOpen || state.toneCustom ? 'custom' : state.tone} on:change={(event) => setTone(event.currentTarget.value)}>
                          {#each TONES as tone}<option value={tone.v}>{tone.label}</option>{/each}
                          <option value="custom">Custom tone…</option>
                        </select>
                      </div>
                    </div>
                    {#if state.customRoleOpen || state.persAcustom}
                      <label for="custom-role">Custom perspective</label>
                      <input id="custom-role" value={state.persAcustom} on:input={(event) => updateState({ persAcustom: event.currentTarget.value }, 'context')} placeholder="Example: a pediatric nurse" />
                    {/if}
                    {#if state.customToneOpen || state.toneCustom}
                      <label for="custom-tone">Custom tone</label>
                      <input id="custom-tone" value={state.toneCustom} on:input={(event) => updateState({ toneCustom: event.currentTarget.value }, 'context')} placeholder="Describe the register and reader" />
                    {/if}
                  {:else if part.id === 'evidence'}
                    <fieldset class="choice-stack">
                      <legend>What may the answer rely on?</legend>
                      <label class="radio-card">
                        <input type="radio" name="evidence" checked={!state.providedOnly} on:change={() => setEvidence('general')} />
                        <span><strong>Request + labelled general knowledge</strong><small>Claims about your material stay grounded in it. Outside knowledge must be named as such.</small></span>
                      </label>
                      <label class="radio-card">
                        <input type="radio" name="evidence" checked={state.providedOnly} on:change={() => setEvidence('provided')} />
                        <span><strong>Provided material only</strong><small>If the request does not support a claim, the answer must stop and say so.</small></span>
                      </label>
                    </fieldset>
                    <p class="field-help">For open-ended research, choose “Research it” as the job. The prompt then asks the model to distinguish established evidence, contested claims, and inference.</p>
                  {:else if part.id === 'guardrail'}
                    <div class="guardrail-summary">
                      {#each GOV_ORDER.filter((id) => guardrails[id]) as id}<span class="mini-pill">{stripAuthoredEntities(GOV[id].plain)}</span>{/each}
                    </div>
                    <p class="field-help">These recommendations come from the selected role, job, and topic. Review the complete safety kit under Advanced setup.</p>
                    <button class="text-button" type="button" on:click={() => { advancedOpen = true; advancedSection = 'safety'; }}>Review every guardrail</button>
                  {:else if part.id === 'format'}
                    <label for="answer-format">Answer format</label>
                    <select id="answer-format" value={state.customFormatOpen || state.formatCustom ? 'custom' : state.format} on:change={(event) => setFormat(event.currentTarget.value)}>
                      {#each FORMATS as format}<option value={format.v}>{format.label}</option>{/each}
                      <option value="custom">Custom format…</option>
                    </select>
                    {#if state.customFormatOpen || state.formatCustom}
                      <label for="custom-format">Custom format</label>
                      <input id="custom-format" value={state.formatCustom} on:input={(event) => updateState({ formatCustom: event.currentTarget.value }, 'format')} placeholder="Example: a two-column decision table" />
                    {/if}
                  {/if}

                  {#if activeWarnings.length}
                    <div class="warnings" aria-label={`Warnings about ${part.label}`}>
                      {#each activeWarnings as warning}
                        <div class:danger={warning.severity === 'danger'} class="warning" role={warning.severity === 'danger' ? 'alert' : 'note'}>
                          <span class="warning-mark" aria-hidden="true">{warning.severity === 'danger' ? '!' : 'i'}</span>
                          <p>{warning.message}</p>
                          {#if warning.action}<button type="button" class="text-button" on:click={() => turnOnWarning(warning.action)}>Turn it on</button>{/if}
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/if}
            </section>
          {/each}
        </div>

        <section class:open={advancedOpen} class="advanced-shell">
          <button class="advanced-toggle" type="button" aria-expanded={advancedOpen} aria-controls="advanced-panel" on:click={() => (advancedOpen = !advancedOpen)}>
            <span><strong>Advanced setup</strong><small>Perspectives, workflows, topic angles, safety, organization, save and share</small></span>
            <span aria-hidden="true">{advancedOpen ? '−' : '+'}</span>
          </button>
          {#if advancedOpen}
            <div id="advanced-panel" class="advanced-panel">
              <div class="advanced-tabs" role="tablist" aria-label="Advanced setup sections">
                {#each advancedSections as section}
                  <button type="button" role="tab" aria-selected={advancedSection === section.id} on:click={() => setAdvancedSection(section.id)}>{section.label}</button>
                {/each}
              </div>

              {#if advancedSection === 'perspective'}
                <div class="advanced-content" data-advanced-panel="perspective">
                  <h3>Compare professional lenses</h3>
                  <p>Add a second independent take only when the disagreement between perspectives is useful.</p>
                  <label class="switch-row"><input type="checkbox" checked={state.compare} on:change={(event) => setComparison(event.currentTarget.checked)} /><span><strong>Compare a second perspective</strong><small>The prompt produces two independent takes and explains what the lens changed.</small></span></label>
                  {#if state.compare}
                    <label for="second-role">Second perspective</label>
                    <select id="second-role" value={String(state.persB)} on:change={(event) => updateState({ persB: Number(event.currentTarget.value), persBcustom: '' }, 'context')}>
                      {#each PERSPECTIVES as perspective, perspectiveIndexValue}<option value={String(perspectiveIndexValue)}>{perspective.label}</option>{/each}
                    </select>
                  {/if}
                </div>
              {:else if advancedSection === 'workflow'}
                <div class="advanced-content" data-advanced-panel="workflow">
                  <h3>Ordered workflow</h3>
                  <p>Later steps receive the output of the previous step. Keep the chain short enough to review.</p>
                  {#each state.jobLabels as jobLabel, index}
                    <div class="workflow-row">
                      <span class="step-badge">{index + 1}</span>
                      <select aria-label={`Workflow step ${index + 1}`} value={jobLabel} on:change={(event) => updateWorkflow(index, event.currentTarget.value)}>
                        {#each ALL_JOBS as job}<option value={job.label}>{job.label}</option>{/each}
                      </select>
                      <button class="icon-button" type="button" disabled={state.jobLabels.length === 1} aria-label={`Remove step ${index + 1}`} on:click={() => removeWorkflowStep(index)}>×</button>
                    </div>
                  {/each}
                  <button class="button secondary compact" type="button" disabled={state.jobLabels.length >= 6 || state.jobLabels.length >= ALL_JOBS.length} on:click={addWorkflowStep}>Add another step</button>
                </div>
              {:else if advancedSection === 'topics'}
                <div class="advanced-content" data-advanced-panel="topics">
                  <h3>Topic angles</h3>
                  <p>A topic turns on relevant guardrail recommendations. An angle adds a visible “Focus on” sentence to your request.</p>
                  <div class="check-grid">
                    {#each TAGS as tag}
                      <label class="check-row"><input type="checkbox" checked={Boolean(state.tags[tag.id])} on:change={(event) => toggleTag(tag.id, event.currentTarget.checked)} /><span>{tag.label}</span></label>
                    {/each}
                  </div>
                  {#each TAGS.filter((tag) => state.tags[tag.id]) as tag}
                    <fieldset class="facet-group">
                      <legend>{tag.label} angles</legend>
                      <div class="chip-list">
                        {#each tag.facets || [] as facet}
                          <button type="button" class:active={state.subject.includes(`Focus on: ${facet.text}.`)} class="chip" aria-pressed={state.subject.includes(`Focus on: ${facet.text}.`)} on:click={() => toggleFacet(facet.text)}>{facet.label}</button>
                        {/each}
                      </div>
                    </fieldset>
                  {/each}
                </div>
              {:else if advancedSection === 'safety'}
                <div class="advanced-content" data-advanced-panel="safety">
                  <div class="section-title-row"><div><h3>Safety kit</h3><p>Recommended from your role, work, and topic. Every switch is explicit and reversible.</p></div><button class="text-button" type="button" on:click={useRecommendedGuardrails}>Use recommendations</button></div>
                  {#each [
                    { label: 'Evidence and model behavior', ids: ['G1', 'G5', 'G9'] },
                    { label: 'People, privacy, and context', ids: ['G2', 'G3', 'G4'] },
                    { label: 'Language, confidentiality, and sign-off', ids: ['G6', 'G8', 'G7'] }
                  ] as group}
                    <fieldset class="guardrail-group">
                      <legend>{group.label}</legend>
                      {#each group.ids as id}
                        <label class="switch-row guardrail-row">
                          <input type="checkbox" checked={guardrails[id]} on:change={(event) => toggleGuardrail(id, event.currentTarget.checked)} />
                          <span><strong>{stripAuthoredEntities(GOV[id].plain)}</strong><small>{stripAuthoredEntities(GOV[id].why)}</small></span>
                        </label>
                        {#if id === 'G3' && guardrails[id]}
                          <label class="nested-field" for="personal-mode">How to handle personal details
                            <select id="personal-mode" value={state.params.G3?.mode || GOV.G3.fields[0].sel[0]} on:change={(event) => updateState({ params: { ...state.params, G3: { mode: event.currentTarget.value } } }, 'guardrail')}>
                              {#each GOV.G3.fields[0].sel as mode}<option value={mode}>{mode}</option>{/each}
                            </select>
                          </label>
                        {/if}
                        {#if id === 'G4' && guardrails[id]}
                          <label class="nested-field" for="jurisdiction">Jurisdiction
                            <input id="jurisdiction" value={state.params.G4?.jurisdiction || ''} placeholder="EU / GDPR" on:input={(event) => updateState({ params: { ...state.params, G4: { jurisdiction: event.currentTarget.value } } }, 'guardrail')} />
                          </label>
                        {/if}
                      {/each}
                    </fieldset>
                  {/each}
                </div>
              {:else if advancedSection === 'org'}
                <div class="advanced-content" data-advanced-panel="org">
                  <div class="section-title-row"><div><h3>Organization brief</h3><p>It may appear in copied or downloaded prompts, but never in a share link.</p></div>{#if orgHasData(org)}<button class="text-button danger-text" type="button" on:click={clearOrganization}>Clear organization data</button>{/if}</div>
                  <p class="privacy-note"><strong>Keep it generic.</strong> Do not put client names, employee details, secrets, or matter facts in a reusable organization brief.</p>
                  <label class="switch-row"><input type="checkbox" checked={rememberOrg} disabled={!storageOk} on:change={(event) => setOrgPersistence(event.currentTarget.checked)} /><span><strong>Remember this brief on this device</strong><small>{rememberOrg ? 'Stored in this browser until you clear it.' : storageOk ? 'Off: these values disappear when this tab closes.' : 'Browser storage is unavailable.'}</small></span></label>
                  <label class="switch-row"><input type="checkbox" checked={org.enabled} on:change={(event) => saveOrgState({ ...org, enabled: event.currentTarget.checked })} /><span><strong>Include organization brief in this prompt</strong><small>{orgHasData(org) ? orgDigest(org) : 'Nothing has been entered yet.'}</small></span></label>
                  <div class="two-fields">
                    <div><label for="org-role">Role for personal data</label><select id="org-role" value={org.role} on:change={(event) => saveOrgState({ ...org, role: event.currentTarget.value })}><option value="">Not set</option>{#each ORG_FIELDS.roles as role}<option value={role}>{role}</option>{/each}</select></div>
                    <div><label for="org-sector">Sector</label><select id="org-sector" value={org.sector} on:change={(event) => saveOrgState({ ...org, sector: event.currentTarget.value, sectorCustom: '' })}><option value="">Not set</option>{#each ORG_FIELDS.sectors as sector}<option value={sector}>{sector}</option>{/each}<option value="custom">Custom…</option></select></div>
                  </div>
                  {#if org.sector === 'custom' || org.sectorCustom}<label for="org-sector-custom">Custom sector</label><input id="org-sector-custom" value={org.sectorCustom} on:input={(event) => saveOrgState({ ...org, sector: '', sectorCustom: event.currentTarget.value })} />{/if}
                  <fieldset class="facet-group"><legend>Jurisdictions that matter</legend><div class="check-grid">{#each ORG_FIELDS.jurisdictions as jurisdiction}<label class="check-row"><input type="checkbox" checked={Boolean(org.jur[jurisdiction])} on:change={(event) => saveOrgState({ ...org, jur: { ...org.jur, [jurisdiction]: event.currentTarget.checked } })} /><span>{jurisdiction}</span></label>{/each}</div></fieldset>
                  <label for="org-posture">Risk posture</label><select id="org-posture" value={org.posture} on:change={(event) => saveOrgState({ ...org, posture: event.currentTarget.value })}><option value="">Not set</option>{#each ORG_FIELDS.postures as posture}<option value={posture.label}>{posture.label}</option>{/each}</select>
                  <label for="org-definitions">House definitions <span class="optional">Optional</span></label><textarea id="org-definitions" rows="3" value={org.definitions} on:input={(event) => saveOrgState({ ...org, definitions: event.currentTarget.value })} placeholder="Example: “Customer data” means data customers upload."></textarea>
                  <label for="org-rules">Standing rules <span class="optional">Optional</span></label><textarea id="org-rules" rows="3" value={org.rules} on:input={(event) => saveOrgState({ ...org, rules: event.currentTarget.value })} placeholder="Example: Never name clients or use real customer examples."></textarea>
                </div>
              {:else if advancedSection === 'saved'}
                <div class="advanced-content" data-advanced-panel="saved">
                  <h3>Save and share the setup</h3>
                  <p>These controls never save or serialize the request, generated prompt, organization brief, warnings, or custom text.</p>
                  {#if storageMessage}<div class="warning"><span class="warning-mark" aria-hidden="true">i</span><p>{storageMessage}</p></div>{/if}
                  <div class="save-row"><label for="setup-name">Setup name</label><div class="inline-control"><input id="setup-name" bind:value={setupName} maxlength="60" placeholder="Example: DPA review" /><button class="button secondary compact" type="button" disabled={!storageOk} on:click={addSetup}>Save setup</button></div></div>
                  {#if setups.length}
                    <ul class="saved-list">
                      {#each setups as entry, index}
                        <li><button type="button" class="saved-load" on:click={() => loadSetup(entry)}><strong>{entry.name}</strong><small>{new Date(entry.t).toLocaleDateString()}</small></button><button type="button" class="icon-button" aria-label={`Delete ${entry.name}`} on:click={() => deleteSetup(index)}>×</button></li>
                      {/each}
                    </ul>
                  {:else}<p class="empty-state">No named setups saved in this browser.</p>{/if}
                  <div class="share-box">
                    <button class="advanced-toggle small" type="button" aria-expanded={shareOpen} on:click={() => (shareOpen = !shareOpen)}><span><strong>Share setup</strong><small>Preset labels, IDs, and switches only</small></span><span aria-hidden="true">{shareOpen ? '−' : '+'}</span></button>
                    {#if shareOpen}<div class="share-preview"><p><strong>Included:</strong> preset perspectives, jobs, tone, format, topic/facet IDs, guardrail overrides, and personal-detail mode.</p><p><strong>Never included:</strong> request, prompt, organization brief, setup name or date, warnings, and every custom text value.</p><button class="button secondary compact" type="button" on:click={copyShareLink}>Copy structure-only link</button></div>{/if}
                  </div>
                  <button class:armed={clearAllArmed} class="button quiet-danger" type="button" on:click={clearEverything}>{clearAllArmed ? 'Confirm clear all saved data' : 'Clear all saved data'}</button>
                  <p class="field-help">This removes the organization brief and named setups from this browser. It does not clear the active prompt.</p>
                </div>
              {/if}
            </div>
          {/if}
        </section>
      </section>

      <section class="review" aria-labelledby="prompt-review-heading">
        <div class="review-head">
          <h2 id="prompt-review-heading" tabindex="-1">Your governed prompt</h2>
          <button class="text-button mobile-back" type="button" on:click={returnToComposer}>← Back to composer</button>
        </div>
        {#if state.suggested?.length && state.subject.trim()}<p class="suggestion-note"><span>Suggested setup</span> Review the labelled parts before using this for important work.</p>{/if}
        <label class="sr-only" for="prompt-preview">Generated prompt</label>
        <textarea
          id="prompt-preview"
          class="prompt-sheet"
          aria-label="Generated prompt"
          readonly
          spellcheck="false"
          value={prompt}
        ></textarea>
        <div class="exit-actions">
          <button class="button primary" type="button" on:click={() => copyText(prompt, 'Prompt')}>Copy prompt</button>
          <button class="button secondary" type="button" on:click={() => download(`governed-prompt-${localDate()}.md`, markdownReceipt(state, org))}>Download prompt and receipt</button>
        </div>
        <p class="exit-boundary">Copying puts the full prompt on your device clipboard. Pasting it into an AI sends it to that provider; check its data-use, access, and retention terms before using confidential or personal data.</p>
        {#if fallback}
          <div class="fallback-panel" role="region" aria-label="Manual copy fallback">
            <label for="copy-fallback">Select and copy {fallback.label.toLowerCase()}</label>
            <textarea id="copy-fallback" readonly rows="10" value={fallback.text}></textarea>
          </div>
        {/if}
        <div class="secondary-exits">
          <button class="text-button" type="button" on:click={() => { advancedOpen = true; advancedSection = 'saved'; reviewOnly = false; }}>Save or share setup</button>
          <button class="text-button danger-text" type="button" on:click={startOver}>Start over</button>
        </div>
      </section>
    </div>
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
