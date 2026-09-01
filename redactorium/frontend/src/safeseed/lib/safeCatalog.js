/**
 * SafeSeed catalog — every field type carries: id, label, tier, citation,
 * claim (what SafeSeed asserts about it), gen(rng, opts) → value, and
 * optional inRange(value) predicate for verify/scan.
 *
 * Tiers (from safeseed README):
 *   - protocol-reserved      : RFC-reserved namespace (2606/5737/3849)
 *   - authority-reserved     : issuing-authority-designated fictitious
 *   - designated-test-only   : published for processor / sandbox testing
 *   - structurally-fake      : self-evidently synthetic; not derived from any record
 */

// deterministic PRNG (mulberry32)
export function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const padN = (n, w) => String(n).padStart(w, "0");

// --------------- catalog pools ---------------
const EMAIL_LOCALS   = ["ada","grace","alan","marie","katherine","edsger","claude","donald","barbara","tim","dorothy","hedy","raj","yuki","olga","fatima","emiko","niels","amina","priya"];
const EMAIL_DOMAINS  = ["example.com","example.org","example.net"];                    // RFC 2606
const NAMES_FIRST    = ["Test","Sample","Fixture","Draft","Placeholder","Notional","Faux","Nominal","Mock","Redact"];
const NAMES_LAST     = ["Testerson","Sampleford","Fixtureton","Draftly","Placeholder","Notreal","Fauxman","Voidson","Mockingham","Redacton"];
const V4_BASES       = ["192.0.2.","198.51.100.","203.0.113."];                        // RFC 5737
const V6_PREFIX      = "2001:db8:";                                                     // RFC 3849
const TEST_CARDS     = ["4242424242424242","4000056655665556","5555555555554444","378282246310005","6011111111111117"]; // Stripe published test PANs
const TEST_IBANS     = ["GB82WEST12345698765432","DE89370400440532013000","FR1420041010050500013M02606","NL91ABNA0417164300"];
const COMPANIES      = ["ACME Test Co.","Example Holdings Ltd","Placeholder Industries Inc.","Sample Group AB","Fixture Systems GmbH","Not-Real Partners LLC","Draft Ventures BV","Notional Works PLC"];
const JOB_TITLES     = ["Test Analyst","Sample Coordinator","Placeholder Manager","Fixture Designer","Draft Specialist","Notional Consultant","Mock Architect","Faux Director"];
const DEPARTMENTS    = ["Engineering","Legal","Finance","Operations","Marketing","People","Product","Support"];
const CITIES         = ["Testville","Sampleburg","Placeholder City","Fixture Falls","Not-Real Town","Draftford","Mockingham","Notionville"];
const COUNTRIES      = ["Testonia","Sampleland","Placeholderia","Fixtureland","Draftistan","Notionia","Mockingland"];
const STREETS        = ["Example Way","Sample Street","Placeholder Rd","Fixture Ave","Draft Lane","Notreal Blvd","Mockingham Court"];
const UTM_PATHS      = ["landing","promo-test","tour-2026","spring-fixture"];
const UTM_SOURCES    = ["testsource","samplecampaign","fixturechannel"];
const UTM_MEDIUMS    = ["email","organic","cpc","affiliate"];
const LANGUAGES      = ["en","fr","de","es","it","pt","nl","sv","no","fi","da"];
const GENDERS        = ["female","male","non-binary","prefer-not-to-say"];
const CURRENCIES     = ["USD","EUR","GBP","SEK","NOK","DKK","CHF","JPY"];
const HTTP_METHODS   = ["GET","POST","PUT","PATCH","DELETE","HEAD"];
const HTTP_STATUS    = [200,201,204,301,302,400,401,403,404,409,422,429,500,502,503];
const ENDPOINTS      = ["/api/v1/health","/api/v1/users","/api/v1/orders","/api/v1/reports","/api/v1/webhooks"];

// --------------- helpers ---------------
async function sha256Hex(v) {
  const enc = new TextEncoder().encode(String(v));
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

// --------------- field definitions ---------------
export const TIERS = {
  "protocol-reserved":    { label: "protocol-reserved",    color: "#274a3d", claim: "Inside the cited protocol-reserved namespace." },
  "authority-reserved":   { label: "authority-reserved",   color: "#B85042", claim: "Inside the cited authority's current fictitious or invalid space." },
  "designated-test-only": { label: "designated-test-only", color: "#c88a2a", claim: "Published by the processor / sandbox for test use only." },
  "structurally-fake":    { label: "structurally-fake",    color: "#6d3878", claim: "Self-evidently synthetic; not derived from any real record." },
};

export const CATALOG = [
  // ---- identifiers ----
  {
    id: "rowIndex", label: "Row index (1..N)", group: "identifier",
    tier: "structurally-fake", citation: "Sequential integer starting at 1",
    gen: (_rng, opts, i) => i + 1,
  },
  {
    id: "opaqueId", label: "Opaque ID (TEST_ID_000042)", group: "identifier",
    tier: "structurally-fake", citation: "Visibly synthetic TEST_ prefix + zero-padded counter",
    gen: (_rng, opts, i) => `TEST_ID_${padN(i + 1, 6)}`,
  },
  {
    id: "uuid", label: "UUID v4 (random)", group: "identifier",
    tier: "structurally-fake", citation: "RFC 4122 v4; SafeSeed treats UUIDs as opaque — no authority reserves them",
    gen: (rng) => {
      const hex = "0123456789abcdef";
      let s = "";
      for (let i = 0; i < 32; i++) {
        let ch;
        if (i === 12) ch = "4";
        else if (i === 16) ch = hex[8 + Math.floor(rng() * 4)];
        else ch = hex[Math.floor(rng() * 16)];
        s += ch;
        if (i === 7 || i === 11 || i === 15 || i === 19) s += "-";
      }
      return s;
    },
  },

  // ---- contact ----
  {
    id: "email", label: "Email address", group: "contact",
    tier: "protocol-reserved", citation: "RFC 2606 — example.com / example.org / example.net reserved for documentation",
    gen: (rng, _o, i) => `${pick(rng, EMAIL_LOCALS)}.${padN(i + 1, 4)}@${pick(rng, EMAIL_DOMAINS)}`,
    inRange: (v) => /^[a-z][a-z0-9._+\-]*@(example\.com|example\.org|example\.net)$/i.test(String(v)),
  },
  {
    id: "fullName", label: "Full name (TEST_)", group: "contact",
    tier: "structurally-fake", citation: "Visibly synthetic fixture names — never issued to a person",
    gen: (rng, _o, i) => `${pick(rng, NAMES_FIRST)} ${pick(rng, NAMES_LAST)}_${padN(i + 1, 4)}`,
  },
  {
    id: "givenName", label: "Given name (TEST_)", group: "contact",
    tier: "structurally-fake", citation: "Fixture first names — never issued to a person",
    gen: (rng) => pick(rng, NAMES_FIRST),
  },
  {
    id: "surname", label: "Surname (TEST_)", group: "contact",
    tier: "structurally-fake", citation: "Fixture surnames — never issued to a person",
    gen: (rng) => pick(rng, NAMES_LAST),
  },
  {
    id: "phone", label: "US phone (NANPA 555-01xx)", group: "contact",
    tier: "authority-reserved", citation: "NANPA/ATIS — 555-0100…555-0199 designated fictitious",
    gen: (rng, _o, i) => {
      const area = pick(rng, ["212","415","202","312","617","305"]);
      return `+1 ${area} 555 01${padN((i % 100), 2)}`;
    },
    inRange: (v) => /^\+1 \d{3} 555 01\d{2}$/.test(String(v)),
  },
  {
    id: "ukPhone", label: "UK mobile (Ofcom drama 07700 9xx)", group: "contact",
    tier: "authority-reserved", citation: "Ofcom drama mobile range 07700 900000–900999",
    gen: (rng, _o, i) => `+44 7700 900${padN(i % 1000, 3)}`,
    inRange: (v) => /^\+44 7700 900\d{3}$/.test(String(v)),
  },
  {
    id: "ipv4", label: "IPv4 (RFC 5737 documentation)", group: "network",
    tier: "protocol-reserved", citation: "RFC 5737 — 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24",
    gen: (rng) => pick(rng, V4_BASES) + (1 + Math.floor(rng() * 253)),
    inRange: (v) => /^(192\.0\.2|198\.51\.100|203\.0\.113)\.\d{1,3}$/.test(String(v)),
  },
  {
    id: "ipv6", label: "IPv6 (RFC 3849 documentation)", group: "network",
    tier: "protocol-reserved", citation: "RFC 3849 — 2001:db8::/32 documentation prefix",
    gen: (rng) => V6_PREFIX + Math.floor(rng() * 65535).toString(16) + ":" + Math.floor(rng() * 65535).toString(16),
  },
  {
    id: "mac", label: "MAC (locally-administered)", group: "network",
    tier: "structurally-fake", citation: "Locally-administered range 02:00:00:xx:xx:xx",
    gen: (rng) => {
      const oct = () => Math.floor(rng() * 256).toString(16).padStart(2,"0");
      return `02:00:00:${oct()}:${oct()}:${oct()}`;
    },
  },
  {
    id: "url", label: "URL (example.com/...)", group: "network",
    tier: "protocol-reserved", citation: "RFC 2606 — example.com is documentation-reserved",
    gen: (rng, _o, i) => `https://example.com/${pick(rng, UTM_PATHS)}/${padN(i + 1, 5)}`,
  },
  {
    id: "marketingUrl", label: "Constrained UTM URL", group: "network",
    tier: "structurally-fake", citation: "example.com host + fixture UTM params",
    gen: (rng, _o, i) => {
      const s = pick(rng, UTM_SOURCES), m = pick(rng, UTM_MEDIUMS);
      return `https://example.com/${pick(rng, UTM_PATHS)}?utm_source=${s}&utm_medium=${m}&utm_campaign=fixture_${padN(i + 1, 4)}`;
    },
  },

  // ---- gov ID ----
  {
    id: "ssn", label: "US SSN (SSA-invalid)", group: "government-id",
    tier: "authority-reserved", citation: "SSA randomization — area 000, group 00, or serial 0000 are never assigned",
    gen: (rng, _o, i) => {
      // area = 000 (never assigned). Also cycles a per-run offset for uniqueness in the group/serial.
      const g = 1 + Math.floor(rng() * 99);
      const s = 1 + ((i * 137) % 9998);
      return `000-${padN(g, 2)}-${padN(s, 4)}`;
    },
    inRange: (v) => /^000-\d{2}-\d{4}$/.test(String(v)),
  },
  {
    id: "passportNumber", label: "Passport (T-prefix)", group: "government-id",
    tier: "structurally-fake", citation: "Visibly synthetic T-prefix + 8 digits — no state issues this shape",
    gen: (rng, _o, i) => `T${padN(i + 1, 8)}`,
  },
  {
    id: "usDriversLicense", label: "US Driver's Licence (TDL-)", group: "government-id",
    tier: "structurally-fake", citation: "TDL prefix is not a valid state DL scheme",
    gen: (rng, _o, i) => `TDL${padN(i + 1, 7)}`,
  },
  {
    id: "nhs", label: "UK NHS (test number)", group: "government-id",
    tier: "authority-reserved", citation: "NHS test number 9990000018 (fixed) — reserved for training",
    gen: () => "9990000018",
  },
  {
    id: "aadhaar", label: "India Aadhaar (all-zero)", group: "government-id",
    tier: "structurally-fake", citation: "All-zero 12-digit — UIDAI never issues 0000-format numbers",
    gen: () => "0000 0000 0000",
  },

  // ---- financial ----
  {
    id: "creditCard", label: "Card number (test PANs)", group: "financial",
    tier: "designated-test-only", citation: "Published processor test PANs (Stripe test mode)",
    gen: (rng) => pick(rng, TEST_CARDS),
    inRange: (v) => TEST_CARDS.includes(String(v)),
  },
  {
    id: "iban", label: "IBAN (published test)", group: "financial",
    tier: "designated-test-only", citation: "Documentation-published IBANs used by SWIFT / country registries",
    gen: (rng) => pick(rng, TEST_IBANS),
    inRange: (v) => TEST_IBANS.includes(String(v)),
  },
  {
    id: "currencyAmount", label: "Currency amount (0..10000.00)", group: "financial",
    tier: "structurally-fake", citation: "Uniform random within a bounded range; no PII linkage",
    gen: (rng) => (Math.floor(rng() * 1_000_000) / 100).toFixed(2),
  },
  {
    id: "currencyCode", label: "Currency code (ISO 4217)", group: "financial",
    tier: "structurally-fake", citation: "ISO 4217 codes from a small fixed list",
    gen: (rng) => pick(rng, CURRENCIES),
  },

  // ---- address ----
  {
    id: "streetAddress", label: "Street address", group: "address",
    tier: "structurally-fake", citation: "Fixture street names on obviously synthetic streets",
    gen: (rng, _o, i) => `${100 + i} ${pick(rng, STREETS)}`,
  },
  {
    id: "city", label: "City", group: "address",
    tier: "structurally-fake", citation: "Fixture city names — do not exist as real municipalities",
    gen: (rng) => pick(rng, CITIES),
  },
  {
    id: "country", label: "Country", group: "address",
    tier: "structurally-fake", citation: "Fixture country names — do not correspond to real sovereign states",
    gen: (rng) => pick(rng, COUNTRIES),
  },
  {
    id: "postalUsZip", label: "US ZIP (test range 00xxx)", group: "address",
    tier: "authority-reserved", citation: "ZIP prefixes 000-009 are unassigned by USPS",
    gen: (rng) => `00${padN(Math.floor(rng() * 900) + 100, 3).slice(-3)}`.slice(0,5),
  },
  {
    id: "postalUkPostcode", label: "UK postcode (SW1A 1AA)", group: "address",
    tier: "structurally-fake", citation: "SW1A 1AA is a well-known public-institution postcode used as illustrative example",
    gen: () => "SW1A 1AA",
  },

  // ---- demographic ----
  {
    id: "dob", label: "Date of birth (1950-2005)", group: "demographic",
    tier: "structurally-fake", citation: "Random calendar date; no PII linkage",
    gen: (rng) => {
      const y = 1950 + Math.floor(rng() * 55);
      const m = 1 + Math.floor(rng() * 12);
      const d = 1 + Math.floor(rng() * 28);
      return `${y}-${padN(m, 2)}-${padN(d, 2)}`;
    },
  },
  {
    id: "age", label: "Age (18-90)", group: "demographic",
    tier: "structurally-fake", citation: "Integer in a bounded range",
    gen: (rng) => 18 + Math.floor(rng() * 72),
  },
  {
    id: "gender", label: "Gender (enum)", group: "demographic",
    tier: "structurally-fake", citation: "Small fixed vocabulary",
    gen: (rng) => pick(rng, GENDERS),
  },
  {
    id: "language", label: "Language (ISO 639-1)", group: "demographic",
    tier: "structurally-fake", citation: "ISO 639-1 codes from a small fixed list",
    gen: (rng) => pick(rng, LANGUAGES),
  },

  // ---- professional ----
  {
    id: "company", label: "Company (TEST Co.)", group: "professional",
    tier: "structurally-fake", citation: "Visibly-synthetic legal-suffix names",
    gen: (rng) => pick(rng, COMPANIES),
  },
  {
    id: "jobTitle", label: "Job title", group: "professional",
    tier: "structurally-fake", citation: "Visibly-synthetic role names",
    gen: (rng) => pick(rng, JOB_TITLES),
  },
  {
    id: "department", label: "Department", group: "professional",
    tier: "structurally-fake", citation: "Small fixed vocabulary",
    gen: (rng) => pick(rng, DEPARTMENTS),
  },

  // ---- temporal ---- (deterministic — anchored to a fixed epoch, not wall clock)
  {
    id: "timestamp", label: "ISO timestamp (recent)", group: "temporal",
    tier: "structurally-fake", citation: "Uniform random ms within a 90-day window anchored to 2026-01-01",
    gen: (rng) => new Date(Date.UTC(2026, 0, 1) - Math.floor(rng() * 90 * 86400_000)).toISOString(),
  },
  {
    id: "dateOnly", label: "Date-only (recent)", group: "temporal",
    tier: "structurally-fake", citation: "Uniform random date within a 365-day window anchored to 2026-01-01",
    gen: (rng) => new Date(Date.UTC(2026, 0, 1) - Math.floor(rng() * 365 * 86400_000)).toISOString().slice(0, 10),
  },

  // ---- categorical ----
  {
    id: "boolean", label: "Boolean", group: "categorical",
    tier: "structurally-fake", citation: "Fair coin flip",
    gen: (rng) => rng() < 0.5,
  },
  {
    id: "enum", label: "Enum (custom values)", group: "categorical",
    tier: "structurally-fake", citation: "User-specified value list; picked uniformly at random",
    hasOptions: true,
    gen: (rng, opts) => {
      const vals = (opts?.values || "a,b,c").split(",").map(s => s.trim()).filter(Boolean);
      return vals.length ? pick(rng, vals) : "";
    },
  },
  {
    id: "randomInt", label: "Random int (min..max)", group: "categorical",
    tier: "structurally-fake", citation: "Uniform integer in [min, max]",
    hasOptions: true,
    gen: (rng, opts) => {
      const mn = Number.isFinite(+opts?.min) ? +opts.min : 0;
      const mx = Number.isFinite(+opts?.max) ? +opts.max : 100;
      return mn + Math.floor(rng() * (mx - mn + 1));
    },
  },
  {
    id: "randomFloat", label: "Random float (min..max)", group: "categorical",
    tier: "structurally-fake", citation: "Uniform real in [min, max), 2 decimals",
    hasOptions: true,
    gen: (rng, opts) => {
      const mn = Number.isFinite(+opts?.min) ? +opts.min : 0;
      const mx = Number.isFinite(+opts?.max) ? +opts.max : 1;
      return (mn + rng() * (mx - mn)).toFixed(2);
    },
  },

  // ---- http / api ----
  {
    id: "httpMethod", label: "HTTP method", group: "http",
    tier: "structurally-fake", citation: "IANA-registered HTTP methods (small subset)",
    gen: (rng) => pick(rng, HTTP_METHODS),
  },
  {
    id: "httpStatus", label: "HTTP status code", group: "http",
    tier: "structurally-fake", citation: "IANA-registered HTTP status codes (small subset)",
    gen: (rng) => pick(rng, HTTP_STATUS),
  },
  {
    id: "endpoint", label: "API endpoint (fixture)", group: "http",
    tier: "structurally-fake", citation: "Fixture path list",
    gen: (rng) => pick(rng, ENDPOINTS),
  },

  // ---- derived (hashed match keys) ----
  {
    id: "sha256Email", label: "SHA-256 of catalog email", group: "derived",
    tier: "protocol-reserved", citation: "Google Ads normalization wire shape · over RFC-2606 email input",
    isAsync: true,
    gen: async (rng, _o, i) => sha256Hex(`${pick(rng, EMAIL_LOCALS)}.${padN(i+1,4)}@${pick(rng, EMAIL_DOMAINS)}`),
  },
  {
    id: "sha256Phone", label: "SHA-256 of NANPA phone", group: "derived",
    tier: "authority-reserved", citation: "Google Ads normalization wire shape · over NANPA fictitious input",
    isAsync: true,
    gen: async (rng, _o, i) => {
      const area = pick(rng, ["212","415","202","312","617","305"]);
      return sha256Hex(`+1${area}55501${padN(i%100,2)}`);
    },
  },
];

export const BY_ID = Object.fromEntries(CATALOG.map(f => [f.id, f]));

export const GROUPS = [
  { id: "identifier",  label: "Identifiers" },
  { id: "contact",     label: "Contact"     },
  { id: "network",     label: "Network"     },
  { id: "government-id", label: "Government IDs" },
  { id: "financial",   label: "Financial"   },
  { id: "address",     label: "Address"     },
  { id: "demographic", label: "Demographic" },
  { id: "professional",label: "Professional"},
  { id: "temporal",    label: "Temporal"    },
  { id: "categorical", label: "Categorical" },
  { id: "http",        label: "HTTP / API"  },
  { id: "derived",     label: "Derived (hashed)" },
];
