# Redactorium

**Find the personal data in a file, decide what happens to each kind, and get a record of what you
did.**

Someone asks you to share a spreadsheet with a vendor, a log with support, a PDF with a regulator.
You know it has personal data in it. You do not know exactly where, and hand-scrubbing a thousand
rows is how mistakes happen.

Drop the file in. Redactorium finds the likely personal data, shows you what it found and the rule
behind each finding, and suggests a treatment for each one: keep it, redact it, replace it with a
code, make it less exact, or swap in a fake. You change what you disagree with, then download the
clean file and a record of exactly what changed.

Nothing is uploaded. The parsing, the detection and the changes all happen in your browser.

## What it reads

CSV, Excel (XLSX and XLS), Word (DOCX), PDF, text, Markdown, and log files. Single file, or a batch
that comes back as one zip: each clean file with its record, plus a manifest of every input and
output hash.

## How it finds things

Two ways, and the findings table says which one produced each row.

- **A spreadsheet column whose cells are personal data** (every cell an email address, a phone
  number, a name) is one row in the table. Its treatment rewrites every cell in the column.
- **Personal data inside text**: a sentence in a PDF, a paragraph in a Word file, a line in a log, a
  notes column in a spreadsheet. Each kind found there (email addresses, phone numbers, card and ID
  numbers) is its own row, with a count. Its treatment rewrites only the matched characters and
  leaves the rest of the sentence alone.

Inside text, card numbers, IBANs and NHS numbers must pass their checksums, and never-issued SSNs
are rejected. Kinds that only mean something next to a label (a date is a date of birth after "born" or
"DOB"; a name after "Name:" or "Dear") need the label. Unlabeled names in prose are not found; check
the clean file before it goes out.

In a spreadsheet, three weak shapes count only in a column named for them: five digits in a ZIP
column, and six to nine letters and digits in a passport or driver's license column. Customer,
order and ticket IDs have the same shape, and would otherwise be read as passports.

The detectors live in [`frontend/src/redactorium/lib/`](frontend/src/redactorium/lib/):

| File | What it holds |
|---|---|
| `piiPatterns.js` | The whole-cell detectors: name, pattern, checksum, and the plain rule shown in the table |
| `textScan.js` | The in-text patterns: where each kind sits inside a sentence, as exact character ranges |
| `detector.js` | Turns a parsed file into findings rows, whole-cell or in-text |
| `customRules.js` | Your own patterns, for the identifiers only your organization uses |
| `transformers.js` | The treatments: keep, redact, replace with a code (keyed hash), make less exact, swap for fakes |
| `parsers.js` | Turning each supported format into rows and text |
| `docxHandler.js` | Word files: every text part, the cleaning, and a write-back that keeps formatting |
| `exporters.js` | The clean file and the record |

Nothing is changed until you apply the treatments, and every treatment can be changed first.

## Word, PDF and spreadsheet specifics

- **Word:** headers, footers, footnotes, endnotes, image alt text, hyperlink addresses and the
  document title are treated like the body. Comments, tracked changes (accepted as final), the
  author and company fields, content-control data and document variables are removed from the clean
  copy, and the record lists them. Pictures, embedded files and charts are not read and stay as
  they are; the page says so.
- **PDF:** the clean file is a new, text-only PDF with the original page breaks. Layout, images,
  attachments and metadata stay behind. Text the original hid (white text, words under a black box,
  an invisible scan layer) is extracted with the rest and becomes ordinary visible text; the page
  says so. A scanned PDF with no text layer has nothing to read, and the page says that instead of
  returning an empty file.
- **Spreadsheets:** the first visible sheet is read, and the clean file contains only that sheet;
  the page names the sheets left out. A first row that holds data rather than column names is
  treated as data.

## Replace with a code

A keyed hash (HMAC-SHA-256, first 16 hex characters). With no key, each run makes a random one
and never stores it, so the same value gets the same code everywhere in the file (or the batch),
but nobody can rebuild the codes by hashing guesses. Enter a key under Advanced to get the same
codes across runs. Hashed data about people is still personal data under the GDPR.

## Make less exact and Swap for fakes

Make less exact keeps the rough part and drops the rest: a date of birth keeps its year, a ZIP code
its first three digits, an IP address its network, a phone number its country and area code.

Swap for fakes draws from reserved or published test ranges, so a fake cannot belong to anyone. The
same real value gets the same fake everywhere in the file (or the batch), and two different values
never share one while the range has room. Test card numbers, test IBANs and the NHS test number come
from short published lists, so they repeat.

## The record

Each run produces a JSON record: which detectors ran, what they found, the treatment applied to
each finding and how many values it changed, what was cleaned from a Word file, the SHA-256 of the
input and of the clean file, and timestamps. It holds no matched values and no key. The file name is scanned the
same way, and anything found in it is replaced before the name is used for the clean file or the
record.

## Building it

```bash
cd frontend
npm ci
npm test         # engine tests: detection, treatments, Word cleaning, the record
npm run lint
npm run build    # -> build/
```

Then stage it into the Toolkit from the repository root with `npm run build:tools`. The build
directory is a generated intermediate and is not committed; the artifact of record is the staged
copy in `public/tools/redactorium/`, whose hash is in `public/tool-sources.json` and verified by
the gate. The build also writes `THIRD-PARTY-LICENSES.txt`, the license of every bundled package.

## Known limits

- Redactorium's bundle is a compiled React app, so unlike the single-file tools it is a directory of
  chunks rather than one readable file. It sends nothing to any other host; the first PDF you open
  loads the PDF reader from the same site. The network panel is the check you can run in thirty
  seconds.
- Pattern matching finds data with a known shape. It cannot see details described in words, text
  inside images, or identifiers only your organization uses until you add a custom rule.

## License

MIT, same as the rest of the Toolkit. Redactorium shipped unlicensed until 2026-09-03; that was an
oversight, not a position.
