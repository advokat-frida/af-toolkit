<script>
  // One chooser row (DESIGN-SYSTEM §3, Chooser row). Used by the finder and by the
  // "Next determination" row under every outcome, so both stay the same control.
  import { WIZARDS } from './engine/council.js';
  import { wizardIcon, wizardIconColor } from './icons.js';

  export let id;
  export let onOpen = () => {};

  $: item = WIZARDS[id];
</script>

{#if item}
  <button type="button" class="wizard-row" on:click={() => onOpen(id)}>
    <span class={`wizard-glyph icon-${wizardIconColor(id)}`} aria-hidden="true">{@html wizardIcon(id)}</span>
    <span class="wizard-copy"><strong>{item.title}</strong><small>{item.q || item.tag} · {item.jurisdictionRoutes ? `${item.jurisdictionRoutes.length} US states` : (item.jurisdictions || []).join(' / ')}</small></span>
    <span class="card-arrow" aria-hidden="true">→</span>
  </button>
{/if}
