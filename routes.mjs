// The Toolkit's public routes: one list shared by the Cloudflare Worker (worker.mjs), the
// local server (server.mjs) and the rendered QA, so the edge and every local run agree.
//
// Public addresses (Ben, 2026-09-28): the Home at `/` and one address per tool, `/safeseed`,
// `/safelist`, `/redactorium` and `/wizards`, all served as the shell with that tool open. The
// Wizards lived at `/privacy-wizards` until 2026-09-29 (Ben: "just /wizards"); that address
// still works and redirects for good. The staged artifacts stay under `/tools/` for the shell's frames and for verification
// by hand; a browser that lands on one directly is sent to the tool's address instead, so the
// only chrome a visitor ever sees is the shell's. Old links that name the tool in the hash
// (`/#redactorium`) still work: the shell moves them onto the path on load.

export const ORIGIN = "https://toolkit.advokatfrida.com";

export const TOOLS = {
  safeseed: {
    title: "SafeSeed",
    description: "Generate fake personal information and generate a tamper-evident receipt.",
    artifact: "/tools/safeseed"
  },
  safelist: {
    title: "SafeList",
    description: "Remove opted-out contacts from a send list and keep a record of the check.",
    artifact: "/tools/safelist"
  },
  redactorium: {
    title: "Redactorium",
    description: "Anonymize a spreadsheet or document: find the personal data, then remove or replace it.",
    artifact: "/tools/redactorium/"
  },
  wizards: {
    title: "Privacy Wizards Council",
    description: "Get quick and citable answers for commonly recurring privacy questions.",
    artifact: "/tools/privacy-wizards-council"
  }
};

// Addresses a tool had before, and where each lives now. A former address answers every
// request with a permanent redirect, so links already out in the world keep working.
export const FORMER_ROUTES = {
  "privacy-wizards": "wizards"
};

export const HOME = {
  title: "Home",
  description: "The Advokat Frida Toolkit: four practical privacy and AI tools in one browser workspace."
};

// Every path that names a staged artifact's entry document, as a visitor might type or
// follow it, mapped to the tool's route. The trailing-slash and `.html` forms are what the
// asset host redirects between, so both are listed.
const ARTIFACT_ROUTES = new Map();
for (const [route, tool] of Object.entries(TOOLS)) {
  if (tool.artifact.endsWith("/")) {
    const dir = tool.artifact.slice(0, -1);
    for (const path of [dir, `${dir}/`, `${dir}/index.html`]) ARTIFACT_ROUTES.set(path, route);
  } else {
    for (const path of [tool.artifact, `${tool.artifact}.html`]) ARTIFACT_ROUTES.set(path, route);
  }
}

// Paths the Worker must see before the asset host does (wrangler `run_worker_first`): the
// artifact entry documents, which exist as files and would otherwise be served straight away.
export const WORKER_FIRST_PATHS = [...ARTIFACT_ROUTES.keys()];

// The route a top-level path names: "home" for "/", a tool's route for "/<route>", else null.
export function routeForPath(pathname) {
  if (pathname === "/") return "home";
  const slug = pathname.replace(/^\/+|\/+$/g, "");
  return Object.hasOwn(TOOLS, slug) ? slug : null;
}

// A browser loading a page, as opposed to a frame, a script, a font, or a command-line fetch.
// Browsers say so in Sec-Fetch-Dest; anything older is judged by what it accepts.
function isPageVisit(headers) {
  const dest = headers.get("sec-fetch-dest");
  if (dest) return dest === "document";
  return (headers.get("accept") || "").includes("text/html");
}

// Where a request goes instead, or null. Keeps the query string.
//   /<former route>[/]              -> /<route>, permanent (301): the same for every request.
//   /<route>/                       -> /<route>, permanent (301): the same for every request.
//   /tools/<artifact>[.html] etc.   -> /<route>, when a browser opens it as a page and the
//                                      shell's `?embed=1` is absent. The shell's frames, curl
//                                      and a tool's own asset requests are left alone. This one
//                                      is a 302 that is never cached: the answer depends on the
//                                      request, and a browser reuses a cached 301 for the same
//                                      address whatever the request, so a visitor who once
//                                      opened /tools/safelist directly would then get the shell
//                                      inside the shell's own frame.
export function redirectFor(url, headers) {
  const path = url.pathname;
  const slug = path.replace(/^\/+|\/+$/g, "");
  if (Object.hasOwn(FORMER_ROUTES, slug)) return { location: `/${FORMER_ROUTES[slug]}${url.search}`, permanent: true };
  if (path !== `/${slug}` && Object.hasOwn(TOOLS, slug)) return { location: `/${slug}${url.search}`, permanent: true };
  const route = ARTIFACT_ROUTES.get(path);
  if (!route || url.searchParams.has("embed") || !isPageVisit(headers)) return null;
  return { location: `/${route}${url.search}`, permanent: false };
}

// The redirect as a Response (the Worker) or as status + headers (the local server).
export function redirectResponse(target, base) {
  const headers = { Location: new URL(target.location, base).href };
  if (!target.permanent) headers["Cache-Control"] = "no-store";
  return { status: target.permanent ? 301 : 302, headers };
}

// The shell's HTML for a route: the title, description and canonical address a tool's page
// carries when the server sends it, so the page is named before any script runs. The shell's
// script sets the same title again when the reader moves between tools. Each anchor must be
// present in index.html exactly once; a template edit that loses one fails here, loudly.
export function shellForRoute(html, route) {
  if (route === "home") return html;
  const tool = TOOLS[route];
  if (!tool) throw new Error(`unknown route: ${route}`);
  const swaps = [
    [`<title>${HOME.title} · AF Toolkit</title>`, `<title>${tool.title} · AF Toolkit</title>`],
    [`content="${HOME.description}"`, `content="${tool.description}"`],
    [`<link rel="canonical" href="${ORIGIN}/" />`, `<link rel="canonical" href="${ORIGIN}/${route}" />`],
    ['<body data-route="home">', `<body data-route="${route}">`]
  ];
  let out = html;
  for (const [from, to] of swaps) {
    const parts = out.split(from);
    if (parts.length !== 2) throw new Error(`shell template anchor missing or repeated: ${from}`);
    out = parts.join(to);
  }
  return out;
}
