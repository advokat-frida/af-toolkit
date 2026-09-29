# Third-party notices

The repository is MIT-licensed ([`LICENSE`](./LICENSE)), and each tool folder carries the same MIT
license. The Advokat Frida name, the fox, and the visual identity are not covered; see
[`TRADEMARKS.md`](./TRADEMARKS.md).

- Each staged tool's MIT license is copied to `public/licenses/<tool>.txt`.
- Redactorium's build bundles third-party packages, among them React, pdf.js, SheetJS, jsPDF,
  JSZip and Papa Parse. The build writes every bundled package's name, version, license and
  license text to `public/tools/redactorium/THIRD-PARTY-LICENSES.txt`, from the modules actually
  in the bundle. pdf.js and SheetJS are Apache-2.0.
- Lucide icons retain the ISC license in `public/licenses/lucide-static.txt`.
- Anton, Archivo, and Space Grotesk retain the SIL Open Font License 1.1 in
  `public/licenses/af-fonts.txt` (and `public/tools/redactorium/fonts/OFL.txt` for Redactorium's
  copies).

`public/tool-sources.json` records the exact source artifact and hash for each staged tool.
