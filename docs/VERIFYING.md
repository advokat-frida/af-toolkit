# Don't trust us, check

Every tool here claims your file never leaves your browser. That is a promise about software you
did not write, delivered over a network you do not control, by people you have not met. You should
be able to check it rather than believe it.

Here is how, in rough order of effort.

## 1. Watch the network

Open a tool, open your browser's network panel, and use it. Drop a file in, generate something,
download the result.

You should see the page load and then nothing. No requests while you work. No beacon on close.
The tools do not lazily fetch anything, because there is nothing to fetch — fonts, icons and data
are all inside the file.

This takes thirty seconds and it is the check that actually matters.

## 2. Pull the plug

Load a tool, then turn off your network — properly, not just offline mode — and keep using it.
Everything still works.

Several of the single-file tools can be saved to disk and opened from `file://` with no server at
all. A tool that runs from a local file cannot be talking to anyone.

## 3. Check the bytes you were served

Every staged artifact is hashed into [`public/tool-sources.json`](../public/tool-sources.json).
The hashes are canonical: identical on Windows, Linux, in CI, and at the edge.

```bash
curl -sL https://toolkit.advokatfrida.com/tools/safeseed.html | sha256sum
node -e "console.log(require('./public/tool-sources.json').tools.find(t=>t.id==='safeseed').toolkitSha256)"
```

Same for `safelist` and `privacy-wizards-council`. Redactorium is a directory
rather than a single file, so its entry records a hash over the whole tree; `scripts/checks.mjs`
recomputes it the same way.

**One honest caveat.** Cloudflare currently injects a small hidden anchor into every HTML response
for bot detection. It is inert — no script, no data about you — but it does mean a raw `curl` of an
HTML page differs from the repository by that one tag. Strip it and the bytes match exactly. We
would rather tell you that than have you find it and wonder what else we did not mention.

## 4. Rebuild it and compare

The strongest check. Clone the repository, build the tool from source, and compare the result to
what the site served you.

```bash
npm ci
npm run build:tools:full   # runs each tool's own build first
git diff --stat public/
```

A clean diff means the artifact in the repository is exactly what the source produces. Combine
that with step 3 and you have followed the chain from source, to artifact, to the bytes in your
browser, without trusting any link in it.

## 5. Read the thing

They are small on purpose. `safelist/src/core.js` is a few hundred lines of pure functions with no
DOM and no network. `privacy-wizards-council/src/lib/engine/council.js` is the entire decision
engine. If you want to
know whether a tool phones home, the fastest answer is often to search it for `fetch`.

Each single-file build also wraps itself in a kill switch that replaces `fetch`, `XMLHttpRequest`,
`sendBeacon`, `WebSocket` and `EventSource` with functions that count attempts and refuse. The
test harness asserts that count is zero after driving the whole tool. That is not a promise, it is
an assertion that fails a build.

## What we cannot prove to you

That the person deploying is honest. Nothing in a static site can prove that; verification only
shows the bytes you got match the bytes we published. What it does mean is that a change is
visible: the hashes move, the diff is public, and the history says who did it and when.

If you find a mismatch you cannot explain, please tell us. [`SECURITY.md`](../SECURITY.md) has the
private route, and a mismatch is exactly the kind of thing worth reporting quietly first.
