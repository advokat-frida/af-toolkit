# Redactorium (frontend)

The Toolkit's local redaction tool: load a file, see which columns look like personal data,
choose a transform per column, and export the cleaned file with a verification record.
Everything runs in the browser.

Built with Vite, React 19 and Tailwind 3. Vite replaced Create React App on 2026-09-11.

```
npm ci            # .npmrc carries legacy-peer-deps: react-day-picker 8 peers on date-fns 2/3, the tree uses 4
npm start         # dev server with hot reload
npm run lint      # the React hooks rules the CRA build used to enforce
npm run build     # -> build/, which the repo's scripts/build-tools.mjs stages into public/tools/redactorium/
```

The shell frames `build/index.html?embed=1#/` from `/tools/redactorium/`, so asset URLs are
relative (`base: './'` in `vite.config.mjs`). `index.html` carries the tool's Content Security
Policy; it forbids inline scripts, which is why the Vite module-preload polyfill is switched
off in the config.
