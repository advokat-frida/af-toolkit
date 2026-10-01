# PDF export font

`pdfFont.js` contains the unmodified Liberation Mono Regular 2.1.5 TTF as base64.
It is loaded only when exporting a PDF. jsPDF embeds the used glyphs and their
Unicode mapping, preserving U+25CF and the rest of its line in rendering and
text extraction. The monospace font preserves the existing export layout.
The browser makes no external font request.

Official release: https://github.com/liberationfonts/liberation-fonts/releases/tag/2.1.5

Release archive:
https://github.com/liberationfonts/liberation-fonts/files/7261482/liberation-fonts-ttf-2.1.5.tar.gz

- Archive SHA-256: `7191c669bf38899f73a2094ed00f7b800553364f90e2637010a69c0e268f25d0`
- `LiberationMono-Regular.ttf` SHA-256: `f2b83c763e8afd21709333370bed4774337fae82267937e2b5aea7e2fbd922c1`
- License: SIL Open Font License 1.1, copied in full to
  `frontend/public/fonts/liberation-mono-LICENSE.txt` and staged with the tool.

To reproduce the module, base64-encode the TTF bytes without line wrapping and
write them as the default exported string, retaining the module's license comment.
No font conversion or subsetting is done in the source; jsPDF subsets exports.
This font does not cover every Unicode script. The regression scope is the
reported black-circle bullet, adjacent text, existing Latin text, and pagination.
