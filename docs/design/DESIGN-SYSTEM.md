# The Toolkit design system

Standing principles for every surface in this repository. Source of truth: the approved
Claude Design package *Toolkit — Redesign* (canvas archived at
`.local-working/design-import/`, decisions recorded here). This file plus
[REVIEW-GATE.md](./REVIEW-GATE.md) are the gate every new tool and every change passes before it
lands. `scripts/design-gate.mjs` enforces the mechanical half. Scoping: the shell is square
(radii 0/50%); single-file tool artifacts may also carry their standalone-page family grammar
(4px, sanctioned 999px pills), which their folder audits enforce at the source; compiled framework
bundles (Redactorium) are exempt from the static palette/font scans — their rendered look is a
review-gate visual item — while external-request and copy scans apply everywhere.

A tool that cannot meet this system does not enter the Toolkit. There is no "close enough" tier.

## 1. Tokens

Defined once in `public/toolkit.css` under `:root`. Tools reuse the same values; the gate fails any
other hex on a Toolkit surface.

| Token | Value | Use |
|---|---|---|
| `--ink` | `#16140f` | Text, structural borders, offset shadows |
| `--soft` | `#4a463d` | Secondary text, labels, muted glyphs |
| `--paper` | `#fffdf8` | Cards, headers, inputs, sidebar |
| `--ground` | `#f6f4ef` | The working canvas behind cards |
| `--canvas` | `#e9e7e0` | Page background outside the shell |
| `--hairline` | `rgba(22,20,15,.17)` | Row separators, quiet card borders |
| `--hairline-strong` | `rgba(22,20,15,.32)` | Dashed drop-zone borders |
| `--faint` | `rgba(22,20,15,.3)` | Breadcrumb separator |
| `--forest` | `#1f4e32` | Primary actions, active/selected accents, link color |
| `--forest-wash` | `#efece4` | Active nav item, active preset pill |
| `--red` | `#c83232` | Link hover; "structurally fake" status dot |
| `--teal` | `#12666a` | "Protocol reserved" status dot |
| `--indigo` | `#3a3a8c` | "Authority reserved" status dot |
| `--amber` | `#9e5415` | Caution verdicts, boundary asides |
| `--forest-press` | `#183e29` | Primary-button hover shade only |
| `--amber-wash` | `#fbf4ea` | Washed amber ground (standalone-page notes) |

Red, teal, indigo, and amber are **semantic status hues only**. They never decorate cards, headers,
numbers, or chrome. (The old per-tool accent bars are retired.)

## 2. Type

Three families, self-hosted (`public/fonts/`), plus one system mono. Nothing else, no CDN.

- **Anton 400** — display nameplates only. Always uppercase. Never labels a field, button, card,
  or paragraph.
- **Space Grotesk 400/600/700** — everything you read: headings, body, options, inputs.
- **Archivo 400/700** — everything that labels or acts: eyebrows, column headers, buttons, nav.
- **Mono** (`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`) — generated data only:
  identifiers, hashes, timestamps, receipts. Never a general interface face.

Roles (desktop; small screens raise editable controls to 16px to prevent focus zoom):

| Role | Spec |
|---|---|
| Home nameplate | Anton 32px, `-0.02em`, lh 1, uppercase |
| Breadcrumb tool name | Anton 21px, `0.01em`, uppercase |
| Verdict headline | Anton 28–32px, `0.01em`, uppercase |
| Sidebar brand | Anton 16px + Archivo 11px/700 caps sub-line |
| Wizard question | Space Grotesk 24px/700 |
| Panel question / drop title | Space Grotesk 22px/700 |
| Task heading | Space Grotesk 19px/700 |
| Card title | Space Grotesk 17px/700 (Home) · 16px/700 (rows) |
| Stat value | Space Grotesk 19px/700 |
| Body | Space Grotesk 15px, lh 1.55 |
| Row/option copy | Space Grotesk 16px |
| Secondary | Space Grotesk 14px, `--soft` |
| Helper/aside | Space Grotesk 13px, lh 1.45, `--soft` |
| Eyebrow / column header | Archivo 11px/700, `0.14em`–`0.1em`, uppercase, `--soft` |
| Sidebar group label | Archivo 10px/700, `0.14em`, uppercase, `--soft` |
| Part number | Archivo 12px/700, `--soft` |
| Nav item / text action | Archivo 13px/700 |
| Button | Archivo 14px/700 |
| Data | Mono 12–14px |

**Rhythm.** Six line-heights, and every role uses one of them; a seventh is a defect. Each tool
declares the same tokens at its source (`--lh-*`) and its role rules reference them, so the shell
and five tools cannot drift apart one decimal at a time, which is how 77 rendered type styles grew
out of about thirty named roles before 2026-09-04.

| Token | Value | Roles |
|---|---|---|
| `--lh-display` | 1.1 | Anton: breadcrumb name, verdict headline (the Home nameplate and the Oracle's 8 stay at 1) |
| `--lh-heading` | 1.2 | Space Grotesk 700 at 16–24px: wizard question, panel and drop titles, task heading, card and row titles, stat values |
| `--lh-body` | 1.55 | Body 15px |
| `--lh-row` | 1.5 | Row and option copy 16px, table cells, all mono data |
| `--lh-helper` | 1.45 | Secondary 14px, helper and aside 13px |
| `--lh-label` | 1.4 | Archivo: eyebrows, column headers, nav, text actions, buttons |

## 3. Components

Square corners everywhere a surface is rectangular. `border-radius` is allowed only where the shape
is the meaning: the 8-ball, status dots stay square, progress tracks stay square — in practice the
only sanctioned circles are the Oracle ball and the fox mark.

**Primary button.** `2px solid var(--ink)` border, `--forest` fill, white Archivo 14/700 uppercase
`0.045em`, padding `9px 18px`, `min-height: 44px`, shadow `4px 4px 0 var(--ink)`. Pressed:
translate `4px,4px`, shadow removed. One primary per decision zone, always at its intrinsic width
— a primary never stretches to fill its column, whatever the artboard drew (Ben, 2026-09-01, the
Oracle's `Ask the oracle`). A primary never greys out either: when its action is not yet possible
it keeps its look, carries `aria-disabled`, and pressing it moves focus to what is missing (the
Oracle's unanswered question, SafeSeed's empty zone, Redactorium's first treatment).

**Secondary button.** `1px solid var(--ink)`, `--paper` fill, ink Archivo 14/700 (no uppercase),
same padding and height floor, no shadow.

**Text action.** Bare Archivo 13/700 ink link, padding `6px 8px`, 44px target. Utility links in
headers, "Change file", "Browse all 16".

**Row control.** A control that lives inside a repeated row (SafeList's decisions, the Oracle's
yes and no, SafeSeed's column editor): the secondary button's look at `min-height: 40px`, padding
`4px 8px`, Archivo 13/700; inputs and selects in a row take the same 40px. The only sanctioned
height under 44, and it exists so a table row is not 60px tall.

**Input and select.** `1px solid var(--ink)`, `--paper`, Space Grotesk 15px, padding `8px 12px`,
`min-height: 44px`. Redactorium's treatment select keeps its 34px right padding for the chevron.

**Mode toggle.** One `inline-flex` box, `1px solid var(--ink)`, `--paper`. Segments Archivo
13/700, padding `9px 18px`; active segment `--ink` fill + `--paper` text; inactive `--soft` text.
Segments size to their labels.

**Home tool card.** The whole card is the link. `1px solid var(--hairline)`, `--paper`, padding
`16px 16px 18px`; a 38px icon plate (`1px solid var(--hairline)`, `--ground`, 22px Lucide at
stroke 1.75 in `--forest`); title 17/700; one-line job description 14px `--soft`. Hover: border
turns `--ink`, shadow `4px 4px 0 var(--ink)`, translate `-1px,-1px`. No numbers, no accent bars,
no status pills, no card buttons.

**Sidebar.** 230px, `--paper`, `2px solid var(--ink)` right edge. Brand cap: 40px fox mark +
`ADVOKAT FRIDA` (Anton 16) over `TOOLKIT` (Archivo 11/700 caps `--soft`). Nav items: 40px min
height, 18px Lucide icon, Archivo 13/700, a 3px left border — transparent at rest, `--forest` +
`--forest-wash` background when current. Groups labeled with 10px caps eyebrows. The rail ends with one
way back to the publication (Ben, 2026-09-04): `Back to Advokat Frida`, Lucide `arrow-left`, Archivo
13/700 in `--soft`, pinned to the bottom of the rail above a hairline. It is the only link in the
rail that leaves the Toolkit, and it never carries a tool's styling when current.

**Tool header.** One 56px bar: `--paper`, hairline bottom border. Left: group eyebrow (Archivo
11/700 caps `--soft`) + `/` in `--faint` + tool name (Anton 21). Right: at most one text action.
The shell owns this bar; a tool never repeats its own name, tagline, or nameplate inside the
workspace. Two same-origin messages connect the shell and a tool: a tool may post
`{toolkit: "context", title}` to name its active task in the breadcrumb (Privacy Wizards names
the open determination), and the shell posts `{toolkit: "reset"}` to the tool on screen when its
rail item is chosen again — every tool answers by returning to its first state. Standalone pages
keep their own way back; the embedded view carries no `Start over` / `Change determination` line.

**Table.** Column headers Archivo 11/700 caps `--soft` over a `1px solid var(--ink)` rule; body
rows separated by `--hairline`; identifiers in mono 14; empty cells show `—` in `--soft`. Status
inside a table is a **dotted label**: 7px square swatch + 13px `--soft` text — never a pill.

**Stat band.** One row, equal columns, `1px solid var(--ink)`, `--paper`, padding `16px 18px`.
Each cell: Archivo 11 caps `--soft` label over a 19px/700 value.

**Verdict block.** `2px` border — `--forest` for a clear/positive determination, `--amber` for
caution — on `--paper`, padding `20px 22px`: Anton 28–32 uppercase headline + one 15px `--soft`
qualifier line. The same block shape in every tool that rules on something.

**Boundary aside.** `3px solid var(--amber)` left border, `padding-left: 12px`, 13px/1.45
`--soft`. At most one per surface, and only where it changes the next action.

**Wizard step.** Progress: Archivo 11 caps label (`Question 2 of 5`) + a 2px `--hairline` track
with `--forest` fill. Question at 24/700. Options: full-width rows, `min-height: 52px`, padding
`12px 18px`, 16px text on `--paper`; default `1px solid var(--ink)`, selected `2px solid
var(--forest)` + 700 weight. One question per screen. Selection is explicit: choosing an option
highlights it; `Next` (primary, bottom-left) commits it and `Back` beside it is a text action.
The progress label counts the longest run of questions still ahead, so it can only shrink.

**Chooser row** (Privacy Wizards pattern). Grid: 20px Lucide icon in `--forest` / content / `→`
in `--soft`. Title 16/700; one sub-line 14px `--soft` — `question · jurisdictions`. Rows separated
by `--hairline`; hover fills `--paper`.

**Drop zone.** `1px dashed var(--hairline-strong)` on `--paper`, centered stack: 22/700 title,
14px `--soft` accepted formats, then the primary + secondary pair. Where two zones sit side by
side (SafeSeed's CSV and receipt), each opens with a 24px Lucide glyph in `--forest` that names
its file.

**Step-flow.** The kit's numbered steps as one band: `1px solid var(--ink)` on `--paper`, equal
columns separated by `--hairline`; each cell is an Archivo 11 caps number in `--forest`, a 16/700
title, and one 14px `--soft` line. Redactorium's `How it works` is the instance.

**Findings table** (Redactorium). Exactly five columns — `Column` (mono), `Detected`,
`Confidence` (mono, two decimals), `Citation` (`--soft`), `Treatment` (a 200px, 44px select) —
in 62px rows. Confidence and citation are the evidence; nothing else lives in the row.

**Record block.** The shape every tool that produces a receipt or record ends on: the output's
name as the task heading (19/700), a stat band only when it carries numbers the surface does not
already state (SafeSeed's heading already says rows and seed, so its receipt has no band — Ben,
2026-09-01), one mono line `hash · timestamp` (a hash shows
its first 12 and last 6 hex characters with the full value on hover; timestamps read
`YYYY-MM-DDTHH:MMZ`), then one actions row — primary download, secondary record download, one
text action. Nothing renders below it. A generated preview above a receipt shows **every** row in
a bounded scroll region (sticky header) — never a truncated sample; the heading states the
count. The bound grows with the viewport, floored at 440px: a fixed height strands the bottom half
of a desktop monitor, which is the same defect as a fixed-width column stranding the sides. **A file preview is rendered as data**: header row and cells alike in mono (header 12px
`--soft` over an inset ink rule, cells 13px, nothing wraps), because the header row is part of the
file — SafeSeed's generated preview (4C) is the reference and SafeList's checked list follows it.
That is distinct from the **Table** above, which is interface: Archivo caps headers, body text,
and mono only on the identifier column (Redactorium's findings, SafeList's review).

**Icons.** Locally vendored Lucide Static 1.31.0 only. Nav 18px at stroke 2; card plates 22px at
stroke 1.75; chooser rows 20px at stroke 2. Icons are decorative beside complete visible labels.

## 4. Layout

- Desktop shell: `230px` rail + one task stage on `--ground`. Inside the shell every tool's
  working column is the canvas pane: `max-width: 1130px` (1066px of content plus 32px sides),
  centered when the stage is wider. The artboards are the wide-screen composition, not a minimum;
  a stage that stretches to fill 1,700px is a defect. Home's content column caps at 1000px.
- The tool header stays 56px. The first useful control is visible when a tool opens.
- Repeated control rows share one optical size; interactive targets never drop below 44px
  (52px for wizard options; 40px for a row control, §3).
- Mobile: compact top brand bar + focus-managed chooser; one-column task flow; the 44px floor
  holds; editable controls at 16px.
- No document-width horizontal scroll at 1440, 1034, 390, or 320 CSS pixels wide.

## 5. Copy

The words are part of the design. The gate's banned-phrase list enforces the bright lines;
review enforces the spirit.

- **No fluff.** Every sentence either orients or advances the task. If a line can be deleted
  without losing information, it was fluff.
- **No redundant content.** A fact appears once. A caveat appears once, where it changes the next
  action — never repeated across sixteen cards.
- **No explanatory nonsense.** Don't restate what the interface already shows. "Names become the
  CSV header" under a column named in a CSV builder is noise.
- **No trust theater.** Generic privacy/compliance/accountability reassurance stacks are
  prohibited. A boundary statement must be concrete and action-local ("example.com and the 555
  range are reserved for documentation. These values cannot reach a real person.").
- **Buttons say the verb.** `Generate`, `Copy prompt`, `Download CSV`, `Ask the oracle`. Never
  `Open tool`, `Click here`, `Learn more`, `Submit`.
- **The shell owns names.** A tool never introduces itself, welcomes anyone, or repeats its own
  name in the workspace.
- One earned personality beat per tool at most (the Oracle's ball, its blunt questions). Jokes
  point outward; the interface never praises itself.
- **The drawn state is the law.** On any state the canvas draws, everything visible must be in
  the artboard. A feature the canvas does not draw is either cut or lives behind the tool's
  existing disclosure (`Advanced…`, `How it works`); it never joins the drawn area.

## 6. What stays out

Retired or banned, with the deciding turn of the design package in parentheses:

- Card numbers (`01`–`05`) and per-tool accent hues on chrome (Turn 1).
- Status/category pills on Home cards and inside tables (Turn 3 — pills became dotted labels).
- Per-card `Open tool` buttons — the card is the link (Turn 1).
- The AF square tile in the Home header — the brand lives in the sidebar cap (Turn 2).
- Double-bordered panels around a tool's whole workspace; a source tool's root wrapper flattens
  in Toolkit mode (Turn 3 — "the double-bordered panel around it removed").
- Rounded cards, soft SaaS panels, gradients, blurred/multi-layer shadows, grain overlays.
- Alfa Slab, DM Serif, Inter, or any non-canonical face; any CDN font, script, or icon runtime.
- Head blurbs and taglines inside tool headers (Turn 1 — "145px of chrome down to 48px").
- Analytics, external requests, tracking of any kind.
- Per-row extras in the findings table — example popovers, reviewer notes, weaker-match lines
  (Turn 4 — "confidence and citation kept; those are the evidence").
- Second and third record formats (PDF, evidence ZIP) beside the record; one record (Turn 4).
- The Oracle's answer window inside the ball — the ball stays the 8 and the ruling is the verdict
  block (Turn 4).
- A selected-facts summary and a sources panel on the question view; `Copy outcome` and
  `Run again` beside a determination (Turn 4).
- Preview hints ("First 12 of 100 rows", "keep the CSV and its receipt together") and rows/seed
  explainers (Turn 3).

## 7. Change control

- This file changes only with an approved design decision (a reviewed design-package turn or
  Ben's explicit call). Code never drifts ahead of it.
- New tools adopt the system **at the source** — the shell's embed adapter may hide standalone
  chrome and align fonts, but it is not a paint-over for a tool that ignores the system.
- `docs/design/style-baseline.json` is the rendered form of §1–§3: every type role, control
  variant, color, radius, and shadow the Toolkit paints, as `scripts/style-census.mjs` measured
  it. The gate fails on any rendered tuple outside it. It is regenerated (`--update`) only in the
  same reviewed change that adds the role to this file; the two move together or not at all.
- Every landing change passes [REVIEW-GATE.md](./REVIEW-GATE.md).
