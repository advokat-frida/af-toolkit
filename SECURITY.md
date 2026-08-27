# Security

## Supported state

The current private `main` branch is the only supported state. This repository serves a static
browser application from a loopback-only Node server and does not contain a hosted backend,
authentication system, or telemetry service.

## Integration trust boundary

The five source-owned tools run as reviewed, same-origin frames so their local storage, downloads,
and browser APIs continue to work. Those frames are application composition, not security
isolation: a synchronized tool is trusted code inside the Toolkit origin. Only the three tools that
actually copy output receive `clipboard-write` permission.

Before any hosted or public release, review this boundary again. Unreviewed or independently
administered tools should move to separate origins or a sandbox design that does not restore
same-origin access.

## Reporting

Report a suspected vulnerability privately through the repository's GitHub security interface or a
private organization issue. Do not attach real personal information, confidential documents, access
tokens, or production datasets to a report; use the smallest synthetic reproduction that proves the
problem.

## Release checks

Every integrated artifact is pinned by hash and provenance. The release gate scans for secrets,
requires local-only runtime behavior with no unexpected external requests, and verifies the exact
rendered application before push. Public release or deployment requires a separate review.
