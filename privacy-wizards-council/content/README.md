# Council content

The Privacy Wizards Council runs on the files in this folder: one file per path and one per
source. They were split out of the legacy `wizards.html` on 2026-09-14, byte for byte, and the
build has read them instead of it since the same day. `scripts/registry/generate.mjs` turns them
into the modules the tool imports (`npm run registry`; dev, build and test run it first) and
stops with a list of errors when a file does not validate. Edit these files, never the
generated modules. While `npm run dev` is running, run `npm run registry` after an edit to see
it. Commit the regenerated modules, `dist/wizards.html` and the restaged Toolkit copy with the
content change: CI fails when they are stale.

## Layout

| Path | Holds |
| --- | --- |
| `registry.json` | The manifest version and every path. `published: true` makes a path available; the value must be `true` or `false`. The finder alphabetizes published categories and titles. |
| `wizards/<id>.json` | One path: `title`, `tag`, `q` (the one-line question under the title), `icon`, `jurisdictions`, `start`, `nodes`, `verifiedAsOf`. |
| `sources/<jurisdiction>/<id>.json` | One source: `kind`, `juris`, `label`, `citation`, `provenance`, an optional `note`, `body`, and `review`. |

The jurisdiction folder is the `juris` value lower-cased: `EU` becomes `eu`, `US-CA` becomes
`us-ca`, `US (federal)` becomes `us-federal`. The file name is the source id that paths cite.

## Nodes

A **question** has `type: "question"`, `q`, `help`, `cites` and `opts`. The first sentence of
`help` shows as the aside and the rest opens under *Why this question?*. Each option has a
`label`, a `goto` and an optional `desc`, shown under the option.

The answer and `desc` describe the fact being selected. `desc` may clarify a definition or
give an example; it must not tell the reader what to do or announce the determination.
Put instructions in outcome `actions`. If advice or reasoning applies only to one selected
answer, put it in that option's `resultActions` or `resultNotes` arrays. The engine carries
these to the final result and the downloaded record, and removes them when the answer is
changed. Scope and provisional-status notes remain visible on the result.

A path may declare `jurisdictionRoutes`, an array of `{ id, label, start }`. Each ID must
occur in `jurisdictions`, each route start must be an option of the ordinary start node,
and the routes must be acyclic and share no nodes. The interface selects jurisdictions
upfront and keeps their answers and results independent. Unknown outcomes may declare
`missingFacts`, an array of `{ fact, owner, why }`, to make the follow-up concrete.

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
card finds a cited paragraph by the marker that opens its line (`1.`, `(a)`, `1.(b)`, `(a) (1)`)
and follows a chain such as `(3)(a)` down from the parent line. A source that holds only some
paragraphs of its provision lists them in its `citation` right after the number
(`Art. 3(3)-(8), (23)`); a mention of any other paragraph stays plain. A draft or superseded
source never opens from the text.

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
- The start and every `goto` name a node in the same file, every node is a question or an
  outcome with its required fields, and every node is reachable from the start.
- `provenance` is an https URL, and each file sits in its jurisdiction's folder.
- A published path that cites a draft, missing or superseded source fails validation, so the
  build stops.
- A path says "Legal sources reviewed through" only when every source it cites is
  `practitioner-reviewed`.

## Adding a path

1. Sources first: fetch the primary text and write each source file with `status: "draft"` and
   its `retrievedDate`.
2. Write `wizards/<id>.json` and add `{ "id": "<id>", "published": false }` to `registry.json`.
   An unpublished path is left out of the finder and the next determinations, and its link opens
   nothing.
3. Add the path to `src/lib/data/categories.js`, `related.js` and `search.js`.
4. Run the adversarial legal panel, move each source to `automated-check-only`, and stamp
   `verifiedAsOf`.
5. Publish: set `published: true`. The tests refuse a published path that cites a draft or
   superseded source. Practitioner review then moves each source to `practitioner-reviewed`
   with its `reviewDate` and `reviewer`.
