# Manifest

Status: reviewed private-repository candidate.

## Product files

- `public/index.html` - semantic Toolkit shell and Home view.
- `public/toolkit.css` - canonical AF square-shadow shell.
- `public/toolkit.js` - routing, persistent tool frames, focus, and mobile navigation.
- `server.mjs` - loopback-only static server.

## Generated integration files

- `public/tools/` - synchronized source-owned tool artifacts.
- `public/tool-sources.json` - source revisions, input hashes, output hashes, and licenses.
- `public/fonts/` - canonical self-hosted AF fonts.

Generated integration files are refreshed by `npm.cmd run sync`. Do not hand-edit them.

## Verification

- Style-bible receipt: passed for the `standalone-shell` family.
- Structural and provenance test: 1/1 passed.
- Static QA: 148/148 checks passed, including byte-for-byte parity for all six Toolkit font files,
  compact type tokens, small-screen control exceptions, and flattened embedded roots.
- Rendered QA: 464/464 checks passed, including computed family, exact semantic type steps,
  meaningful inner boundaries, first-control visibility, and responsive control geometry.
- Literal proof set: 41 Toolkit screenshots across 1440×1000, the reported 1439×726 CSS viewport at
  device-pixel ratio 2 (2878×1452 output), 1034×917, 390×844, and 320×700.
- Core flows exercised: Redactorium sample detection, SafeSeed generate/verify, Privacy Wizards
  decision path, Build-A-Prompt composer, Objection Oracle ruling, persistent tab state, and mobile
  focus-trapped navigation.
- No unexpected external requests, console errors, page errors, or horizontal overflow were found.

The final screenshots and machine-readable report are in `proofs/`.

### `manual_visual_verification`

- References: Ben's approved square-shadow variant in `docs/TOOLKIT-CANON.md`; the validated
  `docs/style-bible-receipts/advokat-frida-toolkit.json` style-bible receipt captured with this release;
  and the five user-supplied density, Home-cleanup, nested-shell, type-parity, and final-Home
  annotation captures used during the review. The source captures contain local workstation paths
  and are deliberately not committed; the exact runtime proof set below is committed.
- Exact runtime files opened at original resolution: `desktop-1440-home.png`,
  `desktop-1440-home-changelog-open.png`,
  `desktop-1440-redactorium.png`, `desktop-1440-safeseed.png`,
  `desktop-1440-privacy-wizards.png`, `desktop-1440-build-a-prompt.png`,
  `desktop-1440-objection-oracle.png`, `reported-1439x726-home.png`,
  `reported-1439x726-redactorium.png`, `reported-1439x726-safeseed.png`,
  `reported-1439x726-safeseed-fields.png`, `reported-1439x726-privacy-wizards.png`,
  `reported-1439x726-privacy-wizards-question.png`, `reported-1439x726-build-a-prompt.png`,
  `reported-1439x726-build-a-prompt-composer.png`, `reported-1439x726-objection-oracle.png`,
  `mid-1034-home.png`, `mid-1034-redactorium.png`,
  `mid-1034-safeseed.png`, `mid-1034-privacy-wizards.png`, `mid-1034-build-a-prompt.png`,
  `mid-1034-objection-oracle.png`, `mobile-390-home.png`, `mobile-390-navigation-open.png`,
  `mobile-390-redactorium.png`, `mobile-390-safeseed.png`, `mobile-390-safeseed-fields.png`,
  `mobile-390-privacy-wizards.png`, `mobile-390-privacy-wizards-question.png`,
  `mobile-390-build-a-prompt.png`, `mobile-390-build-a-prompt-composer.png`,
  `mobile-390-objection-oracle.png`, `narrow-320-home.png`,
  `narrow-320-navigation-open.png`, `narrow-320-home-changelog-open.png`,
  `narrow-320-redactorium.png`, `narrow-320-safeseed.png`, `narrow-320-privacy-wizards.png`,
  `narrow-320-build-a-prompt.png`, `narrow-320-objection-oracle.png`,
  and `narrow-320x568-safeseed-fields.png`.
- Native/runtime display sizes: 1440×1000 desktop, 1439×726 reported desktop at device-pixel
  ratio 2, 1034×917 intermediate desktop, 390×844 mobile, and 320×700 narrow mobile.
- In-product context: the exact synchronized artifacts were reviewed inside the running Toolkit
  shell, including the persistent side rail, mobile tool chooser, parent tool headers, task panes,
  native controls, and long-content scroll states.
- Visible observations: Home now opens with the exact `ADVOKAT FRIDA` / `THE TOOLKIT` hierarchy,
  the one-line practitioner promise, and `What's on your desk today?`. The desktop brand cap is
  gone, the tool list begins at the top of the rail, and the square AF tile sits at the right edge of
  the Home header. Mobile keeps one AF tile in its top bar and does not repeat it in the Home body.
  The announcement, category eyebrow, badge, sidebar filler, maintenance block, launcher pills, and
  publication explainer are absent. Six consistent Lucide line icons use house, eraser, sprout,
  wand-sparkles, message-square-code, and the closest available ball silhouette. All five launchers and their 4px
  shadows are visible together at 1439×726, 1034×917, 390×844, and 320×700; the secondary links
  retain 16px of measured clearance from the adjacent primary-button box and a 44px target height.
  The compact full-width `Changelog` is the sole bottom card, carries no maintenance tagline, opens
  and closes from the keyboard, and keeps its border and offset shadow at 320px. At the reported viewport, the parent tool header is 83.4px
  and each tool receives 642.6px (88.5%) of the viewport. Parent descriptions collapse on mobile so
  the first useful control stays visible. SafeSeed's `.gen-panel`, Privacy Wizards' finder and
  determination shells, and Build-A-Prompt's `.start-stage` are neutral full-width layout
  containers rather than duplicate cards; meaningful drops, choices, questions, reviews, and
  results retain their boundaries and square shadows. Anton remains a compact nameplate. The shared
  working hierarchy is Space Grotesk 22/18/16/15/13, Archivo 14/12/11, and 14px monospace for data;
  small-screen editable controls remain 16px to prevent focus zoom. SafeSeed field names and field
  types now have equal optical metrics. Primary controls remain at least 44px, the file chooser
  shadow is present, paired modes remain equal-width, navigation is unambiguous, headings are not
  cropped, borders remain intact, and there is no horizontal spill. The Oracle's theatrical ball
  remains intentionally round.
- Animation frames: not applicable.
- Result: **PASS**. A reasonable viewer can recognize one coherent Advokat Frida Toolkit while each
  source-owned tool remains distinct and fully usable at every reviewed size.

## External-state boundary

Authorized target: the private `advokat-frida/the-toolkit` repository. No public release, website
sync, Ghost change, theme deployment, publication, DNS, analytics, or announcement is included.
