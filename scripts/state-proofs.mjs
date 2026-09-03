// State proofs — drives the staged Toolkit through every state the design canvas draws
// (Toolkit - Redesign, artboards 2A–4I; Build-A-Prompt's 3D/4G retired with the tool) at the artboard geometry (1360×800) and writes one
// screenshot per state to proofs/states/. The judgment half of the review gate compares
// these against the canvas renders; a state that cannot be reached fails the run.
// SafeList (5A–5D) has no canvas artboard; its proofs are reviewed against DESIGN-SYSTEM.md.
//
//   node scripts/state-proofs.mjs            all states
//   node scripts/state-proofs.mjs 4f-pwc-determination
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = join(repoRoot, "public");
const proofsRoot = join(repoRoot, "proofs", "states");
const only = process.argv[2];

const types = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".woff2", "font/woff2"]
]);

function startServer() {
  const server = createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url || "/", "http://qa").pathname);
    } catch {
      response.writeHead(400).end();
      return;
    }
    const requested = pathname === "/" ? "/index.html" : pathname;
    const candidate = resolve(publicRoot, `.${normalize(requested)}`);
    if (relative(publicRoot, candidate).startsWith("..") || !existsSync(candidate)) {
      response.writeHead(404).end("not found");
      return;
    }
    const path = statSync(candidate).isDirectory() ? join(candidate, "index.html") : candidate;
    if (!existsSync(path)) {
      response.writeHead(404).end("not found");
      return;
    }
    response.writeHead(200, { "Content-Type": types.get(extname(path).toLowerCase()) || "application/octet-stream" });
    createReadStream(path).pipe(response);
  });
  return new Promise((resolvePromise) => {
    server.listen(0, "127.0.0.1", () => resolvePromise({ server, port: server.address().port }));
  });
}

// Each state names the canvas artboard it proves.
function states(page, base) {
  async function open(route) {
    await page.goto(`${base}/?s=${Date.now()}#${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    if (route !== "home") {
      await page.waitForSelector(`[data-view="${route}"]:not([hidden]) .frame-stage.is-loaded`, { timeout: 20000 });
      await page.waitForTimeout(700);
    }
    return page.frameLocator(`[data-view="${route}"] iframe`);
  }
  const answerRows = async (frame, count) => {
    const rows = frame.locator(".oo-question-row");
    for (let index = 0; index < count; index += 1) await rows.nth(index).locator("button").first().click();
  };
  const generateSeed = async (frame) => {
    await frame.getByRole("button", { name: "Generate", exact: true }).last().click();
    await frame.getByRole("button", { name: "Download CSV" }).waitFor({ timeout: 20000 });
  };

  return {
    "2a-home": async () => { await open("home"); },
    "2a-home-changelog": async () => {
      await open("home");
      await page.evaluate(() => {
        const view = document.querySelector('[data-view="home"]');
        view.scrollTop = view.scrollHeight;
        window.scrollTo(0, document.body.scrollHeight);
      });
    },
    "3a-redactorium-landing": async () => { await open("redactorium"); },
    "4a-redactorium-findings": async () => {
      const frame = await open("redactorium");
      await frame.locator("[data-testid=use-sample-btn]").click();
      await frame.locator("[data-testid=detection-table]").waitFor({ timeout: 20000 });
    },
    "4b-redactorium-record": async () => {
      const frame = await open("redactorium");
      await frame.locator("[data-testid=use-sample-btn]").click();
      await frame.locator("[data-testid=apply-transformations-btn]").waitFor({ timeout: 20000 });
      await frame.locator("[data-testid=apply-transformations-btn]").click();
      await frame.locator("[data-testid=download-clean-btn]").waitFor({ timeout: 30000 });
    },
    "3b-safeseed-columns": async () => { await open("safeseed"); },
    "4c-safeseed-preview": async () => { const frame = await open("safeseed"); await generateSeed(frame); },
    "4d-safeseed-verify-result": async () => {
      const frame = await open("safeseed");
      await generateSeed(frame);
      const scratch = join(tmpdir(), `toolkit-state-proofs-${process.pid}`);
      await mkdir(scratch, { recursive: true });
      const [csv] = await Promise.all([page.waitForEvent("download"), frame.getByRole("button", { name: "Download CSV" }).click()]);
      const csvPath = join(scratch, csv.suggestedFilename());
      await csv.saveAs(csvPath);
      const [receipt] = await Promise.all([page.waitForEvent("download"), frame.getByRole("button", { name: "Download receipt" }).click()]);
      const receiptPath = join(scratch, receipt.suggestedFilename());
      await receipt.saveAs(receiptPath);
      await frame.getByRole("button", { name: "Edit columns" }).click();
      await frame.getByRole("button", { name: "Verify a file" }).click();
      await page.waitForTimeout(300);
      const inputs = frame.locator("input[type=file]");
      await inputs.nth(0).setInputFiles(csvPath);
      await inputs.nth(1).setInputFiles(receiptPath);
      await page.waitForTimeout(300);
      await frame.locator(".verify-go").click();
      await frame.locator(".verdict-title").waitFor({ timeout: 20000 });
    },
    "4d-safeseed-verify-empty": async () => {
      const frame = await open("safeseed");
      await frame.getByRole("button", { name: "Verify a file" }).click();
    },
    "5a-safelist-landing": async () => { await open("safelist"); },
    "5b-safelist-loaded": async () => {
      const frame = await open("safelist");
      await frame.getByRole("button", { name: "Load the sample lists" }).click();
      await frame.locator("#setup:not(.hidden)").waitFor({ timeout: 20000 });
    },
    "5c-safelist-review": async () => {
      const frame = await open("safelist");
      await frame.getByRole("button", { name: "Load the sample lists" }).click();
      await frame.getByRole("button", { name: "Check the list" }).click();
      await frame.locator("#view-review:not(.hidden)").waitFor({ timeout: 20000 });
    },
    "5d-safelist-record": async () => {
      const frame = await open("safelist");
      await frame.getByRole("button", { name: "Load the sample lists" }).click();
      await frame.getByRole("button", { name: "Check the list" }).click();
      await frame.locator("#view-review:not(.hidden)").waitFor({ timeout: 20000 });
      const kept = frame.locator("tr.sl-review-row", { hasText: "priya.natarajan" });
      await kept.getByRole("button", { name: "Keep contact" }).click();
      await kept.locator("input.sl-reason").fill("Active customer, open support thread");
      await frame.getByRole("button", { name: "Remove the rest" }).click();
      await frame.getByRole("button", { name: "Finish and download" }).click();
      await frame.locator("#view-done:not(.hidden)").waitFor({ timeout: 20000 });
      await page.waitForTimeout(400);
    },
    "3c-wizards-finder": async () => { await open("privacy-wizards"); },
    "4e-wizards-question": async () => {
      const frame = await open("privacy-wizards");
      await frame.locator(".wizard-row").first().click();
      await frame.locator(".answer-card").first().waitFor({ timeout: 20000 });
      await frame.locator(".answer-card").first().click();
      await frame.getByRole("button", { name: "Next", exact: true }).click();
      await frame.locator(".answer-card").first().waitFor({ timeout: 20000 });
      await frame.locator(".answer-card").first().click();
      await page.waitForTimeout(400);
    },
    "4f-wizards-determination": async () => {
      const frame = await open("privacy-wizards");
      await frame.locator(".wizard-row").first().click();
      for (let step = 0; step < 14; step += 1) {
        if (await frame.locator(".verdict-block").count()) break;
        await frame.locator(".answer-card").first().waitFor({ timeout: 20000 });
        await frame.locator(".answer-card").first().click();
        await frame.getByRole("button", { name: "Next", exact: true }).click();
        await page.waitForTimeout(350);
      }
      await frame.locator(".verdict-block").waitFor({ timeout: 20000 });
    },
    "3e-oracle-landing": async () => { await open("objection-oracle"); },
    "4h-oracle-questions": async () => {
      const frame = await open("objection-oracle");
      await frame.locator("#start-button").click();
      await frame.locator(".oo-question-row").first().waitFor({ timeout: 20000 });
      await answerRows(frame, 3);
    },
    "4i-oracle-ruling": async () => {
      const frame = await open("objection-oracle");
      await frame.locator("#start-button").click();
      await frame.locator(".oo-question-row").first().waitFor({ timeout: 20000 });
      await answerRows(frame, await frame.locator(".oo-question-row").count());
      await frame.locator("#ask-button").click();
      await frame.locator("#view-result:not(.hidden)").waitFor({ timeout: 30000 });
      await page.waitForTimeout(600);
    }
  };
}

async function main() {
  await mkdir(proofsRoot, { recursive: true });
  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1360, height: 800 }, acceptDownloads: true });
  // Timestamped states (records, receipts) must screenshot the same bytes on every run.
  await page.clock.setFixedTime(new Date("2026-09-01T12:00:00Z"));
  const failures = [];
  page.on("pageerror", (error) => failures.push(`page error: ${error.message}`));

  try {
    for (const [name, run] of Object.entries(states(page, base))) {
      if (only && name !== only) continue;
      try {
        await run();
        await page.waitForTimeout(500);
        await page.screenshot({ path: join(proofsRoot, `${name}.png`) });
        process.stdout.write(`PASS  ${name}\n`);
      } catch (error) {
        failures.push(`${name}: ${String(error.message).split("\n")[0]}`);
        process.stdout.write(`FAIL  ${name}\n`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (failures.length) {
    process.stdout.write(`\n${failures.join("\n")}\n${failures.length} state(s) could not be proved.\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write("\nEvery canvas state reached. Compare proofs/states/ against the canvas renders before sign-off.\n");
}

await main();
