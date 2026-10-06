# Ghost access repair — October 5, 2026

**Release authorized; deployment pending.** Ben first approved local inspection,
implementation, and testing directly in this chat after review of the earlier
forwarded-approval rejection. After the local report, Ben explicitly requested
**tuck** on October 5, authorizing the scoped review, source closeout, coordinated
deployment, live verification, and continuity records. Toolkit must remain `setup`
and Guide `public`. Gating activation, subscription changes, keys, and security
settings remain excluded. This report supersedes older readiness statements.

## Location and preservation

Actual root: `C:\Users\Ben\.codex\worktrees\af-subscriber-access` (the supplied
`C:\Users\Ben.codex\...` path was missing the separator before `.codex`).

| Worktree | Detached base | Candidate responsibility |
| --- | --- | --- |
| `af-toolkit` | `43f9890` | Shared Worker/RPC, transactions, mathematical RSA check, preview return helper, tests |
| `af-survival-guide` | `59c6843` | Access routes in public mode, flow proof cookies, preview return helper, tests |
| `website` | `301b6e3` | The three Ghost bridge files and candidate/receipt documentation |

The existing candidate was reviewed against the backups in
`C:\Users\Ben\Documents\Codex\2026-10-05\task\auth-patch-baseline` and the
partial candidates beside it. The four incoming partial files were additionally
saved in `af-toolkit\.local-working\access-finish-baseline` before editing.
Much of the existing access candidate is untracked; `git diff` alone does not show it.
Primary checkouts, unrelated theme files, tool source/artifacts, and Guide artwork
were not edited. Generated QA images are evidence, not product changes.

## Completed behavior

- The bare Ghost bridge checks the current Ghost session even without transaction
  parameters. Sign in and Subscribe appear for guests; signed-in readers see
  destination links, preferences, or the applicable retry control.
- Safe originating Toolkit routes and Guide collection/pagination routes survive
  the handoff, including safe query and fragment state. Existing authorized app
  sessions return directly. Preview links carry browser-only anchors.
- The bridge removes state/flow/expiry and result fields from history before native
  sign-in. Only the validated return destination remains for email/OTP recovery.
  Identity JWTs stay in memory and the fixed callback POST body; they are not stored
  in URLs or browser storage. Recovery storage contains only a safe destination and
  expiry; old stored signed state is removed.
- Toolkit, Guide, and bridge now share the same flow contract. Guide access endpoints
  run while its content remains public, fixing the prior public-mode 404.
- Each login uses opaque state and flow IDs, per-flow host-only cookies, and a
  ten-minute server transaction. Callback state is atomically consumed before
  identity/member I/O. The existing one-use, sixty-second ticket is also bound to
  the destination host, flow, and browser proof. Sessions remain Secure, HttpOnly,
  host-only, SameSite=Lax, and scoped to the receiving application.
- Separate flows prevent ordinary concurrent tabs from replacing each other's
  transaction. Each start prunes old known cookies to four per prefix; simultaneous
  starts can briefly add cookies unseen by the other request, all expiring in ten
  minutes. Expired/evicted state recovers through a fresh check rather than granting
  a session.
- Ghost session requests time out after eight seconds. Guest polling is limited to
  sixty checks at two-second intervals while visible, followed by a manual Check my
  access control. Automatic recovery is bounded per destination for ten minutes;
  repeated failures require an explicit click. BFCache restoration cannot resubmit
  an old callback, and failed submission presents a working retry.
- Allowed destinations use exact origins and supported paths. Validation rejects
  external/credentialed URLs, unsafe schemes, traversal, control characters,
  encoded authority/path tricks, credential parameters, and JWT-shaped values,
  including nested encoding. No arbitrary redirect endpoint is accepted.
- RSA strength is the unsigned modulus's mathematical bit length. Leading zeroes
  and a 256-byte encoding cannot promote RSA-2047 to RSA-2048. Verification still
  checks signature, algorithm, issuer, audience, scope, and token lifetime.
- A verified Ghost member must have the specific active free Dispatch subscription.
  The existing sixty-second maximum permission lifetime, signed invalidation
  webhooks, and fail-closed refresh behavior remain in place.

## Verification

All tests use local synthetic accounts and signing keys. No live member data,
emails, subscriptions, or production sessions were changed.

| Check | Result |
| --- | --- |
| Toolkit `npm run gate` | Passed: design gate, 38-file syntax check, 46/46 tests, 137/137 static checks, rendered layout checks, all state proofs, style census. CI portability subsequently split the same coverage into 40 standalone tests and 6 shared protocol tests; a default-deployment regression adds one more standalone test. Final standalone result: 41/41; shared protocol: 6/6. |
| Toolkit `npm run qa:access` | 37/37 cross-site integration checks passed with real workerd, RPC and SQLite Durable Objects |
| Toolkit `npm run qa:access:bridge` | 38/38 browser scenarios passed; synthetic session/callback UI fixtures |
| Toolkit `npm run qa:access:flows` | 13/13 local HTTPS Chromium scenarios passed with real HTTP 303s, browser cookies, Worker/RPC/DO execution |
| Toolkit `npm run qa:access:browser` | Passed: 37 responsive captures, 8 actual-browser preview-link checks, guest/signed-in controls, gallery/viewer/no-JS navigation; zero overflow, broken visible images, or external requests |
| Guide `npm run check` | 24/24 tests passed, build completed, all 102 original artwork hashes preserved |
| Website `node preflight.mjs` | 10 static checks passed |
| Website `node af-style-bible-audit.mjs --slug=subscriber-access` | Passed for the local candidate; release receipt now records Ben's subsequent scoped Tuck approval |
| Worker deployment dry-runs | Toolkit gated config with `ACCESS_MODE:setup` and Guide gated config with `ACCESS_MODE:public` passed; no upload |
| Literal bridge visual review | Guest, signed-in, unsubscribed and error states inspected at 1440, 768, 390 and 320 pixels; no clipping or horizontal overflow |

Protocol/browser coverage includes both destinations, current Ghost sessions,
existing app sessions, guests, unsubscribed members, expired/missing transactions,
new-tab email-return simulation, OTP navigation simulation, safe deep links,
concurrent targets, callback/ticket replay, unsafe redirects, failed session lookup,
retry exhaustion, and BFCache. Real generated RSA-2048 is accepted; RSA-2047 and
RSA-1024 are rejected. Integer tests also cover leading-zero encodings and malformed
moduli. A test-runtime shutdown stall was fixed by draining response bodies and
bounding setup cases to thirty seconds; no assertions were removed.

Bridge screenshots are in `af-toolkit\.local-working\access-finish\bridge`.
The responsive/gallery proof set and its JSON result are in
`af-toolkit\.local-working\access-finish\browser`. Its 37 captures were checked
automatically; direct visual review additionally covered the Toolkit mobile preview
and Guide desktop/mobile previews. The legacy browser script now owns its local
server and blocks live network access. Its static-asset adapter removes Origin only
for Miniflare's local transport guard; authentication requests retain their headers.
The browser checks caught and verified fixes for stale unsafe and empty fragments.
Regenerated Toolkit proof images were saved under `access-finish/toolkit-regenerated`;
the originally clean tracked proof files were restored to their prior Git bytes.
The HTTPS harness uses isolated loopback hosts and synthetic Ghost responses.
Its destination markup is a minimal fixture after the actual Worker authorizes or
serves the request. Bridge UI tests use a navigation adapter; the separate HTTPS
suite proves actual redirects and cookie rules. Neither is a native Ghost email test.

### Not established locally

- Native production Portal, actual email delivery/link rewriting/OTP, production
  cookies, mobile Safari/Firefox, and physical devices have not been tested for
  this candidate. No claim of a live fix or deployed version is made.
- Tuck re-verification found exactly one public Ghost RSA key with a mathematical
  modulus length of 2048 bits. The supplied working signed-in Toolkit handoff is
  a prior observation; native verification of this candidate remains pending.
- Ghost can redirect a **new signup** to its configured free-tier welcome page,
  overriding the initiating page. A read-only Admin API check during Tuck confirmed
  the active free tier's `welcome_page_url` is `/about/`.
  The local bridge preserves the safe return URL when Ghost returns it, but cannot
  guarantee a new-tab destination if Ghost discards that URL. This requires a live
  check; no welcome-page or membership setting was changed.
- Real edge latency/cache behavior, existing live webhooks, real unsubscribe
  propagation, and native two-tab email behavior still need production verification.
  Gating activation remains a separate decision after that verification.

Ghost source supporting the email-return limitation: [redirect selection](https://github.com/TryGhost/Ghost/blob/1c84678c360860e9466dfa785b0cfb77bb3541d3/ghost/core/core/server/services/members/members-api/controllers/router-controller.js#L46-L63),
[Portal OTP navigation](https://github.com/TryGhost/Ghost/blob/1c84678c360860e9466dfa785b0cfb77bb3541d3/apps/portal/src/actions.js#L204-L218),
and [signup welcome-page override](https://github.com/TryGhost/Ghost/blob/1c84678c360860e9466dfa785b0cfb77bb3541d3/ghost/core/core/server/services/members/middleware.js#L445-L495).
These sources do not establish which exact Portal build is deployed.

## Tuck preparation

Independent review found no blocking authentication defect. It also identified a
stale SECURITY.md description and default-deployment drift risk; both are addressed
within the release. Toolkit standalone CI no longer requires the private Guide
checkout. Guide CI checks out its own repository and a pinned public Toolkit commit
for shared integration/protocol tests. No assertions were removed.

Live configuration was read again on October 5: Toolkit `setup`, Guide `public`,
both workers.dev and preview hostnames disabled. Rollback versions are Toolkit
`e1a8baff-6b00-461e-afa8-eaf63dbcc084` and Guide
`59dec40c-0c09-4e75-b0aa-ae763a3437dd`. Default deployment configs now preserve this
posture and the existing access bindings. The Builds API read lacked permission;
no credentials, Build settings, or permissions were changed to work around it.

The current active theme was freshly downloaded through native Ghost admin.
The release overlay retains all 124 files: exactly the three access files differ,
121 match byte-for-byte, and none are added or removed. Staged preflight passed
10/10. Official Ghost gscan 6.6.1 passed both candidate and original with zero
errors and the same existing optional custom-font warning. Candidate ZIP SHA-256:
`c9586b1fe46460c2a33d9c3d33933f1ed3ffee3992c6fec9f4a817bab6f162fd`.
Backup SHA-256:
`63d3724830aad561feb24c95eccc4838025e36440d59bb3ee9b9de8fcf037b6c`.
Local packages and boundary evidence stay outside source commits, under the sibling
website's `.local-working/access-release-2026-10-05` directory.

## Exact release sequence — authorized by scoped Tuck

1. Confirm the current production Worker versions/configuration and save their
   rollback IDs. Verify Toolkit is still `setup`, Guide is still `public`, and the
   service binding, existing secret names, Durable Objects/migration history,
   disabled workers.dev/preview hostnames, and newsletter ID match the intended
   deployment. Historical version IDs in `ACCESS-VERIFICATION.md` are not a current
   snapshot. Inspect the live Ghost version and free-tier welcome-page setting
   read-only. Stop for a scope decision if deployed configuration has drifted.
2. Download and retain the **currently active** Ghost theme ZIP through native Ghost
   admin. Make a local copy and overlay exactly these files from the candidate:
   `custom-dispatch-access.hbs`, `assets/css/dispatch-access.css`, and
   `assets/js/dispatch-access.js`. Hash every other extracted file against that
   fresh backup; all must match. Do not upload this old worktree's entire theme.
   Run `node preflight.mjs --repo <staging-root>` where the fresh candidate is under
   `<staging-root>/advokat-frida-theme` and the required website preflight inputs are
   present. Validate the candidate ZIP with Ghost's theme validator before upload.
3. Re-run the local checks above against the exact candidate intended for release.
   Confirm these non-uploading commands again:

   ```powershell
   Set-Location 'C:\Users\Ben\.codex\worktrees\af-subscriber-access\af-toolkit'
   npx.cmd --no-install wrangler deploy --config wrangler.gated.jsonc --var ACCESS_MODE:setup --dry-run
   Set-Location 'C:\Users\Ben\.codex\worktrees\af-subscriber-access\af-survival-guide'
   npm.cmd run check
   npx.cmd --no-install wrangler deploy --config wrangler.gated.jsonc --var ACCESS_MODE:public --dry-run
   ```

4. Ben's explicit Tuck authorizes this release and native session verification.
   Deploy Toolkit first, then Guide after exact-candidate review and green gates:

   ```powershell
   Set-Location 'C:\Users\Ben\.codex\worktrees\af-subscriber-access\af-toolkit'
   npx.cmd --no-install wrangler deploy --config wrangler.jsonc
   Set-Location 'C:\Users\Ben\.codex\worktrees\af-subscriber-access\af-survival-guide'
   npx.cmd --no-install wrangler deploy --config wrangler.jsonc
   ```

   The default configs preserve Toolkit setup and Guide public. Bare gated configs
   activate restrictions and must not be deployed. Do not change secrets, keys, newsletter membership, or security
   settings. Record returned versions. This is a coordinated protocol release:
   sign-in may temporarily fail between the Worker and theme steps while existing
   application content remains public. Do not leave a mixed-version patch deployed.
5. Upload and activate only the validated fresh-theme overlay ZIP in native Ghost
   admin. Keep the existing `/dispatch-access/` page and its custom-template
   assignment. Verify the actual Ghost-rendered versioned CSS and JS URLs against
   the candidate hashes, not bare cached asset URLs.
6. Run Guide `node scripts/verify-live.mjs` and website `node preflight.mjs --live`.
   Confirm unauthenticated Toolkit tools and Guide collections/artwork remain
   public. With existing accounts/session actions, exercise both
   destinations, bare bridge states, existing sessions, guest email/OTP, new-tab
   signup and signin, deep links, concurrent tabs, unsubscribe denial, expired
   state, unsafe returns, and replay. Report production limits without changing
   settings to make a failing test pass. Do not activate gating.
7. If the coordinated release fails, restore both captured prior Worker versions
   through Cloudflare deployment history and reactivate the saved pre-release theme.
   Keep Toolkit `setup`, Guide `public`, existing secrets, bindings, and DO classes.
   Do not delete Durable Objects or roll back their migration history. Old in-flight
   sign-ins can expire and restart; no old ticket is promoted into the new protocol.

Gating activation, subscription changes, keys, and security-setting changes remain
outside this scoped Tuck. New-signup/subscription mutation tests require separate
authorization; record them as untested rather than altering membership.
