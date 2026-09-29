// The Toolkit's edge script. Cloudflare serves every file in public/ itself; this runs only
// for the paths wrangler.jsonc names (the staged artifacts' entry documents) and for paths
// with no file behind them (the tool routes, and anything that should 404). See routes.mjs
// for the routing rules; they are the same rules server.mjs applies locally.
import { redirectFor, redirectResponse, routeForPath, shellForRoute } from "./routes.mjs";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const target = redirectFor(url, request.headers);
    if (target) {
      const { status, headers } = redirectResponse(target, url);
      return new Response(null, { status, headers });
    }

    const route = routeForPath(url.pathname);
    if (route && route !== "home") {
      // The shell, named for the tool. Conditional headers are dropped so the asset host
      // answers with the document and not a 304, and the copied ETag goes with them: it
      // described the Home, and this body is not the Home.
      const headers = new Headers(request.headers);
      headers.delete("if-none-match");
      headers.delete("if-modified-since");
      const shell = await env.ASSETS.fetch(new Request(new URL("/", url), { headers }));
      if (!shell.ok) return shell;
      const text = await shell.text();
      let body;
      try {
        body = shellForRoute(text, route);
      } catch (error) {
        // A shell without its anchors is a gate failure that should never deploy. If it does,
        // serve the document as it is under the tool address instead of an error page:
        // toolkit.js still switches to the right tool on load.
        console.error(`shell rewrite failed for /${route}: ${error.message}`);
        body = text;
      }
      const out = new Headers(shell.headers);
      out.delete("etag");
      out.delete("content-length");
      out.set("content-type", "text/html; charset=utf-8");
      out.set("cache-control", "no-cache");
      return new Response(request.method === "HEAD" ? null : body, { status: 200, headers: out });
    }

    return env.ASSETS.fetch(request);
  }
};
