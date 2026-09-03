// Walk the built page through its states with the sample lists and screenshot each one.
//   node tools/build.mjs && node harness/shots.mjs
// Playwright resolves from the repository root's node_modules.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = join(root, "dist");
const out = join(root, "shots");
mkdirSync(out, { recursive: true });

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript" };
const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://x").pathname);
  const file = resolve(dist, `.${normalize(pathname === "/" ? "/safelist.html" : pathname)}`);
  if (!file.startsWith(dist) || !existsSync(file)) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(response);
});
await new Promise((ready) => server.listen(0, "127.0.0.1", ready));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
page.on("pageerror", (error) => console.log("pageerror:", error.message));
page.on("console", (message) => { if (message.type() === "error") console.log("console:", message.text()); });

async function shot(name, options = {}) {
  await page.waitForTimeout(350);
  await page.screenshot({ path: join(out, `${name}.png`), fullPage: Boolean(options.fullPage) });
  console.log(`${name}.png`);
}

await page.goto(`${base}/safelist.html`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await shot("01-load-empty");

await page.getByRole("button", { name: "Load the sample lists" }).click();
await page.waitForTimeout(300);
await shot("02-load-samples", { fullPage: true });

await page.locator("#one-address").fill("Priya.Natarajan@ardent.example.net");
await page.getByRole("button", { name: "Check", exact: true }).click();
await page.waitForTimeout(200);
await shot("03-check-one");

await page.getByRole("button", { name: "Check the list" }).click();
await page.waitForSelector("#view-review:not(.hidden)");
await shot("04-review-undecided", { fullPage: true });

const priya = page.locator("tr.sl-review-row", { hasText: "priya.natarajan" });
await priya.getByRole("button", { name: "Keep contact" }).click();
await priya.locator("input.sl-reason").fill("Active customer, open support thread with our team");
const rows = page.locator("tr.sl-review-row");
for (const index of [0, 1, 2]) {
  await rows.nth(index).getByRole("button", { name: "Remove contact" }).click();
}
await shot("05-review-deciding", { fullPage: true });

await page.getByRole("button", { name: "Remove the rest" }).click();
await page.waitForTimeout(200);
await shot("06-review-all-decided", { fullPage: true });

await page.getByRole("button", { name: "Finish and download" }).click();
await page.waitForSelector("#view-done:not(.hidden)");
await page.waitForTimeout(400);
await shot("07-done", { fullPage: true });

const violations = await page.evaluate(() => window.__safelistNetViolations());
console.log(`network violations: ${violations}`);

await page.setViewportSize({ width: 1360, height: 800 });
await page.goto(`${base}/safelist-embed.html`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Load the sample lists" }).click();
await page.waitForTimeout(300);
await shot("08-embed-loaded");

await browser.close();
server.close();
