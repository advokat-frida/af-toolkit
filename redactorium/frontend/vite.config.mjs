import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Redactorium's build. Vite replaced Create React App (react-scripts 5 behind craco) on
// 2026-09-11: CRA has no maintained release, and most of this tree's security advisories
// lived inside it. The contract with the rest of the Toolkit is unchanged -- the repo's
// scripts/build-tools.mjs stages `frontend/build/` as a tree into public/tools/redactorium/,
// and the shell frames `index.html?embed=1#/` from there.
export default defineConfig({
  // Served from /tools/redactorium/, so every asset URL has to be relative. CRA's
  // `"homepage": "."` did the same job.
  base: "./",
  plugins: [react()],
  resolve: {
    // The one alias the source uses: `@/` -> `src/` (was jsconfig `paths` plus a craco alias).
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    // Keep CRA's output folder so the staging script and .gitignore need no change.
    outDir: "build",
    emptyOutDir: true,
    // index.html ships a CSP with `script-src 'self'` and no 'unsafe-inline'. Vite's
    // module-preload polyfill is an inline <script>, which that CSP would refuse, and every
    // browser the site supports loads modules natively, so the polyfill is switched off.
    modulePreload: { polyfill: false },
    // pdfjs-dist is a dynamic import in lib/parsers.js and lands in its own chunk. The main
    // bundle still carries the spreadsheet and document libraries, so the default 500 kB
    // warning would fire on every build without telling anyone anything new.
    chunkSizeWarningLimit: 1500,
  },
  esbuild: {
    // Keep third-party licence headers in the bundle, as webpack's LICENSE.txt extraction
    // did. The Toolkit's provenance manifest is the primary record; this is belt and braces.
    legalComments: "inline",
  },
});
