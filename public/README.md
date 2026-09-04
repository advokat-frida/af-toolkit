# public

What the browser gets. Served in development by `server.mjs` on `127.0.0.1:4177`, and in
production by a Cloudflare Worker that runs no code of ours.

## Hand-written

| Path | What it is |
|---|---|
| `index.html` | The whole shell: sidebar, breadcrumb header, one iframe per tool, and the changelog |
| `toolkit.css` | The design system as a stylesheet. Tokens live in `:root` here and nowhere else |
| `toolkit.js` | Routing, frame management, focus handling, the mobile chooser, and the two postMessage handlers |
| `_headers` | Edge headers: nosniff, no-referrer, same-origin; no-store on tools and the manifest; immutable on fonts |
| `fonts/` | Anton, Archivo and Space Grotesk, self-hosted. Never loaded from a CDN |
| `assets/` | The fox mark |

## Generated — do not hand-edit

| Path | Written by |
|---|---|
| `tools/` | `scripts/build-tools.mjs` |
| `licenses/` | `scripts/build-tools.mjs` |
| `tool-sources.json` | `scripts/build-tools.mjs` |

Editing these directly is the mistake that costs the most time. The gate compares the manifest
hashes against the files, so a hand-edit fails the build without saying "someone hand-edited
this". Change the tool in its own folder and run `npm run build:tools`.

## tool-sources.json

The provenance manifest. Per tool: the source folder, the source artifact, the hash of the staged
artifact, and the licence. It is what anyone verifying a served file checks against, so its hashes
are canonical LF and identical on every platform. [How to verify](../docs/VERIFYING.md).
