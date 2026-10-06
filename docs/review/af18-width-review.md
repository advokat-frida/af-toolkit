# AF-18 width review — approved candidate, October 5, 2026

Status: Ben approved this exact reviewed layout and its release on October 5, 2026. His “af-18 approved” reply in the coordinating chat authorizes integration through existing PR #26, commit/push, clean merge, Toolkit deployment, live verification, and AF-18 closeout. This approval excludes access activation, AF-19 metadata, and PR #27. The release receipt belongs in the existing AF-18 task after production verification.

## Candidate and provenance

- Existing task: https://app.notion.com/3e50f293ed9d819eb8b2e6957f0d9ae0
- Existing PR: https://github.com/advokat-frida/af-toolkit/pull/26 — original head `b1fbbf561cd998b32901eb05b40fd34ee3a32354`, branch `claude/af18-toolkit-width`. Its original recorded checks succeeded; no GitHub human review was recorded. This approved integration updates that same PR.
- Reviewed base: `354af903e720b115862793cd2a1e599a45087215`. Includes the released AF-22 Word-link/place repair and the recent access fixes. Remote main was rechecked at this exact base after approval.
- Local branch: `codex/af18-width-integration`.
- Checkout: `C:/Users/Ben/.codex/worktrees/af18-width-review/af-toolkit`.
- Canonical public-tree SHA-256: `eb4528bf8d494b56a99fe66b3c9cff02455a1e1d2ab936500223c36d50a7b4a7`. The recipe and 51 file hashes are in `.local-working/af18-review/candidate-identity.json` and `identify.mjs`.

The original source patch was applied to a new worktree based on current main. Generated output was rebuilt from the actual tool folders. The parent's detached checkout and other preserved worktrees were not modified. No second PR, task, or goal was created. PR #27 and its `/wizards` route change are excluded.

The task explicitly permits a max-width solution and says to keep the left rail. The older PR handoff's phrase “Trade-off, accepted” is historical agent evidence. Release authority is Ben's October 5 reply, independently verified in the coordinating chat, after review of this current-main candidate.

## Result

Tools keep the 1130px base working column and Home keeps 1000px. Existing large-display zoom steps remain. SafeSeed and SafeList fit every preview column except the final column to its contents plus a 24px base gutter. The final column absorbs the remaining width. The left rail, tool routes, access code/configuration, data logic, and AF-22 code/tests are unchanged from main.

The source behavior is PR #26's existing approach. Integration preserves the newer SafeList review-region overflow fix from main. Two small documentation adjustments accompany it: the changelog is dated October 5, and the Home card description now correctly says the capped layout holds three columns instead of claiming five or six on a wide screen.

## Measurements

Both versions used the same 100-row, five-column UK contacts preset and seed 1. Gaps below are the distance remaining after the widest value/header in each non-final column. Numbers are rendered CSS pixels after zoom.

| Viewport | Main tool width | Candidate tool width | Main gaps | Candidate gaps | Candidate preview scroll |
| --- | ---: | ---: | --- | --- | ---: |
| 2560 | 1820 | 1469 | 137–185 | 31.2, even | 0 |
| 1920 | 1557.6 | 1333.4 | 110–148 | 28.3, even | 0 |
| 1440 | 1130 | 1130 | 65–86 | 24, even | 0 |
| 1034 | 804 | 804 | 17–18 | 24, even | 20 |
| 390 | 390 | 390 | 14, even | 24, even | 390 |
| 320 | 320 | 320 | 14, even | 24, even | 460 |

The eight-column SafeList sample needs 182px of inner scrolling at 1920 (main: 0), and 183px at 1440 (main: 113). These are scrollable preview regions, not document overflow. Data text hashes match between main and candidate at all six sizes. Rail widths match at every size. The complete measurements, keyboard outcomes, and zero page-error result are in `.local-working/af18-review/responsive-evidence.json`.

## Verification

All commands below exited 0 in this integration checkout:

- SafeSeed demo `build:standalone:generator` and `verify:chrome`.
- SafeList `npm run check`: 28 tests, build, and sample verification.
- Privacy Wizards `npm run check`: 75 tests, style audit, build, and artifact verification.
- Redactorium frontend `npm run lint` and `npm test`: 94 tests, including the current AF-22 coverage.
- Root `npm run build:tools:full`: all four tools rebuilt and staged with provenance.
- Root `npm run gate`, repeated after the final documentation/changelog adjustment: 41 shell tests, 137/137 static checks, rendered QA at 1440/1034/390/320, all 16 state proofs, unchanged style census.
- Additional responsive comparison: 24 measured preview cases across main/candidate and six widths; keyboard reaches both previews and scrolls them; no shell/frame horizontal overflow or browser page errors.
- `git diff --check`.

Logs are in `.local-working/af18-review/`. The final root gate log is `toolkit-gate-final.log`; the additional run is `responsive-qa.log`.

Direct visual review covered all 16 regenerated state screenshots, SafeSeed five-column output at 2560/1920/1440/1034/390/320, SafeList eight-column output at desktop/intermediate/mobile, and Home, Redactorium, and Wizards at 2560. Eleven state screenshots are byte-identical to current main. The two changed preview states are byte-identical to PR #26's corresponding proofs. Home differs by the changelog date; Redactorium's record contains its per-run random hash. The source review found only the intended width/gutter changes plus the two documentation adjustments.

Manual browser review additionally verified a visible focus outline around the mobile SafeSeed preview, ArrowRight scrolling within it, and mobile chooser Escape returning focus to Tools. No physical phone, Safari, or Firefox run is claimed.

Observed baseline limitation: SafeList's existing media rule wraps some preview fields when the frame is at most 860px, despite the design document's general no-wrap wording. It occurs in both main and this candidate and was left unchanged; it is not evidence of new clipping or lost data in AF-18.

Live output was read, not changed. The shell, CSS, JS, source manifest, and all four tool entry documents match current main after removing only the observed Cloudflare-injected hidden `cdn-cgi/content` link from HTML. CSS, JS, and source manifest match without that normalization. Raw and application hashes, URLs, and timestamps are in `live-parity.json`. `wrangler.jsonc` still has `ACCESS_MODE: setup`; no Guide files or settings were touched.

## Visual references

Full-size PNGs in `.local-working/af18-review/screens/`:

- `main-1920-safeseed-five.png` and `candidate-1920-safeseed-five.png`: primary before/after.
- `candidate-2560-safeseed-five.png`: very wide composition.
- `candidate-1034-safeseed-five.png`: 20px inner-scroll tradeoff.
- `candidate-390-safeseed-five.png` and `candidate-320-safeseed-five.png`: phone layouts.
- `candidate-1920-safelist-eight.png`: wider file scrolling inside the cap.
- `candidate-2560-2a-home.png`: left-aligned Home with unused ground on the right.

Standard current-candidate screenshots remain in `proofs/` and `proofs/states/`.

## Approval and release verification

Ben approved the 1130px/1000px caps and 24px preview gutter on October 5, including the documented additional inner scrolling and the open right side of Home at very wide sizes. The reviewed public tree remains frozen at the hash above.

The original PR's source changes have already been ported onto current main and regenerated. Preserve the original PR's ancestry while keeping this reviewed integration tree; do not restore its older generated assets or force-rewrite the remote branch. AF-22 and the existing access configuration remain protected.

Before merge, require the current PR checks, recheck main ancestry, and verify the approved public hash. After deployment, compare production files and inspect the five-column layout at desktop and phone widths. Mark AF-18 Done only after those live checks pass; record the merge SHA, deployment version, and live evidence in its existing task. No access activation or other release is part of AF-18.

Ben separately authorized a bounded SafeSeed build-dependency repair on October 5 after the fresh CI audit blocked release. Both SafeSeed lockfiles now use source-map-js 1.2.2. The demo uses a local, MIT-attributed copy of the existing single-file inliner with its unused glob-matching option removed, eliminating the micromatch/braces dependency chain. Audits are not weakened. The hosted build, all four standalone outputs, 127 core tests, six CLI checks, five Action checks, and release-alignment checks pass; compiled core and standalone artifact bytes remain identical to the approved candidate. The public-tree hash above is unchanged. This is build-dependency remediation; no browser-upload exposure was established.
