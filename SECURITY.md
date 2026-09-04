# Security

## Supported state

`main` is the only supported state, and https://toolkit.advokatfrida.com serves exactly what `main`
builds: a static browser application with no hosted backend, no authentication system, and no
telemetry. Every served tool file is hash-recorded in `public/tool-sources.json`; see
`docs/VERIFYING.md` for how to check that the file you received is the file this repository built.

## Integration trust boundary

The five tools run as reviewed, same-origin frames so their local storage, downloads,
and browser APIs continue to work. Those frames are application composition, not security
isolation: a staged tool is trusted code inside the Toolkit origin. Only the three tools that
actually copy output receive `clipboard-write` permission.

This boundary was reviewed again for the public, hosted release on 2026-09-04 and holds because
every tool's source lives in this repository and passes the same gate before it is staged. It stops
holding the day a tool is developed or administered somewhere else: such a tool moves to a separate
origin or a sandbox design that does not restore same-origin access, before it is staged.

## Reporting

Report a suspected vulnerability privately through
[GitHub private vulnerability reporting](https://github.com/advokat-frida/af-toolkit/security/advisories/new). Do not attach real personal information, confidential documents, access
tokens, or production datasets to a report; use the smallest synthetic reproduction that proves the
problem.

## Release checks

Every staged artifact is hashed and recorded in `public/tool-sources.json`. The release gate scans for secrets,
requires local-only runtime behavior with no unexpected external requests, and verifies the exact
rendered application before push. Public release or deployment requires a separate review.
