<script>
  import Mentions from './Mentions.svelte';
  import { contextFor } from './engine/mentions.js';

  export let id;
  export let wizardId;
  export let actions;
  export let actionCites = [];
  export let scope = undefined;
  export let heading = 'What to do next';
</script>

<section class="next-actions action-checklist" aria-labelledby={`${id}-heading`}>
  <p class="field-label" id={`${id}-heading`}>{heading}</p>
  <ol>
    {#each actions as action, index}
      <li>
        <label class="action-check-target">
          <input type="checkbox" aria-labelledby={`${id}-${index}`} />
        </label>
        <span class="action-check-text" id={`${id}-${index}`}><Mentions text={action} context={contextFor(wizardId, { cites: actionCites[index] })} {scope} /></span>
      </li>
    {/each}
  </ol>
</section>
