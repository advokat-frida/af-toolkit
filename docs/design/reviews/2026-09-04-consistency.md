# Consistency review — 2026-09-04

The Toolkit is the flagship, so it got the audit a flagship deserves: not "does it look fine", but
"what did the browser actually paint, and how many different ways did it paint the same thing".
This is the record of that pass, what was fixed on the spot, what needs a ruling, and what the
gate now catches on its own so nobody has to do this by hand again.

## Method

Two passes, neither of which is a vibe.

1. **The rendered census** (`scripts/style-census.mjs`, new). It drives the same nineteen states
   `state-proofs.mjs` proves, and for the shell and each tool frame records every visible text run
   (family, size, weight, line-height, letter-spacing, transform, color), every control (type,
   fill, border, radius, shadow, padding, height floor), and every painted color, radius, and
   shadow. Then it counts. A tuple that shows up in one tool, or twice in total, is flagged
   ONE-OFF. The full report is `npm run qa:census:report`.
2. **The eye pass.** Every `proofs/states/*.png` at literal size, plus the desktop-monitor shots
   at 1920 and 2560 that the adaptive-layout work produced the same day.

The static gate (`design-gate.mjs`) reads source text and cannot see any of this. It can say "that
hex is not a token". It cannot say "that hairline is mixed from a different ink", "that button
inherited Arial", or "that weight was never loaded, so the browser faked it". The census can,
because it asks the page.

## Headline numbers

| | Before | After |
|---|---|---|
| Font families that actually rendered | 6 (Arial and a bare `monospace` had crept in) | 4 |
| Distinct rendered type roles | 78 | 77 |
| Distinct control variants | 36 | 35 |
| Colors outside the token set | 1, on 333 borders | 0 |
| Synthesized weights (not loaded, faked by the browser) | 2 | 1 (a toast title, see D) |
| Mono font stacks | 2 | 1 |

Seventy-seven type roles is still far too many for a system that names about thirty. The gap is
almost entirely line-height (see C below). That is the next pass, and it is mechanical.

## Fixed in this pass

Each of these is an alignment to what `DESIGN-SYSTEM.md` already says. None is a design change.

1. **SafeSeed's remove-column button rendered in Arial.** `.field-del` set a size and no family,
   so the button fell back to the browser default. Now Archivo, like every other control.
2. **Three tools carried a hairline mixed from a different ink.** SafeList, the Oracle, and the
   Wizards all defined their rule color as `rgba(31,29,24,.16)`, an old theme value. The token is
   `rgba(22,20,15,.17)`. Invisible one row at a time, visible across 333 borders when the tools sit
   beside SafeSeed and Redactorium, which had it right. Fixed at the source in each tool.
3. **A faux-bold arrow.** The Wizards' chooser arrow asked for Space Grotesk 800. The face ships
   400/600/700, so the browser synthesized it. Now 700.
4. **Primary buttons in two shades of white.** The Wizards and Redactorium set primary text to
   `--paper`; the other three used white, which is what §3 says. Now white everywhere. Nobody would
   have seen this. That is not a reason to keep it.
5. **Two mono stacks.** SafeSeed led with `ui-monospace`; SafeList, the Oracle, and Redactorium led
   with `SFMono-Regular`. On Windows they resolve the same. On a Mac, `ui-monospace` is SF Mono and
   `SFMono-Regular` is not an installed family name, so three tools would have dropped to Menlo
   while SafeSeed got SF Mono. One stack now, the one §2 names.
6. **Redactorium started 16px below the header, on a strip of paper.** The eye pass caught a
   pale band under the shell header on every Redactorium state and on no other tool. The DOM had
   no such element: the first section's `margin-top: 16px` collapsed through `#root`, so the whole
   app box began 16px down and the body's paper showed above it. `display: flow-root` on the
   embedded root stops the collapse; the html and body behind it are ground now too, so nothing
   can leak. A pixel probe under the header now reads ground at every row, for every tool.

And two changes to the machinery, because a fix nobody can regress to is a fix:

- `design-gate.mjs` now locks `rgb()`/`rgba()` colors to the token bases, not just hexes. Item 2
  would have failed the gate the day it was written.
- `state-proofs.mjs` parks the pointer on empty rail before each screenshot. The Redactorium
  findings proof used to show a hovered row and a focused row as if the canvas had drawn them.

## Needs a ruling

*Ruled the same day. Ben's call: standardize the principles (type, size, line-height) and let
layouts differ. A to D shipped in the second pass on 2026-09-04: the six rhythm tokens, the row
control at 40px, one text-action padding, one input shape, the mode toggle at 13, Redactorium's
task heading at 19. E remains open.*

These are places where the code, the written system, and the drawn canvas do not agree with each
other. Picking one is Ben's call; the recommendation is marked.

**A. The 44px floor versus compact rows.** §4 says interactive targets never drop below 44px.
The canvas drew, and the code ships, controls under it: SafeList's `Keep contact` / `Remove
contact` at 40px, the Oracle's yes/no at 40px, SafeSeed's column editor at 32px (inputs, selects,
the remove button) and its preset pills at 34px. Recommendation: name one exception in §3, "a
control inside a repeated row: 40px minimum", raise SafeSeed's editor and pills to it, and leave
the floor at 44 everywhere else. One rule, no special cases per tool.

**B. Redactorium's task heading is 22px; every other tool's is 19px.** §2 says 19. Its drop-zone
title is rightly 22 (that role exists); its file-name heading borrowed the same size.
Recommendation: 19.

**C. Line-height sprawl.** This is where most of the 77 roles come from. The same family, size,
weight, and color renders at several line-heights depending on which tool wrote the CSS:

| Role | Line-heights found | Where |
|---|---|---|
| Body 15px | 1.55 · 1.5 · 1.45 | shell/Oracle/SafeList/SafeSeed · Wizards/Redactorium · SafeList record |
| Row copy 16px | 1.4 · 1.45 · 1.5 · 1.6 | four of them inside the Oracle alone |
| Eyebrow Archivo 11 | 1.2 · 1.4 · 1.5 · 1.55 · 1.6 | five, across five tools |
| Data mono 13px | 1.4 · 1.45 · 1.55 · 1.6 | SafeList and SafeSeed, same role |
| Task heading 19px | 1.25 · 1.3 | SafeSeed/Redactorium · SafeList |
| Panel title 22px | 1.15 · 1.2 · 1.25 | Redactorium · SafeList · Oracle |

The fix is a short set of line-height tokens per role, adopted at the source in each tool, with
the census diff as the proof. It is the single largest polish lever available and it costs no
design decisions. Recommendation: do it as the next pass, before any visual exploration, because
rhythm is most of what "clean" means on the reference sites (see below).

**D. Control variants.** Thirty-five is the count; about twelve are the system. Text actions
render with five different paddings. Skip links come in three styles. SafeSeed's mode toggle is
Archivo 13, Redactorium's is 14 (§3 says 13). Selects come in three shapes. Redactorium's toast
title is a synthesized 500. Recommendation: consolidate to the §3 set in the same pass as C.

**E. SafeList's checked-list preview clips its last column** at 1360 with no sign that the table
scrolls sideways (`Q3 Outrea`). §3 forbids wrapping in a data preview, so a scroll is correct; the
missing part is the affordance. Nit; fix with C.

## What the gate does now that it did not do yesterday

`npm run gate` ends with `qa:census`, which drives every drawn state and fails on any rendered
tuple absent from `docs/design/style-baseline.json`. The baseline was generated from this build,
after the fixes above. It changes only via `--update`, in the same reviewed change that adds a
role to `DESIGN-SYSTEM.md`. So a new tool cannot bring a new font size, a fifth line-height for
body text, a slightly different hairline, or a 41px button into the Toolkit without the diff
showing exactly that, with the state and element it appeared in. CI runs it too.

The baseline deliberately contains the items under A–E as they are today. When a ruling lands and
the fix ships, `--update` shrinks it. The number of entries is a score; lower is better.

## On inspiration, and the Claude Design question

privado.ai and transcend.io read as clean for three reasons that have nothing to do with their
palettes: one big statement per screen and then quiet; spacing that follows a rhythm rather than
just being generous; and one accent color with everything else neutral. Their actual look (a
pastel gradient hero and pill buttons on one, a navy field with a lime CTA and abstract 3D on the
other) is marketing-site grammar and would not survive contact with our tokens, nor should it. Our
paper, ink, forest, square corners, and offset shadows are the brand. Keep them.

What the Toolkit lacks against those sites is not color or shape. It is rhythm (C and D above)
and, on Home, a first impression sized for a flagship: the nameplate is modest, and the cards say
what a tool does without giving any sense of what it produces. That is the one place a directed
visual exploration would pay off.

So: yes to a Claude Design pass, and not yet. Do C and D first, so the exploration starts from one
rhythm instead of six, then brief it tightly: Home and one working state (SafeList's review table)
at 1440 and 2560, three directions, tokens and type roles fixed, hierarchy and rhythm the only
variables. The census then measures the winner; if a direction needs a role the system does not
have, the diff names it and §2 either grows or the direction loses. Mobbin is overkill for this;
if it gets used at all, search dashboard patterns (data tables, review queues, result summaries),
which are closer to our density than either reference's landing page.
