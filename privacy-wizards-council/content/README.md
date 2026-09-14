# Council content

The Privacy Wizards Council runs on the files in this folder: one file per path and one per
source. They were split out of the legacy `wizards.html` on 2026-09-14 and match it exactly;
`tests/unit/registry.test.js` proves it on every test run.

> **Switch-over pending.** The build still extracts the registry from `wizards.html`
> (`scripts/extract-legacy-data.mjs`). It moves to these files in the commit after the 2.1.0
> work lands, so the two changes stay reviewable apart. Until then, do not edit these files:
> the equivalence test fails on any difference from `wizards.html`.

## Layout

| Path | Holds |
| --- | --- |
| `registry.json` | The manifest version and every path in finder order. `published: true` makes a path available. |
| `wizards/<id>.json` | One path: `title`, `tag`, `q` (the one-line question under the title), `icon`, `jurisdictions`, `start`, `nodes`, `verifiedAsOf`. |
| `sources/<jurisdiction>/<id>.json` | One source: `kind`, `juris`, `label`, `citation`, `provenance`, an optional `note`, `body`, and `review`. |

The jurisdiction folder is the `juris` value lower-cased: `EU` becomes `eu`, `US-CA` becomes
`us-ca`, `US (federal)` becomes `us-federal`. The file name is the source id that paths cite.

## Nodes

A **question** has `type: "question"`, `q`, `help`, `cites` and `opts`. The first sentence of
`help` shows as the aside and the rest opens under *Why this question?*. Each option has a
`label`, a `goto` and an optional `desc`, shown under the option.

An **outcome** has `type: "outcome"`, `tier` (`required`, `warn`, `ok` or `info`), `title`,
`summary` (the reasoning), `actions` and `cites`, and optionally `clock` (the line under the
verdict) and `clockSpec` (`anchorLabel`, `legs` of `{ label, hours }`, `note`). A calendar
reminder stays locked until the clock itself is practitioner-reviewed.

Article, section, guidance, case and defined-term mentions in any of this text become citation
cards when they resolve to a source in this folder (`src/lib/engine/mentions.js`). A mention
with no source stays plain text.

## Sources

`body` is the included text as a list of lines, joined with a newline at build. Use `<p>`,
`<span class="num">` for paragraph numbers, `<blockquote>`, `<b>` and `<i>` only. The citation
card finds a cited paragraph by its `(1)` or `1.` marker.

`review` holds the review state. It never enters the source's content hash, so a status change
does not look like a text change.

| Field | Meaning |
| --- | --- |
| `status` | `draft`, `automated-check-only`, `practitioner-reviewed` or `superseded` |
| `retrievedDate` | When the primary text was fetched, `YYYY-MM-DD` |
| `effectiveOrPublicationDate` | When the text took effect or was published |
| `reviewDate`, `reviewer`, `reviewerRole` | Who reviewed it and when; `practitioner-reviewed` needs `reviewDate` and `reviewer` |

Unknown values are `null`, never omitted.

## What the checks enforce

- Every path in `registry.json` has a file, and every path file is listed.
- Every cite resolves to a source file, and source ids are unique across folders.
- `provenance` is an https URL, and each file sits in its jurisdiction's folder.
- A published path that cites a draft, missing or superseded source fails closed.
- A path says "Legal sources reviewed through" only when every source it cites is
  `practitioner-reviewed`.

## Adding a path, after the switch-over

1. Sources first: fetch the primary text and write each source file with `status: "draft"` and
   its `retrievedDate`.
2. Write `wizards/<id>.json` and add `{ "id": "<id>", "published": false }` to `registry.json`.
3. Add the path to `src/lib/data/categories.js`, `related.js` and `search.js`.
4. Run the adversarial legal panel, move each source to `automated-check-only`, and stamp
   `verifiedAsOf`.
5. Publish. Practitioner review then moves each source to `practitioner-reviewed` with its
   `reviewDate` and `reviewer`.
