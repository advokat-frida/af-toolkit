# Dispatch access and Guide discovery

> **October 5, 2026: subscriber gating deployed and verified.** Both production
> hosts require an active free Dispatch subscription for protected content. Public
> descriptions and selected Guide previews remain available. Default deployments
> preserve gated mode.
> [ACCESS-ACTIVATION-2026-10-05.md](ACCESS-ACTIVATION-2026-10-05.md) records the
> source and release evidence, verification boundaries, deployment procedure, and rollback.
> [ACCESS-PATCH-2026-10-05.md](ACCESS-PATCH-2026-10-05.md) preserves the completed
> repair release and flow contract. Earlier restrictions below are historical.

## Historical September 30 / October 1 status

Ben approved preparation on September 30, 2026 and subsequently authorized deployment,
ending the OpenAI collaboration hold. The implementation uses a 60-second maximum
subscription-permission lifetime. The changes remain uncommitted in isolated worktrees.

**October 1 release:** the access infrastructure and Guide collection URLs were deployed,
but both applications remain public until Ghost's pending 2048-bit member-signing key
becomes active and the real login/revocation checks pass. Toolkit's explicit `setup` mode
enables sign-in and signed webhooks without restricting application access. Guide runs
the service-bound entrypoint with `ACCESS_MODE=public`. Ordinary public mode still has
no authentication requirement, authorization requests, cookies, or subscription barrier.
See `ACCESS-VERIFICATION.md` for exact live versions and the verified launch blocker.

## Goal and ownership

A verified, currently subscribed Dispatch member can use the hosted Toolkit and
the complete Survival Guide. Public descriptions and selected previews remain
crawlable. Unsubscribing ends access to subsequent protected requests within 60
seconds, even in an existing session. Already delivered bytes cannot be recalled.

- `af-toolkit/access/` owns shared authentication and subscription authorization.
- Toolkit's Worker protects tools and their supporting assets before delivery.
- Guide's Worker calls the same authorization service through a private binding.
- A Ghost-theme access page completes sign-in with Ghost's signed member identity.
- Guide owns collection URLs, linked pagination, public HTML previews and sitemaps.
- Existing tool processing stays in the browser. No input data goes to this service.

## Implementation contract

Use Ghost's signed member identity and published verification keys; verify signature,
algorithm, issuer, audience, expiry and scope. Look up the exact verified member and
the Dispatch newsletter ID server-side. Never grant access from an email supplied
by the browser. Admin keys remain Worker secrets.

Issue a signed, HttpOnly, Secure, host-only session cookie on each app. A browser-bound,
one-use 60-second handoff ticket connects the Ghost callback to the requesting app;
unrelated AF subdomains never receive the app session. A per-member
Durable Object caches the latest subscription decision for at most 60 seconds,
measured from the beginning of the Ghost request. Signed Ghost webhooks invalidate
that decision. Expired permissions require a successful fresh check; errors do not
extend an allow decision. Replayed/out-of-order webhook payloads cannot grant access.

Login uses a short-lived state cookie, fixed callback and allowed return origins.
The Guide service binding exposes authorization and one-use ticket completion, not member records. Protected
responses have `Cache-Control: private, no-store`; alternate hosts and direct asset
URLs receive the same gate. Public preview artwork is an explicit allowlist.

Guide collections use `/comics/` and `/posters/`, with stable pagination URLs, real
links, initial HTML content, distinct titles/descriptions/canonicals and a sitemap.
The approved artwork bytes and gallery presentation remain the reference. Public
previews contain useful text and selected samples; full files outside that sample
set require authorization. No thin detail pages are generated for every artwork.

## Named acceptance tests (before implementation)

1. `rejects forged, expired, wrong-origin and wrong-scope identity tokens`
2. `requires the specific active Dispatch subscription`
3. `expires an allow decision at 60 seconds without extending it on failure`
4. `webhook invalidation wins over an in-flight stale refresh`
5. `rejects callback CSRF, replay and external return URLs`
6. `protects direct tool, artwork, catalog and alternate-host requests`
7. `keeps public previews crawlable without exposing the member catalog`
8. `collection URLs render useful HTML without JavaScript`
9. `pagination, reload and browser back preserve the selected collection`
10. `member and anonymous responses cannot share a cached protected body`
11. `default public mode exposes both sites without authentication or auth calls`

Run existing repository gates, edge-runtime integration tests and literal desktop,
intermediate and phone visual review. Record live Ghost read compatibility separately
from local synthetic signup/unsubscribe verification. The routine-check performance
target is under 100 ms added latency; a local benchmark is not an edge measurement.

## Release prerequisites

The Ghost access page/theme, Worker secrets, Durable Object migration, service binding
and signed member webhooks must be configured together at an authorized release.
Live member sign-in and revocation require verification after release. No email is
sent, no member subscription is changed and no existing session is used as a test
account without the applicable authorization.

See [ACCESS-VERIFICATION.md](ACCESS-VERIFICATION.md) for the verified local state,
the Ghost signing-key prerequisite and the future activation checklist.
