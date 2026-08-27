import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const candidateRoot = resolve(scriptDir, "..");
const proofsRoot = resolve(candidateRoot, "proofs");
const port = Number.parseInt(process.env.AF_TOOLKIT_QA_PORT || "4187", 10);
const baseUrl = process.env.AF_TOOLKIT_QA_URL || `http://127.0.0.1:${port}`;

const routes = ["home", "redactorium", "safeseed", "privacy-wizards", "build-a-prompt", "objection-oracle"];
const viewports = [
  { id: "desktop-1440", width: 1440, height: 1000 },
  { id: "reported-1439x726", width: 1439, height: 726, deviceScaleFactor: 2 },
  { id: "mid-1034", width: 1034, height: 917 },
  { id: "mobile-390", width: 390, height: 844 },
  { id: "narrow-320", width: 320, height: 700 }
];
const homeDensityViewportIds = new Set(["reported-1439x726", "mid-1034", "mobile-390", "narrow-320"]);
const interactionViewportIds = new Set(["reported-1439x726", "mid-1034", "mobile-390", "narrow-320"]);
const typographyViewportIds = new Set(["reported-1439x726", "mobile-390"]);
const embeddedAuditViewportIds = new Set(["reported-1439x726", "mobile-390"]);
const transitionProofViewportIds = new Set(["reported-1439x726", "mobile-390"]);
const shadowClearance = 4;
const viewportClearance = 8;

const embeddedRootContracts = {
  safeseed: {
    initial: { root: ".gen-panel", main: ".site-main", inner: ".field-name" }
  },
  "privacy-wizards": {
    initial: { root: ".finder-stage", main: "main", inner: ".wizard-card" },
    determination: { root: ".determination-shell", main: "main", inner: ".question-card" }
  },
  "build-a-prompt": {
    initial: { root: ".start-stage", main: "main", inner: "#work-request" }
  }
};

const semanticTypeContracts = {
  redactorium: {
    initial: [
      { role: "task heading", selector: ".red-drop-card h2", family: "Space Grotesk", size: 22, weight: 700, lineHeightRatio: 1.15 },
      { role: "primary action", selector: ".btn-forest", family: "Archivo", size: 14, weight: 700, lineHeightRatio: 1.2 },
      { role: "supporting copy", selector: ".red-field-sources", family: "Space Grotesk", size: 13, weight: 400 }
    ]
  },
  safeseed: {
    initial: [
      { role: "section heading", selector: ".gen-panel-head h2", family: "Space Grotesk", size: 18, weight: 700, lineHeightRatio: 1.2 },
      { role: "field name", selector: ".field-name", family: "Space Grotesk", size: 15, mobileSize: 16, weight: 400, lineHeightRatio: 1.35 },
      { role: "field type", selector: ".field-type", family: "Space Grotesk", size: 15, mobileSize: 16, weight: 400 },
      { role: "preset label", selector: ".gen-presets-head p", family: "Archivo", size: 11, weight: 700 },
      { role: "status chip", selector: ".tier-chip", family: "Archivo", size: 12, weight: 600, lineHeightRatio: 1.2 },
      { role: "secondary status", selector: ".preset-status", family: "Space Grotesk", size: 13, weight: 400, lineHeightRatio: 1.5 },
      { role: "mode action", selector: ".gen-mode", family: "Archivo", size: 14, weight: 700, lineHeightRatio: 1.2 }
    ]
  },
  "privacy-wizards": {
    initial: [
      { role: "task heading", selector: ".finder-head h2", family: "Space Grotesk", size: 22, weight: 700, lineHeightRatio: 1.15 },
      { role: "finder search", selector: "#finder", family: "Space Grotesk", size: 15, mobileSize: 16, weight: 400 },
      { role: "section heading", selector: ".library-heading h3", family: "Space Grotesk", size: 18, weight: 700, lineHeightRatio: 1.2 },
      { role: "card title", selector: ".wizard-copy strong", family: "Space Grotesk", size: 16, weight: 700, lineHeightRatio: 1.3 },
      { role: "card support", selector: ".wizard-copy small", family: "Space Grotesk", size: 13, weight: 400, lineHeightRatio: 1.5 },
      { role: "card metadata", selector: ".card-meta", family: "Archivo", size: 11, weight: 700, lineHeightRatio: 1.35 },
      { role: "review status", selector: ".review-badge", family: "Archivo", size: 12, weight: 700, lineHeightRatio: 1.2, desktopOnly: true },
      { role: "category action", selector: ".category-row button", family: "Archivo", size: 12, weight: 700 }
    ],
    determination: [
      { role: "task heading", selector: "#question-heading", family: "Space Grotesk", size: 22, weight: 700, lineHeightRatio: 1.15 },
      { role: "question support", selector: ".question-help", family: "Space Grotesk", size: 13, weight: 400, lineHeightRatio: 1.5 },
      { role: "answer support", selector: ".answer-card small", family: "Space Grotesk", size: 13, weight: 400, lineHeightRatio: 1.5 }
    ]
  },
  "build-a-prompt": {
    initial: [
      { role: "task heading", selector: ".field-heading h2", family: "Space Grotesk", size: 22, weight: 700, lineHeightRatio: 1.15 },
      { role: "work request", selector: "#work-request", family: "Space Grotesk", size: 15, mobileSize: 16, weight: 400 },
      { role: "field support", selector: ".field-help", family: "Space Grotesk", size: 13, weight: 400, lineHeightRatio: 1.5 },
      { role: "primary action", selector: ".button.primary", family: "Archivo", size: 14, weight: 700, lineHeightRatio: 1.2 }
    ],
    composer: [
      { role: "task heading", selector: ".workspace-head h2", family: "Space Grotesk", size: 22, weight: 700, lineHeightRatio: 1.15 },
      { role: "part title", selector: ".part-copy strong", family: "Space Grotesk", size: 16, weight: 700, lineHeightRatio: 1.25 },
      { role: "part support", selector: ".part-copy small", family: "Space Grotesk", size: 13, weight: 400, lineHeightRatio: 1.5 }
    ]
  },
  "objection-oracle": {
    initial: [
      { role: "task heading", selector: ".oo-view-title", family: "Space Grotesk", size: 22, weight: 700, lineHeightRatio: 1.15 },
      { role: "primary action", selector: ".oo-main-action", family: "Archivo", size: 14, weight: 700, lineHeightRatio: 1.2 },
      { role: "outcome key", selector: ".oo-key", family: "Archivo", size: 12, weight: 700, lineHeightRatio: 1.2 },
      { role: "visual caption", selector: ".oo-caption", family: "Space Grotesk", size: 13, weight: 400 }
    ]
  }
};

function assertInside(base, target) {
  const rel = relative(resolve(base), resolve(target));
  if (!rel || rel.startsWith("..") || rel.includes(":")) throw new Error(`Unsafe proof path: ${target}`);
}

async function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The loopback server is still starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }
  throw new Error(`Toolkit server did not answer at ${url}`);
}

async function activate(page, route) {
  await page.evaluate((nextRoute) => { window.location.hash = nextRoute; }, route);
  await page.locator(`[data-view="${route}"]:not([hidden])`).waitFor({ state: "visible" });
  if (route !== "home") {
    const frame = page.locator(`[data-tool-frame="${route}"]`);
    await frame.waitFor({ state: "visible" });
    await page.locator(`[data-view="${route}"] .frame-stage.is-loaded`).waitFor({ state: "attached", timeout: 30000 });
  }
  await page.waitForTimeout(120);
}

async function routeGeometry(page, route) {
  return page.evaluate((active) => {
    const view = document.querySelector(`[data-view="${active}"]:not([hidden])`);
    const heading = view?.querySelector("h1");
    const headingBox = heading?.getBoundingClientRect();
    const headerBox = view?.querySelector(".tool-view-head")?.getBoundingClientRect();
    const frameBox = view?.querySelector("iframe")?.getBoundingClientRect();
    const viewBox = view?.getBoundingClientRect();
    return {
      route: active,
      documentOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      viewOverflow: Boolean(view && view.scrollWidth > view.clientWidth + 1),
      headingVisible: Boolean(headingBox && headingBox.width > 0 && headingBox.bottom > 0 && headingBox.top < window.innerHeight),
      visibleViews: document.querySelectorAll("[data-view]:not([hidden])").length,
      viewHeight: viewBox?.height || null,
      headerHeight: headerBox?.height || null,
      headerShare: headerBox && viewBox ? headerBox.height / viewBox.height : null,
      frameTop: frameBox?.top || null,
      frameHeight: frameBox?.height || null,
      frameShare: frameBox && viewBox ? frameBox.height / viewBox.height : null
    };
  }, route);
}

async function homeDensity(page) {
  await page.locator(".home-view").evaluate((view) => view.scrollTo({ top: 0, behavior: "auto" }));
  await page.evaluate(() => new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
  return page.evaluate(({ cardShadow, clearance }) => {
    const view = document.querySelector('[data-view="home"]:not([hidden])');
    const viewBox = view.getBoundingClientRect();
    const cards = [...view.querySelectorAll(".tool-card")];
    const measurements = cards.map((card) => {
      const cardBox = card.getBoundingClientRect();
      const target = card.querySelector(".card-actions .button.primary");
      const secondary = card.querySelector(".card-actions > a:not(.button)");
      const targetBox = target?.getBoundingClientRect();
      const secondaryBox = secondary?.getBoundingClientRect();
      const secondaryStyle = secondary ? getComputedStyle(secondary) : null;
      const secondaryVisible = Boolean(secondaryBox)
        && secondaryStyle?.display !== "none"
        && secondaryStyle?.visibility !== "hidden"
        && secondaryBox.width > 0
        && secondaryBox.height > 0;
      const cardFits = cardBox.top >= viewBox.top + clearance
        && cardBox.bottom + cardShadow <= viewBox.bottom - clearance;
      const targetFits = Boolean(targetBox)
        && targetBox.top >= viewBox.top + clearance
        && targetBox.bottom + cardShadow <= viewBox.bottom - clearance;
      return {
        name: card.querySelector("h3")?.textContent?.trim() || "untitled",
        cardTop: cardBox.top,
        cardBottom: cardBox.bottom,
        cardBottomWithShadow: cardBox.bottom + cardShadow,
        cardFits,
        targetTop: targetBox?.top || null,
        targetBottomWithShadow: targetBox ? targetBox.bottom + cardShadow : null,
        targetWidth: targetBox?.width || null,
        targetHeight: targetBox?.height || null,
        targetFits,
        secondaryVisible,
        secondaryHeight: secondaryVisible ? secondaryBox.height : null,
        secondaryPaddingLeft: secondaryVisible ? Number.parseFloat(secondaryStyle.paddingLeft) : null,
        secondaryTextGap: secondaryVisible && targetBox
          ? secondaryBox.left + Number.parseFloat(secondaryStyle.paddingLeft) - targetBox.right
          : null
      };
    });
    return {
      initialScrollTop: view.scrollTop,
      viewportTop: viewBox.top,
      viewportBottom: viewBox.bottom,
      visualViewportScale: window.visualViewport?.scale || 1,
      devicePixelRatio: window.devicePixelRatio,
      rootZoom: getComputedStyle(document.documentElement).zoom || "1",
      cards: measurements
    };
  }, { cardShadow: shadowClearance, clearance: viewportClearance });
}

async function homeChromeGeometry(page) {
  return page.evaluate(({ cardShadow, clearance }) => {
    const view = document.querySelector('[data-view="home"]:not([hidden])');
    const hero = view?.querySelector(".home-hero");
    const heroCopy = hero?.firstElementChild;
    const homeMark = hero?.querySelector(".home-brand-mark");
    const mobileMark = document.querySelector(".mobile-bar .brand-mark");
    const desktopBrand = document.querySelector(".toolkit-sidebar .brand");
    const eyebrow = hero?.querySelector(".eyebrow");
    const title = hero?.querySelector("h1");
    const lede = hero?.querySelector(".home-lede");
    const taskQuestion = view?.querySelector("#tools-title");
    const taskEyebrow = view?.querySelector(".section-head .eyebrow");
    const bottom = view?.querySelector(".home-bottom");
    const changelog = bottom?.querySelector(".changelog-card");
    const viewBox = view?.getBoundingClientRect();
    const heroBox = hero?.getBoundingClientRect();
    const heroCopyBox = heroCopy?.getBoundingClientRect();
    const homeMarkBox = homeMark?.getBoundingClientRect();
    const mobileMarkBox = mobileMark?.getBoundingClientRect();
    const eyebrowBox = eyebrow?.getBoundingClientRect();
    const ledeBox = lede?.getBoundingClientRect();
    const bottomBox = bottom?.getBoundingClientRect();
    const changelogBox = changelog?.getBoundingClientRect();
    const changelogSummaryBox = changelog?.querySelector("summary")?.getBoundingClientRect();
    const sidebar = document.querySelector(".toolkit-sidebar");
    const nav = sidebar?.querySelector(".tool-nav");
    const sidebarBox = sidebar?.getBoundingClientRect();
    const navBox = nav?.getBoundingClientRect();
    const isRendered = (element, box) => Boolean(element && box)
      && getComputedStyle(element).display !== "none"
      && getComputedStyle(element).visibility !== "hidden"
      && box.width > 0
      && box.height > 0;
    const retiredSelector = [
      ".sidebar-promise",
      ".sidebar-foot",
      ".status-dot",
      ".announcement",
      ".announcement-tag",
      ".tool-status",
      ".editorial-note",
      ".nav-code"
    ].join(",");
    return {
      retiredElements: document.querySelectorAll(retiredSelector).length,
      heroChildren: hero?.children.length || 0,
      heroDisplay: hero ? getComputedStyle(hero).display : null,
      desktopBrandRendered: isRendered(desktopBrand, desktopBrand?.getBoundingClientRect()),
      homeMarkRendered: isRendered(homeMark, homeMarkBox),
      mobileMarkRendered: isRendered(mobileMark, mobileMarkBox),
      homeMarkWidth: homeMarkBox?.width || null,
      homeMarkHeight: homeMarkBox?.height || null,
      homeMarkRightDelta: heroBox && homeMarkBox ? heroBox.right - homeMarkBox.right : null,
      heroTracksOverlap: Boolean(heroCopyBox && homeMarkBox)
        && heroCopyBox.left < homeMarkBox.right
        && heroCopyBox.right > homeMarkBox.left
        && heroCopyBox.top < homeMarkBox.bottom
        && heroCopyBox.bottom > homeMarkBox.top,
      sidebarNavTopGap: sidebarBox && navBox ? navBox.top - sidebarBox.top : null,
      eyebrow: eyebrow?.textContent?.trim() || null,
      title: title?.textContent?.trim() || null,
      lede: lede?.textContent?.trim() || null,
      taskQuestion: taskQuestion?.textContent?.trim() || null,
      taskEyebrowRendered: isRendered(taskEyebrow, taskEyebrow?.getBoundingClientRect()),
      eyebrowVisible: Boolean(eyebrowBox && eyebrowBox.width > 0 && eyebrowBox.height > 0),
      ledeVisible: Boolean(ledeBox && ledeBox.width > 0 && ledeBox.height > 0),
      bottomChildren: bottom?.children.length || 0,
      changelogLabel: changelog?.querySelector("summary .eyebrow")?.textContent?.trim() || null,
      changelogSummaryHeight: changelogSummaryBox?.height || null,
      changelogInitiallyOpen: Boolean(changelog?.open),
      leftDelta: bottomBox && changelogBox ? Math.abs(bottomBox.left - changelogBox.left) : null,
      rightDelta: bottomBox && changelogBox ? Math.abs(bottomBox.right - changelogBox.right) : null,
      shadowClear: Boolean(viewBox && changelogBox)
        && changelogBox.left >= viewBox.left + clearance
        && changelogBox.right + cardShadow <= viewBox.right - clearance
    };
  }, { cardShadow: shadowClearance, clearance: viewportClearance });
}

async function navigationGeometry(page, viewport, context) {
  return page.evaluate(({ viewportId, contextId }) => {
    const nav = document.querySelector(".tool-nav");
    const navBox = nav?.getBoundingClientRect();
    const links = [...(nav?.querySelectorAll("a[data-route-link]") || [])].map((link) => {
      const linkBox = link.getBoundingClientRect();
      const icon = link.querySelector(".nav-icon");
      const iconBox = icon?.getBoundingClientRect();
      const svg = icon?.querySelector("svg");
      const svgBox = svg?.getBoundingClientRect();
      const label = link.querySelector(":scope > span:last-child");
      const labelBox = label?.getBoundingClientRect();
      return {
        route: link.dataset.routeLink,
        name: link.innerText.trim().replace(/\s+/g, " "),
        width: linkBox.width,
        height: linkBox.height,
        top: linkBox.top,
        bottom: linkBox.bottom,
        visibleInsideNav: Boolean(navBox)
          && linkBox.top >= navBox.top - 1
          && linkBox.bottom <= navBox.bottom + 1,
        iconWidth: iconBox?.width || null,
        iconHeight: iconBox?.height || null,
        svgWidth: svgBox?.width || null,
        svgHeight: svgBox?.height || null,
        iconLabelGap: iconBox && labelBox ? labelBox.left - iconBox.right : null,
        svgFocusable: svg?.getAttribute("focusable") || null,
        iconHidden: icon?.getAttribute("aria-hidden") || null
      };
    });
    const rowGaps = links.slice(1).map((link, index) => link.top - links[index].bottom);
    return {
      viewport: viewportId,
      context: contextId,
      overflow: Boolean(nav && nav.scrollHeight > nav.clientHeight + 1),
      links,
      rowGaps
    };
  }, { viewportId: viewport, contextId: context });
}

async function getToolFrame(page, route) {
  const handle = await page.locator(`[data-tool-frame="${route}"]`).elementHandle();
  return handle?.contentFrame();
}

async function prepareCanonicalFonts(target) {
  await target.evaluate(async () => {
    await Promise.all([
      document.fonts.load('400 15px "Space Grotesk"'),
      document.fonts.load('700 15px "Space Grotesk"'),
      document.fonts.load('700 11px "Archivo"'),
      document.fonts.load('400 42px "Anton"')
    ]);
    await document.fonts.ready;
  });
}

async function embeddedLayoutGeometry(page, route, state = "initial") {
  const contract = embeddedRootContracts[route]?.[state];
  if (!contract) return null;
  const frame = await getToolFrame(page, route);
  if (!frame) return { route, state, available: false };
  return frame.evaluate(({ routeId, stateId, selectors }) => {
    const px = (value) => Number.parseFloat(value) || 0;
    const root = document.querySelector(selectors.root);
    const main = document.querySelector(selectors.main);
    const inner = document.querySelector(selectors.inner);
    if (!root || !main) {
      return {
        route: routeId,
        state: stateId,
        available: false,
        missing: [!root ? selectors.root : null, !main ? selectors.main : null].filter(Boolean)
      };
    }
    const rootBox = root.getBoundingClientRect();
    const mainBox = main.getBoundingClientRect();
    const rootStyle = getComputedStyle(root);
    const mainStyle = getComputedStyle(main);
    const innerBox = inner?.getBoundingClientRect();
    const innerStyle = inner ? getComputedStyle(inner) : null;
    const mainContentLeft = mainBox.left + px(mainStyle.paddingLeft);
    const mainContentRight = mainBox.right - px(mainStyle.paddingRight);
    const frameWidth = document.documentElement.clientWidth;
    return {
      route: routeId,
      state: stateId,
      available: true,
      rootSelector: selectors.root,
      mainSelector: selectors.main,
      innerSelector: selectors.inner,
      frameWidth,
      rootBox: {
        left: rootBox.left,
        right: rootBox.right,
        width: rootBox.width,
        height: rootBox.height
      },
      mainContentBox: {
        left: mainContentLeft,
        right: mainContentRight,
        width: mainContentRight - mainContentLeft
      },
      alignment: {
        leftDelta: Math.abs(rootBox.left - mainContentLeft),
        rightDelta: Math.abs(rootBox.right - mainContentRight),
        widthDelta: Math.abs(rootBox.width - (mainContentRight - mainContentLeft)),
        leftGutter: rootBox.left,
        rightGutter: frameWidth - rootBox.right
      },
      surface: {
        borderTop: px(rootStyle.borderTopWidth),
        borderRight: px(rootStyle.borderRightWidth),
        borderBottom: px(rootStyle.borderBottomWidth),
        borderLeft: px(rootStyle.borderLeftWidth),
        paddingTop: px(rootStyle.paddingTop),
        paddingRight: px(rootStyle.paddingRight),
        paddingBottom: px(rootStyle.paddingBottom),
        paddingLeft: px(rootStyle.paddingLeft),
        marginTop: px(rootStyle.marginTop),
        marginRight: px(rootStyle.marginRight),
        marginBottom: px(rootStyle.marginBottom),
        marginLeft: px(rootStyle.marginLeft),
        boxShadow: rootStyle.boxShadow,
        backgroundColor: rootStyle.backgroundColor
      },
      innerBoundary: inner && innerStyle && innerBox ? {
        visible: innerBox.width > 0 && innerBox.height > 0 && innerStyle.display !== "none" && innerStyle.visibility !== "hidden",
        maxBorderWidth: Math.max(
          px(innerStyle.borderTopWidth),
          px(innerStyle.borderRightWidth),
          px(innerStyle.borderBottomWidth),
          px(innerStyle.borderLeftWidth)
        )
      } : null
    };
  }, { routeId: route, stateId: state, selectors: contract });
}

async function semanticTypographyGeometry(page, route, state = "initial") {
  const contracts = semanticTypeContracts[route]?.[state];
  if (!contracts) return null;
  const frame = await getToolFrame(page, route);
  if (!frame) return { route, state, available: false, roles: [] };
  await prepareCanonicalFonts(frame);
  return frame.evaluate(({ routeId, stateId, roleContracts }) => {
    const read = (contract) => {
      const element = document.querySelector(contract.selector);
      if (!element) return { ...contract, available: false };
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      const lineHeight = Number.parseFloat(style.lineHeight);
      return {
        ...contract,
        available: true,
        rendered: style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0,
        actual: {
          family: style.fontFamily,
          size: Number.parseFloat(style.fontSize),
          weight: Number.parseInt(style.fontWeight, 10),
          lineHeight: Number.isFinite(lineHeight) ? lineHeight : null,
          lineHeightRaw: style.lineHeight,
          letterSpacing: style.letterSpacing,
          textTransform: style.textTransform
        }
      };
    };
    return { route: routeId, state: stateId, available: true, roles: roleContracts.map(read) };
  }, { routeId: route, stateId: state, roleContracts: contracts });
}

async function safeSeedFieldParity(page, viewport, state = "initial") {
  const frame = await getToolFrame(page, "safeseed");
  if (!frame) return { viewport, state, available: false };
  await prepareCanonicalFonts(frame);
  return frame.evaluate(({ viewportId, stateId }) => {
    const read = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      const lineHeight = Number.parseFloat(style.lineHeight);
      return {
        selector,
        family: style.fontFamily,
        size: Number.parseFloat(style.fontSize),
        weight: Number.parseInt(style.fontWeight, 10),
        lineHeight: Number.isFinite(lineHeight) ? lineHeight : null,
        lineHeightRaw: style.lineHeight,
        width: box.width,
        height: box.height
      };
    };
    const fieldName = read(".field-name");
    const fieldType = read(".field-type");
    return {
      viewport: viewportId,
      state: stateId,
      available: Boolean(fieldName && fieldType),
      fieldName,
      fieldType
    };
  }, { viewportId: viewport, stateId: state });
}

async function homeFontRoles(page) {
  await prepareCanonicalFonts(page);
  return page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector);
      const style = getComputedStyle(element);
      return {
        selector,
        family: style.fontFamily,
        size: Number.parseFloat(style.fontSize),
        weight: Number.parseInt(style.fontWeight, 10)
      };
    };
    return {
      available: {
        body: document.fonts.check('400 15px "Space Grotesk"'),
        heading: document.fonts.check('700 15px "Space Grotesk"'),
        label: document.fonts.check('700 11px "Archivo"'),
        display: document.fonts.check('400 42px "Anton"')
      },
      body: read("body"),
      display: read(".home-hero h1"),
      lede: read(".home-lede"),
      label: read(".home-hero .eyebrow"),
      cardTitle: read(".tool-card h3")
    };
  });
}

function firstUsefulControls(frame, route) {
  if (route === "redactorium") {
    return [{ label: "Choose a file", locator: frame.getByRole("button", { name: /choose a file/i }) }];
  }
  if (route === "safeseed") {
    return [{ label: "Choose a practical schema", locator: frame.locator(".preset-btn").first() }];
  }
  if (route === "privacy-wizards") {
    return [
      { label: "Find a determination", locator: frame.locator("#finder") },
      { label: "Open the first determination", locator: frame.locator(".wizard-card").first() }
    ];
  }
  if (route === "build-a-prompt") {
    return [
      { label: "Describe the work request", locator: frame.locator("#work-request") },
      { label: "Build the first draft", locator: frame.getByRole("button", { name: /build the first draft/i }) }
    ];
  }
  return [{ label: "Ask the oracle", locator: frame.locator("#start-button") }];
}

async function firstUsefulControlGeometry(page, route) {
  const iframe = page.locator(`[data-tool-frame="${route}"]`);
  const iframeBox = await iframe.boundingBox();
  const frame = await getToolFrame(page, route);
  if (!iframeBox || !frame) return { available: false, controls: [] };
  await frame.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  const controls = [];
  for (const contract of firstUsefulControls(frame, route)) {
    await contract.locator.waitFor({ state: "visible", timeout: 10000 });
    const box = await contract.locator.boundingBox();
    const fontSize = await contract.locator.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
    controls.push({
      label: contract.label,
      top: box?.y || null,
      bottom: box ? box.y + box.height : null,
      width: box?.width || null,
      height: box?.height || null,
      fontSize,
      fits: Boolean(box)
        && box.y >= iframeBox.y - 1
        && box.y + box.height <= Math.min(iframeBox.y + iframeBox.height, page.viewportSize().height) - viewportClearance
    });
  }
  return { available: true, iframe: iframeBox, controls };
}

function typographyEvaluator({ secondarySelectors }) {
  const hiddenSelector = '[hidden], [aria-hidden="true"], .sr-only, .visually-hidden, .screen-reader-text';
  const skippedTags = new Set(["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT", "SVG", "PATH", "USE", "TITLE"]);
  const isRendered = (element) => {
    if (!element || skippedTags.has(element.tagName) || element.closest(hiddenSelector)) return false;
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return style.display !== "none"
      && style.visibility !== "hidden"
      && Number.parseFloat(style.opacity || "1") > 0
      && box.width > 0
      && box.height > 0;
  };
  const describe = (element) => ({
    tag: element.tagName.toLowerCase(),
    id: element.id || "",
    className: typeof element.className === "string" ? element.className.slice(0, 90) : "",
    text: (element.innerText || element.getAttribute("aria-label") || element.getAttribute("placeholder") || "")
      .trim().replace(/\s+/g, " ").slice(0, 100),
    fontSize: Number.parseFloat(getComputedStyle(element).fontSize)
  });

  const textElements = [...document.body.querySelectorAll("*")].filter((element) => {
    if (!isRendered(element)) return false;
    if (element.matches("input, textarea, select, button, summary")) return true;
    return [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
  });
  const baselineViolations = textElements
    .filter((element) => Number.parseFloat(getComputedStyle(element).fontSize) < 11 - 0.01)
    .map(describe);
  const secondaryElements = [...new Set(secondarySelectors.flatMap((selector) => [...document.querySelectorAll(selector)]))]
    .filter(isRendered)
    .filter((element) => {
      const style = getComputedStyle(element);
      const text = (element.innerText || "").trim();
      const compactUppercaseLabel = text.length > 0
        && text.length <= 80
        && text === text.toUpperCase()
        && Number.parseFloat(style.fontSize) <= 13
        && Number.parseFloat(style.letterSpacing || "0") > 0;
      return !compactUppercaseLabel;
    });
  const secondaryViolations = secondaryElements
    .filter((element) => Number.parseFloat(getComputedStyle(element).fontSize) < 13 - 0.01)
    .map(describe);
  return {
    bodyFontSize: Number.parseFloat(getComputedStyle(document.body).fontSize),
    bodyFontFamily: getComputedStyle(document.body).fontFamily,
    baselineViolations,
    secondaryViolations
  };
}

async function typographyGeometry(page, route) {
  await prepareCanonicalFonts(page);
  const shellSelectors = [
    ".home-lede",
    ".section-head > p",
    ".tool-card p",
    ".tool-view-head p:not(.eyebrow)",
    ".changelog-body"
  ];
  const shell = await page.evaluate(typographyEvaluator, { secondarySelectors: shellSelectors });
  if (route === "home") return { shell, frame: null };
  const frame = await getToolFrame(page, route);
  await prepareCanonicalFonts(frame);
  const frameSelectors = [
    "p:not(.eyebrow):not([class*='meta']):not([class*='label']):not([class*='tag'])",
    "li",
    "dd",
    "[class*='help']",
    "[class*='hint']",
    "[class*='caption']",
    "[class*='intro']",
    "[class*='promise']"
  ];
  return { shell, frame: await frame.evaluate(typographyEvaluator, { secondarySelectors: frameSelectors }) };
}

function controlTargetEvaluator() {
  const hiddenSelector = '[hidden], [aria-hidden="true"], .sr-only, .visually-hidden, .screen-reader-text';
  const candidates = [...document.querySelectorAll([
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "textarea:not([disabled])",
    "select:not([disabled])",
    "summary",
    "[role='button']",
    "[role='tab']",
    "a.button",
    "a[data-route-link]"
  ].join(","))];
  const targets = [];
  const seen = new Set();
  for (const candidate of candidates) {
    if (candidate.closest(hiddenSelector)) continue;
    const type = candidate instanceof HTMLInputElement ? candidate.type : "";
    const label = (type === "checkbox" || type === "radio")
      ? candidate.closest("label") || (candidate.id ? document.querySelector(`label[for="${CSS.escape(candidate.id)}"]`) : null)
      : null;
    const target = label || candidate;
    if (seen.has(target)) continue;
    seen.add(target);
    const style = getComputedStyle(target);
    const box = target.getBoundingClientRect();
    const intersectsViewport = box.right > 0 && box.left < document.documentElement.clientWidth && box.bottom > 0 && box.top < window.innerHeight;
    if (style.display === "none" || style.visibility === "hidden" || Number.parseFloat(style.opacity || "1") <= 0 || box.width <= 0 || box.height <= 0 || !intersectsViewport) continue;
    targets.push({
      tag: target.tagName.toLowerCase(),
      id: target.id || "",
      className: typeof target.className === "string" ? target.className.slice(0, 90) : "",
      text: (target.innerText || target.getAttribute("aria-label") || target.getAttribute("placeholder") || "")
        .trim().replace(/\s+/g, " ").slice(0, 100),
      width: box.width,
      height: box.height
    });
  }
  return targets;
}

async function controlTargetGeometry(page, route) {
  const shell = await page.evaluate(controlTargetEvaluator);
  if (route === "home") return { shell, frame: [] };
  const frame = await getToolFrame(page, route);
  return { shell, frame: await frame.evaluate(controlTargetEvaluator) };
}

async function frameOverflow(page, route) {
  if (route === "home") return null;
  const frame = page.frames().find((item) => item.url().includes(`/tools/${route === "privacy-wizards" ? "privacy-wizards-council" : route}`));
  if (!frame) return { route, available: false };
  return frame.evaluate(() => ({
    route: document.title,
    available: true,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    bodyOverflow: document.body.scrollWidth > document.body.clientWidth + 1
  }));
}

function record(checks, ok, label, detail = "") {
  checks.push({ ok: Boolean(ok), label, detail });
}

async function runCoreFlows(page, checks) {
  await activate(page, "redactorium");
  const red = page.frameLocator('[data-tool-frame="redactorium"]');
  const modeGeometry = await red.locator('[role="tablist"] button').evaluateAll((buttons) => buttons.map((button) => ({ width: button.getBoundingClientRect().width, label: button.textContent.trim() })));
  record(checks, modeGeometry.length === 2 && Math.abs(modeGeometry[0].width - modeGeometry[1].width) <= 1, "Redactorium paired modes have equal width", JSON.stringify(modeGeometry));
  const chooseShadow = await red.getByRole("button", { name: /choose a file/i }).evaluate((button) => getComputedStyle(button).boxShadow);
  record(checks, chooseShadow !== "none" && chooseShadow.includes("4px"), "Choose a file has the canonical visible shadow", chooseShadow);
  await red.getByTestId("use-sample-btn").click();
  await red.getByTestId("detection-table").waitFor({ state: "visible", timeout: 20000 });
  record(checks, await red.getByTestId("detection-table").isVisible(), "Redactorium sample reaches detection review");

  await activate(page, "safeseed");
  const seed = page.frameLocator('[data-tool-frame="safeseed"]');
  await seed.locator(".gen-mode").first().waitFor({ state: "visible", timeout: 30000 });
  await seed.locator(".gen-table").waitFor({ state: "visible" });
  const seedModes = await seed.locator(".gen-mode").evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().width));
  record(checks, seedModes.length === 2 && Math.abs(seedModes[0] - seedModes[1]) <= 1, "SafeSeed generate and verify modes have equal width", JSON.stringify(seedModes));
  record(checks, await seed.getByTestId("download-csv").isEnabled(), "SafeSeed produces a downloadable generated CSV");
  await seed.getByRole("button", { name: "Verify a file" }).click();
  await seed.locator(".verify-drops").waitFor({ state: "visible" });
  record(checks, await seed.locator(".verify-drops").isVisible(), "SafeSeed switches to verification without reload");

  await activate(page, "build-a-prompt");
  const prompt = page.frameLocator('[data-tool-frame="build-a-prompt"]');
  await prompt.locator("#work-request").fill("Review this DPA clause and list material risk, missing terms, and the decisions a human reviewer must make.");
  await prompt.getByRole("button", { name: /Build the first draft/i }).click();
  await prompt.locator("#composer-heading").waitFor({ state: "visible" });
  record(checks, await prompt.locator("#composer-heading").isVisible(), "Build-A-Prompt reaches the five-part composer");

  await activate(page, "privacy-wizards");
  const wizards = page.frameLocator('[data-tool-frame="privacy-wizards"]');
  await wizards.locator(".wizard-card").first().click();
  await wizards.locator("#question-heading").waitFor({ state: "visible" });
  const firstQuestion = await wizards.locator("#question-heading").textContent();
  await wizards.locator(".answer-card").first().click();
  await page.waitForTimeout(120);
  const nextQuestion = await wizards.locator("#question-heading").textContent().catch(() => "outcome");
  record(checks, Boolean(firstQuestion) && nextQuestion !== firstQuestion, "Privacy Wizards advances a determination path", `${firstQuestion} -> ${nextQuestion}`);

  await activate(page, "objection-oracle");
  const oracle = page.frameLocator('[data-tool-frame="objection-oracle"]');
  await oracle.locator("#start-button").click();
  for (let index = 0; index < 5; index += 1) {
    await oracle.locator('[data-answer="yes"]:visible').click();
  }
  await oracle.locator("#shake-button").waitFor({ state: "visible" });
  await oracle.locator("#shake-button").click();
  await oracle.locator("#result-title").waitFor({ state: "visible", timeout: 10000 });
  const ruling = (await oracle.locator("#result-title").textContent())?.trim();
  record(checks, ["SHIP IT", "NEXT VERSION", "FIX IT, THEN SHIP", "HARD STOP"].includes(ruling), "Objection Oracle returns a deterministic ruling", ruling || "missing");

  await activate(page, "build-a-prompt");
  record(checks, await prompt.locator("#composer-heading").isVisible(), "An opened tool stays mounted across tab switches");
}

async function captureTransitionProofs(page, viewport, report) {
  await activate(page, "safeseed");
  const seedFrame = await getToolFrame(page, "safeseed");
  const fieldList = seedFrame.locator(".field-list").first();
  await fieldList.waitFor({ state: "visible", timeout: 10000 });
  await fieldList.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const seedScreenshot = `${viewport}-safeseed-fields.png`;
  await page.screenshot({ path: join(proofsRoot, seedScreenshot), fullPage: false });
  report.screenshots.push(seedScreenshot);

  await activate(page, "privacy-wizards");
  const wizards = page.frameLocator('[data-tool-frame="privacy-wizards"]');
  await wizards.locator(".wizard-card").first().click();
  await wizards.locator("#question-heading").waitFor({ state: "visible", timeout: 10000 });
  await wizards.locator(".question-card").scrollIntoViewIfNeeded();
  report.embeddedLayouts.push({ viewport, ...await embeddedLayoutGeometry(page, "privacy-wizards", "determination") });
  report.semanticTypography.push({ viewport, ...await semanticTypographyGeometry(page, "privacy-wizards", "determination") });
  const wizardScreenshot = `${viewport}-privacy-wizards-question.png`;
  await page.screenshot({ path: join(proofsRoot, wizardScreenshot), fullPage: false });
  report.screenshots.push(wizardScreenshot);

  await activate(page, "build-a-prompt");
  const prompt = page.frameLocator('[data-tool-frame="build-a-prompt"]');
  await prompt.locator("#work-request").fill("Review this DPA clause and list material risk, missing terms, and the decisions a human reviewer must make.");
  await prompt.getByRole("button", { name: /Build the first draft/i }).click();
  await prompt.locator("#composer-heading").waitFor({ state: "visible", timeout: 10000 });
  await prompt.locator("#composer-heading").scrollIntoViewIfNeeded();
  report.semanticTypography.push({ viewport, ...await semanticTypographyGeometry(page, "build-a-prompt", "composer") });
  const promptScreenshot = `${viewport}-build-a-prompt-composer.png`;
  await page.screenshot({ path: join(proofsRoot, promptScreenshot), fullPage: false });
  report.screenshots.push(promptScreenshot);
}

async function captureNarrowSafeSeedProof(browser, report) {
  const viewport = "narrow-320x568";
  const context = await browser.newContext({
    viewport: { width: 320, height: 568 },
    colorScheme: "light",
    reducedMotion: "reduce"
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") report.consoleErrors.push({ viewport, text: message.text() });
  });
  page.on("pageerror", (error) => report.pageErrors.push({ viewport, text: error.message }));
  page.on("request", (request) => {
    const requestUrl = new URL(request.url());
    if (requestUrl.origin !== new URL(baseUrl).origin) report.externalRequests.push({ viewport, url: request.url() });
  });

  await page.goto(`${baseUrl}/#home`, { waitUntil: "networkidle" });
  await activate(page, "safeseed");
  report.embeddedLayouts.push({ viewport, ...await embeddedLayoutGeometry(page, "safeseed") });
  report.semanticTypography.push({ viewport, ...await semanticTypographyGeometry(page, "safeseed") });
  report.safeSeedFieldParity.push(await safeSeedFieldParity(page, viewport));
  const frame = await getToolFrame(page, "safeseed");
  const fieldList = frame.locator(".field-list").first();
  await fieldList.waitFor({ state: "visible", timeout: 10000 });
  await fieldList.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const screenshot = `${viewport}-safeseed-fields.png`;
  await page.screenshot({ path: join(proofsRoot, screenshot), fullPage: false });
  report.screenshots.push(screenshot);
  await context.close();
}

let server;
let browser;
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  screenshots: [],
  geometry: [],
  frameGeometry: [],
  homeDensity: [],
  homeChrome: [],
  navigationGeometry: [],
  firstUsefulControls: [],
  typography: [],
  embeddedLayouts: [],
  semanticTypography: [],
  safeSeedFieldParity: [],
  homeFontParity: [],
  controlTargets: [],
  consoleErrors: [],
  pageErrors: [],
  externalRequests: [],
  checks: []
};

try {
  assertInside(candidateRoot, proofsRoot);
  await rm(proofsRoot, { recursive: true, force: true });
  await mkdir(proofsRoot, { recursive: true });

  if (!process.env.AF_TOOLKIT_QA_URL) {
    server = spawn(process.execPath, ["server.mjs"], {
      cwd: candidateRoot,
      env: { ...process.env, AF_TOOLKIT_PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"]
    });
  }
  await waitForServer(baseUrl);
  browser = await chromium.launch({ headless: true });

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor || 1,
      colorScheme: "light",
      reducedMotion: "reduce"
    });
    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error") report.consoleErrors.push({ viewport: viewport.id, text: message.text() });
    });
    page.on("pageerror", (error) => report.pageErrors.push({ viewport: viewport.id, text: error.message }));
    page.on("request", (request) => {
      const requestUrl = new URL(request.url());
      if (requestUrl.origin !== new URL(baseUrl).origin) report.externalRequests.push({ viewport: viewport.id, url: request.url() });
    });

    await page.goto(`${baseUrl}/#home`, { waitUntil: "networkidle" });
    for (const route of routes) {
      await activate(page, route);
      if (route === "home") {
        report.homeChrome.push({ viewport: viewport.id, ...await homeChromeGeometry(page) });
        if (homeDensityViewportIds.has(viewport.id)) {
          report.homeDensity.push({ viewport: viewport.id, ...await homeDensity(page) });
        }
        if (viewport.width > 820) {
          report.navigationGeometry.push(await navigationGeometry(page, viewport.id, "desktop-rail"));
        }
      }
      if (route !== "home" && interactionViewportIds.has(viewport.id)) {
        report.firstUsefulControls.push({ viewport: viewport.id, route, ...await firstUsefulControlGeometry(page, route) });
      }
      if (typographyViewportIds.has(viewport.id)) {
        report.typography.push({ viewport: viewport.id, route, ...await typographyGeometry(page, route) });
        if (route === "home") report.homeFontParity.push({ viewport: viewport.id, ...await homeFontRoles(page) });
      }
      if (route !== "home" && embeddedAuditViewportIds.has(viewport.id)) {
        const embeddedLayout = await embeddedLayoutGeometry(page, route);
        if (embeddedLayout) report.embeddedLayouts.push({ viewport: viewport.id, ...embeddedLayout });
        const semanticTypography = await semanticTypographyGeometry(page, route);
        if (semanticTypography) report.semanticTypography.push({ viewport: viewport.id, ...semanticTypography });
        if (route === "safeseed") report.safeSeedFieldParity.push(await safeSeedFieldParity(page, viewport.id));
      }
      if (interactionViewportIds.has(viewport.id)) {
        report.controlTargets.push({ viewport: viewport.id, route, ...await controlTargetGeometry(page, route) });
      }
      const screenshot = `${viewport.id}-${route}.png`;
      await page.screenshot({ path: join(proofsRoot, screenshot), fullPage: false });
      report.screenshots.push(screenshot);
      report.geometry.push({ viewport: viewport.id, ...await routeGeometry(page, route) });
      const innerGeometry = await frameOverflow(page, route);
      if (innerGeometry) report.frameGeometry.push({ viewport: viewport.id, ...innerGeometry });
    }

    if (viewport.id === "mobile-390" || viewport.id === "narrow-320") {
      await activate(page, "home");
      await page.locator(".menu-button").click();
      const navigationScreenshot = `${viewport.id}-navigation-open.png`;
      await page.locator(".toolkit-sidebar").screenshot({ path: join(proofsRoot, navigationScreenshot) });
      report.screenshots.push(navigationScreenshot);
      report.navigationGeometry.push(await navigationGeometry(page, viewport.id, "mobile-drawer"));
      record(report.checks, await page.locator(".menu-button").getAttribute("aria-expanded") === "true", `${viewport.id} tool chooser announces open state`);
      await page.keyboard.press("Escape");
      record(report.checks, await page.locator(".menu-button").getAttribute("aria-expanded") === "false", `${viewport.id} Escape closes the tool chooser`);
      record(report.checks, await page.locator(".menu-button").evaluate((button) => document.activeElement === button), `${viewport.id} tool chooser returns focus to its trigger`);
    }

    if (viewport.id === "desktop-1440" || viewport.id === "narrow-320") {
      await activate(page, "home");
      const summary = page.locator(".changelog-card summary");
      await summary.scrollIntoViewIfNeeded();
      await summary.focus();
      await summary.press("Enter");
      record(report.checks, await page.locator(".changelog-card").evaluate((details) => details.open), `${viewport.id} Changelog opens from the keyboard`);
      const changelogScreenshot = `${viewport.id}-home-changelog-open.png`;
      await page.screenshot({ path: join(proofsRoot, changelogScreenshot), fullPage: false });
      report.screenshots.push(changelogScreenshot);
      await summary.press("Space");
      record(report.checks, !(await page.locator(".changelog-card").evaluate((details) => details.open)), `${viewport.id} Changelog closes from the keyboard`);
    }

    if (transitionProofViewportIds.has(viewport.id)) await captureTransitionProofs(page, viewport.id, report);
    if (viewport.id === "desktop-1440") await runCoreFlows(page, report.checks);
    await context.close();
  }

  await captureNarrowSafeSeedProof(browser, report);

  for (const geometry of report.geometry) {
    record(report.checks, !geometry.documentOverflow && !geometry.viewOverflow, `${geometry.viewport} ${geometry.route} has no outer horizontal overflow`, JSON.stringify(geometry));
    record(report.checks, geometry.visibleViews === 1 && geometry.headingVisible, `${geometry.viewport} ${geometry.route} has one visible labelled view`, JSON.stringify(geometry));
    if (geometry.route !== "home") {
      record(report.checks, geometry.frameHeight >= 320, `${geometry.viewport} ${geometry.route} keeps a usable task pane`, String(geometry.frameHeight));
      if (homeDensityViewportIds.has(geometry.viewport)) {
        record(
          report.checks,
          geometry.headerShare <= 0.18 && geometry.frameShare >= 0.82,
          `${geometry.viewport} ${geometry.route} gives at least 82% of the view to the tool`,
          JSON.stringify({ headerHeight: geometry.headerHeight, headerShare: geometry.headerShare, frameTop: geometry.frameTop, frameHeight: geometry.frameHeight, frameShare: geometry.frameShare })
        );
      }
    }
  }
  for (const density of report.homeDensity) {
    const cardsFit = density.cards.length === 5 && density.cards.every((card) => card.cardFits);
    const targetsFit = density.cards.length === 5 && density.cards.every((card) => card.targetFits);
    const targetSizesFit = density.cards.length === 5 && density.cards.every((card) => card.targetWidth >= 44 && card.targetHeight >= 44);
    record(report.checks, density.initialScrollTop === 0 && cardsFit, `${density.viewport} Home shows all five cards and their shadows initially`, JSON.stringify(density.cards));
    record(report.checks, targetsFit, `${density.viewport} Home shows every Open tool target initially`, JSON.stringify(density.cards.map((card) => ({ name: card.name, targetTop: card.targetTop, targetBottomWithShadow: card.targetBottomWithShadow, targetFits: card.targetFits }))));
    record(report.checks, targetSizesFit, `${density.viewport} Home Open tool targets are at least 44 by 44`, JSON.stringify(density.cards.map((card) => ({ name: card.name, width: card.targetWidth, height: card.targetHeight }))));
    const visibleSecondaryLinks = density.cards.filter((card) => card.secondaryVisible);
    if (visibleSecondaryLinks.length) {
      record(
        report.checks,
        visibleSecondaryLinks.length === 5 && visibleSecondaryLinks.every((card) => card.secondaryTextGap >= 16 - 0.5),
        `${density.viewport} Home secondary link text clears the primary box by at least 16px`,
        JSON.stringify(visibleSecondaryLinks.map((card) => ({ name: card.name, textGap: card.secondaryTextGap, paddingLeft: card.secondaryPaddingLeft })))
      );
      record(
        report.checks,
        visibleSecondaryLinks.every((card) => card.secondaryHeight >= 44 - 0.5),
        `${density.viewport} Home secondary links keep 44px targets`,
        JSON.stringify(visibleSecondaryLinks.map((card) => ({ name: card.name, height: card.secondaryHeight })))
      );
    }
    if (density.viewport === "reported-1439x726") {
      const rootZoom = Number.parseFloat(density.rootZoom) || 1;
      record(
        report.checks,
        Math.abs(density.visualViewportScale - 1) <= 0.001 && Math.abs(rootZoom - 1) <= 0.001 && Math.abs(density.devicePixelRatio - 2) <= 0.001,
        "Reported 1439x726 proof runs at 100% page zoom and DPR 2",
        JSON.stringify({ visualViewportScale: density.visualViewportScale, rootZoom: density.rootZoom, devicePixelRatio: density.devicePixelRatio })
      );
    }
  }
  for (const chrome of report.homeChrome) {
    record(report.checks, chrome.retiredElements === 0, `${chrome.viewport} Home renders none of the retired filler regions`, JSON.stringify(chrome));
    const compactViewport = chrome.viewport === "mobile-390" || chrome.viewport === "narrow-320";
    record(
      report.checks,
      chrome.heroChildren === 2
        && chrome.heroDisplay === "grid"
        && !chrome.desktopBrandRendered
        && !chrome.heroTracksOverlap
        && (compactViewport
          ? !chrome.homeMarkRendered && chrome.mobileMarkRendered
          : chrome.homeMarkRendered
            && !chrome.mobileMarkRendered
            && chrome.homeMarkWidth === 40
            && chrome.homeMarkHeight === 40
            && chrome.homeMarkRightDelta >= 3
            && chrome.homeMarkRightDelta <= 5
            && Math.abs(chrome.sidebarNavTopGap) <= 1),
      `${chrome.viewport} uses one AF tile in the correct header and no desktop brand cap`,
      JSON.stringify({ heroChildren: chrome.heroChildren, heroDisplay: chrome.heroDisplay, desktopBrandRendered: chrome.desktopBrandRendered, homeMarkRendered: chrome.homeMarkRendered, mobileMarkRendered: chrome.mobileMarkRendered, homeMarkWidth: chrome.homeMarkWidth, homeMarkHeight: chrome.homeMarkHeight, homeMarkRightDelta: chrome.homeMarkRightDelta, heroTracksOverlap: chrome.heroTracksOverlap, sidebarNavTopGap: chrome.sidebarNavTopGap })
    );
    record(
      report.checks,
      chrome.eyebrow === "ADVOKAT FRIDA"
        && chrome.title === "THE TOOLKIT"
        && chrome.lede === "The privacy practitioners swiss army knife."
        && chrome.taskQuestion === "What's on your desk today?"
        && !chrome.taskEyebrowRendered
        && chrome.eyebrowVisible
        && chrome.ledeVisible,
      `${chrome.viewport} Home keeps the approved orientation copy visible`,
      JSON.stringify({ eyebrow: chrome.eyebrow, title: chrome.title, lede: chrome.lede, taskQuestion: chrome.taskQuestion, taskEyebrowRendered: chrome.taskEyebrowRendered, eyebrowVisible: chrome.eyebrowVisible, ledeVisible: chrome.ledeVisible })
    );
    record(
      report.checks,
      chrome.bottomChildren === 1
        && chrome.changelogLabel === "Changelog"
        && chrome.changelogInitiallyOpen === false
        && chrome.changelogSummaryHeight <= 56
        && chrome.leftDelta <= 1
        && chrome.rightDelta <= 1
        && chrome.shadowClear,
      `${chrome.viewport} Home ends with one closed full-width Changelog and a clear shadow`,
      JSON.stringify(chrome)
    );
  }
  const expectedNavNames = ["Home", "Redactorium", "SafeSeed", "Privacy Wizards", "Build-A-Prompt", "Objection Oracle"];
  for (const nav of report.navigationGeometry) {
    const names = nav.links.map((link) => link.name);
    const geometryPasses = nav.links.length === 6 && nav.links.every((link) => (
      link.height >= 44 - 0.5
      && link.visibleInsideNav
      && Math.abs(link.iconWidth - 30) <= 0.5
      && Math.abs(link.iconHeight - 30) <= 0.5
      && Math.abs(link.svgWidth - 20) <= 0.5
      && Math.abs(link.svgHeight - 20) <= 0.5
      && link.iconLabelGap >= 9.5
      && link.svgFocusable === "false"
      && link.iconHidden === "true"
    ));
    record(
      report.checks,
      !nav.overflow && geometryPasses && JSON.stringify(names) === JSON.stringify(expectedNavNames),
      `${nav.viewport} ${nav.context} shows six labelled, decorative Lucide navigation rows`,
      JSON.stringify(nav)
    );
    record(
      report.checks,
      nav.rowGaps.length === 5 && nav.rowGaps.every((gap) => gap >= 2),
      `${nav.viewport} ${nav.context} navigation rows do not overlap`,
      JSON.stringify(nav.rowGaps)
    );
  }
  for (const entry of report.embeddedLayouts) {
    const surface = entry.surface || {};
    const transparentBackground = surface.backgroundColor === "transparent" || surface.backgroundColor === "rgba(0, 0, 0, 0)";
    const flatSurface = entry.available
      && [surface.borderTop, surface.borderRight, surface.borderBottom, surface.borderLeft].every((value) => value <= 0.01)
      && [surface.paddingTop, surface.paddingRight, surface.paddingBottom, surface.paddingLeft].every((value) => value <= 0.01)
      && [surface.marginTop, surface.marginRight, surface.marginBottom, surface.marginLeft].every((value) => Math.abs(value) <= 0.01)
      && surface.boxShadow === "none"
      && transparentBackground;
    record(
      report.checks,
      flatSurface,
      `${entry.viewport} ${entry.route} ${entry.state} uses the Toolkit canvas without an outer application card`,
      JSON.stringify({ root: entry.rootSelector, surface })
    );
    const gutterLimit = entry.viewport === "reported-1439x726" ? 24.5 : 12.5;
    const alignment = entry.alignment || {};
    const fillsMainCanvas = entry.available
      && alignment.leftDelta <= 1
      && alignment.rightDelta <= 1
      && alignment.widthDelta <= 1
      && alignment.leftGutter >= -0.5
      && alignment.rightGutter >= -0.5
      && alignment.leftGutter <= gutterLimit
      && alignment.rightGutter <= gutterLimit
      && Math.abs(alignment.leftGutter - alignment.rightGutter) <= 1;
    record(
      report.checks,
      fillsMainCanvas,
      `${entry.viewport} ${entry.route} ${entry.state} fills the one-gutter embedded canvas`,
      JSON.stringify({ root: entry.rootSelector, frameWidth: entry.frameWidth, rootBox: entry.rootBox, mainContentBox: entry.mainContentBox, alignment, gutterLimit })
    );
    record(
      report.checks,
      Boolean(entry.innerBoundary?.visible && entry.innerBoundary.maxBorderWidth >= 1),
      `${entry.viewport} ${entry.route} ${entry.state} preserves meaningful inner control boundaries`,
      JSON.stringify({ inner: entry.innerSelector, innerBoundary: entry.innerBoundary })
    );
  }
  for (const entry of report.semanticTypography) {
    for (const role of entry.roles || []) {
      const compactMobile = entry.viewport === "mobile-390" || entry.viewport?.startsWith("narrow-");
      if (role.desktopOnly && compactMobile) continue;
      const actual = role.actual || {};
      const expectedSize = compactMobile && role.mobileSize ? role.mobileSize : role.size;
      const familyPasses = role.available && actual.family?.includes(role.family);
      const sizePasses = role.available && Math.abs(actual.size - expectedSize) <= 0.05;
      const weightPasses = role.weight === undefined || (role.available && actual.weight === role.weight);
      const lineHeightPasses = role.lineHeightRatio === undefined
        || (role.available && actual.lineHeight !== null && Math.abs((actual.lineHeight / actual.size) - role.lineHeightRatio) <= 0.04);
      record(
        report.checks,
        entry.available && role.rendered && familyPasses && sizePasses && weightPasses && lineHeightPasses,
        `${entry.viewport} ${entry.route} ${entry.state} uses canonical ${role.role} typography`,
        JSON.stringify({ selector: role.selector, expected: { family: role.family, size: expectedSize, weight: role.weight, lineHeightRatio: role.lineHeightRatio }, available: role.available, rendered: role.rendered, actual })
      );
    }
  }
  for (const entry of report.safeSeedFieldParity) {
    const fieldName = entry.fieldName || {};
    const fieldType = entry.fieldType || {};
    const expectedSize = entry.viewport === "mobile-390" || entry.viewport?.startsWith("narrow-") ? 16 : 15;
    const lineHeightMatches = fieldName.lineHeight !== null && fieldType.lineHeight !== null
      ? Math.abs(fieldName.lineHeight - fieldType.lineHeight) <= 0.05
      : fieldType.lineHeightRaw === "normal" && Math.abs(fieldName.height - fieldType.height) <= 0.5;
    const matches = entry.available
      && fieldName.family?.includes("Space Grotesk")
      && fieldName.family === fieldType.family
      && fieldName.size === expectedSize
      && fieldName.size === fieldType.size
      && fieldName.weight === 400
      && fieldName.weight === fieldType.weight
      && lineHeightMatches
      && Math.abs(fieldName.height - fieldType.height) <= 0.5;
    record(
      report.checks,
      matches,
      `${entry.viewport} SafeSeed field names and field types have equal visual type metrics`,
      JSON.stringify({ fieldName, fieldType })
    );
  }
  for (const entry of report.firstUsefulControls) {
    record(
      report.checks,
      entry.available && entry.controls.length > 0 && entry.controls.every((control) => control.fits),
      `${entry.viewport} ${entry.route} shows its first useful control without scrolling`,
      JSON.stringify(entry.controls)
    );
    record(
      report.checks,
      entry.available && entry.controls.every((control) => control.fontSize >= 14 - 0.01),
      `${entry.viewport} ${entry.route} keeps first-action text at the 14px action floor`,
      JSON.stringify(entry.controls.map((control) => ({ label: control.label, fontSize: control.fontSize })))
    );
  }
  for (const entry of report.typography) {
    const portions = [{ name: "shell", metrics: entry.shell }];
    if (entry.frame) portions.push({ name: "tool", metrics: entry.frame });
    for (const portion of portions) {
      const baselineDetail = { count: portion.metrics.baselineViolations.length, sample: portion.metrics.baselineViolations.slice(0, 12) };
      const secondaryDetail = { count: portion.metrics.secondaryViolations.length, sample: portion.metrics.secondaryViolations.slice(0, 12) };
      record(report.checks, portion.metrics.bodyFontSize >= 15 - 0.01, `${entry.viewport} ${entry.route} ${portion.name} keeps the 15px body floor`, String(portion.metrics.bodyFontSize));
      record(report.checks, portion.metrics.bodyFontFamily.includes("Space Grotesk"), `${entry.viewport} ${entry.route} ${portion.name} uses Space Grotesk for body copy`, portion.metrics.bodyFontFamily);
      record(report.checks, portion.metrics.baselineViolations.length === 0, `${entry.viewport} ${entry.route} ${portion.name} has no visible text below 11px`, JSON.stringify(baselineDetail));
      record(report.checks, portion.metrics.secondaryViolations.length === 0, `${entry.viewport} ${entry.route} ${portion.name} keeps secondary text at 13px`, JSON.stringify(secondaryDetail));
    }
  }
  for (const entry of report.homeFontParity) {
    const desktop = entry.viewport === "reported-1439x726";
    const expected = desktop
      ? { display: 42, lede: 16, cardTitle: 18 }
      : { display: 30, lede: 15, cardTitle: 16 };
    record(report.checks, Object.values(entry.available).every(Boolean), `${entry.viewport} loads all three canonical AF font families`, JSON.stringify(entry.available));
    record(report.checks, entry.body.family.includes("Space Grotesk") && entry.body.size === 15, `${entry.viewport} Home body uses the compact 15px Space Grotesk step`, JSON.stringify(entry.body));
    record(report.checks, entry.display.family.includes("Anton") && entry.display.size === expected.display, `${entry.viewport} Home title uses the pocket-scale Anton step`, JSON.stringify(entry.display));
    record(report.checks, entry.label.family.includes("Archivo") && entry.label.size >= 11, `${entry.viewport} Home labels use compact readable Archivo`, JSON.stringify(entry.label));
    record(report.checks, entry.lede.family.includes("Space Grotesk") && entry.lede.size === expected.lede, `${entry.viewport} Home lede uses the compact responsive reading step`, JSON.stringify(entry.lede));
    record(report.checks, entry.cardTitle.family.includes("Space Grotesk") && entry.cardTitle.size === expected.cardTitle, `${entry.viewport} Home card titles use the compact card-title step`, JSON.stringify(entry.cardTitle));
  }
  for (const entry of report.controlTargets) {
    const targets = [...entry.shell.map((target) => ({ area: "shell", ...target })), ...entry.frame.map((target) => ({ area: "tool", ...target }))];
    const undersized = targets.filter((target) => target.width < 44 - 0.5 || target.height < 44 - 0.5);
    record(
      report.checks,
      undersized.length === 0,
      `${entry.viewport} ${entry.route} first-viewport controls are at least 44 by 44`,
      JSON.stringify({ count: undersized.length, sample: undersized.slice(0, 16) })
    );
  }
  for (const geometry of report.frameGeometry.filter(Boolean)) {
    record(report.checks, geometry.available && !geometry.overflow && !geometry.bodyOverflow, `${geometry.viewport} ${geometry.route} frame has no document overflow`, JSON.stringify(geometry));
  }
  record(report.checks, report.consoleErrors.length === 0, "No console errors", JSON.stringify(report.consoleErrors));
  record(report.checks, report.pageErrors.length === 0, "No uncaught page errors", JSON.stringify(report.pageErrors));
  record(report.checks, report.externalRequests.length === 0, "No unexpected external requests", JSON.stringify(report.externalRequests));

  const failed = report.checks.filter((item) => !item.ok);
  report.summary = { total: report.checks.length, passed: report.checks.length - failed.length, failed: failed.length };
  await writeFile(join(proofsRoot, "visual-qa.json"), `${JSON.stringify(report, null, 2)}\n`);
  for (const item of report.checks) process.stdout.write(`${item.ok ? "PASS" : "FAIL"}  ${item.label}${item.detail ? ` · ${item.detail}` : ""}\n`);
  process.stdout.write(`\n${report.summary.passed}/${report.summary.total} rendered checks passed; ${report.screenshots.length} literal screenshots captured.\n`);
  if (failed.length) process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill();
}
