import { describe, expect, it } from 'vitest';
import {
  GOV_ORDER,
  ORG_KEY,
  SETUPS_KEY,
  applyStructure,
  assemblePrompt,
  captureStructure,
  decodeShareHash,
  defaultOrg,
  defaultState,
  effectiveGuardrails,
  encodeShareStructure,
  inferSetup,
  lintPrompt,
  markdownReceipt,
  perspectiveIndex,
  setupEntry
} from '../../src/lib/engine/prompt.js';
import {
  clearAllSavedData,
  loadOrg,
  loadSetups,
  saveOrg,
  saveSetups,
  storageAvailable
} from '../../src/lib/storage/local.js';

function memoryStorage({ blocked = false } = {}) {
  const values = new Map();
  return {
    getItem(key) {
      if (blocked) throw new Error('blocked');
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      if (blocked) throw new Error('blocked');
      values.set(key, String(value));
    },
    removeItem(key) {
      if (blocked) throw new Error('blocked');
      values.delete(key);
    }
  };
}

function base64url(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('legacy engine preservation', () => {
  it('infers explicit review and redline work instead of falling back to explain', () => {
    const policyReview = inferSetup('Review this privacy policy for unclear claims and missing evidence.');
    expect(policyReview.jobLabels).toEqual(['Review it']);
    expect(policyReview.persA).toBe(perspectiveIndex('Privacy analyst'));

    const redline = inferSetup('Redline this synthetic notice for clarity.');
    expect(redline.jobLabels).toEqual(['Redline / edit']);
  });

  it('assemble_single_matches_legacy_fixture', () => {
    const state = defaultState();
    state.subject = 'Explain the retention clause.';
    const prompt = assemblePrompt(state, defaultOrg());
    expect(prompt).toContain('You are a plain-language explainer who avoids all jargon.');
    expect(prompt).toContain('Task: Explain the subject below in plain terms.');
    expect(prompt).toContain('<<<SUBJECT BEGIN>>>\nExplain the retention clause.\n<<<SUBJECT END>>>');
    expect(prompt).toContain('Now do the Task above on the Subject provided, following the guardrails.');
  });

  it('assemble_comparison_matches_legacy_fixture', () => {
    const state = defaultState();
    state.subject = 'Assess a new AI vendor.';
    state.compare = true;
    state.persA = perspectiveIndex('Privacy lead');
    state.persB = perspectiveIndex('InfoSec analyst');
    const prompt = assemblePrompt(state);
    expect(prompt).toContain('TWO independent takes on the SAME subject');
    expect(prompt).toContain('=== TAKE 1');
    expect(prompt).toContain('=== TAKE 2');
    expect(prompt).toContain('=== WHAT THE LENS CHANGED ===');
  });

  it('ordered_jobs_preserve_rank_and_subject_handoff', () => {
    const state = defaultState();
    state.jobLabels = ['Summarize it', 'Extract (structured)', 'Review it'];
    const prompt = assemblePrompt(state);
    const extract = prompt.indexOf('1. Extract');
    const summarize = prompt.indexOf('2. Summarize');
    const review = prompt.indexOf('3. Review');
    expect(extract).toBeGreaterThan(-1);
    expect(summarize).toBeGreaterThan(extract);
    expect(review).toBeGreaterThan(summarize);
    expect(prompt).toContain("from step 2 onward, 'the subject' means the output of the previous step");
  });

  it('automatic_guardrails_match_legacy_role_and_job_rules', () => {
    const draft = effectiveGuardrails(inferSetup('Draft a response for human review.'));
    const dpa = effectiveGuardrails(inferSetup('Review this DPA clause.'));
    expect(draft.G2).toBe(true);
    expect(draft.G7).toBe(true);
    expect(dpa.G3).toBe(true);
  });

  it('manual_guardrail_override_survives_recomposition', () => {
    const state = defaultState();
    state.manual = { G1: false, G9: true };
    state.subject = 'Material from another party.';
    expect(effectiveGuardrails(state).G1).toBe(false);
    expect(effectiveGuardrails(state).G9).toBe(true);
    expect(assemblePrompt(state)).toContain('ignore previous instructions');
  });

  it('lint_attaches_to_the_responsible_prompt_part', () => {
    const state = defaultState();
    state.subject = 'Email alex@example.com about the file.';
    const warnings = lintPrompt(state);
    expect(warnings.some((warning) => warning.part === 'evidence' && warning.severity === 'danger')).toBe(true);
    expect(warnings.every((warning) => ['outcome', 'context', 'evidence', 'guardrail', 'format'].includes(warning.part))).toBe(true);
  });

  it('markdown_receipt_matches_prompt_and_selected_controls', () => {
    const state = inferSetup('Review this DPA clause.');
    const prompt = assemblePrompt(state);
    const receipt = markdownReceipt(state, defaultOrg(), new Date('2026-08-20T12:00:00'));
    expect(receipt).toContain(prompt);
    expect(receipt).toContain('- Perspective (Suggested — review before use): Lawyer');
    expect(receipt).toContain('## Guardrails on');
  });
});

describe('structure-only setup and share contracts', () => {
  it('saved_setup_never_serializes_subject_org_or_custom_text', () => {
    const state = defaultState();
    state.subject = 'CANARY_SUBJECT';
    state.persAcustom = 'CANARY_ROLE';
    state.toneCustom = 'CANARY_TONE';
    state.formatCustom = 'CANARY_FORMAT';
    const serialized = JSON.stringify(setupEntry('CANARY_NAME', state, 123));
    expect(serialized).not.toContain('CANARY_SUBJECT');
    expect(serialized).not.toContain('CANARY_ROLE');
    expect(serialized).not.toContain('CANARY_TONE');
    expect(serialized).not.toContain('CANARY_FORMAT');
    expect(serialized).toContain('CANARY_NAME');
  });

  it('share_hash_round_trips_preset_structure_only', () => {
    const state = inferSetup('Review a DPA.');
    const decoded = decodeShareHash(encodeShareStructure(state));
    expect(decoded.status).toBe('ok');
    expect(decoded.structure).toEqual(captureStructure(state));
  });

  it('share_hash_never_serializes_subject_org_or_custom_text', () => {
    const state = defaultState();
    state.subject = 'CANARY_SUBJECT';
    state.persAcustom = 'CANARY_ROLE';
    state.toneCustom = 'CANARY_TONE';
    state.formatCustom = 'CANARY_FORMAT';
    const hash = encodeShareStructure(state);
    expect(hash).not.toContain('CANARY');
    const decoded = decodeShareHash(hash);
    const serialized = JSON.stringify(decoded.structure);
    expect(serialized).not.toContain('CANARY');
    expect(serialized).toContain('pAc');
    expect(serialized).toContain('tc');
    expect(serialized).toContain('fc');
  });

  it('legacy_v1_share_hash_decodes_and_remains_structure_only', () => {
    const legacy = { pA: 'Lawyer', jobs: ['Review it'], tone: 'Formal / legal', fmt: 'Memo', tags: ['dpa'] };
    const decoded = decodeShareHash(`#s=v1.${base64url(JSON.stringify(legacy))}`);
    expect(decoded).toEqual({ status: 'ok', structure: legacy });
    const applied = applyStructure(defaultState(), decoded.structure);
    expect(applied.persA).toBe(perspectiveIndex('Lawyer'));
  });

  it('share_hash_rejects_malformed_unknown_and_oversized_payloads_without_echo', () => {
    expect(decodeShareHash('#s=v9.abc')).toEqual({ status: 'invalid', reason: 'version' });
    expect(decodeShareHash('#s=v1.not-json').status).toBe('invalid');
    const oversized = `#s=v1.${base64url('x'.repeat(9000))}`;
    expect(decodeShareHash(oversized)).toEqual({ status: 'invalid', reason: 'size' });
  });

  it('unknown_fields_are_not_reserialized', () => {
    const dirty = { pA: 'Lawyer', jobs: ['Review it'], subject: 'CANARY', generated: 'CANARY', timestamp: 123 };
    const decoded = decodeShareHash(`#s=v1.${base64url(JSON.stringify(dirty))}`);
    expect(decoded.status).toBe('ok');
    expect(decoded.structure).toEqual({ pA: 'Lawyer', jobs: ['Review it'] });
  });
});

describe('browser storage lifecycle', () => {
  it('legacy_org_storage_imports_without_loss', () => {
    const storage = memoryStorage();
    const org = { ...defaultOrg(), role: 'Controller', definitions: 'Customer data means uploaded data.' };
    expect(saveOrg(org, storage)).toBe(true);
    expect(loadOrg(storage)).toEqual({ ok: true, value: org });
  });

  it('legacy_saved_setups_import_without_loss', () => {
    const storage = memoryStorage();
    const state = inferSetup('Review a DPA.');
    const entries = [setupEntry('DPA review', state, 123)];
    expect(saveSetups(entries, storage)).toBe(true);
    expect(loadSetups(storage)).toEqual({ ok: true, value: entries });
  });

  it('clear_all_saved_data_removes_every_legacy_and_vnext_key', () => {
    const storage = memoryStorage();
    storage.setItem(ORG_KEY, '{}');
    storage.setItem(SETUPS_KEY, '[]');
    expect(clearAllSavedData(storage)).toBe(true);
    expect(storage.getItem(ORG_KEY)).toBe(null);
    expect(storage.getItem(SETUPS_KEY)).toBe(null);
  });

  it('blocked_or_corrupt_storage_falls_back_without_losing_active_work', () => {
    const storage = memoryStorage({ blocked: true });
    const active = inferSetup('Draft an executive update.');
    expect(storageAvailable(storage)).toBe(false);
    expect(loadOrg(storage).ok).toBe(false);
    expect(loadSetups(storage).ok).toBe(false);
    expect(active.subject).toBe('Draft an executive update.');
  });

  it('all_guardrail_ids_remain_stable', () => {
    expect(GOV_ORDER).toEqual(['G1', 'G2', 'G3', 'G9', 'G5', 'G6', 'G4', 'G8', 'G7']);
  });
});
