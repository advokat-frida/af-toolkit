/**
 * HMAC-SHA-256 signing of the transformation log with a user-provided key.
 * Verification runs entirely in the browser via WebCrypto; the sig is embedded
 * inside the log JSON at `.signature` and also delivered as a separate .sig
 * file for standalone verification.
 */

async function importKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function hexToBuf(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

/** Canonical JSON: keys are sorted so identical logical logs produce identical bytes. */
export function canonicalize(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonicalize).join(",") + "]";
  const keys = Object.keys(v).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + canonicalize(v[k])).join(",") + "}";
}

export async function signLog(logObj, secret) {
  // Sign a copy without the .signature property to keep it well-defined
  const copy = { ...logObj }; delete copy.signature;
  const bytes = new TextEncoder().encode(canonicalize(copy));
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, bytes);
  return {
    algorithm: "HMAC-SHA-256",
    key_fingerprint_sha256: bufToHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret))).slice(0, 16),
    signature_hex: bufToHex(sig),
    canonicalization: "RFC 8785-ish (sorted keys)",
    signed_at: new Date().toISOString(),
  };
}

export async function verifyLog(logObj, secret) {
  if (!logObj?.signature?.signature_hex) return { ok: false, reason: "no signature present" };
  const copy = { ...logObj }; delete copy.signature;
  const bytes = new TextEncoder().encode(canonicalize(copy));
  const key = await importKey(secret);
  const ok = await crypto.subtle.verify("HMAC", key, hexToBuf(logObj.signature.signature_hex), bytes);
  return { ok, reason: ok ? "match" : "signature does not match secret" };
}
