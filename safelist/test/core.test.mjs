import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_RULES, STALE_AFTER_HOURS, applyDecisions, buildRecord, checkOne, detectEmailColumns, detectHeader,
  findDuplicates, findMatches, loadList, nameColumns, normalizeEmail, parseCSV, parseSuppression, recordText, reviewItems,
  shortHash, staleness, stamp, toCSV
} from "../src/core.js";

const sample = (name) => readFileSync(fileURLToPath(new URL(`../samples/${name}`, import.meta.url)), "utf8");

test("parseCSV handles quotes, doubled quotes, CRLF, a BOM, and blank lines", () => {
  const rows = parseCSV('\uFEFFa,b\r\n"x, y","say ""hi"""\r\n\r\nlast,row\n');
  assert.deepEqual(rows, [["a", "b"], ["x, y", 'say "hi"'], ["last", "row"]]);
});

test("toCSV quotes only what needs quoting and round-trips", () => {
  const rows = [["Email", "Note"], ["a@example.com", "plain"], [" padded ", 'has "quotes", commas']];
  const text = toCSV(rows);
  assert.equal(text, 'Email,Note\na@example.com,plain\n" padded ","has ""quotes"", commas"\n');
  assert.deepEqual(parseCSV(text), rows);
});

test("normalizeEmail folds the variants the suppression list never spells the same way twice", () => {
  assert.equal(normalizeEmail("  Dana Whitfield <Dana.Whitfield@Halvorsen.example.com> "), "dana.whitfield@halvorsen.example.com");
  assert.equal(normalizeEmail("mailto:LUCAS.BRANDT@northgate.example.com"), "lucas.brandt@northgate.example.com");
  assert.equal(normalizeEmail("tobias.lindqvist+events@copperline.example.com"), "tobias.lindqvist@copperline.example.com");
  assert.equal(normalizeEmail("J.O.H.N+news@Gmail.com"), "john@gmail.com");
  assert.equal(normalizeEmail("j.o.h.n@copperline.example.com"), "j.o.h.n@copperline.example.com", "dots fold only on gmail");
  assert.equal(normalizeEmail("tobias.lindqvist+events@copperline.example.com", { ...DEFAULT_RULES, plusTags: false }), "tobias.lindqvist+events@copperline.example.com");
  assert.equal(normalizeEmail("not an address"), null);
  assert.equal(normalizeEmail("*@quietharbor.example.net"), null, "a domain rule is not an address");
  assert.equal(normalizeEmail(""), null);
});

test("detectHeader tells a header row from a headerless list of addresses", () => {
  assert.equal(detectHeader([["Email Address", "Status"], ["a@example.com", "Unsubscribed"]]), true);
  assert.equal(detectHeader([["a@example.com"], ["b@example.com"]]), false);
  assert.equal(detectHeader([["*@example.com"], ["b@example.com"]]), false);
});

test("loadList finds the email column by content, whatever the header says", () => {
  const list = loadList(sample("cadence-audience.csv"));
  assert.equal(list.hasHeader, true);
  assert.equal(list.rows.length, 40);
  assert.equal(list.header.length, 8);
  assert.equal(list.emailColumns.length, 1);
  assert.equal(list.emailColumns[0].name, "Email");
  assert.equal(list.emailColumns[0].index, 4);
  assert.equal(list.emailColumns[0].ratio, 1);
});

test("detectEmailColumns ignores columns where fewer than half the cells are addresses", () => {
  const header = ["Name", "Contact"];
  const rows = [["Ann", "a@example.com"], ["Ben", "555-0100"], ["Cy", "c@example.com"], ["Di", "d@example.com"]];
  const columns = detectEmailColumns(header, rows);
  assert.deepEqual(columns.map((column) => column.name), ["Contact"]);
  assert.equal(columns[0].ratio, 0.75);
});

test("parseSuppression separates addresses from domain rules and counts them", () => {
  const list = loadList(sample("suppression-list.csv"));
  const suppression = parseSuppression(list);
  assert.equal(suppression.count, 62);
  assert.equal(suppression.domainCount, 1);
  assert.ok(suppression.domains.has("quietharbor.example.net"));
  assert.ok(suppression.emails.has("priya.natarajan@ardent.example.net"), "padded, quoted address is normalized");
  assert.ok(suppression.emails.has("dana.whitfield@halvorsen.example.com"), "display-name form is normalized");
  assert.deepEqual(suppression.invalid, []);
});

test("a headerless pasted column of addresses works as a suppression list", () => {
  const list = loadList("A@Example.com\nb@example.com\n*@gone.example.org\n");
  assert.equal(list.hasHeader, false);
  const suppression = parseSuppression(list);
  assert.equal(suppression.count, 2);
  assert.equal(suppression.domainCount, 1);
});

test("findMatches catches every variant in the samples and names the reason", () => {
  const send = loadList(sample("cadence-audience.csv"));
  const suppression = parseSuppression(loadList(sample("suppression-list.csv")));
  const matches = findMatches(send, [4], suppression);
  const byEmail = Object.fromEntries(matches.map((match) => [match.normalized, match.reason]));
  assert.equal(matches.length, 9);
  assert.equal(byEmail["dana.whitfield@halvorsen.example.com"], "address");
  assert.equal(byEmail["marisol.acevedo@meridian.example.org"], "address");
  assert.equal(byEmail["tobias.lindqvist@copperline.example.com"], "address");
  assert.equal(byEmail["priya.natarajan@ardent.example.net"], "address");
  assert.equal(byEmail["lucas.brandt@northgate.example.com"], "address");
  assert.equal(byEmail["hannah.stroud@pinewood.example.org"], "address");
  assert.equal(byEmail["owen.castellanos@redwood.example.com"], "address");
  assert.equal(byEmail["elena.marsh@quietharbor.example.net"], "domain");
  assert.equal(byEmail["ruben.oyelaran@quietharbor.example.net"], "domain");
  assert.equal(matches.find((match) => match.reason === "domain").domain, "quietharbor.example.net");
});

test("domain rules can be switched off", () => {
  const send = loadList(sample("cadence-audience.csv"));
  const rules = { ...DEFAULT_RULES, domainRules: false };
  const suppression = parseSuppression(loadList(sample("suppression-list.csv")), rules);
  assert.equal(findMatches(send, [4], suppression, rules).length, 7);
});

test("findDuplicates flags the second copy of an address and points at the first", () => {
  const send = loadList(sample("cadence-audience.csv"));
  const duplicates = findDuplicates(send, [4]);
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].row, 10);
  assert.equal(duplicates[0].duplicateOf, 9);
  assert.equal(findDuplicates(send, [4], { ...DEFAULT_RULES, dedupe: false }).length, 0);
});

test("reviewItems is one row per contact, sorted, matches winning over duplicates", () => {
  const items = reviewItems([{ row: 5, normalized: "x", reason: "address" }], [{ row: 5, duplicateOf: 1 }, { row: 2, duplicateOf: 0 }]);
  assert.deepEqual(items.map((item) => [item.row, item.kind]), [[2, "duplicate"], [5, "match"]]);
});

test("checkOne answers for a single address", () => {
  const suppression = parseSuppression(loadList(sample("suppression-list.csv")));
  assert.equal(checkOne("Priya.Natarajan@ardent.example.net", suppression).status, "listed");
  assert.equal(checkOne("someone@quietharbor.example.net", suppression).reason, "domain");
  assert.equal(checkOne("imogen.wren@wrenco.example.com", suppression).status, "clear");
  assert.equal(checkOne("nope", suppression).status, "invalid");
});

test("applyDecisions refuses to finish with an undecided row and otherwise counts honestly", () => {
  const send = loadList(sample("cadence-audience.csv"));
  const suppression = parseSuppression(loadList(sample("suppression-list.csv")));
  const items = reviewItems(findMatches(send, [4], suppression), findDuplicates(send, [4]));
  assert.equal(items.length, 10);
  const partial = applyDecisions(send, items, { 0: { decision: "remove" } });
  assert.equal(partial.ok, false);
  assert.equal(partial.missing.length, 9);
  const decisions = {};
  for (const item of items) decisions[item.row] = { decision: item.normalized === "priya.natarajan@ardent.example.net" ? "keep" : "remove", reason: "Active customer" };
  const result = applyDecisions(send, items, decisions);
  assert.equal(result.ok, true);
  assert.deepEqual(result.counts, { input: 40, output: 31, matched: 9, removed: 8, keptOnList: 1, duplicates: 1, duplicatesRemoved: 1 });
  assert.equal(result.rows.length, 31);
  assert.ok(result.rows.some((cells) => cells[4] === "priya.natarajan@ardent.example.net"), "kept contact stays");
  assert.ok(!result.rows.some((cells) => cells[4].toLowerCase() === "sofia.reinholt@tessellate.example.com" && cells[5] === "Trade show"), "duplicate row is gone");
});

test("staleness blocks a suppression list older than the limit", () => {
  const now = new Date("2026-09-02T10:00:00Z");
  assert.equal(staleness(new Date("2026-09-02T08:10:00Z"), now).blocked, false);
  assert.equal(staleness(new Date("2026-09-02T08:10:00Z"), now).age, "2 hours old");
  assert.equal(staleness(new Date("2026-08-30T08:10:00Z"), now).blocked, true);
  assert.equal(staleness(new Date("2026-08-30T08:10:00Z"), now).age, "3 days old");
  assert.equal(STALE_AFTER_HOURS, 24);
});

test("stamp and shortHash follow the record grammar", () => {
  assert.equal(stamp("2026-09-02T10:15:30.123Z"), "2026-09-02T10:15Z");
  assert.equal(shortHash("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"), "0123456789ab…abcdef");
});

test("buildRecord fingerprints removed contacts and names only the kept ones", async () => {
  const sendText = sample("cadence-audience.csv");
  const suppText = sample("suppression-list.csv");
  const send = loadList(sendText);
  const suppression = parseSuppression(loadList(suppText));
  const items = reviewItems(findMatches(send, [4], suppression), findDuplicates(send, [4]));
  const decisions = {};
  for (const item of items) decisions[item.row] = { decision: item.normalized === "priya.natarajan@ardent.example.net" ? "keep" : "remove", reason: "Active customer, open support thread" };
  const result = applyDecisions(send, items, decisions);
  const outputText = toCSV([send.header, ...result.rows]);
  const input = {
    now: "2026-09-02T10:15:00Z",
    sendList: { name: "cadence-audience.csv", rows: 40, columns: send.header, text: sendText },
    suppression: { name: "suppression-list.csv", fileDate: "2026-09-02T08:10:00Z", count: suppression.count, domainCount: suppression.domainCount, text: suppText },
    matchColumns: ["Email"],
    origin: "crm",
    rules: DEFAULT_RULES,
    items,
    decisions,
    counts: result.counts,
    output: { name: "cadence-audience.checked.csv", rows: result.rows.length, text: outputText }
  };
  const record = await buildRecord(input);
  const again = await buildRecord(input);
  assert.equal(record.recordSha256, again.recordSha256, "same inputs, same record hash");
  assert.equal(record.decisions.length, 10);
  const kept = record.decisions.filter((entry) => entry.decision === "keep");
  assert.equal(kept.length, 1);
  assert.equal(kept[0].email, "priya.natarajan@ardent.example.net");
  assert.equal(kept[0].keepReason, "Active customer, open support thread");
  for (const entry of record.decisions.filter((item) => item.decision === "remove")) {
    assert.equal(entry.email, undefined, "removed contacts are fingerprints only");
    assert.match(entry.emailSha256, /^[0-9a-f]{64}$/);
  }
  assert.equal(record.suppressionList.ageHours, 2.08);
  assert.equal(record.counts.output, 31);
  const text = recordText(record);
  assert.match(text, /^SAFELIST RECORD [0-9a-f]{12}…[0-9a-f]{6} · 2026-09-02T10:15Z/);
  assert.match(text, /KEPT: row 4 priya\.natarajan@ardent\.example\.net — Active customer/);
});

/* ---------- the header shapes real exports use (ADVO-172) ---------- */

const engagementExport = [
  "First Name,Last Name,Email Address,Personal Email,Title,Account Name,Phone,Mobile Phone,Cadence,Owner,Do Not Contact",
  "Dana,Whitfield,dana.whitfield@halvorsen.example.com,,VP Data,Halvorsen,+1 555 0100,,Q3 outreach,Ari,FALSE",
  "Noor,Haddad,noor.haddad@meridian.example.org,noor.h@gmail.com,Privacy Lead,Meridian,,+1 555 0101,Q3 outreach,Ari,FALSE",
  "Sam,Okafor,sam.okafor@ardent.example.net,sam.okafor@outlook.com,CISO,Ardent,+1 555 0102,,Q3 outreach,Bea,TRUE"
].join("\n");

const unsubscribeExport = [
  "Id,First Name,Last Name,Email Address,Company Name,Unsubscribed,Unsubscribed Reason,Email Invalid,Marketing Suspended,Black Listed,Updated At",
  "1041,Dana,Whitfield,Dana.Whitfield@Halvorsen.example.com,Halvorsen,TRUE,Customer request,FALSE,FALSE,FALSE,2026-08-30 09:12",
  "1042,Noor,Haddad,noor.h@gmail.com,Meridian,TRUE,Unsubscribe link,FALSE,FALSE,FALSE,2026-08-31 14:03",
  "1043,Lee,Park,lee.park@copperline.example.com,Copperline,FALSE,,TRUE,FALSE,FALSE,2026-09-01 08:45"
].join("\r\n");

const crmReport = '"First Name","Last Name","Title","Account Name","Email","Phone","Lead Status","Email Opt Out","Do Not Call"\r\n'
  + '"Dana","Whitfield","VP Data","Halvorsen","dana.whitfield@halvorsen.example.com","(555) 010-0100","Working","1","0"\r\n'
  + '"Priya","Natarajan","Counsel","Ardent","priya.natarajan@ardent.example.net","","Open","0","1"\r\n';

const apiExport = "FirstName,LastName,Email,Company,HasOptedOutOfEmail,DoNotCall\nDana,Whitfield,dana.whitfield@halvorsen.example.com,Halvorsen,true,false\n";

test("a sales engagement people export: both email columns found, work address first, names and account named", () => {
  const list = loadList(engagementExport);
  assert.equal(list.hasHeader, true);
  assert.deepEqual(list.emailColumns.map((column) => column.name), ["Email Address", "Personal Email"]);
  assert.equal(list.emailColumns[1].ratio, 1, "a half-empty personal column still counts by its filled cells");
  const names = nameColumns(list.header);
  assert.deepEqual([names.first, names.last, names.full, names.company], [0, 1, -1, 5]);
});

test("a suppressed personal address is caught when every email column is matched", () => {
  const send = loadList(engagementExport);
  const suppression = parseSuppression(loadList("Email Address\nnoor.h@gmail.com\n"));
  assert.equal(findMatches(send, [2], suppression).length, 0, "the work column alone misses it");
  const matches = findMatches(send, send.emailColumns.map((column) => column.index), suppression);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].normalized, "noorh@gmail.com", "gmail dots fold on both sides");
});

test("a marketing automation unsubscribe export: flag columns never read as addresses, every row suppresses", () => {
  const list = loadList(unsubscribeExport);
  assert.deepEqual(list.emailColumns.map((column) => column.name), ["Email Address"]);
  const suppression = parseSuppression(list);
  assert.equal(suppression.emails.size, 3);
  assert.equal(suppression.domains.size, 0);
  assert.deepEqual(suppression.invalid, []);
  assert.ok(suppression.emails.has("dana.whitfield@halvorsen.example.com"), "mixed case folds");
  assert.equal(nameColumns(list.header).company, 4, "Company Name");
});

test("a CRM report export with quoted cells and opt-out flags: one email column, account named", () => {
  const list = loadList(crmReport);
  assert.equal(list.rows.length, 2);
  assert.deepEqual(list.emailColumns.map((column) => column.name), ["Email"]);
  const names = nameColumns(list.header);
  assert.deepEqual([names.first, names.last, names.company], [0, 1, 3]);
});

test("an API-style header without spaces still names first, last and company", () => {
  const list = loadList(apiExport);
  assert.deepEqual(list.emailColumns.map((column) => column.name), ["Email"]);
  assert.deepEqual(nameColumns(list.header), { first: 0, last: 1, full: -1, company: 3 });
});

test("nameColumns prefers the exact column over a looser match", () => {
  assert.equal(nameColumns(["Account Owner", "Account Name", "Email"]).company, 1);
  assert.equal(nameColumns(["Contact Name", "Email"]).full, 0);
  assert.equal(nameColumns(["Surname", "Given"]).last, 0);
  assert.deepEqual(nameColumns(["Email"]), { first: -1, last: -1, full: -1, company: -1 });
});
