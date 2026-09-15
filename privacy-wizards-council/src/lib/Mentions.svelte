<script>
  // A block of authored text whose article, section, guidance, case and term mentions are
  // inline citations (DESIGN-SYSTEM §3, Inline citation / Citation card). Hover or focus
  // opens the card; click pins it; Escape, a click elsewhere, or the × closes it.
  import { onDestroy, tick } from 'svelte';
  import { get } from 'svelte/store';
  import { SOURCE_MANIFEST, sourceStatusLabel } from './engine/council.js';
  import { mentionCard, tokenize } from './engine/mentions.js';
  import { activeCite } from './engine/cite-state.js';

  export let text = '';
  export let context = null;
  export let scope = null;

  // One id per block, so the shared store can say which block owns the open card.
  const instance = `m${(globalThis.__pwcMentions = (globalThis.__pwcMentions || 0) + 1)}`;

  let block;
  let cardEl;
  let cardStyle = '';
  let showFull = false;
  let cardKey = '';
  let showTimer = null;
  let hideTimer = null;
  // Returning focus to the mention after a close must not reopen the card.
  let quietFocus = false;

  $: segments = tokenize(text, context || undefined, scope || undefined);
  // The same block is reused when the reader moves on; an open card would then point at
  // words that are no longer there.
  $: blockKey = `${context?.wizardId || ''}|${context?.uk ? 'uk' : ''}|${text}`;
  $: dropStale(blockKey);
  $: active = $activeCite && $activeCite.instance === instance ? $activeCite : null;
  $: card = active ? mentionCard(active.sourceId, active.para) : null;
  $: status = active ? SOURCE_MANIFEST[active.sourceId]?.status || 'draft' : 'draft';
  $: syncCard(active, card);

  function trigger(index) {
    return block?.querySelector(`[data-cite="${index}"]`);
  }

  function dropStale() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    if (get(activeCite)?.instance === instance) activeCite.set(null);
  }

  // A different mention resets the card to its cited paragraph; pinning the same one does not.
  function syncCard(current, next) {
    const key = current && next ? `${current.index}|${current.sourceId}|${current.para || ''}` : '';
    if (key === cardKey) return;
    cardKey = key;
    showFull = next ? !next.focus : false;
    if (next) position();
  }

  function open(index, segment, pinned) {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    const current = get(activeCite);
    if (current?.instance === instance && current.index === index) {
      // Already open: a click pins it, and nothing unpins a pinned card but a close.
      if (pinned && !current.pinned) activeCite.set({ ...current, pinned: true });
      return;
    }
    activeCite.set({ instance, index, sourceId: segment.sourceId, para: segment.para, pinned });
  }

  function close(refocus = false) {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    const current = get(activeCite);
    if (current?.instance !== instance) return;
    activeCite.set(null);
    if (refocus) {
      quietFocus = true;
      trigger(current.index)?.focus();
      quietFocus = false;
    }
  }

  function onFocus(index, segment) {
    if (!quietFocus) open(index, segment, false);
  }

  function scheduleOpen(index, segment) {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    showTimer = setTimeout(() => {
      if (get(activeCite)?.pinned) return;
      open(index, segment, false);
    }, 140);
  }

  function scheduleClose() {
    clearTimeout(showTimer);
    hideTimer = setTimeout(() => {
      const current = get(activeCite);
      if (current?.instance === instance && !current.pinned) activeCite.set(null);
    }, 220);
  }

  function toggle(index, segment) {
    clearTimeout(showTimer);
    const current = get(activeCite);
    if (current?.instance === instance && current.index === index && current.pinned) close();
    else open(index, segment, true);
  }

  async function position() {
    await tick();
    const current = get(activeCite);
    const el = current?.instance === instance ? trigger(current.index) : null;
    if (!el || !cardEl || !block) return;
    const width = Math.round(Math.min(440, block.clientWidth));
    const left = Math.round(Math.max(0, Math.min(el.offsetLeft, block.clientWidth - width)));
    // Lay the card out at its final width first; its height depends on it.
    cardStyle = `top:${Math.round(el.offsetTop + el.offsetHeight + 8)}px;left:${left}px;width:${width}px`;
    await tick();
    if (!cardEl) return;
    const rect = el.getBoundingClientRect();
    const height = cardEl.offsetHeight;
    const fitsBelow = rect.bottom + height + 12 <= window.innerHeight;
    const fitsAbove = rect.top - height - 12 >= 0;
    if (!fitsBelow && fitsAbove) cardStyle = `top:${Math.round(el.offsetTop - height - 8)}px;left:${left}px;width:${width}px`;
  }

  function onKeydown(event) {
    if (event.key !== 'Escape' || get(activeCite)?.instance !== instance) return;
    // Focus goes back to the mention only when it was in this block to begin with.
    close(Boolean(block && block.contains(document.activeElement)));
  }

  function onWindowClick(event) {
    const current = get(activeCite);
    if (current?.instance !== instance || !current.pinned || !block) return;
    // The path is fixed when the click is dispatched, so a control the click itself removed
    // (Show the whole text) still counts as inside the block.
    if (!event.composedPath().includes(block)) activeCite.set(null);
  }

  function onFocusOut(event) {
    const current = get(activeCite);
    if (current?.instance !== instance || current.pinned) return;
    if (block && event.relatedTarget && block.contains(event.relatedTarget)) return;
    activeCite.set(null);
  }

  // Reading on keeps the card: it pins, and focus moves to the card because the button
  // that held it is gone.
  async function showWhole() {
    showFull = true;
    const current = get(activeCite);
    if (current?.instance === instance && !current.pinned) activeCite.set({ ...current, pinned: true });
    await position();
    cardEl?.focus();
  }

  onDestroy(() => {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    if (get(activeCite)?.instance === instance) activeCite.set(null);
  });
</script>

<svelte:window on:keydown={onKeydown} on:click={onWindowClick} />

<span class="mentions" bind:this={block} on:focusout={onFocusOut}>{#each segments as segment, index}{#if segment.sourceId}<button type="button" class="cite" class:open={active?.index === index} data-cite={index} aria-expanded={active?.index === index} on:mouseenter={() => scheduleOpen(index, segment)} on:mouseleave={scheduleClose} on:focus={() => onFocus(index, segment)} on:click={() => toggle(index, segment)}>{segment.text}</button>{#if active && active.index === index && card}<span class="cite-card" role="dialog" aria-label={card.label} tabindex="-1" bind:this={cardEl} style={cardStyle} on:mouseenter={() => clearTimeout(hideTimer)} on:mouseleave={scheduleClose}>
  <span class="cite-card-head"><span class="cite-card-label">{card.label}</span><button type="button" class="cite-close" aria-label="Close" on:click={() => close(true)}>×</button></span>
  <span class="cite-card-cite">{card.citation}</span>
  <span class="status-line"><span class={`status-dot dot-${status}`} aria-hidden="true"></span>{sourceStatusLabel(status)}</span>
  <span class="cite-card-text">{showFull ? card.full : card.focus}</span>
  <span class="cite-card-actions">{#if card.focus && !showFull}<button type="button" class="text-button" on:click={showWhole}>Show the whole text</button>{/if}{#if card.provenance}<a class="official-link" href={card.provenance} target="_blank" rel="noopener noreferrer">Open the official text ↗</a>{/if}</span>
</span>{/if}{:else}{segment.text}{/if}{/each}</span>
