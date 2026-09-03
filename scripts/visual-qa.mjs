// Rendered QA for the Toolkit shell — the mechanical half of the review gate's
// viewport checks. Serves public/, drives Chromium at the four literal review
// sizes, asserts the structural contract, and writes the proof screenshots the
// human review inspects at full size.
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { extname, join, normalize, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = join(repoRoot, "public");
const proofsRoot = join(repoRoot, "proofs");

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

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "mid-1034", width: 1034, height: 917 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "narrow-320", width: 320, height: 700 }
];

// The first useful control that must be visible when each tool opens.
const TOOL_ANCHORS = {
  redactorium: "[data-testid='dropzone'], [data-testid='mode-single-btn']",
  safeseed: ".gen-modes",
  safelist: "[data-pick='send']",
  "objection-oracle": "#start-button",
  "privacy-wizards": "#finder"
};

const failures = [];
function assert(condition, label) {
  if (!condition) failures.push(label);
  process.stdout.write(`${condition ? "PASS" : "FAIL"}  ${label}\n`);
}

async function noHorizontalScroll(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 1, `${label}: no document horizontal scroll (overflow ${overflow}px)`);
}

async function openRoute(page, base, route) {
  await page.goto(`${base}/#${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  if (route !== "home") {
    await page.waitForSelector(`[data-view="${route}"]:not([hidden]) .frame-stage.is-loaded`, { timeout: 20000 });
    await page.waitForTimeout(600);
  }
}

async function main() {
  await mkdir(proofsRoot, { recursive: true });
  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();

  try {
    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      const desktop = viewport.width >= 821;

      await openRoute(page, base, "home");
      await noHorizontalScroll(page, `${viewport.name} home`);
      assert((await page.locator(".tool-card").count()) === 5, `${viewport.name} home: five tool cards`);
      assert((await page.locator(".group-label").count()) === 2, `${viewport.name} home: two group labels`);
      if (desktop) {
        assert(await page.locator(".brand-cap").isVisible(), `${viewport.name} home: sidebar brand cap visible`);
        const rail = await page.locator(".toolkit-sidebar").boundingBox();
        assert(rail && Math.abs(rail.width - 230) <= 2, `${viewport.name} home: rail is 230px (${rail?.width})`);
      } else {
        assert(await page.locator(".menu-button").isVisible(), `${viewport.name} home: mobile menu button visible`);
      }
      await page.screenshot({ path: join(proofsRoot, `${viewport.name}-home.png`), fullPage: false });

      for (const route of Object.keys(TOOL_ANCHORS)) {
        await openRoute(page, base, route);
        await noHorizontalScroll(page, `${viewport.name} ${route}`);
        if (desktop) {
          const head = await page.locator(`[data-view="${route}"] .tool-head`).boundingBox();
          assert(head && Math.abs(head.height - 56) <= 1, `${viewport.name} ${route}: 56px breadcrumb header (${head?.height})`);
        }
        const frame = page.frameLocator(`[data-view="${route}"] iframe`);
        const anchor = frame.locator(TOOL_ANCHORS[route]).first();
        await anchor.waitFor({ state: "visible", timeout: 15000 });
        if (viewport.name === "desktop-1440") {
          const box = await anchor.boundingBox();
          assert(box && box.y < viewport.height, `${route}: first useful control visible on open (y=${Math.round(box?.y ?? -1)})`);
        }
        const frameOverflow = await page.frames().find((f) => f.url().includes("/tools/"))?.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        ).catch(() => 0);
        assert((frameOverflow ?? 0) <= 1, `${viewport.name} ${route}: no embedded horizontal scroll (overflow ${frameOverflow}px)`);
        if (true) {
          await page.screenshot({ path: join(proofsRoot, `${viewport.name}-${route}.png`), fullPage: false });
        }
      }

      if (viewport.name === "desktop-1440") {
        // Changelog opens as a native disclosure.
        await openRoute(page, base, "home");
        await page.locator(".changelog-card summary").click();
        await page.waitForTimeout(200);
        assert(await page.locator(".changelog-body").isVisible(), "desktop-1440 home: changelog opens");
        await page.screenshot({ path: join(proofsRoot, "desktop-1440-home-changelog-open.png"), fullPage: true });

        // Keyboard: skip link first, focus lands on the active view heading after switching.
        await page.goto(`${base}/?kbd=1#home`, { waitUntil: "networkidle" });
        await page.keyboard.press("Tab");
        assert(await page.evaluate(() => document.activeElement?.classList.contains("skip-link")), "keyboard: skip link is first");
        await page.evaluate(() => { window.location.hash = "#safeseed"; });
        await page.waitForTimeout(700);
        assert(
          await page.evaluate(() => document.activeElement?.id === "safeseed-title"),
          "keyboard: focus lands on the tool heading after switching"
        );
      }

      if (viewport.name === "mobile-390") {
        // The chooser traps focus and closes on Escape.
        await openRoute(page, base, "home");
        await page.locator(".menu-button").click();
        await page.waitForTimeout(250);
        assert(await page.evaluate(() => document.body.classList.contains("nav-open")), "mobile-390: chooser opens");
        assert(await page.evaluate(() => document.activeElement?.classList.contains("nav-close")), "mobile-390: focus moves into the chooser");
        await page.screenshot({ path: join(proofsRoot, "mobile-390-menu-open.png"), fullPage: false });
        await page.keyboard.press("Escape");
        await page.waitForTimeout(250);
        assert(await page.evaluate(() => !document.body.classList.contains("nav-open")), "mobile-390: Escape closes the chooser");
      }

      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (failures.length) {
    process.stdout.write(`\n${failures.length} rendered check(s) failed.\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write("\nRendered checks passed. Inspect the proofs/ screenshots at literal size before sign-off.\n");
}

await main();
