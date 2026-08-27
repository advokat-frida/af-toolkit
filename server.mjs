import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("./public/", import.meta.url)));
const host = "127.0.0.1";
const port = Number.parseInt(process.env.AF_TOOLKIT_PORT || "4177", 10);

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

function resolveRequest(urlValue) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(urlValue, `http://${host}`).pathname);
  } catch {
    return null;
  }
  const requested = pathname === "/" ? "/index.html" : pathname;
  const candidate = resolve(root, `.${normalize(requested)}`);
  const withinRoot = relative(root, candidate);
  if (withinRoot.startsWith("..") || withinRoot.includes(":") || withinRoot === "") {
    return null;
  }
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    const index = join(candidate, "index.html");
    return existsSync(index) ? index : null;
  }
  return existsSync(candidate) && statSync(candidate).isFile() ? candidate : null;
}

const server = createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { "Allow": "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
    response.end("Method not allowed");
    return;
  }
  const path = resolveRequest(request.url || "/");
  if (!path) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": types.get(extname(path).toLowerCase()) || "application/octet-stream",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff"
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(path).pipe(response);
});

server.listen(port, host, () => {
  process.stdout.write(`The Advokat Frida Toolkit is ready at http://${host}:${port}/\n`);
});
