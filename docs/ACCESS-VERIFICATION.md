# Dispatch access: release readiness and pending activation

> **Newer activation work:** Ben has now authorized enabling subscriber gating.
> [ACCESS-ACTIVATION-2026-10-05.md](ACCESS-ACTIVATION-2026-10-05.md) is the current
> candidate and deployment record. The repair and preparation records below
> preserve their original scope and do not override that newer authorization.

> **October 5, 2026: repair deployed; native email sign-in verified.** Current
> source commits, active Worker versions, CI, live browser/HTTP evidence, rollback,
> and remaining limits are in [ACCESS-PATCH-2026-10-05.md](ACCESS-PATCH-2026-10-05.md).
> Toolkit remains setup and Guide public. Existing signed-in handoffs to both sites
> pass, and the live public key is mathematically RSA-2048. Ben completed email
> sign-in for the existing unsubscribed test account; the safe target survived and
> the subsequent handoff correctly denied a member session. Subscribed email and
> actual new-tab email-link returns remain untested. Subscription, key,
> security-setting changes, and gating activation remain excluded. All sections
> below describe the earlier release and must not override the October 5 report.

## Historical preparation and October 1 release record

Prepared September 30, 2026. Ben subsequently authorized deployment and ended the
OpenAI collaboration hold. **The access infrastructure and Guide URLs are deployed,
but the subscriber gate is still off because native Ghost sign-in fails the key-strength
check. Both applications remain public.** This was the October 1 status; the
October 5 report above supersedes it.

## Authorized release: October 1, 2026 UTC

- Toolkit source was fast-forwarded to current `origin/main` (`43f9890`) before release,
  preserving the September 30 export and recipient fixes. The access changes remain
  uncommitted in the isolated worktree; no source-control or tracker closeout occurred.
- Toolkit version `e1a8baff-6b00-461e-afa8-eaf63dbcc084` runs the access entrypoint in
  explicit `ACCESS_MODE=setup`. Application bytes remain public; native sign-in and
  signed webhook endpoints are enabled for release verification. Normal `public` mode
  continues to disable authentication endpoints and RPC.
- Guide version `59dec40c-0c09-4e75-b0aa-ae763a3437dd` runs `worker.gated.mjs` with
  `ACCESS_MODE=public`, its private `DispatchAccess` service binding, and all static
  requests routed through the Worker. `/comics/`, `/posters/`, and pagination are live.
- The Toolkit has both SQLite Durable Objects, the rate limiter, and the three required
  server-side secrets. Worker dev/preview hostnames are disabled in these release configs.
- Ghost page `/dispatch-access/` is published using `custom-dispatch-access`.
  The live theme was downloaded before upload. Every existing theme file was retained
  byte for byte; only the three access files were added. The integration token cannot
  upload/list themes (403), so the existing signed-in Ghost admin uploaded and activated
  the preflight-checked package through the native UI. The original theme ZIP is retained
  privately for rollback. No existing Ghost membership setting or newsletter was changed.
- Signed Ghost `member.edited` and `member.deleted` webhooks are installed. The native
  test member's unsubscribe event reached `/_access/webhook` and returned **204**, confirming
  the real signature and payload shape. An unsigned request remains rejected.
- The disposable test account completed native emailed-code
  sign-in in Chrome. The real callback initially returned **503** on the strict identity-key
  check. The handler now returns a safe fixed-origin redirect to `result=keys`; live Portal
  and the bridge display "Ghost is updating sign-in. Please try again later."
- An uncached JWKS response still lists RSA-1024 kid
  `u4WjRqsaNT7OefG-pes2SbIxpqkcvqUvKp90nveabGU` first (active) and RSA-2048 kid
  `oNfanoXzSdmSSS2yfu2F7rVWNQJppXr4rTa4YwB26Rs` second (pending). The verified
  installed version is `6.68.0-rc.0+96f3a6f`. Its pinned source publishes the next key
  for 48 hours before using it. We have not changed keys, reset authentication, or
  lowered the verifier's 2048-bit minimum.
- The test account is left **unsubscribed**. Ben's regular Dispatch subscription is untouched.
- Verification: 34 existing Toolkit tests, two new real-workerd setup regressions,
  37 cross-site fixture checks, bridge browser QA, and Guide's 12 tests pass. Guide live
  verification matches 24 generated/source/search files and checks all 102 original
  artwork URLs, representative exact artwork hashes, and the unchanged fox.
- Live Guide desktop and 390-by-844 phone views were inspected directly. The phone
  collection uses one column, its pagination and section controls remain usable,
  visible images load, and there is no horizontal document overflow. The temporary
  viewport override was reset after review.
- The Chrome disposable-member session was signed out after the unsubscribe test;
  the bridge again shows its guest Subscribe and Sign in controls. The isolated
  in-app test session is retained only for the pending strong-key verification.
- Website live preflight passes with one expected warning about the new per-file asset
  pins. Fetching both actual Ghost-rendered versioned URLs confirms exact CSS/JS hashes,
  so those assets are current. The Den and the other existing member page remain gated.

**Still required:** Ghost's active key must reach 2048 bits; then real identities, both
site sessions, direct protected requests, production cache behavior, edge latency, and
unsubscribe revocation within 60 seconds must pass before enabling `ACCESS_MODE=gated`.
Promote the intended configs into the normal release workflow at that switch, retaining
the Durable Object exports/migration history for a safe public-mode rollback.
Ben authorized sending the revised support request from his email account to
`support@ghost.org`. It was sent October 1, 2026 at 6:30 p.m. Pacific, with Ghost
documentation, version-specific source links, and the completed checks. Gmail
readback confirmed the sender, recipient, exact approved body, and Sent status.
The message/thread receipt is retained privately with the release artifacts.

## Candidate locations

All product edits are uncommitted in isolated, detached worktrees under
`C:/Users/Ben/.codex/worktrees/af-subscriber-access/`:

| Repository | Base | Work |
| --- | --- | --- |
| `af-toolkit` | `43f9890` | Shared access service, Toolkit gate, synthetic tests |
| `af-survival-guide` | `59c6843` | Crawlable collections, Guide gate, unchanged artwork |
| `website` | `301b6e3` | Future Ghost access-page template, styles and script |

The worktrees are registered in the parent workspace's `hygiene.mjs`. That small
registration preserves its pre-existing changes. Primary product checkouts and
unrelated website work were preserved. Initial preparation made no commits,
pushes, Ghost writes, member changes, emails, deployments, or Notion status
changes. The authorized account-only follow-up below records the later test
signup and subscription changes. See the authorized release section for the later
theme, page, infrastructure, and Guide deployment.

The existing discovery task is [AF-25: Give Survival Guide content crawlable URLs
and verify search discovery](https://app.notion.com/p/3eb0f293ed9d81f5b0bec4cd173d986e).
The collection-URL release and live source verification are complete. Sitemap submission
and Search Console/Bing discovery verification remain outstanding; the tracker is unchanged.

## Behavior prepared

- Guide public mode has 16 initial-HTML pages: home, five comic pages and ten poster
  pages. Collection and pagination links work without JavaScript. Each URL has its
  own title, description and canonical, with a sitemap and robots file. Browser
  back, reload, keyboard navigation and the existing viewer work after enhancement.
- Future access requires a verified Ghost identity and the specific active Dispatch
  newsletter subscription. A free Ghost member record alone is insufficient.
- Ghost membership permissions live for at most 60 seconds, measured from the start
  of the lookup. A signed member webhook invalidates them sooner. A failed refresh
  denies protected requests. Already delivered tools, images and downloaded copies
  cannot be recalled; publicly available source repositories are outside this gate.
- Sessions are signed, HttpOnly, Secure and host-only. Browser-bound, single-use
  tickets transfer login between the Ghost bridge and the requesting site. A cookie
  for one site cannot authorize the other. Ghost may let the reader complete the
  second site's sign-in without another email, but there is no parent-domain cookie.
- Protected files are checked before delivery, including direct URLs and alternate
  hosts. Protected responses disable shared/browser caching and validators. Public
  descriptions and explicitly selected art samples remain accessible to everyone.
- Ordinary `wrangler.jsonc` configurations do not import or bind the access service.
  `wrangler.gated.jsonc` is a separately named future configuration in each app.
  Guide SEO work can be released independently while both sites remain public.

## Verification performed

| Check | Result and limit |
| --- | --- |
| Toolkit `npm run gate` | Passed design, syntax, 33 tests at that run, 137 static checks, four viewport checks, 16 state proofs and style census. Later access changes received targeted checks. |
| Toolkit access unit tests | Identity signature/issuer/scope/expiry, exact subscription, permission expiry, stale-refresh fencing, webhook signature, direct paths, return URLs and public mode passed. |
| Final Toolkit checks | 34 tests, design gate, syntax check and diff whitespace check passed after the last code change. |
| Real Durable Object lifecycle regression | Passed in workerd with SQLite: permission checks, state claims and ticket consumption still work after alarm cleanup in the same instance. |
| `npm run qa:access` | 37 synthetic Worker/RPC/Durable Object checks passed, including both-site login, CSRF, replay, wrong browser, wrong cookie audience, unsubscribe invalidation and outage denial. No real Ghost member was modified. |
| `npm run qa:access:bridge` | Exact new Ghost script/body handles unsigned-in state, posts identity to the fixed callback, consumes state, and keeps identity out of URLs and browser storage. No email sent. |
| Guide `npm run check` | 12 tests passed; all 102 original artwork hashes matched. Initial HTML and sitemap entries verified for every collection page. |
| Native Wrangler static-assets routing | Local public Guide and both future gated configurations exercised. Anonymous previews/CSS returned 200; direct protected tool/catalog requests returned 401. This supplements the synthetic asset binding. |
| Expanded Guide release verifier | Passed against local Wrangler: all 16 pages, six runtime/style/catalog files, sitemap, robots file and 102 artwork URLs. Encoded preview storage paths normalize to the blocked canonical path; unknown collection pages return 404. No public page sets an access cookie. |
| Future configurations | Both Wrangler dry runs bundled successfully; no deployment performed. |
| Browser QA | Nine enhanced widths from 320 to 1440, four no-JavaScript widths, pagination/reload/back, viewer keyboard/focus, 37 candidate captures. No horizontal overflow, broken visible images or Guide page errors. |
| Theme preflight and style receipt | Static preflight and `af-style-bible-audit --slug=subscriber-access` passed. Ghost template has not been uploaded or rendered by a live Ghost server. |
| Dependency audit | No reported vulnerabilities after updating the local Wrangler dependencies. |
| Independent review | Two defects fixed: exact Ghost `/members/api` issuer/audience and SQLite-preserving alarm cleanup. Reviewer found no remaining access bypass in the reviewed candidate. |

The integration harness runs real Worker/RPC/Durable Object code but substitutes
Ghost and asset fetches. Native Wrangler tests separately cover actual static asset
routing. A recent local warm protected request measured about 9 ms median / 12 ms
p95, including the local response. This is **not a production latency measurement**.

## Readiness follow-up: September 30, 2026

Ben authorized a disposable plus-alias test account, Ghost sign-in emails, a
temporary Dispatch subscribe/unsubscribe/resubscribe cycle, and coordination with
his main Frida chat for those emails. The existing credentials were checked before
asking him to supply anything:

- The existing Ghost Admin API credential works. The Dispatch is active with the
  expected newsletter ID. The local Ghost admin browser is already signed in.
- Cloudflare OAuth is signed in to the Ducket account with Worker permissions.
  Both live Workers' secret-list requests succeeded and returned empty lists. The
  access-service secrets have not been installed.
- Native Ghost Portal signup sent its confirmation email. Only the matching test
  email was opened in Ducket Gmail; its link was followed in the same in-app
  browser that started signup. Portal then showed the correct test account.
  Login links and tokens were kept out of ordinary chat output and repository files.
- The real account subscribed to The Dispatch, unsubscribed through native email
  preferences, and resubscribed. Ghost reads returned `subscribed: false` and no
  newsletter relation after unsubscribe, then `subscribed: true` and the active
  Dispatch relation after resubscribe. The candidate's eligibility function returned
  false and true respectively.
- After the cycle, the disposable account was left unsubscribed to end the temporary
  newsletter subscription. A final read using the candidate's actual Ghost helper
  and `Accept-Version: v6.0` succeeded and confirmed access eligibility was false.
  The test member record remains for future login checks. Ben's regular member
  subscription was not used as a test.
- The live Ghost config reports `6.68.0-rc.0+96f3a6f`. The public JWKS still listed
  a 1024-bit key first and a 2048-bit key second; that response had a cache age of
  about 3.7 hours and a 24-hour maximum age. A real member identity signature has
  **not** yet been checked against either key. Direct browser navigation to the
  session endpoint was blocked by the browser client; this does not establish the
  server's cause or prove which key is currently signing.

These checks prove native signup/login and the real subscription fields consumed
by the candidate. They do not prove the cross-site bridge, live Worker sessions,
webhook delivery, edge caching, or the 60-second production revocation bound.
The next integration prerequisite is completing real identity verification from
the Ghost access-page context. Both public sites remain open.

## manual_visual_verification

Evidence is local and ignored under
`af-toolkit/.local-working/dispatch-access/`. The exact opened files, dimensions
and hashes are recorded in `docs/verification/subscriber-access-visuals.json`.

References opened: the live Guide home and Ghost Den at 1440 and 390 pixels.
Candidate captures were opened individually at their captured viewport dimensions,
including 320, 390, 719, 720, 768, 959, 960, 1034 and 1440 where applicable.
There is no animation or new artwork in this change.

Visible observations:

- Guide home retains the live forest header, cream dotted background, fox, peacock
  hero and tilted art composition. Desktop and phone proportions match the reference.
- Comics remain uncropped landscape originals; posters retain full portrait framing.
  The new introductory text wraps cleanly. Pagination controls and collection labels
  fit at 320 pixels. Gallery columns change at the existing responsive thresholds.
- The viewer keeps the entire robot panel and maker's mark visible. Close, navigation
  and download controls remain separate on phone; keyboard focus returns to the art.
- With JavaScript disabled, section links wrap into a taller visible header. All
  sections remain reachable and pagination navigates to real HTML pages.
- Toolkit's future preview uses the existing fox, Anton uppercase heading, cream
  background, bordered cards and forest primary button. Buttons stack on phones;
  the header wraps at 320 pixels without clipping.
- Guide's future preview shows three labeled samples from the full collection,
  with the full collection count. It contains no hidden full catalog or app runtime.
- The future Ghost page has distinct signup/sign-in buttons and a minimum 44-pixel
  Continue control. Subscription-required copy directs readers to email preferences.
  The exact new body/CSS/script was tested in representative existing theme chrome.
  That fixture omits the live announcement, uses simplified navigation/footer and
  does not load Portal; full Ghost-rendered chrome and emailed sign-in remain launch QA.

**PASS for the local app pages and new bridge body.** Ghost publication, Portal and
production caching remain unverified. No claim is made that all 102 source images
were visually re-reviewed; their unchanged bytes were verified, and visible gallery,
home and viewer examples were inspected in product context.

## Required before any future activation

Ben has authorized activation. The current hold is the verified Ghost identity-key
prerequisite, not missing release permission. Complete the remaining real-member
checks below under that authorization once Ghost finishes its supported rotation.

1. Verify Ghost's active signing key and an authorized real member identity. The live
   JWKS inspected during this work listed a 1024-bit RSA key first and a 2048-bit key
   second. Ghost's source orders the active key first, so a legacy signing key appears
   to remain active. The verifier intentionally rejects keys below 2048 bits. Resolve
   rotation through the appropriate Ghost administration/support path, then verify a
   real token's RS512 signature, `members:identity` scope and exact issuer/audience
   `https://advokatfrida.com/members/api`. Do not weaken validation to pass a test.
2. Review/integrate the three candidates against current branches. Recheck Ghost's
   Dispatch ID (`6a2b163946abeb0008d5380b`) and the current Worker/domain routing.
   The verified Ghost version during preparation was 6.68; APIs may change before launch.
3. Install the future theme files and create the `/dispatch-access/` Ghost page using
   its custom template. Test native Portal signup, existing-member sign-in, email
   return in the same browser, preferences, timeout/retry and both destinations.
4. Configure only server-side secrets: `GHOST_ADMIN_API_KEY`, a cryptographically random
   `SESSION_SECRET` with at least 256 bits of entropy, and `GHOST_WEBHOOK_SECRET`.
   Bind the two SQLite Durable Objects, rate limiter and Guide's private service binding.
   No production secret values are present in these candidates.
5. Configure signed member-change/deletion webhooks to the Toolkit access endpoint.
   Prove that Dispatch unsubscribe/resubscribe updates cause invalidation. The 60-second
   refresh limit is still required even when webhooks are delayed or unavailable.
6. Test an explicitly authorized account end to end on both hosts. Confirm anonymous
   previews, direct protected URLs, encoded paths, HEAD/conditional requests, alternate
   hosts, CDN/browser cache behavior, replay denial and same-browser email completion.
   Measure real edge latency and verify access ends within 60 seconds after unsubscribe.
7. Only then activate the future configurations under explicit release authority.
   All static requests must run through the Worker. Disable unwanted alternate/preview
   hosts; do not give crawlers a different authenticated body. Gated Guide indexing
   covers home and the two useful public collection previews, rather than private pages.
8. Verify a reversible public-mode configuration before activation. Once Durable Objects
   exist, retain their exports, bindings and migration history when disabling the gate:
   use the gated entrypoints with `ACCESS_MODE=public`. Do not assume redeploying the
   old entrypoint can safely remove live Durable Object classes. Promote the intended
   deployment configuration into the release workflow during the authorized switch.

Primary protocol references: [Ghost member identity configuration](https://github.com/TryGhost/Ghost/blob/main/ghost/core/core/server/services/members/members-config-provider.js),
[Ghost identity tests](https://github.com/TryGhost/Ghost/blob/main/ghost/core/test/unit/server/services/members/members-api/services/token-service.test.js),
[Ghost signing-key ordering](https://github.com/TryGhost/Ghost/blob/main/ghost/core/core/server/services/signing-keys/signing-key-service.ts),
[Ghost webhooks](https://docs.ghost.org/webhooks/),
[Cloudflare static asset routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/).
