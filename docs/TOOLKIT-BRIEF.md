# The Advokat Frida Toolkit

Status: consolidated single-repository build (2026-08-31), redesigned to the approved design package.

## Product decision

The Advokat Frida Toolkit is one browser workspace for practical privacy and AI work. It brings
SafeSeed, Redactorium, Privacy Wizards Council, Build-A-Prompt, and Objection Oracle into one
persistent shell. Existing Advokat Frida articles remain editorial and promotional surfaces. They
may link into the Toolkit, but they do not become duplicate tool pages.

Every newly approved tool joins this Toolkit unless a later product decision says otherwise.

## Reader job

A privacy, legal, product, or engineering practitioner should be able to arrive once, understand
which tool fits the work on the desk, switch tools without hunting across URLs, complete one focused
task, and leave with the output that tool already promises.

## Information architecture

- **Home** is the orientation view. It contains one short welcome, five tool entrances, and one
  closed full-width Changelog at the bottom. Announcement, publication-explainer, local-build, and
  other maintenance cards stay out of the working view. The desktop AF tile lives in the Home
  header rather than a separate rail cap.
- **Tool routes** keep one active workspace at a time. Each source tool keeps its own behavior,
  local-processing boundary, state, and portable output.
- **Desktop navigation** is a persistent left rail. A growing toolkit needs stable scan positions
  more than another horizontal row of shrinking tabs. The first visible row is Home; no duplicate
  brand block sits above the tools.
- **Mobile navigation** is a compact top brand bar with a focus-managed tool chooser. The active
  workspace stays one column and no control is covered by fixed chrome.
- **Articles** are secondary contextual links from Home or the relevant tool entrance. They do not
  interrupt the primary task flow.

## Integration contract

- Every tool's source lives in this repository as its own top-level folder and adopts the design
  system at the source (`docs/design/DESIGN-SYSTEM.md`). Each tool ships a portable artifact that
  mounts as a same-origin, chrome-free task stage behind a stable Toolkit route, hiding its
  standalone chrome in embed mode.
- The shell owns navigation, the 56px breadcrumb header, and frame management. It may not rewrite a
  tool's logic, legal sources, result language, storage behavior, or export semantics.
- One Toolkit shell surrounds one open canvas. Meaningful task cards remain inside the canvas, but a
  tool may not wrap its entire workflow in a second bordered application card.
- `scripts/build-tools.mjs` stages each tool's built artifact and records provenance — source
  folder, artifact path, SHA-256 — in `public/tool-sources.json`. Editing a tool folder never
  silently changes `public/tools/`; restaging is deliberate and verified.
- New tools enter only through `docs/design/REVIEW-GATE.md`.

## Required views

1. Home
2. Redactorium
3. SafeSeed
4. Privacy Wizards Council
5. Build-A-Prompt
6. Objection Oracle

## Acceptance

- One local command starts the complete Toolkit.
- Direct links and browser back/forward restore the active view.
- Keyboard users can skip the navigation, reach every route, see focus, and receive focus at the
  active view after switching.
- The current route is announced with `aria-current` and does not rely on color alone.
- The mobile chooser traps and returns focus correctly, closes with Escape, and never covers the
  active task after selection.
- Home explains the five tools without generic trust or compliance theater.
- The desktop rail and mobile chooser use semantic Lucide icons beside complete visible tool names;
  the icons never replace the accessible labels. Redactorium uses an eraser, SafeSeed a sprout,
  Privacy Wizards a sparkling wand, Build-A-Prompt its code-message icon, and Objection Oracle the
  closest available Lucide ball silhouette.
- Home asks `What's on your desk today?`, uses the approved one-line practitioner promise, and keeps
  exactly one visible AF tile in desktop or mobile context.
- Home carries no category/status pills, and its full change history stays in one native bottom
  disclosure.
- Rectangular Toolkit surfaces and primary actions follow `TOOLKIT-CANON.md`, including the shadow on
  file-choice actions and equal-width paired toggles.
- SafeSeed, Build-A-Prompt, and Privacy Wizards Council use the full task canvas without a redundant
  standalone-app card, while their meaningful inner task and result cards remain intact.
- Across every embedded tool, Anton is display-only; Space Grotesk carries 22px task headings, 15px
  reading, and 15px desktop / 16px small-screen editable controls; Archivo carries 11px labels and
  14px action text; mono is reserved for 14px generated data/code. Repeated control rows have one
  optical size and a 44px height floor.
- Framed tools have no nested site header/footer, unexpected external request, double vertical
  scrollbar, clipped output, or document-width overflow.
- Redactorium file selection/sample flow, SafeSeed generation, Build-A-Prompt first build,
  Privacy Wizards Council first determination, and Objection Oracle five-answer ruling work in the
  integrated shell.
- Literal 1440x1000, 1034x917, 390x844, and 320x700 review finds no clipping, stranded copy,
  accidental dead space, hidden task action, or one-word final line in key interface copy.

## Release boundary

Private source control only. This shell may be committed and pushed to the private
`advokat-frida/the-toolkit` repository. No public release, website sync, Ghost change, deployment,
publication, DNS, analytics, or announcement is included.
