import { chromium } from "playwright";
const baseUrl = process.env.AF_TOOLKIT_URL || "http://127.0.0.1:4177";

const audits = {
  safeseed: [
    "html", "body", ".site-main", ".gen-main", ".gen-intro", ".gen-modes", ".gen-panel",
    ".gen-panel-head h2", ".gen-presets-head strong", ".gen-presets-head p", ".preset-btn",
    ".preset-status", ".field-row", ".field-name", ".field-type", ".tier-chip", ".remove-field"
  ],
  "privacy-wizards": [
    "html", "body", "main", ".orientation", ".finder-stage", ".finder-head h2", ".step-label",
    ".search-wrap input", ".category-row button", ".legal-gate", ".legal-gate strong",
    ".legal-gate p", ".library-heading h3", ".wizard-card", ".wizard-copy strong",
    ".wizard-copy small", ".review-badge"
  ],
  "objection-oracle": [
    "html", "body", "#main", ".oo-stage", ".oo-visual", ".oo-panel", ".oo-view-title",
    ".oo-view > .eyebrow", ".oo-view > p:not(.eyebrow)", ".oo-main-action", ".oo-key"
  ]
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1439, height: 726 } });
await page.goto(`${baseUrl}/#home`, { waitUntil: "networkidle" });
const result = {};

for (const [route, selectors] of Object.entries(audits)) {
  await page.evaluate((nextRoute) => { location.hash = nextRoute; }, route);
  const iframe = page.locator(`[data-tool-frame="${route}"]`);
  await iframe.waitFor({ state: "visible" });
  const handle = await iframe.elementHandle();
  const frame = await handle.contentFrame();
  await frame.waitForLoadState("domcontentloaded");
  await frame.waitForTimeout(100);
  result[route] = await frame.evaluate(({ selectors }) => {
    const geometryAndType = (element) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === "string" ? element.className : "",
        text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 100),
        x: Math.round(box.x * 10) / 10,
        y: Math.round(box.y * 10) / 10,
        width: Math.round(box.width * 10) / 10,
        height: Math.round(box.height * 10) / 10,
        display: style.display,
        padding: style.padding,
        margin: style.margin,
        border: style.border,
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
        background: style.backgroundColor,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing
      };
    };
    const values = {};
    for (const selector of selectors) values[selector] = geometryAndType(document.querySelector(selector));
    values.topLevel = [...document.body.children].map((node) => geometryAndType(node));
    return values;
  }, { selectors });
}

await browser.close();
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
