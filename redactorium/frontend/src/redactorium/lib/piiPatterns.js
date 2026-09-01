/**
 * PII detectors — pure regex / pattern matching. No AI, no models.
 * Each detector supplies a name, a category, a regex (or predicate),
 * a confidence baseline, an optional Luhn/checksum boost, and citations.
 *
 * Confidence is scored per value; column confidence is the % of non-empty
 * cells that match, blended with per-value confidence. Higher-specificity
 * patterns (checksum-validated) start at 0.9+; heuristics stay <=0.7.
 */

// ---------- helpers ----------
export const luhnCheck = (num) => {
  const digits = String(num).replace(/\D/g, "");
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0, alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d; alt = !alt;
  }
  return sum % 10 === 0;
};

const ibanMod97 = (iban) => {
  const s = iban.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
  const rearr = s.slice(4) + s.slice(0, 4);
  let expanded = "";
  for (const ch of rearr) expanded += (ch >= "A" && ch <= "Z") ? (ch.charCodeAt(0) - 55) : ch;
  // mod-97 on big string
  let rem = 0;
  for (let i = 0; i < expanded.length; i += 7) {
    rem = parseInt(String(rem) + expanded.slice(i, i + 7), 10) % 97;
  }
  return rem === 1;
};

const ssnValid = (v) => {
  // format shape only; catches obviously invalid area/group/serial
  const m = v.match(/^(\d{3})-?(\d{2})-?(\d{4})$/);
  if (!m) return false;
  const [ , a, g, s ] = m;
  if (a === "000" || a === "666" || a[0] === "9") return false;
  if (g === "00") return false;
  if (s === "0000") return false;
  return true;
};

// ---------- detectors ----------
// tier: "checksum" | "reserved" | "format" | "heuristic"
// Confidence at value-level assigned by detector; column-level aggregated later.
export const DETECTORS = [
  {
    id: "email",
    name: "Email address",
    category: "contact",
    tier: "format",
    base: 0.95,
    citation: "RFC 5322 (relaxed grammar) — local@domain",
    test: (v) => {
      const m = String(v).match(/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/);
      return m ? 0.97 : 0;
    },
    columnHint: /(mail|e[-_]?mail)/i,
  },
  {
    id: "phone",
    name: "Phone number",
    category: "contact",
    tier: "format",
    base: 0.75,
    citation: "E.164 / NANP shape",
    test: (v) => {
      const s = String(v).trim();
      // strong: +NN...  or  (XXX) XXX-XXXX or XXX-XXX-XXXX
      if (/^\+?\d[\d\s().\-]{7,17}\d$/.test(s) && s.replace(/\D/g, "").length >= 8) {
        return /^\+/.test(s) || /^\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}$/.test(s) ? 0.9 : 0.72;
      }
      return 0;
    },
    columnHint: /(phone|mobile|tel|cell|contact\s*number)/i,
  },
  {
    id: "ssn",
    name: "US Social Security Number",
    category: "government-id",
    tier: "checksum",
    base: 0.98,
    citation: "SSA randomization rules — invalid area/group/serial exclusions",
    test: (v) => ssnValid(String(v).trim()) ? 0.98 : 0,
    columnHint: /(\bssn\b|social[-_ ]?security)/i,
  },
  {
    id: "credit_card",
    name: "Payment card (PAN)",
    category: "financial",
    tier: "checksum",
    base: 0.97,
    citation: "ISO/IEC 7812 · Luhn mod-10",
    test: (v) => {
      const s = String(v).replace(/[\s-]/g, "");
      if (!/^\d{12,19}$/.test(s)) return 0;
      return luhnCheck(s) ? 0.97 : 0.3;
    },
    columnHint: /(card|pan|credit|payment)/i,
  },
  {
    id: "iban",
    name: "IBAN (bank account)",
    category: "financial",
    tier: "checksum",
    base: 0.98,
    citation: "ISO 13616 · mod-97 check",
    test: (v) => {
      const s = String(v).replace(/\s+/g, "").toUpperCase();
      if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return 0;
      return ibanMod97(s) ? 0.98 : 0.4;
    },
    columnHint: /(iban|bank)/i,
  },
  {
    id: "ipv4",
    name: "IPv4 address",
    category: "network",
    tier: "format",
    base: 0.92,
    citation: "RFC 791 dotted-quad",
    test: (v) => {
      const m = String(v).match(/^(25[0-5]|2[0-4]\d|[01]?\d?\d)(\.(25[0-5]|2[0-4]\d|[01]?\d?\d)){3}$/);
      return m ? 0.94 : 0;
    },
    columnHint: /(\bip\b|ipv4|address)/i,
  },
  {
    id: "ipv6",
    name: "IPv6 address",
    category: "network",
    tier: "format",
    base: 0.9,
    citation: "RFC 4291",
    test: (v) => {
      const s = String(v).trim();
      return /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:$|^::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$/.test(s) ? 0.9 : 0;
    },
    columnHint: /(ipv6)/i,
  },
  {
    id: "dob",
    name: "Date of birth",
    category: "demographic",
    tier: "format",
    base: 0.7,
    citation: "ISO 8601 / common date shapes",
    test: (v) => {
      const s = String(v).trim();
      const m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
             || s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
      if (!m) return 0;
      const year = m[3] && m[3].length === 4 ? +m[3] : +m[1];
      if (year < 1900 || year > new Date().getFullYear()) return 0;
      return 0.65; // heuristic — could be any date
    },
    columnHint: /(dob|birth|born|birthday)/i,
    columnHintBoost: 0.25,
  },
  {
    id: "passport",
    name: "Passport number",
    category: "government-id",
    tier: "format",
    base: 0.6,
    citation: "ICAO Doc 9303 — 9 alphanumerics",
    test: (v) => {
      const s = String(v).trim().toUpperCase();
      return /^[A-Z0-9]{6,9}$/.test(s) && /[A-Z]/.test(s) && /\d/.test(s) ? 0.6 : 0;
    },
    columnHint: /(passport)/i,
    columnHintBoost: 0.3,
  },
  {
    id: "us_dl",
    name: "US driver's license",
    category: "government-id",
    tier: "format",
    base: 0.55,
    citation: "State-specific formats (letter+digits, 5-9 chars)",
    test: (v) => {
      const s = String(v).trim().toUpperCase();
      return /^[A-Z]\d{5,8}$|^[A-Z]{1,2}\d{5,7}$/.test(s) ? 0.55 : 0;
    },
    columnHint: /(licen[cs]e|dl[_ -]?number|driver)/i,
    columnHintBoost: 0.3,
  },
  {
    id: "postal_us",
    name: "US ZIP code",
    category: "address",
    tier: "format",
    base: 0.75,
    citation: "USPS ZIP / ZIP+4",
    test: (v) => /^\d{5}(-\d{4})?$/.test(String(v).trim()) ? 0.8 : 0,
    columnHint: /(zip|postal)/i,
  },
  {
    id: "postal_uk",
    name: "UK postcode",
    category: "address",
    tier: "format",
    base: 0.85,
    citation: "Royal Mail postcode format",
    test: (v) => /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(String(v).trim()) ? 0.9 : 0,
    columnHint: /(post\s*code|postcode)/i,
  },
  {
    id: "address_street",
    name: "Street address",
    category: "address",
    tier: "heuristic",
    base: 0.55,
    citation: "Number + street-word heuristic",
    test: (v) => {
      const s = String(v).trim();
      return /^\d{1,6}\s+\w+.*\b(street|st|road|rd|ave|avenue|blvd|boulevard|lane|ln|drive|dr|court|ct|way|place|pl)\b/i.test(s) ? 0.6 : 0;
    },
    columnHint: /(address|street|addr)/i,
    columnHintBoost: 0.3,
  },
  {
    id: "person_name",
    name: "Person name",
    category: "demographic",
    tier: "heuristic",
    base: 0.4,
    citation: "Two-plus capitalized tokens (heuristic — expect false positives)",
    test: (v) => {
      const s = String(v).trim();
      if (!/^[A-Z][a-z']+(\s+[A-Z][a-z']+){1,3}$/.test(s)) return 0;
      return 0.55;
    },
    columnHint: /(\bname\b|full[_ ]?name|first[_ ]?name|last[_ ]?name|surname|given)/i,
    columnHintBoost: 0.35,
  },
  {
    id: "company",
    name: "Company / organization",
    category: "professional",
    tier: "heuristic",
    base: 0.45,
    citation: "Legal-suffix heuristic (Inc, Ltd, GmbH, LLC, AS, AB, SA)",
    test: (v) => {
      const s = String(v).trim();
      return /\b(Inc\.?|LLC|Ltd\.?|GmbH|AS|AB|SA|SAS|BV|PLC|Co\.?|Corp\.?|Company|Group|Holdings)\b/i.test(s) ? 0.65 : 0;
    },
    columnHint: /(company|employer|organi[sz]ation|firm)/i,
    columnHintBoost: 0.3,
  },
  {
    id: "job_title",
    name: "Job title",
    category: "professional",
    tier: "heuristic",
    base: 0.4,
    citation: "Common role-token dictionary",
    test: (v) => {
      const s = String(v).trim();
      return /\b(Manager|Director|Engineer|Developer|Analyst|Consultant|Officer|President|Executive|Assistant|Coordinator|Specialist|Architect|Designer|Lead|Head|VP|CEO|CTO|CFO|COO|Partner|Attorney|Nurse|Doctor|Advokat|Legal|Counsel)\b/i.test(s) ? 0.55 : 0;
    },
    columnHint: /(title|role|position|job)/i,
    columnHintBoost: 0.3,
  },
  {
    id: "nhs",
    name: "UK NHS number",
    category: "government-id",
    tier: "checksum",
    base: 0.95,
    citation: "NHS mod-11 check digit",
    test: (v) => {
      const s = String(v).replace(/\s|-/g, "");
      if (!/^\d{10}$/.test(s)) return 0;
      let sum = 0;
      for (let i = 0; i < 9; i++) sum += parseInt(s[i], 10) * (10 - i);
      let check = 11 - (sum % 11);
      if (check === 11) check = 0;
      if (check === 10) return 0;
      return check === parseInt(s[9], 10) ? 0.96 : 0.2;
    },
    columnHint: /(nhs)/i,
  },
  {
    id: "aadhaar",
    name: "India Aadhaar",
    category: "government-id",
    tier: "checksum",
    base: 0.85,
    citation: "12-digit Verhoeff shape (format-only here)",
    test: (v) => /^\d{4}\s?\d{4}\s?\d{4}$/.test(String(v).trim()) ? 0.75 : 0,
    columnHint: /(aadhaar|aadhar|uid)/i,
    columnHintBoost: 0.2,
  },
  {
    id: "url",
    name: "URL",
    category: "network",
    tier: "format",
    base: 0.9,
    citation: "RFC 3986 (permissive)",
    test: (v) => /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(String(v).trim()) ? 0.92 : 0,
    columnHint: /(url|website|link)/i,
  },
  {
    id: "mac",
    name: "MAC address",
    category: "network",
    tier: "format",
    base: 0.95,
    citation: "IEEE 802 EUI-48",
    test: (v) => /^([0-9A-F]{2}[:-]){5}[0-9A-F]{2}$/i.test(String(v).trim()) ? 0.97 : 0,
    columnHint: /(mac)/i,
  },
];

export const CATEGORY_COLORS = {
  contact: "pill-forest",
  "government-id": "pill-brick",
  financial: "pill-brick",
  network: "pill-plum",
  demographic: "pill-ochre",
  address: "pill-ochre",
  professional: "pill-plum",
};

export const TIER_LABEL = {
  checksum: "checksum-verified",
  reserved: "reserved-namespace",
  format: "format-matched",
  heuristic: "heuristic",
};
