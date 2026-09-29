import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import worker from "../worker.mjs";
import { ORIGIN } from "../routes.mjs";

const shellHtml = await readFile(new URL("../public/index.html", import.meta.url), "utf8");

// A stand-in for the asset host: the shell at "/", one artifact at "/tools/safeseed", 404
// elsewhere. A conditional request for the shell gets a 304, as the real host answers.
function assets(shell = shellHtml) {
  return {
    fetch(request) {
      const { pathname } = new URL(request.url);
      if (pathname === "/") {
        if (request.headers.has("if-none-match")) return new Response(null, { status: 304, headers: { etag: '"home"' } });
        return new Response(shell, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            etag: '"home"',
            "content-length": String(shell.length),
            "x-content-type-options": "nosniff"
          }
        });
      }
      if (pathname === "/tools/safeseed") return new Response("artifact", { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
      return new Response("not found", { status: 404 });
    }
  };
}

const run = (path, { method = "GET", headers = {} } = {}, env = { ASSETS: assets() }) =>
  worker.fetch(new Request(`${ORIGIN}${path}`, { method, headers }), env);

test("a tool address serves the shell named for the tool, uncached, without the Home's ETag", async () => {
  const res = await run("/safeseed");
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.ok(body.includes("<title>SafeSeed · AF Toolkit</title>"), "title");
  assert.ok(body.includes(`href="${ORIGIN}/safeseed"`), "canonical");
  assert.ok(body.includes('<body data-route="safeseed">'), "route on body");
  assert.equal(res.headers.get("cache-control"), "no-cache");
  assert.equal(res.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(res.headers.get("etag"), null, "the Home's ETag does not describe this body");
  assert.equal(res.headers.get("content-length"), null);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff", "the asset host's headers ride along");
});

test("a conditional request for a tool address still gets the document", async () => {
  const res = await run("/safeseed", { headers: { "if-none-match": '"home"' } });
  assert.equal(res.status, 200);
  assert.ok((await res.text()).includes("<title>SafeSeed · AF Toolkit</title>"));
});

test("HEAD on a tool address has the headers and no body", async () => {
  const res = await run("/redactorium", { method: "HEAD" });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-cache");
  assert.equal(await res.text(), "");
});

test("a page visit to an artifact is sent to the tool address with a 302 nothing may cache", async () => {
  const res = await run("/tools/safeseed", { headers: { "sec-fetch-dest": "document", accept: "text/html" } });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), `${ORIGIN}/safeseed`);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(await res.text(), "");
});

test("the shell's frame and curl get the artifact itself", async () => {
  const frame = await run("/tools/safeseed", { headers: { "sec-fetch-dest": "iframe", accept: "text/html" } });
  assert.equal(frame.status, 200);
  assert.equal(await frame.text(), "artifact");
  const curl = await run("/tools/safeseed", { headers: { accept: "*/*" } });
  assert.equal(curl.status, 200);
  assert.equal(await curl.text(), "artifact");
});

test("a trailing slash is a permanent redirect that keeps the query", async () => {
  const res = await run("/safeseed/?x=1", { headers: { "sec-fetch-dest": "document" } });
  assert.equal(res.status, 301);
  assert.equal(res.headers.get("location"), `${ORIGIN}/safeseed?x=1`);
  assert.equal(res.headers.get("cache-control"), null);
});

test("unknown paths and a missing shell pass the asset host's answer through", async () => {
  assert.equal((await run("/nope")).status, 404);
  assert.equal((await run("/tools/nope")).status, 404);
  const gone = { ASSETS: { fetch: () => new Response("gone", { status: 404 }) } };
  assert.equal((await run("/safeseed", {}, gone)).status, 404);
});

test("a shell that lost its anchors is served as it is, not as an error page", async () => {
  const broken = "<!doctype html><html><head><title>x</title></head><body>no anchors</body></html>";
  const errors = [];
  const original = console.error;
  console.error = (message) => errors.push(String(message));
  try {
    const res = await run("/safelist", {}, { ASSETS: assets(broken) });
    assert.equal(res.status, 200);
    assert.equal(await res.text(), broken);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /shell rewrite failed for \/safelist/);
  } finally {
    console.error = original;
  }
});
