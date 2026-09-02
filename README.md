# Advokat Frida Toolkit

One repository, one workbench: the Toolkit shell plus the full source of every tool in it.
Redactorium, SafeSeed, Privacy Wizards Council, and Objection Oracle live here as
top-level source folders and render inside one navigable shell without throwing away in-progress
work when the user switches tools.

![The Toolkit Home view](proofs/desktop-1440-home.png)

## Layout

| Path | What it is |
|---|---|
| `public/` | The shell — Home, grouped navigation, breadcrumb tool headers — plus staged tool artifacts |
| `redactorium/` | Tool source: file sanitation (React frontend + reference backend) |
| `safeseed/` | Tool source: deterministic synthetic data library, CLI, action, and browser generator |
| `privacy-wizards-council/` | Tool source: guided privacy determinations (Svelte) |
| `objection-oracle/` | Tool source: release-triage 8-ball (vanilla, single-file build) |
| `scripts/` | Shell QA and the staging pipeline |
| `docs/design/` | The design package: standing principles and the review gate |

`public/tools/`, `public/licenses/`, and `public/tool-sources.json` are **generated** by
`scripts/build-tools.mjs` from the tool folders. Do not hand-edit them. Provenance — source
artifact, hashes, license — is recorded per tool in
[`public/tool-sources.json`](public/tool-sources.json).

## Run locally

Requirements: Node.js 22 or newer.

```powershell
npm.cmd ci
npm.cmd start
```

Open `http://127.0.0.1:4177/`. Starting the app serves the committed snapshot; it never runs a
build or rewrites tracked files.

## Change a tool

1. Edit inside the tool's folder and pass that folder's own gate (its `check`, `qa`, tests, or
   harness).
2. Restage: `npm.cmd run build:tools` (uses each tool's committed artifact) or
   `npm.cmd run build:tools:full` (runs each tool's build first).
3. Run the repository gate and review the rendered proofs.

## Gate

```powershell
npm.cmd run gate
```

design-gate (palette, fonts, copy, radii, external requests) → typecheck → tests → static QA →
rendered QA at 1440×1000, 1034×917, 390×844, and 320×700 with fresh `proofs/` screenshots. The
judgment half of the review lives in [`docs/design/REVIEW-GATE.md`](docs/design/REVIEW-GATE.md);
the standing principles in [`docs/design/DESIGN-SYSTEM.md`](docs/design/DESIGN-SYSTEM.md). New
tools enter only through that gate.

## Licensing

There is intentionally no blanket license. SafeSeed, Privacy Wizards Council, and
Objection Oracle carry MIT in their folders (copied to `public/licenses/`). Redactorium declares no
license, and this private repository makes no redistribution grant for it. See
[`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).

## Release status

Private source control only: no deployment, website or Ghost change, publication, DNS, analytics,
or public release. The superseded standalone GitHub repositories remain until they are archived
deliberately.
