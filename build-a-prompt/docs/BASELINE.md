# Shipped baseline

Captured before the vNext local redesign on 2026-08-20.

- Repository head: `19b91dee44c46ec7fcdd7ae1b88dc71aaf257223`
- Portable artifact: `prompt-builder.html`
- SHA-256: `8CB8AAB51049B8C8626C29F83C5EBB4950A866BB9018CB2D3BD77C8FC66946DA`
- Git blob: `b1376ee78eb3d6df1c477ea9c56e459320323b3e`

The legacy HTML remains untouched in the repository root. vNext authoring lives in `src/`; the local
portable candidate is built to `dist/prompt-builder.html`.

## Compatibility invariants

- `af_bap_org_v1` remains the organization-brief store.
- `af_bap_setups_v1` remains the named-setup store.
- Existing `#s=v1.<payload>` structure-only links remain readable.
- Work request, generated prompt, organization brief, custom role, custom tone, and custom format do
  not enter setup or share payloads.
- Copy and download are deliberate exits from the page boundary.
