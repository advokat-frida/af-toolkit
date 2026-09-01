/**
 * Transformers — per-value rewriting rules.
 * All deterministic within a run given a seed + salt (for reproducibility
 * in the transformation log).
 *
 * Synthetic values are drawn from RFC-reserved / authority-designated ranges
 * (SafeSeed's approach) so outputs are auditable and provably fake.
 */

import { luhnCheck } from "./piiPatterns";

// ---------- deterministic PRNG (mulberry32) ----------
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ---------- SHA-256 hashing via WebCrypto ----------
export async function sha256Hex(value, salt = "") {
  const enc = new TextEncoder().encode(salt + String(value));
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ---------- Reserved / catalog data pools (SafeSeed-style) ----------
const RESERVED_EMAIL_LOCALS = ["ada", "grace", "leibniz", "curie", "turing", "boole", "lovelace", "hopper", "erdos", "shannon"];
const RESERVED_EMAIL_DOMAINS = ["example.com", "example.org", "example.net"]; // RFC 2606
const RESERVED_NAMES_FIRST  = ["Alex", "Sam", "Robin", "Jamie", "Chris", "Taylor", "Morgan", "Casey", "Riley", "Reese"];
const RESERVED_NAMES_LAST   = ["Testerson", "Sample", "Fixture", "Placeholder", "Draft", "Notreal", "Faux", "Nominal", "Redact", "Void"];
const RESERVED_COMPANIES    = ["ACME Test Co.", "Example Holdings Ltd", "Placeholder Industries Inc.", "Sample Group AB", "Fixture Systems GmbH", "Not-Real Partners LLC"];
const RESERVED_JOB_TITLES   = ["Test Analyst", "Sample Coordinator", "Placeholder Manager", "Fixture Designer", "Draft Specialist", "Notional Consultant"];
const RESERVED_STREETS      = ["100 Example Way", "200 Sample Street", "300 Placeholder Rd", "400 Fixture Ave", "500 Notreal Ln"];
// RFC 5737 documentation IPv4 blocks
const DOC_V4_BASES = ["192.0.2.", "198.51.100.", "203.0.113."];
// RFC 3849 documentation IPv6
const DOC_V6_PREFIX = "2001:db8::";
// ISO/IEC test PANs (Stripe-published test cards — designated-test-only)
const TEST_CARDS = ["4242424242424242", "4000056655665556", "5555555555554444", "378282246310005", "6011111111111117"];
// NANPA fictitious range
const FICTITIOUS_PHONE = (rng) => {
  const n = 100 + Math.floor(rng() * 100); // 555-01xx
  const area = ["212", "415", "202", "312", "617", "305"][Math.floor(rng() * 6)];
  return `+1 ${area} 555 0${String(n).padStart(3, "0")}`;
};

// ---------- Per-detector synthetic swap ----------
export function synthetic(detectorId, rng) {
  switch (detectorId) {
    case "email": {
      const local = RESERVED_EMAIL_LOCALS[Math.floor(rng() * RESERVED_EMAIL_LOCALS.length)];
      const dom   = RESERVED_EMAIL_DOMAINS[Math.floor(rng() * RESERVED_EMAIL_DOMAINS.length)];
      const salt  = Math.floor(rng() * 9999).toString().padStart(4, "0");
      return `${local}.${salt}@${dom}`;
    }
    case "phone": return FICTITIOUS_PHONE(rng);
    case "person_name": {
      const f = RESERVED_NAMES_FIRST[Math.floor(rng() * RESERVED_NAMES_FIRST.length)];
      const l = RESERVED_NAMES_LAST[Math.floor(rng() * RESERVED_NAMES_LAST.length)];
      return `${f} ${l}`;
    }
    case "company":  return RESERVED_COMPANIES[Math.floor(rng() * RESERVED_COMPANIES.length)];
    case "job_title":return RESERVED_JOB_TITLES[Math.floor(rng() * RESERVED_JOB_TITLES.length)];
    case "address_street": return RESERVED_STREETS[Math.floor(rng() * RESERVED_STREETS.length)];
    case "ipv4": return DOC_V4_BASES[Math.floor(rng() * 3)] + (1 + Math.floor(rng() * 253));
    case "ipv6": return DOC_V6_PREFIX + Math.floor(rng() * 65535).toString(16);
    case "mac":  {
      const oct = () => Math.floor(rng() * 256).toString(16).padStart(2, "0");
      return `02:00:00:${oct()}:${oct()}:${oct()}`; // locally administered
    }
    case "url":  return `https://example.com/${Math.floor(rng() * 1e6).toString(36)}`;
    case "credit_card": return TEST_CARDS[Math.floor(rng() * TEST_CARDS.length)];
    case "iban": {
      // GB82 WEST test IBAN with random tail preserving mod-97? For MVP, use published test IBAN
      const testIbans = ["GB82WEST12345698765432", "DE89370400440532013000", "FR1420041010050500013M02606"];
      return testIbans[Math.floor(rng() * testIbans.length)];
    }
    case "ssn": {
      // Use format-only, SSA-invalid components. Area 000 is never issued.
      const g = 10 + Math.floor(rng() * 89);
      const s = 1 + Math.floor(rng() * 9998);
      return `000-${String(g).padStart(2, "0")}-${String(s).padStart(4, "0")}`;
    }
    case "passport": return `T${Math.floor(rng() * 9e7 + 1e7)}`;
    case "us_dl":    return `T${Math.floor(rng() * 9e6 + 1e6)}`;
    case "nhs":      return "9990000018"; // NHS test-only synthetic number
    case "aadhaar":  return "0000 0000 0000";
    case "postal_us": return `00${Math.floor(rng() * 900) + 100}`; // ZIP starting 001-009 (test-like)
    case "postal_uk": return "SW1A 1AA";
    case "dob": {
      const y = 1980 + Math.floor(rng() * 40);
      return `${y}-01-01`;
    }
    default: return "SYNTHETIC_VALUE";
  }
}

// ---------- Generalization ----------
export function generalize(value, detectorId) {
  const v = String(value ?? "");
  switch (detectorId) {
    case "dob": {
      const m = v.match(/(\d{4})/) || v.match(/(\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
      if (!m) return "1900s";
      return `${m[1]}`;
    }
    case "postal_us": return v.slice(0, 3) + "**"; // first 3 digits only
    case "postal_uk": {
      const m = v.match(/^([A-Z]{1,2}\d[A-Z\d]?)/i);
      return m ? m[1].toUpperCase() : v[0] + "***";
    }
    case "ipv4": {
      const p = v.split("."); return p.length === 4 ? `${p[0]}.${p[1]}.0.0/16` : v;
    }
    case "ipv6": return v.split(":").slice(0, 3).join(":") + "::/48";
    case "credit_card": {
      const digits = v.replace(/\D/g, "");
      return `${digits.slice(0, 6)}******${digits.slice(-4)}`;
    }
    case "iban": {
      const s = v.replace(/\s/g, "");
      return s.slice(0, 4) + "****" + s.slice(-4);
    }
    case "email": {
      const [l, d] = v.split("@");
      if (!d) return "***";
      return "***@" + d;
    }
    case "phone": {
      const digits = v.replace(/\D/g, "");
      return "*".repeat(Math.max(0, digits.length - 4)) + digits.slice(-4);
    }
    case "person_name": {
      const parts = v.split(/\s+/);
      return parts.map(p => (p[0] || "") + ".").join(" ");
    }
    case "address_street": {
      const m = v.match(/\b(street|st|road|rd|ave|avenue|blvd|boulevard|lane|ln|drive|dr|court|ct|way|place|pl)\b/i);
      return m ? "*** " + m[0] : "***";
    }
    case "company": {
      const m = v.match(/\b(Inc\.?|LLC|Ltd\.?|GmbH|AS|AB|SA|SAS|BV|PLC|Co\.?|Corp\.?)\b/i);
      return m ? "*** " + m[0] : "*** Co.";
    }
    case "job_title": {
      const seniority = /(Senior|Junior|Lead|Head|Chief|VP|Director)/i.exec(v);
      return seniority ? seniority[0] + " (generalized)" : "Professional (generalized)";
    }
    default: {
      // Generic generalization: keep first char + length bucket
      if (v.length === 0) return "";
      return v[0] + "*".repeat(Math.min(6, Math.max(1, v.length - 1)));
    }
  }
}

// ---------- Redaction ----------
export function redact(value, style = "block") {
  const v = String(value ?? "");
  if (!v) return v;
  if (style === "block") return "[REDACTED]";
  if (style === "stars") return "*".repeat(Math.min(12, Math.max(3, v.length)));
  return "[REDACTED]";
}

// ---------- Apply column-wise transformations ----------
export async function applyTransformations({ headers, rows }, columnPlan, options) {
  const salt = options?.salt ?? "redactorium-v1";
  const seed = hashSeed(options?.seed || "redactorium");
  const rng = makeRng(seed);

  const outHeaders = [...headers];
  const outRows = rows.map(r => [...r]);
  const stats = columnPlan.map(c => ({ index: c.index, header: c.header, transform: c.transform, changed: 0, sampled: 0 }));

  for (let ci = 0; ci < columnPlan.length; ci++) {
    const plan = columnPlan[ci];
    if (plan.transform === "keep") continue;
    const detId = plan.detectorId;
    for (let ri = 0; ri < outRows.length; ri++) {
      const original = outRows[ri][plan.index];
      if (original === undefined || original === null || String(original).trim() === "") continue;
      stats[ci].sampled++;
      let next = original;
      if (plan.transform === "hash") {
        next = (await sha256Hex(original, salt)).slice(0, 16);
      } else if (plan.transform === "redact") {
        next = redact(original, plan.redactStyle || "block");
      } else if (plan.transform === "generalize") {
        next = generalize(original, detId);
      } else if (plan.transform === "synthetic") {
        next = synthetic(detId, rng);
      }
      if (next !== original) stats[ci].changed++;
      outRows[ri][plan.index] = next;
    }
  }

  return { headers: outHeaders, rows: outRows, stats };
}
