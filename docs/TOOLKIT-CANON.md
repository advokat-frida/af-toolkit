# Advokat Frida Toolkit visual canon

This is a scoped application-shell extension of the Advokat Frida canon. It governs the Toolkit
shell, Home view, navigation, cards, panels, paired toggles, and primary actions. It does not redesign
Advokat Frida articles, the Ghost theme, or unrelated publication families.

## Foundation

- Display: Anton, self-hosted.
- Interface and headings: Space Grotesk, self-hosted.
- Labels and metadata: Archivo, self-hosted.
- Toolkit body text: 15px minimum. Secondary explanation: 13px minimum. Metadata: 11px minimum.
  Editable controls return to 16px on small screens to prevent browser focus zoom.
- Ink: `#16140f`.
- Soft ink: `#4a463d`.
- Paper: `#fffdf8`.
- Ground: `#f6f4ef`.
- Forest: `#1f4e32`.
- Teal: `#12666a`.
- Indigo: `#3a3a8c`.
- Amber: `#9e5415`.
- Red: `#c83232`.
- Amber wash: `#fbf4ea`.

## Square-shadow extension

- Rectangular cards, panels, navigation blocks, inputs, file actions, and primary buttons use
  `border: 2px solid #16140f` and `border-radius: 0`.
- Raised cards and primary actions use a solid `4px 4px 0 #16140f` offset shadow.
- Pressed controls translate by `4px 4px` and remove the shadow. Hover may translate by at most one
  pixel. Layout must not jump.
- The file-choice action receives the same shadow as every other primary action. A native unstyled
  file button is not an exception.
- Paired mode toggles share the available width equally. Label length never determines tab width.
- Compact semantic tags inside an active tool may retain full rounding when their shape carries
  meaning. Home launcher cards do not carry category or status pills. Rectangular work surfaces may
  not become pills.

## What Redactorium contributes

- Tactile square work surfaces.
- Clear file-first action hierarchy.
- Solid offset shadows that make controls feel physical.
- Compact tool-mode switching.

## What stays out

- Alfa Slab, DM Serif, and Inter as the Toolkit font stack.
- The yellower paper palette.
- Global grain or noise overlays.
- Heavy, multi-layer, blurred, or decorative shadows.
- Rounded cards, soft SaaS panels, gradients, and card soup.

## Shell rules

- Desktop uses a persistent left rail and one active task stage. The rail begins directly with the
  tool list; it has no separate brand cap, lockup box, or empty header strip.
- Mobile uses a compact top bar and a focus-managed chooser.
- Navigation is stable across tools; tool-specific controls remain inside the task stage.
- Home contains one short orientation, five direct tool entrances, and one closed, full-width
  Changelog at the bottom. It carries no announcement card, publication explainer, local-build
  status block, or other maintenance furniture.
- One primary action per decision zone. Secondary article links remain visually secondary.
- The Home orientation reads `ADVOKAT FRIDA` / `THE TOOLKIT` / `The privacy practitioners swiss army
  knife.` The tool question is `What's on your desk today?`; it carries no category eyebrow.
- The square AF tile sits at the right edge of the desktop Home header. On narrow screens the Home
  copy does not repeat it because the compact mobile brand bar already carries the tile.
- The navigation boxes use locally vendored Lucide Static 1.31.0 line icons: house, eraser, sprout,
  wand-sparkles, message-square-code, and circle-dot. Lucide has no native 8-ball or crystal-ball
  glyph, so circle-dot is the closest ball silhouette for Objection Oracle. Icons remain
  decorative beside complete visible text labels; no CDN or icon runtime is allowed.
- The closed Changelog summary is one compact `Changelog` label plus its state cue. It does not add
  a second maintenance tagline or grow into a promotional card.
- Secondary links beside the shadowed primary button keep at least 16px of visible horizontal
  clearance and a 44px-tall target.
- Motion is brief and functional, and reduced-motion preferences remove non-essential transitions.
- Generic legal, privacy, licensing, trust, or accountability disclaimer stacks are prohibited.
  Show an action-local boundary only when it changes the next action.

## Application density

- The Toolkit is a workbench, not a campaign page. Anton supplies short nameplates and hierarchy; it
  must not consume the working viewport.
- Home borrows the live site's display face but uses a pocket-workbench scale: the main Anton title
  is 42px on desktop and 30px on mobile. Home tool-card titles are 18px on desktop and 16px on
  mobile, keeping the impact without making the tool chooser feel promotional.
- At a 1440×726 CSS viewport at 100% browser zoom, Home shows all five tool names, job descriptions,
  and primary entrances without scrolling. The desktop navigation rail stays near 220px.
- A tool's shared parent header stays at or below 100px on desktop so the active controls own the
  screen. The first useful control inside every tool must be visible when its tab opens.
- Home uses compact sibling cards, three columns at ordinary desktop widths, without fixed
  promotional card heights. Change history stays available in the bottom disclosure and never leads
  the visual hierarchy.
- Compactness comes from shorter orientation, tighter gaps, fewer repeated words, a one-step-smaller
  role scale, and better grid use. Never use CSS zoom/scale or reduce core copy below 15px, helper
  copy below 13px, metadata below 11px, or touch targets below 44px. Small-screen editable controls
  remain 16px to avoid focus zoom.
- On mobile, preserve one-column task flow and the 44px target floor. Reduce decorative display
  type, blank space, and repeated descriptions before hiding a useful action or instruction.

## Embedded canvas contract

- The Toolkit shell is the only application shell. Its rail, tool header, and task canvas already
  establish the product boundary; an embedded source tool may not repeat that boundary as one giant
  paper card.
- In Toolkit mode, a source tool's standalone root wrapper becomes a neutral layout container:
  full available width, transparent background, no structural border, no offset shadow, no inherited
  max-width, and no duplicate outer padding. The iframe canvas supplies consistent 20–24px desktop
  gutters and 10–12px mobile gutters.
- Preserve cards that communicate a real unit of work: a file drop, recipe picker, wizard choice,
  current question, source layer, result, receipt, or other bounded task. Removing the whole-app card
  is not permission to erase useful grouping inside the tool.
- SafeSeed's `.gen-panel`, Build-A-Prompt's `.start-stage`, and Privacy Wizards Council's
  `.finder-stage` / `.determination-shell` are root wrappers in Toolkit mode and therefore flatten.
  Objection Oracle's question panel remains because it is one meaningful half of the tool's two-zone
  stage rather than a duplicate application shell.
- Apply this presentation through generated Toolkit adapters. Standalone source artifacts keep their
  own full-page chrome and remain authoritative for behavior, data, storage, decisions, and exports.

## Toolkit type hierarchy

- **Display nameplate:** Anton appears only in the shared Toolkit/tool nameplate, at 38–42px desktop
  and 26–30px mobile. Anton never labels fields, buttons, cards, or results.
- **Task heading:** Space Grotesk 22px / 700. **Section heading:** Space Grotesk 18px / 700.
  **Card or choice title:** Space Grotesk 16px / 700.
- **Core reading:** Space Grotesk 15px with a 1.5–1.6 line height for instructions, questions,
  warnings, decisions, and results. **Secondary explanation:** Space Grotesk 13px / 1.5.
- **Editable controls:** Space Grotesk 15px / 400 on desktop and 16px / 400 on small screens for
  text inputs, textareas, selects, and option content. Related controls in one repeated row use the
  same family, size, line height, and 44px minimum height. Editable identifier names do not switch to
  monospace merely because they contain underscores.
- **Actions:** Archivo 14px / 700 for primary and secondary action buttons. **Labels and eyebrows:**
  Archivo 11px / 700 uppercase. **Status pills:** Archivo 12px / 600. Monospace is reserved for
  generated data, code, hashes, and portable receipts at 14px; it is not a general interface face.
- Tool-specific semantic color survives normalization. Type scale and role do not drift by tool.
  A select value may not visually outrank the field name it describes, and a metadata pill may not
  compete with the task heading.

## Canon relationship

The broader standalone family currently uses 4px radii for rectangular surfaces. Ben selected this
0px square-shadow variant for the Toolkit on 2026-08-27. That explicit product decision controls this
surface only. Canonical AF colors, typography, structural borders, accessibility rules, and editorial
voice remain unchanged.
