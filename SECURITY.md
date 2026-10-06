# Security

## Supported state

`main` is the supported source state for https://toolkit.advokatfrida.com. The tools process
their inputs in the browser, without sending those inputs to the access service or adding
tool telemetry. A separate Worker service verifies Ghost member identities and active
Dispatch subscriptions, and issues host-only sessions using browser-bound, one-use tickets.
The access repair releases in `setup` mode: tool content remains public and gating is off.
Ghost sign-in and subscription lookups make network requests; they do not receive tool inputs.
Every served tool file is hash-recorded in `public/tool-sources.json`; see
`docs/VERIFYING.md` for how to check that the file you received is the file this repository built.

## Integration trust boundary

The four tools run as reviewed, same-origin frames so their local storage, downloads,
and browser APIs continue to work. Those frames are application composition, not security
isolation: a staged tool is trusted code inside the Toolkit origin. Clipboard access follows
from that shared origin too, so it is not a boundary either.

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

Every staged artifact is hashed and recorded in `public/tool-sources.json`. GitHub secret scanning
and push protection watch the repository for secrets. The release gate requires local-only tool
processing with no unexpected external requests, tests the separate authentication boundary,
and verifies the rendered application before push. Public release or deployment requires
a separate review; enabling subscriber gating is a separate explicit release decision.
