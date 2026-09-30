import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';

// A CRLF working copy of index.html (older Windows checkouts) leaves a stray blank line where
// vite-plugin-singlefile removes the module script, so the artifact came out a byte longer than
// CI's Linux build. Normalising the template first makes every checkout build the same bytes.
const lfTemplate = {
  name: 'pwc-lf-template',
  transformIndexHtml: { order: 'pre', handler: (html) => html.replace(/\r\n?/g, '\n') }
};

export default defineConfig({
  base: './',
  plugins: [lfTemplate, svelte(), viteSingleFile()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    target: 'es2020',
    rollupOptions: { output: { inlineDynamicImports: true } }
  }
});
