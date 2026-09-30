// Routes are paths since 2026-09-28 (Ben): the Home at `/` and one address per tool. The
// server (routes.mjs, applied by worker.mjs at the edge and server.mjs locally) answers those
// paths with this shell; this script opens the tool the path names and moves between tools
// without a reload. Old links that named the tool in the hash (`/#redactorium`) are moved onto
// the path on load and keep working.
const routeMeta = {
  home: { title: "Home", path: "/" },
  redactorium: { title: "Redactorium", path: "/redactorium" },
  safeseed: { title: "SafeSeed", path: "/safeseed" },
  safelist: { title: "SafeList", path: "/safelist" },
  wizards: { title: "Privacy Wizards Council", path: "/wizards" }
};

// Former tool names (routes.mjs FORMER_ROUTES): an old `/#privacy-wizards` link opens the
// Wizards at their current address.
const formerRoutes = { "privacy-wizards": "wizards" };

const homeAnchors = new Set(["tool-grid", "toolkit-changelog"]);
const views = new Map([...document.querySelectorAll("[data-view]")].map((node) => [node.dataset.view, node]));
const navLinks = [...document.querySelectorAll("[data-route-link]")];
const frames = new Map([...document.querySelectorAll("[data-tool-frame]")].map((node) => [node.dataset.toolFrame, node]));
const menuButton = document.querySelector(".menu-button");
const closeButton = document.querySelector(".nav-close");
const sidebar = document.querySelector(".toolkit-sidebar");
const scrim = document.querySelector(".nav-scrim");
let menuReturnTarget = null;
const frameLayouts = new Map();

// Each same-origin tool has a natural-height embed layout. Observe its body,
// not its viewport/scrollHeight (which cannot shrink after a long result).
// The outer document owns scrolling, so the footer follows the whole tool.
function trackFrameHeight(frame) {
  frameLayouts.get(frame)?.disconnect();
  const doc = frame.contentDocument;
  if (!doc?.body) return;
  let pending = 0;
  const syncViewport = () => {
    if (!frame.getClientRects().length) return;
    // Embedded notifications must stay in the visible part of a long frame.
    doc.documentElement.style.setProperty("--toolkit-bottom-inset", `${Math.max(0, frame.getBoundingClientRect().bottom - window.innerHeight)}px`);
  };
  const sync = () => {
    pending = 0;
    if (!frame.getClientRects().length) return;
    const headerHeight = document.querySelector(".mobile-bar").getBoundingClientRect().height;
    const toolHeadHeight = frame.closest(".tool-view").querySelector(".tool-head").getBoundingClientRect().height;
    // Bounded data previews still use the browser viewport, not the expanding
    // iframe height. Otherwise each resize would make them grow again.
    doc.documentElement.style.setProperty("--toolkit-viewport-height", `${Math.max(1, window.innerHeight - headerHeight - toolHeadHeight)}px`);
    const height = Math.ceil(doc.body.getBoundingClientRect().height);
    if (height > 0 && frame.style.height !== `${height}px`) frame.style.height = `${height}px`;
    syncViewport();
  };
  const schedule = () => {
    if (!pending) pending = requestAnimationFrame(sync);
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(doc.body);
  frameLayouts.set(frame, {
    schedule,
    syncViewport,
    disconnect() {
      observer.disconnect();
      cancelAnimationFrame(pending);
    }
  });
  doc.fonts.ready.then(schedule);
  sync();
}

function hashValue() {
  try {
    return decodeURIComponent(window.location.hash.replace(/^#\/?/, "")).replace(/\/$/, "");
  } catch {
    return "";
  }
}

// The route the address names: "/" is the Home, "/<route>" is that tool. Anything else
// (the server only ever sends this page for those) falls back to the Home.
function routeForPath(pathname) {
  if (pathname === "/") return "home";
  const slug = pathname.replace(/^\/+|\/+$/g, "");
  return Object.hasOwn(routeMeta, slug) ? slug : null;
}

function activeRoute() {
  return routeForPath(window.location.pathname) || "home";
}

// An old link names the tool in the hash. Put it on the path once, keeping the query, and
// say whether the address changed. `#home` is the old Home; in-page anchors are left alone.
function adoptLegacyHash() {
  const value = formerRoutes[hashValue()] || hashValue();
  if (!value || homeAnchors.has(value)) return false;
  const path = value === "home" ? routeMeta.home.path : routeMeta[value]?.path;
  if (!path) return false;
  window.history.replaceState(null, "", path + window.location.search);
  return true;
}

function ensureFrame(route) {
  const frame = frames.get(route);
  if (!frame || frame.src) return;
  frame.addEventListener("load", () => {
    trackFrameHeight(frame);
    frame.closest(".frame-stage")?.classList.add("is-loaded");
  });
  frame.src = frame.dataset.src;
}

let shownPath = null;

function showRoute({ focus = true } = {}) {
  const route = activeRoute();
  const raw = hashValue();
  const subAnchor = route === "home" && homeAnchors.has(raw) ? raw : null;

  for (const [id, view] of views) {
    view.hidden = id !== route;
  }

  for (const link of navLinks) {
    if (link.dataset.routeLink === route) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }

  document.body.dataset.route = route;
  shownPath = window.location.pathname;
  document.title = `${routeMeta[route].title} · AF Toolkit`;
  ensureFrame(route);
  frameLayouts.get(frames.get(route))?.schedule();
  closeMenu({ restoreFocus: false });

  requestAnimationFrame(() => {
    if (subAnchor) {
      document.getElementById(subAnchor)?.scrollIntoView({ block: "start" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
    if (focus) views.get(route)?.querySelector("h1")?.focus({ preventScroll: true });
  });
}

// A tool may name its active task in the shared breadcrumb (Privacy Wizards posts
// its open determination). Same-origin frames only; the default name is restored
// when the tool clears it or its frame reloads.
window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;
  const data = event.data;
  if (!data || data.toolkit !== "context") return;
  for (const [route, frame] of frames) {
    if (frame.contentWindow !== event.source) continue;
    const heading = views.get(route)?.querySelector("[data-context-title]");
    if (!heading) return;
    const title = typeof data.title === "string" ? data.title.trim() : "";
    heading.textContent = title || heading.dataset.contextTitle;
    return;
  }
});

function openMenu() {
  if (window.matchMedia("(min-width: 821px)").matches) return;
  menuReturnTarget = document.activeElement;
  document.body.classList.add("nav-open");
  menuButton?.setAttribute("aria-expanded", "true");
  scrim.hidden = false;
  closeButton?.focus();
}

function closeMenu({ restoreFocus = true } = {}) {
  const wasOpen = document.body.classList.contains("nav-open");
  document.body.classList.remove("nav-open");
  menuButton?.setAttribute("aria-expanded", "false");
  scrim.hidden = true;
  if (wasOpen && restoreFocus) (menuReturnTarget || menuButton)?.focus();
}

function trapMenuFocus(event) {
  if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
    event.preventDefault();
    closeMenu();
    return;
  }
  if (event.key !== "Tab" || !document.body.classList.contains("nav-open")) return;
  const focusable = [...sidebar.querySelectorAll("a[href], button:not([disabled])")].filter((node) => !node.hidden);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

menuButton?.addEventListener("click", openMenu);
closeButton?.addEventListener("click", () => closeMenu());
scrim?.addEventListener("click", () => closeMenu());
document.addEventListener("keydown", trapMenuFocus);

// Choosing the rail item of the tool already on screen returns that tool to its
// first state (the shell posts a reset; same-origin frames only) and restores
// the default breadcrumb name.
function resetActiveTool(route) {
  const frame = frames.get(route);
  if (!frame?.contentWindow) return;
  frame.contentWindow.postMessage({ toolkit: "reset" }, window.location.origin);
  const heading = views.get(route)?.querySelector("[data-context-title]");
  if (heading) heading.textContent = heading.dataset.contextTitle;
}

// Every same-origin link to a route (the rail, the Home cards) switches views in place; a
// modified click, another target, or an in-page anchor (the skip link, the Home's changelog)
// is the browser's to handle.
document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest("a[href]");
  if (!link || link.origin !== window.location.origin || link.target) return;
  if (link.hash && link.pathname === window.location.pathname) return;
  const route = routeForPath(link.pathname);
  if (!route || (route === "home" && link.hash)) return;
  event.preventDefault();
  if (route === activeRoute()) {
    if (route !== "home") resetActiveTool(route);
    closeMenu({ restoreFocus: false });
    showRoute();
    return;
  }
  window.history.pushState(null, "", link.pathname + link.search);
  showRoute();
});

// A fragment jump fires popstate too; only a path change is a route change.
window.addEventListener("popstate", () => {
  if (window.location.pathname !== shownPath) showRoute({ focus: false });
});
window.addEventListener("hashchange", () => {
  if (adoptLegacyHash() || homeAnchors.has(hashValue())) showRoute();
});
window.addEventListener("scroll", () => {
  frameLayouts.get(frames.get(activeRoute()))?.syncViewport();
}, { passive: true });
window.addEventListener("resize", () => {
  frameLayouts.get(frames.get(activeRoute()))?.schedule();
  if (window.matchMedia("(min-width: 821px)").matches) closeMenu({ restoreFocus: false });
});

adoptLegacyHash();
showRoute({ focus: false });
