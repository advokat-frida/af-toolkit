# Redactorium — PRD

## Problem statement (verbatim)
> i want to build a tool that does not rely on a LLM. A browser tool where you drop a CSV, word document, pdf, xlsx any machine readable format really. it detects PII columns (regex, pattern matching, no AI), and you pick your transformation per column: hash it, generalize it, redact it, swap it with synthetic values. Output is a clean file plus a transformation log you can hand to legal as proof.

## User choices
- Formats: CSV, XLSX, PDF, DOCX, TXT (+ md/log)
- PII detectors: extensive set with confidence + citation per detector (email, phone, SSN, credit card, IBAN, IPv4/v6, DOB, passport, US driver's license, US ZIP, UK postcode, street address, person name, company, job title, NHS, Aadhaar, URL, MAC)
- Transformations: hash · redact · generalize · synthetic-swap (SafeSeed catalog) · keep
- Processing: fully client-side (no backend, no network)
- Log formats: JSON + PDF (both), plus SHA-256 of input & output bytes
- Brand: match advokatfrida.com — forest green + cream paper + Alfa Slab display + editorial engraving aesthetic

## Architecture
- **Frontend only** (React 19 + CRA/craco + Tailwind + shadcn)
- Libraries: `papaparse`, `xlsx`, `pdfjs-dist@4.8.69` (CDN worker), `mammoth`, `jspdf`, `file-saver`
- Hashing: WebCrypto `SHA-256`
- Synthetic values: RFC 2606 / 3849 / 5737 · NANPA 555-01xx · SSA-invalid SSNs · ISO 7812 test PANs · Ofcom drama mobiles

## What's implemented (2026-02)
- `pages/Redactorium.jsx` — single-page flow
- `components/`: Masthead, FileDropZone, DetectionView (with drill-down), PreviewTable, ActionBar (+ DownloadPanel with ZIP button), Footer, CustomRulesPanel
- `lib/piiPatterns.js` — 20 detectors with Luhn/mod-97/NHS-mod-11 checksums
- `lib/detector.js` — column-wise sampling + confidence blending + custom-rule injection + up-to-3 example captures per detector
- `lib/transformers.js` — hash / redact / generalize / synthetic
- `lib/parsers.js` — dispatch for CSV/XLSX/DOCX/PDF/TXT
- `lib/docxHandler.js` — DOCX round-trip: parse `word/document.xml` into paragraphs, rewrite `<w:t>` runs, rezip preserving styles/headings
- `lib/customRules.js` — user regex rules persisted to localStorage
- `lib/exporters.js` — cleaned file + JSON log + PDF record + `buildEvidenceZip` bundle
- Editorial paper-noise background, Alfa Slab display, deep-forest banner, ochre/brick/plum tag chips

## Feature iterations
- **v0.1..v0.9** — Redactorium + SafeSeed built out, restructured into self-contained folders
- **v1.0 (2026-02-27)** — Polish: searchable preset combobox, schema JSON export, verify-log deep link in PDF, A4 PDFs with page numbers · tested 100%
- **v1.1 (2026-02-27)** — **CSV Schema Import**: SafeSeed Import modal now has JSON | CSV tabs. CSV headers become field names; sampled cells run against every catalog `inRange` predicate to guess types, with structurally-fake fallbacks (randomInt/randomFloat/dateOnly/enum/opaqueId). Round-trip proven (Export → CSV Import → identical schema). Privacy-preserving — SafeSeed never keeps CSV values, only headers and guessed types. Tested 8/8

## Repo split plan
- Ready to extract SafeSeed to its own repo when the user decides — the folder has no dependencies on Redactorium files. Only shared artifacts are `index.css` (design tokens = Advokat Frida site theme), `components/ui/*` (shadcn), and `package.json` (libraries)

## Backlog (P1/P2)
- P1: SafeSeed verify screen — paste output + record → strict whole-file check
- P1: SafeSeed scan screen — paste any CSV → flag values outside catalog ranges
- P2: SafeSeed relational schemas (foreign keys across two tables in one bundle)
- P2: Add data-testid to SafeSeed Output SHA-256 for easier automation
- P2: Verify-log route for Redactorium HMAC records
- P2: Multi-sheet XLSX support (Redactorium)
- P2: I18n

## Not-a-scope-out disclaimer
Detection is regex only. Real personal data that doesn't match a configured pattern is not flagged. The transformation log documents intent and mechanism; it is not a cryptographic proof of origin (the record is unsigned).
