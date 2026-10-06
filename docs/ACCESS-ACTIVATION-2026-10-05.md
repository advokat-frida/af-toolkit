# Dispatch subscriber-gating activation

## Status and authority

**Activation candidate; not deployed.** Ben explicitly requested a goal to enable
gating, the tasks needed to reach it, and implementation. This supersedes the
earlier access-repair instruction to keep Toolkit setup and Guide public.
Keys, unrelated security settings, artwork, and unrelated work remain protected.
Ben directly approved two narrow exceptions by asking this session to perform
the pending browser actions: temporarily subscribe/unsubscribe the designated
test member and restore its initial state; clear the free tier's forced `/about/`
welcome destination. Both actions have now been exercised and read back.

The prior repair is already deployed. Its source and historical verification are
in [ACCESS-PATCH-2026-10-05.md](ACCESS-PATCH-2026-10-05.md). This activation does not
replace the authentication implementation or deploy another theme.

Tracked in the existing AF Notion schema:

- [AF-32: email sign-in and destination recovery](https://app.notion.com/p/3f10f293ed9d81e58a21ec84240ceafb).
- [AF-33: production enforcement and revocation](https://app.notion.com/p/3f10f293ed9d8162bebedf22edcb0aa1).
- [AF-34: enable and verify gating](https://app.notion.com/p/3f10f293ed9d819794b1e8f2a58f7bed).

AF-25 search submission and discovery remains separate. Its explicitly approved
anonymous-preview canonical correction is included in this Guide release.

## Candidate and invariant review

Both repositories use `codex/dispatch-gating`. Toolkit activation commit `f6eb166`
was integrated with released AF-18 main `f10f8281` as `b4b9cf3d`, preserving AF-22
and every AF-18 public artifact and tool source byte. Guide activation and the
approved AF-25 metadata correction passed CI and merged through PR #4 as
`fed6ee7a`, from candidate `8d161989`. Do not redeploy older access snapshots.

Toolkit's ordinary `wrangler.jsonc` now selects `ACCESS_MODE=gated`. Guide's
ordinary config selects `worker.gated.mjs`, `ACCESS_MODE=gated`, and
`assets.run_worker_first=true`. **Guide requires all three:** changing its mode
alone would leave direct static files outside the authorization check. Both
defaults are checked against their explicit gated configs.

Bindings, existing secret names, Durable Object classes and migration history,
rate limits, custom domains, disabled workers.dev/preview hosts, and the exact
Dispatch newsletter ID are unchanged. No key is rotated. The one-use ticket
handoff and host-only application sessions are unchanged. The subscription
permission lifetime remains at most 60 seconds; bytes already delivered to a
browser cannot be recalled.

Independent review found no substantive blockers in the activation diff at
Toolkit base `354af903` and Guide base `0623b5d6`. The reviewer independently
passed seven Toolkit routing and 17 Guide access tests, and verified the Guide
metadata/artwork boundary. A follow-up review at `b4b9cf3d` confirmed the four-file
activation configuration/test delta is byte-identical to the reviewed `f6eb166`
patch, while public, access, routing, Worker, and all tool source trees exactly
match released AF-18 main. No substantive findings remain.

## Completed verification

| Layer | Checked result |
| --- | --- |
| Toolkit complete gate | Passed again after AF-18 integration: 41 tests, 38 syntax files, 137 static assertions, four-width rendered QA, all 16 state proofs, and style census. Current rendered proofs were inspected and retained privately. |
| Focused access tests | 15 passed. |
| Shared workerd/RPC/SQLite integration | 37 passed. Synthetic local warm median 10.44 ms, p95 14.52 ms; these are not production latency measurements. |
| Guide gate | 25 passed after AF-25 integration; all 102 original artwork hashes unchanged. The added regression covers 16 routes in four access modes. |
| Candidate packaging | Both default Wrangler deployment dry-runs passed without upload. |
| Local browser QA | 37 captures and eight return-link checks passed; no overflow, broken visible images, or external requests. Desktop and phone gated previews were directly inspected. |
| Prepared guest release verifier | 182 local assertions passed again after AF-18 integration, including all 96 nonpreview artwork files, current direct tool files, invalid cookies, and conditional/range requests. Production run remains pending activation. |
| Current live prerequisites | Toolkit setup, Guide public, alternate hostnames disabled, and public Ghost RSA modulus mathematically 2048 bits. |
| Real unsubscribed protocol | 19 assertions passed on both destinations using the existing test member and official Admin-assisted sign-in; no membership change. Exact targets survived and neither destination issued a member session. This is not native email-delivery evidence. |
| Real subscribed protocol and replay | Both destinations issued Secure, HttpOnly, host-only member sessions and returned to their exact targets. Reusing each consumed ticket with its original browser proof returned 400 and issued no session. |
| Real unsubscribe propagation | After the approved native Ghost unsubscribe/save, existing Toolkit and Guide sessions lost handoff authorization in 6,533 ms and 6,826 ms respectively. These are live setup/public-mode authorization checks, before protected delivery is enabled. |
| Native email and fresh-tab recovery | Ben completed the fresh email sign-in; the browser automatically reached Guide `/posters/page/2/?source=native-activation#gallery`. A fresh tab using that real Ghost session recovered Toolkit `/safeseed?source=native-new-tab#sample`. |
| Concurrent browser returns | Parallel tabs reached Toolkit `/redactorium?source=concurrent#proof` and Guide `/comics/page/3/?source=concurrent#panel` without mixing destinations. |
| Ghost welcome setting | Cleared the free-tier forced welcome URL in native Ghost admin, saved, reloaded, and confirmed `welcome_page_url: null`. About content and welcome email were not edited. |
| AF-25 metadata boundary | Exactly 13 paginated anonymous-preview heads changed. Every preview body, all full-page files, and all other generated bytes remained unchanged. Requested member return paths retain their page number. |

Private proofs and sanitized protocol results are under
`.local-working/access-activation/`; no credentials, identity JWTs, session
cookies, or magic-link values are committed or included in those receipts.

## Remaining release checks

The designated test member was restored to unsubscribed after the first
revocation test, then temporarily subscribed again for native email and final
post-activation checks. Restore it to unsubscribed before completion. The cleared
welcome URL is the intended persistent setting.

Ben was asked to open the email link in a new tab and confirmed sign-in. The
observed final browser state proves the exact Guide return, but does not
independently establish which tab hosted the email-link click. Fresh-tab recovery
was directly verified afterward with the real email-authenticated session.
Fresh-account signup, Safari/Firefox, and physical devices remain untested.
Local suites cover expiry, concurrency, unsafe redirects, replay, bounded
recovery, and mathematical RSA key-size boundaries.

Post-activation protected delivery and revocation, plus production warm-request
latency, remain pending. Earlier handoff timings are end-to-end network timings,
not isolated authorization overhead.

After activation, verify guest descriptions and selected previews remain visible;
direct tool files, full catalogs, nonpreview artwork, encoded paths, and cached
responses cannot disclose protected bytes; subscribed sessions work on both
hosts; and the designated test membership is restored. Do not label the ordinary
Guide `scripts/verify-live.mjs` as a gated test: it expects public full content.

Ghost sign-out and application-session revocation are different operations.
Application cookies are host-only; active membership is rechecked within the
permission lifetime. Do not claim cross-host logout from a Ghost-only sign-out.

## Exact deployment sequence

This is a prepared procedure, not evidence of execution.

1. Preserve the completed prerequisite and AF-18 integration evidence.
   Re-read live versions, mode, binding names, and disabled alternate-host flags.
   If another release has landed, preserve it and refresh the rollback snapshot.
2. Review the exact source diff, retain passing gate evidence, and complete source
   review/closeout. A main-branch merge may trigger Toolkit Workers Builds; treat
   that merge as part of the deployment boundary. Do not merge early while the
   live checks are pending. Guide CI does not itself deploy.
3. Deploy Toolkit first and verify its live mode/version before deploying Guide:

   ```powershell
   Set-Location 'C:\Users\Ben\.codex\worktrees\af-subscriber-access\af-toolkit'
   npx.cmd --no-install wrangler deploy --config wrangler.jsonc
   Set-Location 'C:\Users\Ben\.codex\worktrees\af-subscriber-access\af-survival-guide'
   npx.cmd --no-install wrangler deploy --config wrangler.jsonc
   ```

4. Record returned version IDs and the actually active deployments; an automatic
   build may assign a later version. Verify both are gated, the Guide calls the
   intended Toolkit service, and the deployment preserves bindings and secrets.
5. Run guest and subscribed production checks and inspect desktop/mobile browser
   surfaces. Record exact passed, failed, and untested cases. Close AF-32 through
   AF-34 only when their acceptance criteria are met. No theme upload is needed
   for this activation and bounded Guide metadata correction.

## Rollback

The current pre-activation snapshot, read October 6 UTC / October 5 Pacific, is:

| Worker | Version | Mode |
| --- | --- | --- |
| `the-toolkit` | `9037107a-4c75-4196-90b6-16bf39b9fd1f` | setup, including AF-18 and AF-22 |
| `af-survival-guide` | `42521793-8f84-4ab6-869d-4974afe65ad1` | public |

If activation fails, restore Guide first, then Toolkit using the verified current
snapshot. This restores public application content and keeps the access service
available. Do not delete Durable Objects, erase migration history, rotate keys, or
replace the Ghost theme.

```powershell
Set-Location 'C:\Users\Ben\.codex\worktrees\af-subscriber-access\af-survival-guide'
npx.cmd --no-install wrangler rollback 42521793-8f84-4ab6-869d-4974afe65ad1 --name af-survival-guide --message 'Restore public Guide after gating activation failure'
Set-Location 'C:\Users\Ben\.codex\worktrees\af-subscriber-access\af-toolkit'
npx.cmd --no-install wrangler rollback 9037107a-4c75-4196-90b6-16bf39b9fd1f --name the-toolkit --message 'Restore Toolkit setup after gating activation failure'
```

Verify the actual deployments, public access, AF-18/AF-22 artifact identity, and service
bindings after rollback. Revert the activation change in source before another
normal build; a version rollback alone does not change the repository's gated
defaults. Restore the designated test member to its original unsubscribed state.
The approved empty welcome URL is intended to persist; restore `/about/` only
if rolling back that setting is needed and record the result separately.
