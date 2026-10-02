// AF-19 regression: in-app navigation must agree with the server's initial HTML.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { createToolkitHandler } from "../server.mjs";

const routes = ["home", "safeseed", "safelist", "redactorium", "privacy-wizards"];
const pathFor = (route) => route === "home" ? "/" : `/${route}`;

export async function verifyRouteMetadata(page, base) {
  let checks = 0;
  const expected = new Map();
  await page.goto(base, { waitUntil: "domcontentloaded" });
  for (const route of routes) {
    const response = await page.request.get(base + pathFor(route));
    assert.equal(response.status(), 200, `${route}: initial HTML is available`);
    const metadata = await page.evaluate((html) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      return {
        title: doc.title,
        description: doc.querySelector('meta[name="description"]').content,
        canonical: doc.querySelector('link[rel="canonical"]').getAttribute("href"),
        counts: ["title", 'meta[name="description"]', 'link[rel="canonical"]'].map(selector => doc.querySelectorAll(selector).length)
      };
    }, await response.text());
    assert.deepEqual(metadata.counts, [1, 1, 1], `${route}: one of each metadata element`);
    expected.set(route, metadata);
  }
  async function check(route, reason) {
    await page.waitForFunction(route => {
      const view = document.querySelector(`[data-view="${route}"]`);
      return document.body.dataset.route === route && view && !view.hidden;
    }, route);
    const actual = await page.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]').content,
      canonical: document.querySelector('link[rel="canonical"]').getAttribute("href"),
      counts: ["title", 'meta[name="description"]', 'link[rel="canonical"]'].map(selector => document.querySelectorAll(selector).length)
    }));
    assert.deepEqual(actual, expected.get(route), `${reason}: ${route} matches initial HTML`);
    checks++;
  }
  for (const route of routes) {
    await page.goto(base + pathFor(route), { waitUntil: "domcontentloaded" });
    await check(route, "direct entry");
  }
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await check("home", "navigation start");
  await page.evaluate(() => { window.af19NavigationMarker = "same document"; });
  const sequence = ["safeseed", "safelist", "redactorium", "privacy-wizards", "home"];
  for (const route of sequence) {
    const link = page.locator(`.toolkit-sidebar [data-route-link="${route}"]`);
    if (await page.locator(".menu-button").isVisible()) await page.locator(".menu-button").click();
    await link.click();
    await check(route, "client navigation");
    assert.equal(await page.evaluate(() => window.af19NavigationMarker), "same document", "navigation does not reload the document");
  }
  for (const route of ["privacy-wizards", "redactorium", "safelist", "safeseed", "home"]) {
    await page.goBack();
    await check(route, "back");
  }
  for (const route of sequence) {
    await page.goForward();
    await check(route, "forward");
  }
  for (const route of routes) {
    await page.goto(`${base}/?ref=af19#${route}`, { waitUntil: "domcontentloaded" });
    await check(route, "legacy hash");
    await page.waitForFunction(path => location.pathname === path && location.hash === "", pathFor(route));
    assert.equal(new URL(page.url()).search, "?ref=af19", "legacy entry preserves the query");
  }
  await page.goto(`${base}/#tool-grid`, { waitUntil: "domcontentloaded" });
  await check("home", "home section anchor");
  return checks;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const server = createServer(createToolkitHandler());
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch();
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      const count = await verifyRouteMetadata(page, `http://127.0.0.1:${server.address().port}`);
      console.log(`PASS ${viewport.width}px: ${count} metadata states, direct/client/history/legacy entries`);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
}
