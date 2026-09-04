# Redactorium

**Find the personal data in a file, decide what happens to each field, and get a record of what you
did.**

Someone asks you to share a spreadsheet with a vendor, a log with support, a PDF with a regulator.
You know it has personal data in it. You do not know exactly where, and hand-scrubbing a thousand
rows is how mistakes happen.

Drop the file in. Redactorium finds the likely personal data, shows you what it found and why, and
lets you pick a treatment per column: keep it, hash it, redact it, generalize it, or swap in
synthetic values. Then you get the clean file and a record of exactly what was changed.

Nothing is uploaded. The parsing, the detection and the transformation all happen in your browser.

## What it reads

CSV, XLSX, PDF, DOCX, TXT, Markdown, and log files. Single file, or a batch that comes back as a
zip with a manifest of every input and output hash.

## What it looks for

The detectors live in [`frontend/src/redactorium/lib/`](frontend/src/redactorium/lib/):

| File | What it holds |
|---|---|
| `piiPatterns.js` | The pattern library each detector is built from |
| `detector.js` | Runs the detectors over parsed content and scores confidence |
| `customRules.js` | Your own patterns, for the identifiers only your organisation uses |
| `transformers.js` | The five treatments: keep, hash, redact, generalize, synthetic swap |
| `parsers.js` | Turning each supported format into rows and text |
| `exporters.js` | The clean file, the record, and the batch archive |

Every finding shows its confidence and its citation, and nothing is changed until you choose a
treatment. The tool never decides for you, because a detector that silently redacts the wrong
column is worse than one that asks.

## The record

Each run produces a JSON record: which detectors ran, what they matched, the treatment applied per
column, the SHA-256 of the file content, and a timestamp. That is the artifact you keep when
someone later asks what exactly you shared and what you removed.

## Building it

```bash
cd frontend
npm ci
CI=false npm run build      # CRA warnings are not errors here
```

Output lands in `frontend/build/`, which is gitignored. Stage it into the Toolkit from the
repository root with `npm run build:tools`.

The build directory is a generated intermediate and is deliberately not committed. The artifact of
record is the staged copy in `public/tools/redactorium/`, whose hash is in
`public/tool-sources.json` and verified by the gate.

## Known warts

This tool came from a vibecoded prototype and was hardened afterwards. The generator's scaffolding
is gone as of 2026-09-04 (the FastAPI and MongoDB template, the pod cron config, the PRD, the
iteration logs, a stray committed `.gitconfig`), so what is left is the tool. One thing remains
worth knowing:

- Redactorium's bundle is a compiled React app, so unlike the single-file tools it is a directory
  of chunks rather than one readable file. It still makes no network requests; the design gate
  scans it for external hosts on every run, and the network panel is the check you can run in
  thirty seconds.

## Licence

MIT, same as the rest of the Toolkit. Redactorium shipped unlicensed until 2026-09-03; that was an
oversight, not a position.
