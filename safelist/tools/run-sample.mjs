// Run the engine over the sample lists exactly as the page would, with one Keep
// decision, and write the "after" file plus its record next to the "before" files.
//   node tools/run-sample.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_RULES, applyDecisions, buildRecord, findDuplicates, findMatches, loadList, parseSuppression,
  recordText, reviewItems, toCSV
} from "../src/core.js";

const root = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const sendText = readFileSync(root("samples/cadence-audience.csv"), "utf8");
const suppText = readFileSync(root("samples/suppression-list.csv"), "utf8");

const send = loadList(sendText);
const suppression = parseSuppression(loadList(suppText), DEFAULT_RULES);
const column = send.emailColumns[0].index;
const items = reviewItems(findMatches(send, [column], suppression, DEFAULT_RULES), findDuplicates(send, [column], DEFAULT_RULES));

// The one Keep in the sample: an existing customer with an open support thread.
const decisions = {};
for (const item of items) {
  decisions[item.row] = item.normalized === "priya.natarajan@ardent.example.net"
    ? { decision: "keep", reason: "Active customer, open support thread with our team" }
    : { decision: "remove", reason: "" };
}

const result = applyDecisions(send, items, decisions);
if (!result.ok) throw new Error(`undecided rows: ${result.missing.join(", ")}`);
const outputText = toCSV([send.header, ...result.rows]);
const record = await buildRecord({
  now: "2026-09-02T10:15:00Z",
  sendList: { name: "cadence-audience.csv", rows: send.rows.length, columns: send.header, text: sendText },
  suppression: { name: "suppression-list.csv", fileDate: "2026-09-02T08:10:00Z", count: suppression.count, domainCount: suppression.domainCount, text: suppText },
  matchColumns: [send.header[column]],
  origin: "crm",
  rules: DEFAULT_RULES,
  items,
  decisions,
  counts: result.counts,
  output: { name: "cadence-audience.checked.csv", rows: result.rows.length, text: outputText }
});

writeFileSync(root("samples/cadence-audience.checked.csv"), outputText);
writeFileSync(root("samples/safelist-record.json"), `${JSON.stringify(record, null, 2)}\n`);
writeFileSync(root("samples/safelist-record.txt"), `${recordText(record)}\n`);
console.log(recordText(record));
