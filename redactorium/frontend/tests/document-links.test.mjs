import { test } from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { SaxesParser } from "saxes";
import { parseFile } from "../src/redactorium/lib/parsers.js";
import { detectColumns } from "../src/redactorium/lib/detector.js";
import { applyTransformations } from "../src/redactorium/lib/transformers.js";
import { buildOutput, buildLogJSON } from "../src/redactorium/lib/exporters.js";
import { scanText } from "../src/redactorium/lib/textScan.js";
import { unzipText } from "./fixtures.mjs";

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';
const link = "https://portfolio.example/alex?contact=alex@example.org&amp;ref=resume";
const label = '<w:r><w:rPr><w:b/></w:rPr><w:t>Portfolio</w:t></w:r>';
const paths = ["word/document.xml", "word/header1.xml", "word/footer1.xml", "word/footnotes.xml", "word/endnotes.xml", "word/glossary/document.xml"];
const relPath = (path) => path.replace(/([^/]+)$/, "_rels/$1.rels");

async function linkedDocx() {
  const zip = new JSZip();
  for (const path of paths) {
    // Reuse the relationship ID in different parts: IDs have part-local scope.
    zip.file(path, `<w:document ${W}><w:body>`
      + `<w:p><w:hyperlink r:id="rWeb">${label}</w:hyperlink></w:p>`
      + '<w:p><w:hyperlink r:id="rWeb"/><w:r><w:drawing><a:hlinkClick r:id="rWeb"/><a:hlinkHover r:id="rWeb"></a:hlinkHover></w:drawing></w:r></w:p>'
      + '<w:p><w:hyperlink w:anchor="experience"><w:r><w:t>Experience</w:t></w:r></w:hyperlink></w:p>'
      + `<w:p><w:fldSimple w:instr=" HYPERLINK &quot;https://simple.example/alex&quot; ">${label}</w:fldSimple></w:p>`
      + '<w:p><w:r><w:fldChar w:fldCharType="begin"></w:fldChar></w:r>'
      + '<w:r><w:instrText xml:space="preserve"> HYPERLINK "https://complex.</w:instrText></w:r>'
      + '<w:r><w:instrText xml:space="preserve">example/alex" </w:instrText></w:r>'
      + `<w:r><w:fldChar w:fldCharType="separate"/></w:r>${label}<w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>`
      + '<w:p><w:r><w:t>Visit https://visible.example/alex.</w:t></w:r></w:p>'
      + '<w:p><w:r><w:fldChar w:fldCharType="begin"/><w:instrText> PAGE </w:instrText><w:fldChar w:fldCharType="separate"/><w:t>1</w:t><w:fldChar w:fldCharType="end"/></w:r></w:p>'
      + '</w:body></w:document>');
    zip.file(relPath(path), `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rWeb" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${link}" TargetMode="External"/></Relationships>`);
  }
  zip.file("word/numbering.xml", '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="●"/></w:lvl></w:abstractNum></w:numbering>');
  return new File([await zip.generateAsync({ type: "uint8array" })], "resume.docx");
}

async function run(file, transform = "redact") {
  const parsed = await parseFile(file);
  const detection = detectColumns(parsed);
  const plan = detection.map((r) => ({ key: r.key, mode: r.mode, index: r.index, header: r.header, detectorId: r.top?.detectorId, transform }));
  const applied = await applyTransformations(parsed, plan);
  const output = await buildOutput({ ...parsed, rows: applied.rows }, applied.edits);
  // Check every complete XML part: string assertions alone can miss a lost closing tag.
  for (const [path, xml] of Object.entries(parsed.format === "docx" ? await unzipText(output.blob) : {})) {
    if (/\.(?:xml|rels)$/.test(path)) {
      assert.doesNotThrow(() => new SaxesParser({ xmlns: true }).write(xml).close(), path);
    }
  }
  return { parsed, detection, plan, applied, output };
}

test("web addresses include the full destination, even when it contains other identifiers", () => {
  const text = 'See (https://example.org/Alex_(profile)), www.portfolio.example/alex; https://example.org/?email=alex@example.org&phone=415-555-0134.';
  assert.deepEqual(scanText(text).map((s) => [s.detectorId, s.value]), [
    ["url", "https://example.org/Alex_(profile)"],
    ["url", "www.portfolio.example/alex"],
    ["url", "https://example.org/?email=alex@example.org&phone=415-555-0134"],
  ]);
  assert.deepEqual(scanText("Portfolio: 'https://example.org/O'Connor'.").map((s) => s.value), ["https://example.org/O'Connor"]);
});

test("Word redaction unlinks relationships and both field forms while preserving labels and numbering", async () => {
  const file = await linkedDocx();
  const r = await run(file);
  assert.equal(r.detection.find((d) => d.top?.detectorId === "url")?.top.matches, 24);
  const parts = await unzipText(r.output.blob);
  for (const path of paths) {
    assert.ok(!/portfolio\.example|simple\.example|complex\.|visible\.example|alex@example/.test(parts[path] + parts[relPath(path)]), path);
    assert.ok(!/r:id="rWeb"|HYPERLINK|fldSimple/.test(parts[path]), path);
    assert.ok(!/TargetMode="External"/.test(parts[relPath(path)]), path);
    assert.equal(parts[path].split(label).length - 1, 3, "all formatted labels survive");
    assert.match(parts[path], /w:anchor="experience"/, "internal bookmarks stay linked");
    assert.match(parts[path], /<w:instrText> PAGE <\/w:instrText>/, "unrelated fields survive");
    assert.match(parts[path], /Visit \[REDACTED\]\./, "visible URLs are replaced");
  }
  assert.equal(parts["word/numbering.xml"], (await unzipText(file))["word/numbering.xml"]);
  const log = buildLogJSON({ inputFile: file, parsed: r.parsed, format: "docx", columnPlan: r.plan, stats: r.applied.stats, detectionResults: r.detection, meta: r.parsed.meta });
  assert.equal(log.transformations.find((t) => t.detector === "url").matches_changed, 24);
  assert.ok(!/portfolio\.example|simple\.example|complex\.|visible\.example|alex@example/.test(JSON.stringify(log)));
});

test("Keep preserves web links and their field structure byte for byte", async () => {
  const file = await linkedDocx();
  const before = await unzipText(file);
  const r = await run(file, "keep");
  assert.ok(r.detection.some((d) => d.top?.detectorId === "url"));
  assert.deepEqual(await unzipText(r.output.blob), before);
  assert.ok(r.applied.stats.every((s) => s.changed === 0));
});

test("codes and generalization remove link wiring; synthetic URLs remain valid destinations", async () => {
  for (const method of ["hash", "generalize", "synthetic"]) {
    const r = await run(await linkedDocx(), method);
    const parts = await unzipText(r.output.blob);
    const all = Object.values(parts).join("\n");
    assert.ok(!/portfolio\.example|simple\.example|complex\.|visible\.example|alex@example/.test(all), method);
    if (method === "synthetic") {
      for (const path of paths) {
        assert.match(parts[path], /HYPERLINK &quot;https:\/\/example\.com\//);
        assert.match(parts[relPath(path)], /Target="https:\/\/example\.com\//);
      }
    } else {
      for (const path of paths) assert.ok(!/r:id="rWeb"|HYPERLINK/.test(parts[path]), method);
    }
  }
});

test("a non-hyperlink external target receives a valid reserved URL after redaction", async () => {
  const zip = await JSZip.loadAsync(await (await linkedDocx()).arrayBuffer());
  const path = "word/_rels/document.xml.rels";
  zip.file(path, (await zip.file(path).async("string")).replace("/hyperlink", "/image"));
  const r = await run(new File([await zip.generateAsync({ type: "uint8array" })], "external.docx"));
  const parts = await unzipText(r.output.blob);
  assert.match(parts[path], /Target="https:\/\/redacted\.invalid\/"/);
  assert.ok(!parts[path].includes("[REDACTED]"));
});

test("software names using MS do not turn the preceding list item into a location", async () => {
  const skills = "Collaboration and Project Management: Asana, SharePoint, Notion, Confluence, MS Teams, GSuite, Slack, Power Automate";
  assert.deepEqual(scanText(skills), []);
  for (const product of ["Teams", "Office", "Excel", "Word", "Outlook", "Access", "PowerPoint", "Project", "Visio"]) {
    assert.deepEqual(scanText(`Tools: Confluence, MS ${product}`), []);
  }
  assert.deepEqual(scanText("Jackson, MS; Redlands, CA; Madison, Wisconsin.").map((s) => s.value), ["Jackson, MS", "Redlands, CA", "Madison, Wisconsin"]);
  for (const text of ["Jackson, MS office", "Our Jackson, MS office has moved.", "The Jackson, MS project starts Monday.", "Jackson, MS Office", "Jackson, MS access road"]) {
    assert.ok(scanText(text).some((s) => s.detectorId === "place_us" && s.value.endsWith("Jackson, MS")), text);
  }
  const r = await run(new File([skills + "\nLocation: Jackson, MS"], "notes.txt"));
  assert.equal(r.output.text, skills + "\nLocation: [REDACTED]");
});
