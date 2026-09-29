// The local Toolkit server: the same routes the edge applies (routes.mjs), on top of the
// asset host's own behavior for files (`auto-trailing-slash`: `/x.html` is `/x`, and a
// folder is its `index.html`), so what a local run shows is what toolkit.advokatfrida.com
// shows. `node server.mjs` serves public/ on AF_TOOLKIT_PORT (4177); the rendered QA
// imports `createToolkitHandler` and listens on a port of its own.
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { redirectFor, redirectResponse, routeForPath, shellForRoute } from "./routes.mjs";

const defaultRoot = resolve(fileURLToPath(new URL("./public/", import.meta.url)));
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
  [".txt", "text/plain; charset=utf-8"],
  [".woff2", "font/woff2"]
]);

const baseHeaders = {
  "Cache-Control": "no-store",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff"
};

// What the asset host does with a path: the file to serve, a redirect to the path's
// canonical form, or nothing.
function resolveAsset(root, pathname, search) {
  const candidate = resolve(root, `.${normalize(pathname)}`);
  const within = relative(root, candidate);
  if (within.startsWith("..") || within.includes(":")) return null;
  const isFile = (p) => existsSync(p) && statSync(p).isFile();
  const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
  if (pathname.endsWith("/index.html") && isFile(candidate)) return { redirect: pathname.slice(0, -"index.html".length) + search };
  if (pathname.endsWith(".html") && pathname !== "/index.html" && isFile(candidate)) return { redirect: pathname.slice(0, -".html".length) + search };
  if (pathname.endsWith("/")) {
    const index = join(candidate, "index.html");
    return isFile(index) ? { file: index } : null;
  }
  if (isFile(candidate)) return { file: candidate };
  if (isFile(`${candidate}.html`)) return { file: `${candidate}.html` };
  if (isDir(candidate) && isFile(join(candidate, "index.html"))) return { redirect: `${pathname}/${search}` };
  return null;
}

export function createToolkitHandler({ root = defaultRoot } = {}) {
  return (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { "Allow": "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
      response.end("Method not allowed");
      return;
    }
    let url;
    try {
      url = new URL(request.url || "/", `http://${host}`);
      url.pathname = decodeURIComponent(url.pathname);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const target = redirectFor(url, new Headers(request.headers));
    if (target) {
      const { status, headers } = redirectResponse(target, url);
      response.writeHead(status, { ...baseHeaders, ...headers, Location: target.location });
      response.end();
      return;
    }

    const route = routeForPath(url.pathname);
    if (route && route !== "home") {
      const body = shellForRoute(readFileSync(join(root, "index.html"), "utf8"), route);
      response.writeHead(200, { ...baseHeaders, "Content-Type": types.get(".html") });
      response.end(request.method === "HEAD" ? undefined : body);
      return;
    }

    const asset = resolveAsset(root, url.pathname === "/" ? "/index.html" : url.pathname, url.search);
    if (asset?.redirect && url.pathname !== "/") {
      response.writeHead(307, { ...baseHeaders, Location: asset.redirect });
      response.end();
      return;
    }
    const file = asset?.file || (url.pathname === "/" ? join(root, "index.html") : null);
    if (!file) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, { ...baseHeaders, "Content-Type": types.get(extname(file).toLowerCase()) || "application/octet-stream" });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    createReadStream(file).pipe(response);
  };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  createServer(createToolkitHandler()).listen(port, host, () => {
    process.stdout.write(`The Advokat Frida Toolkit is ready at http://${host}:${port}/\n`);
  });
}
