import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { HOME, ORIGIN, TOOLS, WORKER_FIRST_PATHS, redirectFor, redirectResponse, routeForPath, shellForRoute } from "../routes.mjs";

const browser = (dest) => new Headers(dest ? { "sec-fetch-dest": dest, accept: "text/html,*/*" } : { accept: "text/html,*/*" });
const curl = new Headers({ accept: "*/*" });
const at = (path) => new URL(path, ORIGIN);
const permanent = (location) => ({ location, permanent: true });
const perRequest = (location) => ({ location, permanent: false });

test("the four tools and the Home are the only routes", () => {
  assert.deepEqual(Object.keys(TOOLS), ["safeseed", "safelist", "redactorium", "privacy-wizards"]);
  assert.equal(routeForPath("/"), "home");
  for (const route of Object.keys(TOOLS)) assert.equal(routeForPath(`/${route}`), route);
  for (const path of ["/tools", "/tools/safeseed", "/index.html", "/SafeSeed", "/nope"]) assert.equal(routeForPath(path), null, path);
});

test("a tool address with a trailing slash goes to the tool address, query kept, for good", () => {
  assert.deepEqual(redirectFor(at("/safeseed/"), browser("document")), permanent("/safeseed"));
  assert.deepEqual(redirectFor(at("/privacy-wizards/?ref=advokatfrida.com"), curl), permanent("/privacy-wizards?ref=advokatfrida.com"));
  assert.equal(redirectFor(at("/safeseed"), browser("document")), null);
  assert.equal(redirectFor(at("/"), browser("document")), null);
  assert.deepEqual(redirectResponse(permanent("/safeseed"), at("/safeseed/")), { status: 301, headers: { Location: `${ORIGIN}/safeseed` } });
});

test("a browser that opens a staged artifact as a page is sent to the tool's address, and that answer is never cached", () => {
  const sent = redirectResponse(perRequest("/safelist"), at("/tools/safelist"));
  assert.deepEqual(sent, { status: 302, headers: { Location: `${ORIGIN}/safelist`, "Cache-Control": "no-store" } });
  for (const [path, route] of [
    ["/tools/safeseed", "safeseed"],
    ["/tools/safeseed.html", "safeseed"],
    ["/tools/safelist", "safelist"],
    ["/tools/safelist.html", "safelist"],
    ["/tools/privacy-wizards-council", "privacy-wizards"],
    ["/tools/privacy-wizards-council.html", "privacy-wizards"],
    ["/tools/redactorium", "redactorium"],
    ["/tools/redactorium/", "redactorium"],
    ["/tools/redactorium/index.html", "redactorium"]
  ]) {
    assert.deepEqual(redirectFor(at(path), browser("document")), perRequest(`/${route}`), path);
    assert.deepEqual(redirectFor(at(path), browser()), perRequest(`/${route}`), `${path} with no Sec-Fetch headers`);
  }
  assert.deepEqual(redirectFor(at("/tools/safeseed?ref=x"), browser("document")), perRequest("/safeseed?ref=x"));
});

test("the shell's frames, curl and a tool's own assets are left alone", () => {
  assert.equal(redirectFor(at("/tools/safeseed?embed=1"), browser("iframe")), null);
  assert.equal(redirectFor(at("/tools/safeseed.html?embed=1"), browser("iframe")), null);
  assert.equal(redirectFor(at("/tools/safelist?embed=1"), browser("iframe")), null);
  assert.equal(redirectFor(at("/tools/redactorium/?embed=1"), browser("iframe")), null);
  assert.equal(redirectFor(at("/tools/safeseed"), curl), null, "curl asks for */*");
  assert.equal(redirectFor(at("/tools/safeseed.html"), curl), null);
  assert.equal(redirectFor(at("/tools/redactorium/assets/index.js"), browser("script")), null);
  assert.equal(redirectFor(at("/tools/redactorium/pdf.worker.min.mjs"), browser("worker")), null);
  assert.equal(redirectFor(at("/tools/safeseed?embed=1"), browser("document")), null, "the flag wins even on a page load");
});

test("every artifact entry document is on the Worker's must-see list", async () => {
  assert.deepEqual([...WORKER_FIRST_PATHS].sort(), [
    "/tools/privacy-wizards-council", "/tools/privacy-wizards-council.html",
    "/tools/redactorium", "/tools/redactorium/", "/tools/redactorium/index.html",
    "/tools/safelist", "/tools/safelist.html",
    "/tools/safeseed", "/tools/safeseed.html"
  ]);
  const wrangler = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  for (const path of WORKER_FIRST_PATHS) assert.ok(wrangler.includes(`"${path}"`), `wrangler.jsonc runs the Worker first for ${path}`);
});

test("the shell is named for the tool it opens, and only there", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  assert.equal(shellForRoute(html, "home"), html);
  for (const [route, tool] of Object.entries(TOOLS)) {
    const named = shellForRoute(html, route);
    assert.ok(named.includes(`<title>${tool.title} · AF Toolkit</title>`), `${route} title`);
    assert.ok(named.includes(`content="${tool.description}"`), `${route} description`);
    assert.ok(named.includes(`<link rel="canonical" href="${ORIGIN}/${route}" />`), `${route} canonical`);
    assert.ok(named.includes(`<body data-route="${route}">`), `${route} body`);
    assert.ok(!named.includes(`<title>${HOME.title} · AF Toolkit</title>`), `${route} keeps no Home title`);
    assert.equal(named.split("<title>").length, 2, `${route} has one title`);
  }
  assert.throws(() => shellForRoute("<title>Something else</title>", "safeseed"), /anchor missing/);
});

test("every frame in the shell is left alone, even by a browser that sends no Sec-Fetch headers", async () => {
  const index = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const sources = [...index.matchAll(/data-src="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(sources.length, 4, "one frame per tool");
  for (const src of sources) {
    assert.equal(redirectFor(at(src), browser("iframe")), null, src);
    assert.equal(redirectFor(at(src), browser()), null, `${src} from a browser without Sec-Fetch-Dest`);
  }
});
