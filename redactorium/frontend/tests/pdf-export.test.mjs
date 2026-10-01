import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { buildOutput } from "../src/redactorium/lib/exporters.js";

const standardFontDataUrl = fileURLToPath(new URL("../node_modules/pdfjs-dist/standard_fonts/", import.meta.url));

async function readExport(lines, pageStarts = [0]) {
  const output = await buildOutput({
    kind: "text", format: "pdf", headers: ["text"], rows: lines.map((line) => [line]),
    meta: { pageStarts },
  });
  const pdf = await getDocument({ data: new Uint8Array(await output.blob.arrayBuffer()), standardFontDataUrl }).promise;
  try {
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const content = await (await pdf.getPage(i)).getTextContent();
      pages.push(content.items.filter((item) => item.str).map((item) => item.str));
    }
    return pages;
  } finally {
    await pdf.destroy();
  }
}

test("PDF export preserves black-circle bullets and the complete following text", async () => {
  const lines = [
    "Synthetic qualifications",
    "\u25cf The whole qualification stays readable after export.",
    "\u2022 An ordinary bullet stays readable too.",
    "Email: [REDACTED]",
  ];
  assert.deepEqual(await readExport(lines), [lines]);
});

test("Unicode PDF text and original page boundaries survive export", async () => {
  const lines = ["\u25cf R\u00e9sum\u00e9 \u2014 \u00e6 \u00f8 \u00e5", "\u25cf Second page: [REDACTED]"];
  assert.deepEqual(await readExport(lines, [0, 1]), [[lines[0]], [lines[1]]]);
});

test("bullet lines stay intact when a text-only PDF needs another page", async () => {
  const lines = Array.from({ length: 65 }, (_, i) => `\u25cf Qualification ${i + 1}: this entire line stays visible.`);
  const pages = await readExport(lines);
  assert.equal(pages.length, 2);
  assert.deepEqual(pages.flat(), lines);
});
