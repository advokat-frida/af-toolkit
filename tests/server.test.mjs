import assert from "node:assert/strict";
import test from "node:test";
import { createServer, get } from "node:http";
import { createToolkitHandler } from "../server.mjs";

async function localServer(t) {
  const server = createServer(createToolkitHandler());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return (path) => new Promise((resolve, reject) => {
    get({ hostname: "127.0.0.1", port: server.address().port, path }, (res) => {
      res.resume();
      res.on("end", () => resolve({ status: res.statusCode, location: res.headers.location }));
    }).on("error", reject);
  });
}

test("local asset redirects reject decoded network-path references", async (t) => {
  const request = await localServer(t);
  for (const path of [
    "/%2ftools/safelist.html", "/%2ftools%5csafelist.html",
    "/%5ctools/safelist.html", "/%2ftools/redactorium/index.html",
    "/%2ftools/redactorium", "/%2ftools/safelist.html?next=https://example.org"
  ]) {
    const result = await request(path);
    assert.equal(result.status, 404, path);
    assert.equal(result.location, undefined, path);
  }
});

test("ordinary local redirects keep their path and query", async (t) => {
  const request = await localServer(t);
  for (const [path, location] of [
    ["/tools/safelist.html?download=1", "/tools/safelist?download=1"],
    ["/tools/redactorium/index.html?embed=1", "/tools/redactorium/?embed=1"],
    ["/tools/redactorium", "/tools/redactorium/"]
  ]) {
    assert.deepEqual(await request(path), { status: 307, location });
  }
});
