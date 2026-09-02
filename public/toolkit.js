const routeMeta = {
  home: { title: "Home" },
  redactorium: { title: "Redactorium" },
  safeseed: { title: "SafeSeed" },
  "objection-oracle": { title: "Objection Oracle" },
  "privacy-wizards": { title: "Privacy Wizards Council" }
};

const homeAnchors = new Set(["tool-grid", "toolkit-changelog"]);
const views = new Map([...document.querySelectorAll("[data-view]")].map((node) => [node.dataset.view, node]));
const navLinks = [...document.querySelectorAll("[data-route-link]")];
const frames = new Map([...document.querySelectorAll("[data-tool-frame]")].map((node) => [node.dataset.toolFrame, node]));
const menuButton = document.querySelector(".menu-button");
const closeButton = document.querySelector(".nav-close");
const sidebar = document.querySelector(".toolkit-sidebar");
const scrim = document.querySelector(".nav-scrim");
let menuReturnTarget = null;

function hashValue() {
  try {
    return decodeURIComponent(window.location.hash.replace(/^#\/?/, "")).replace(/\/$/, "");
  } catch {
    return "";
  }
}

function activeRoute() {
  const value = hashValue();
  if (homeAnchors.has(value)) return "home";
  return Object.hasOwn(routeMeta, value) ? value : "home";
}

function ensureFrame(route) {
  const frame = frames.get(route);
  if (!frame || frame.src) return;
  frame.addEventListener("load", () => {
    frame.closest(".frame-stage")?.classList.add("is-loaded");
  });
  frame.src = frame.dataset.src;
}

function showRoute({ focus = true } = {}) {
  const raw = hashValue();
  const route = activeRoute();
  const subAnchor = homeAnchors.has(raw) ? raw : null;

  for (const [id, view] of views) {
    view.hidden = id !== route;
  }

  for (const link of navLinks) {
    if (link.dataset.routeLink === route) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }

  document.body.dataset.route = route;
  document.title = `${routeMeta[route].title} · The Advokat Frida Toolkit`;
  ensureFrame(route);
  closeMenu({ restoreFocus: false });

  requestAnimationFrame(() => {
    if (subAnchor) {
      document.getElementById(subAnchor)?.scrollIntoView({ block: "start" });
      return;
    }
    if (route === "home") views.get("home")?.scrollTo({ top: 0, behavior: "auto" });
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

for (const link of navLinks) {
  link.addEventListener("click", () => {
    if (link.dataset.routeLink === activeRoute() && link.dataset.routeLink !== "home") resetActiveTool(link.dataset.routeLink);
    closeMenu({ restoreFocus: false });
  });
}

window.addEventListener("hashchange", () => showRoute());
window.addEventListener("resize", () => {
  if (window.matchMedia("(min-width: 821px)").matches) closeMenu({ restoreFocus: false });
});

if (!window.location.hash || (!Object.hasOwn(routeMeta, hashValue()) && !homeAnchors.has(hashValue()))) {
  window.history.replaceState(null, "", "#home");
}
showRoute({ focus: false });
