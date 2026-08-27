# HANDOFF

## 2026-08-27 - Private repository graduation

The reviewed Toolkit candidate graduated from `studio/active` into the dedicated `the-toolkit`
integration-shell repository. The shell owns Home, navigation, visual adapters, local serving,
provenance, and QA. The five integrated tools remain source-owned in their individual repositories.

The current release boundary is private source control only. No website sync, Ghost change, theme
deployment, public release, DNS, analytics, or package publication is part of this checkpoint.

Next change: update a tool in its source repository, review and commit that source build, run the
explicit Toolkit sync, then repeat the full static, rendered, and literal visual gate.
