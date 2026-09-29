// End to end through the same functions the page calls: parse, detect, apply the suggested
// plan, build the clean file, then read the clean file back and look for what should be gone.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFile } from "../src/redactorium/lib/parsers.js";
import { detectColumns } from "../src/redactorium/lib/detector.js";
import { applyTransformations, makeHasher } from "../src/redactorium/lib/transformers.js";
import { buildOutput, buildLogJSON } from "../src/redactorium/lib/exporters.js";
import { trickyDocx, TRICKY_DOCX_SECRETS, unzipText } from "./fixtures.mjs";

const planFrom = (detection) => detection.map((r) => ({
  key: r.key, mode: r.mode, index: r.index, header: r.header, detectorId: r.top?.detectorId || null, transform: r.suggested,
}));

async function redact(file, overrides = {}) {
  const parsed = await parseFile(file);
  const detection = detectColumns(parsed);
  const plan = planFrom(detection).map((p) => (overrides[p.key] ? { ...p, transform: overrides[p.key] } : p));
  const applied = await applyTransformations(parsed, plan, { seed: "test" });
  const output = await buildOutput({ ...parsed, headers: applied.headers, rows: applied.rows }, applied.edits);
  return { parsed, detection, plan, applied, output };
}

test("a CSV notes column: the personal data inside the sentence goes, the sentence stays", async () => {
  const csv = "name,notes\nAda Lovelace,call ada@example.org or +1 415 555 0134 about SSN 123-45-6789\nGrace Hopper,nothing here\n";
  const { detection, output } = await redact(new File([csv], "t.csv"));
  assert.deepEqual(detection.map((r) => r.key), ["col:0", "text:1:email", "text:1:ssn", "text:1:phone"]);
  const text = await output.blob.text();
  for (const secret of ["Ada Lovelace", "ada@example.org", "415 555 0134", "123-45-6789"]) assert.ok(!text.includes(secret), secret);
  assert.match(text, /call \[REDACTED\] or \[REDACTED\] about SSN \[REDACTED\]/);
  assert.ok(!/\n,\s*$/.test(text), "no empty trailing row");
});

test("a text file: each kind found is its own decision, and only matches change", async () => {
  const txt = "Contact Ada at ada@example.org.\nHer SSN is 123-45-6789.\nNothing else here.\nFrom 203.0.113.7 at 10:30.\n";
  const { detection, output } = await redact(new File([txt], "notes.txt"));
  assert.deepEqual(detection.map((r) => `${r.top.detectorId}:${r.suggested}`), ["email:redact", "ssn:redact", "ipv4:generalize"]);
  assert.equal(await output.blob.text(), "Contact Ada at [REDACTED].\nHer SSN is [REDACTED].\nNothing else here.\nFrom 203.0.0.0/16 at 10:30.\n");
});

test("a document with nothing personal says so and changes nothing", async () => {
  const { detection } = await redact(new File(["The quarterly numbers look fine.\n"], "memo.md"));
  assert.equal(detection.length, 1);
  assert.equal(detection[0].top, null);
  assert.equal(detection[0].empty, true);
});

test("keep leaves a kind alone while the other kinds are treated", async () => {
  const txt = "Mail ada@example.org from 203.0.113.7\n";
  const { output } = await redact(new File([txt], "a.log"), { "text:0:ipv4": "keep" });
  assert.equal(await output.blob.text(), "Mail [REDACTED] from 203.0.113.7\n");
});

test("a Word document: body, header, footnote, hyperlink, comments, tracked changes and properties", async () => {
  const { parsed, output, applied } = await redact(await trickyDocx());
  assert.equal(output.ext, "docx");
  const parts = await unzipText(output.blob);
  const all = Object.values(parts).join("\n");
  for (const secret of TRICKY_DOCX_SECRETS) assert.ok(!all.includes(secret), `still contains ${secret}`);
  // What was cleaned is reported.
  assert.deepEqual(parsed.meta.cleaned.comments, 1);
  assert.equal(parsed.meta.cleaned.trackedDeletions, 1);
  assert.equal(parsed.meta.cleaned.trackedInsertions, 1);
  assert.deepEqual(parsed.meta.cleaned.propertiesCleared, ["custom properties", "author", "last modified by", "company", "manager"]);
  assert.equal(parsed.meta.cleaned.dataPartsRemoved, 1);
  assert.equal(parsed.meta.cleaned.documentVariables, 1);
  assert.deepEqual(parsed.meta.cleaned.unread, ["pictures", "embedded files"]);
  assert.ok(!Object.keys(parts).some((p) => p.startsWith("customXml/")) && !parts["docProps/custom.xml"], "data parts removed");
  assert.ok(!parts["word/comments.xml"] && !parts["word/people.xml"], "comment parts removed");
  assert.ok(!/comments\.xml|people\.xml/.test(parts["word/_rels/document.xml.rels"] + parts["[Content_Types].xml"]), "comment wiring removed");
  // Only the personal parts of the alt text changed.
  assert.ok(parts["word/document.xml"].includes('descr="Badge photo, Name: [REDACTED], [REDACTED]"'), "alt text treated");
  // The accepted insertion survives; the untouched paragraph keeps its formatting byte for byte.
  assert.match(parts["word/document.xml"], /<w:t>verified<\/w:t>/);
  assert.match(parts["word/document.xml"], /<w:r><w:rPr><w:i\/><\/w:rPr><w:t>Nothing personal here\.<\/w:t><\/w:r>/);
  // The split email became one replacement in the run where it began; the bold run is emptied.
  assert.match(parts["word/document.xml"], /<w:t xml:space="preserve">Write to \[REDACTED\]<\/w:t><\/w:r><w:r><w:rPr><w:b\/><\/w:rPr><w:t><\/w:t><\/w:r><w:r><w:t xml:space="preserve"> today\.<\/w:t>/);
  assert.match(parts["word/_rels/document.xml.rels"], /Target="mailto:\[REDACTED\]"/);
  assert.ok(applied.stats.every((s) => s.changed === s.sampled), "every match was treated");
});

test("hash codes: same value, same code within a run; a random key by default; no raw SHA-256", async () => {
  const csv = "ssn\n123-45-6789\n123-45-6789\n234-56-7890\n";
  const parsed = await parseFile(new File([csv], "s.csv"));
  const plan = planFrom(detectColumns(parsed)).map((p) => ({ ...p, transform: "hash" }));
  const a = await applyTransformations(parsed, plan, {});
  const b = await applyTransformations(parsed, plan, {});
  assert.equal(a.rows[0][0], a.rows[1][0]);
  assert.notEqual(a.rows[0][0], a.rows[2][0]);
  assert.notEqual(a.rows[0][0], b.rows[0][0], "a fresh random key per run");
  assert.equal(a.hashKey, "random");
  const shared = await makeHasher("tenant-key");
  const c = await applyTransformations(parsed, plan, { hasher: shared });
  const d = await applyTransformations(parsed, plan, { hasher: await makeHasher("tenant-key") });
  assert.equal(c.rows[0][0], d.rows[0][0], "the same key repeats the codes");
  assert.equal(c.hashKey, "user-supplied");
  const { createHash } = await import("node:crypto");
  assert.notEqual(c.rows[0][0], createHash("sha256").update("123-45-6789").digest("hex").slice(0, 16));
});

test("the record describes the run without carrying the data", async () => {
  const csv = "name,notes\nAda Lovelace,call ada@example.org\n";
  const file = new File([csv], "customers-ada.csv");
  const { parsed, detection, plan, applied } = await redact(file);
  const log = buildLogJSON({
    inputFile: file, format: parsed.format, columnPlan: plan, stats: applied.stats, detectionResults: detection,
    inputHash: "a".repeat(64), outputHash: "b".repeat(64), salt: "", hashKey: applied.hashKey, seed: "test",
    startedAt: "2026-09-24T00:00:00.000Z", finishedAt: "2026-09-24T00:00:01.000Z", meta: parsed.meta,
  });
  const json = JSON.stringify(log);
  for (const secret of ["Ada Lovelace", "ada@example.org"]) assert.ok(!json.includes(secret), secret);
  assert.equal(log.parameters.hash_key, "random, generated for this run and not stored");
  const email = log.transformations.find((t) => t.detector === "email");
  assert.equal(email.found_in, "text");
  assert.equal(email.matches_found, 1);
  assert.equal(email.matches_changed, 1);
});
