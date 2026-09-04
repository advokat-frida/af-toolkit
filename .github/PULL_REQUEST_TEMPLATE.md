## What changed, and why

<!-- One paragraph. What a reader of the changelog would need to know. -->

## Gate

- [ ] `npm run gate` passes locally
- [ ] If a tool folder changed: that folder's own check passes, and `npm run build:tools` was run to restage
- [ ] `proofs/` is either unchanged or the new screenshots were looked at, at full size

## Review checklist

Reviewed against [`docs/design/REVIEW-GATE.md`](../docs/design/REVIEW-GATE.md):

- [ ] Every state, not just the happy path: empty, loading, error, longest-content, done
- [ ] Tokens, type, and components match [`docs/design/DESIGN-SYSTEM.md`](../docs/design/DESIGN-SYSTEM.md)
- [ ] Copy earns its place: no fluff, no restating what the interface already shows, no trust theater
- [ ] Nothing leaves the browser: no new network calls, no storage, no analytics

## Anything a reviewer should push back on

<!-- Be honest here. A shortcut you took, a state you did not check, a decision you are unsure about. -->
