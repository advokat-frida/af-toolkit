# SafeList

Your send list, minus everyone who said no.

A sales or marketing person loads two files: the list they are about to send to, and today's
export of the opt-outs. SafeList finds every contact on the send list who is on the suppression
list, asks for a Keep or Remove on each one, and hands back the checked list in the same columns
plus a record of exactly what was checked. Nothing leaves the page.

"Safe" means one thing here: the list no longer contains anyone on the suppression list that was
loaded, as of that list's export date. It says nothing about where the list came from. The tool
never shows the word as a status; results say what was checked, against which file, on what date.

## Status

Version 0.1.0 is the working build Ben asked for on 2026-09-02: the full flow with sample lists,
the Keep/Remove approval table, the record, and the checked-list download. Wired into the Toolkit
shell the same day (stage entry, route, nav and Home card in the Manage data group, state proofs
5A–5D) and through the repository gate. Proposal: the Google Doc "Toolkit proposal: SafeList"
(Ben's Drive).

## What it does

- **Loads two lists** by file or paste (CSV; a bare column of addresses works). The email column
  is found by content, not by header name, and confirmed in one line.
- **Refuses a stale suppression list.** Opt-outs change every day. A suppression file older than
  24 hours (by its file date) blocks the check with no override; the fix is a fresh export.
- **Normalizes both sides the same way** before comparing: trims, lowercases, strips display
  names and `mailto:`, folds plus-tags and gmail dots (each a rule you can switch off), and honors
  `@domain.com` rows in the suppression list as whole-domain rules.
- **Flags duplicates** inside the send list (same address twice).
- **Approval table.** One row per matched contact with the reason and two buttons, `Keep contact`
  and `Remove contact`. Keep asks for a reason that goes into the record. Nothing is removed until
  every row has a decision.
- **Checked list** in the original columns and order, ready to import.
- **Record** (JSON): counts, matching columns, rules, the suppression file's date and fingerprint,
  the send list and output fingerprints, every decision, and the record's own SHA-256. Kept
  contacts are named; removed contacts appear as fingerprints only, so the record never becomes a
  second copy of the suppression list.
- **Check one address** against the loaded suppression list, for the one-off email.

## Layout

- `src/core.js` — the engine (CSV, normalization, detection, matching, decisions, record). Pure
  functions; every rule lives here.
- `src/app.js`, `src/page-body.html`, `src/page.css` — the page. Rendering only.
- `chrome/` — `fonts.css` + `shared.css`, byte-exact copies of the family chrome (do not edit).
- `samples/` — the mock lists: `cadence-audience.csv` (before), `suppression-list.csv`, and the
  generated `cadence-audience.checked.csv` (after) with `safelist-record.json` / `.txt`.
- `tools/build.mjs` — assembles `dist/safelist.html` (standalone) and `dist/safelist-embed.html`
  (Toolkit stage). `tools/run-sample.mjs` regenerates the sample "after" files.
- `test/` — `node --test` suite over the engine and the samples.
- `harness/shots.mjs` — Playwright walk-through of every state with the sample lists → `shots/`.

## Commands

```
npm test          # engine suite (node --test)
npm run build     # dist/safelist.html + dist/safelist-embed.html
npm run sample    # samples/cadence-audience.checked.csv + the record
npm run shots     # screenshots of every state (needs the build)
npm run check     # test + build + sample
```
