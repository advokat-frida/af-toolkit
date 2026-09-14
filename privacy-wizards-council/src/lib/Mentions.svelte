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
  let showTimer = null;
  let hideTimer = null;
  // Returning focus to the mention after a close must not reopen the card.
  let quietFocus = false;

  $: segments = tokenize(text, context || undefined, scope || undefined);
  $: active = $activeCite && $activeCite.instance === instance ? $activeCite : null;
  $: card = active ? mentionCard(active.sourceId, active.para) : null;
  $: status = active ? SOURCE_MANIFEST[active.sourceId]?.status || 'draft' : 'draft';
  $: if (card) {
    showFull = !card.focus;
    position();
  }

  function trigger(index) {
    return block?.querySelector(`[data-cite="${index}"]`);
  }

  function open(index, segment, pinned) {
    clearTimeout(hideTimer);
    activeCite.set({ instance, index, sourceId: segment.sourceId, para: segment.para, pinned });
  }

  function close(refocus = false) {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    const current = get(activeCite);
    if (!current || current.instance !== instance) return;
    activeCite.set(null);
    if (refocus) {
      quietFocus = true;
      trigger(current.index)?.focus();
      quietFocus = false;
    }
  }

  function onFocus(index, segment) {
    if (quietFocus) return;
    open(index, segment, false);
  }

  function scheduleOpen(index, segment) {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    showTimer = setTimeout(() => {
      const current = get(activeCite);
      if (current?.pinned) return;
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
    const el = current ? trigger(current.index) : null;
    if (!el || !cardEl || !block) return;
    const width = Math.min(440, block.clientWidth);
    const left = Math.max(0, Math.min(el.offsetLeft, block.clientWidth - width));
    const rect = el.getBoundingClientRect();
    const cardHeight = cardEl.offsetHeight;
    const fitsBelow = rect.bottom + cardHeight + 12 <= window.innerHeight;
    const fitsAbove = rect.top - cardHeight - 12 >= 0;
    const top = fitsBelow || !fitsAbove ? el.offsetTop + el.offsetHeight + 8 : el.offsetTop - cardHeight - 8;
    cardStyle = `top:${Math.round(top)}px;left:${Math.round(left)}px;width:${Math.round(width)}px`;
  }

  function onKeydown(event) {
    if (event.key === 'Escape') close(true);
  }

  function onWindowClick(event) {
    const current = get(activeCite);
    if (current?.instance === instance && current.pinned && block && !block.contains(event.target)) activeCite.set(null);
  }

  function onFocusOut(event) {
    const current = get(activeCite);
    if (!current || current.instance !== instance || current.pinned) return;
    if (block && event.relatedTarget && block.contains(event.relatedTarget)) return;
    activeCite.set(null);
  }

  function showWhole() {
    showFull = true;
    position();
  }

  onDestroy(() => {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    const current = get(activeCite);
    if (current?.instance === instance) activeCite.set(null);
  });
</script>

<svelte:window on:keydown={onKeydown} on:click={onWindowClick} />

<span class="mentions" bind:this={block} on:focusout={onFocusOut}>{#each segments as segment, index}{#if segment.sourceId}<button type="button" class="cite" class:open={active?.index === index} data-cite={index} aria-expanded={active?.index === index} on:mouseenter={() => scheduleOpen(index, segment)} on:mouseleave={scheduleClose} on:focus={() => onFocus(index, segment)} on:click={() => toggle(index, segment)}>{segment.text}</button>{#if active && active.index === index && card}<span class="cite-card" role="dialog" aria-label={card.label} bind:this={cardEl} style={cardStyle} on:mouseenter={() => clearTimeout(hideTimer)} on:mouseleave={scheduleClose}>
  <span class="cite-card-head"><span class="cite-card-label">{card.label}</span><button type="button" class="cite-close" aria-label="Close" on:click={() => close(true)}>×</button></span>
  <span class="cite-card-cite">{card.citation}</span>
  <span class="status-line"><span class={`status-dot dot-${status}`} aria-hidden="true"></span>{sourceStatusLabel(status)}</span>
  <span class="cite-card-text">{showFull ? card.full : card.focus}</span>
  <span class="cite-card-actions">{#if card.focus && !showFull}<button type="button" class="text-button" on:click={showWhole}>Show the whole text</button>{/if}{#if card.provenance}<a class="official-link" href={card.provenance} target="_blank" rel="noopener noreferrer">Open the official text ↗</a>{/if}</span>
</span>{/if}{:else}{segment.text}{/if}{/each}</span>
