import { ORG_FIELDS } from '../data/legacy.generated.js';
import { ORG_KEY, SETUPS_KEY, defaultOrg, sanitizeStructure } from '../engine/prompt.js';

export function storageAvailable(storage = globalThis.localStorage) {
  try {
    const key = 'af_bap_probe';
    storage.setItem(key, '1');
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function validateOrg(value) {
  const clean = defaultOrg();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return clean;
  if (ORG_FIELDS.roles.includes(value.role)) clean.role = value.role;
  if (ORG_FIELDS.sectors.includes(value.sector)) clean.sector = value.sector;
  if (typeof value.sectorCustom === 'string') clean.sectorCustom = value.sectorCustom.slice(0, 500);
  if (value.jur && typeof value.jur === 'object' && !Array.isArray(value.jur)) {
    for (const jurisdiction of ORG_FIELDS.jurisdictions) if (value.jur[jurisdiction]) clean.jur[jurisdiction] = true;
  }
  if (ORG_FIELDS.postures.some((posture) => posture.label === value.posture)) clean.posture = value.posture;
  if (typeof value.definitions === 'string') clean.definitions = value.definitions.slice(0, 5000);
  if (typeof value.rules === 'string') clean.rules = value.rules.slice(0, 5000);
  clean.enabled = value.enabled !== false;
  return clean;
}

export function loadOrg(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(ORG_KEY);
    return raw ? { ok: true, value: validateOrg(JSON.parse(raw)) } : { ok: true, value: defaultOrg() };
  } catch {
    return { ok: false, value: defaultOrg() };
  }
}

export function saveOrg(org, storage = globalThis.localStorage) {
  try {
    const candidate = JSON.stringify(validateOrg(org));
    storage.setItem(ORG_KEY, candidate);
    if (storage.getItem(ORG_KEY) !== candidate) throw new Error('readback');
    return true;
  } catch {
    return false;
  }
}

export function validateSetups(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => entry && typeof entry === 'object' && typeof entry.name === 'string' && Number.isFinite(entry.t))
    .map((entry) => ({ name: entry.name.slice(0, 60), t: entry.t, s: sanitizeStructure(entry.s) }))
    .filter((entry) => entry.s)
    .slice(-10);
}

export function loadSetups(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(SETUPS_KEY);
    return raw ? { ok: true, value: validateSetups(JSON.parse(raw)) } : { ok: true, value: [] };
  } catch {
    return { ok: false, value: [] };
  }
}

export function saveSetups(setups, storage = globalThis.localStorage) {
  try {
    const candidate = JSON.stringify(validateSetups(setups));
    storage.setItem(SETUPS_KEY, candidate);
    if (storage.getItem(SETUPS_KEY) !== candidate) throw new Error('readback');
    return true;
  } catch {
    return false;
  }
}

export function clearStore(key, storage = globalThis.localStorage) {
  try {
    storage.removeItem(key);
    return storage.getItem(key) === null;
  } catch {
    return false;
  }
}

export function clearAllSavedData(storage = globalThis.localStorage) {
  const org = clearStore(ORG_KEY, storage);
  const setups = clearStore(SETUPS_KEY, storage);
  return org && setups;
}
