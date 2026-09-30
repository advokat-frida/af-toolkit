# Redactorium (frontend)

The Toolkit's local redaction tool: load a file, see where the personal data is (whole columns, and
inside the text), choose a treatment for each finding, and download the clean file with a record.
Everything runs in the browser.

Built with Vite, React 19 and Tailwind 3. Vite replaced Create React App on 2026-09-11.

```
npm ci            # .npmrc carries legacy-peer-deps, which Dependabot reads too
npm start         # dev server with hot reload
npm test          # the engine tests (node --test, no extra dependencies)
npm run lint      # the React hooks rules the CRA build used to enforce
npm run build     # -> build/, which the repo's scripts/build-tools.mjs stages into public/tools/redactorium/
```

The engine in `src/redactorium/lib/` imports its siblings with explicit `.js` extensions, so Node
runs it directly for the tests. Saving a file (`download.js`, file-saver) is kept apart from it
because it needs a browser.

The shell frames `build/index.html?embed=1#/` from `/tools/redactorium/`, so asset URLs are
relative (`base: './'` in `vite.config.mjs`). `index.html` carries the tool's Content Security
Policy: no inline or eval'd scripts, no network connections (`connect-src 'none'`), workers only
from this origin. That is why the Vite module-preload polyfill is switched off, and why pdf.js is
opened with `isEvalSupported: false`.

The build also writes `THIRD-PARTY-LICENSES.txt` from the modules Rollup actually bundled (a small
plugin in `vite.config.mjs`), so every shipped dependency's license travels with it.

`xlsx` (SheetJS) installs from the SheetJS CDN, not the npm registry. The npm package stopped at
0.18.5, which is open to CVE-2023-30533 and CVE-2024-22363. The lock file pins the tarball's
sha512, so `npm ci` fails if the CDN ever serves different bytes. Dependabot cannot open a pull
request for a URL dependency, so upgrades are manual: `npm rm --save xlsx`, then
`npm i --save https://cdn.sheetjs.com/xlsx-<version>/xlsx-<version>.tgz`, as SheetJS's
[install page](https://docs.sheetjs.com/docs/getting-started/installation/frameworks) describes.
Check [cdn.sheetjs.com/advisories](https://cdn.sheetjs.com/advisories/) when SheetJS announces one.
