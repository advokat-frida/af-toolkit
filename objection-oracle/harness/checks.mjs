import './server.mjs';
import { chromium } from 'playwright';
import {
  OUTCOMES,
  RESPONSE_BANKS,
  RUBRIC_VERSION,
  formatReceipt,
} from '../src/core.js';

const BASE = 'http://localhost:8794';
const failures = [];
function check(name, condition, detail = '') {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${name}${detail ? ` | ${detail}` : ''}`);
  if (!condition) failures.push(name);
}

const flows = {
  SHIP_IT: [false, true, true, false, true],
  NEXT_VERSION: [true, true, false, false, false],
  FIX_THEN_SHIP: [true, true, true, true, true],
  HARD_STOP: [true, true, true, false, true],
};

async function storageCounts(page) {
  return page.evaluate(async () => ({
    local: localStorage.length,
    session: sessionStorage.length,
    idb: (await indexedDB.databases()).length,
  }));
}

async function noHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
}

async function loadFresh(page) {
  await page.goto(`${BASE}/objection-oracle.html`, { waitUntil: 'networkidle' });
  await page.locator('#start-button').focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('#view-questions:not(.hidden)');
}

async function completeAnswers(page, answers, assertLocked = false) {
  for (let index = 0; index < answers.length; index += 1) {
    const pair = page.locator(`.oo-question-row:nth-child(${index + 1}) .oo-pair button`);
    await pair.nth(answers[index] ? 0 : 1).click();
    if (assertLocked && index < 4) {
      check(
        `ruling unavailable after ${index + 1} answer${index ? 's' : ''}`,
        (await page.locator('#ask-button').getAttribute('aria-disabled')) === 'true'
          && !(await page.locator('#view-result').isVisible()),
      );
    }
  }
  check('ask unlocks at five answers', (await page.locator('#ask-button').getAttribute('aria-disabled')) === 'false');
}

async function askAndRead(page) {
  await page.click('#ask-button');
  await page.waitForSelector('#view-result:not(.hidden)', { timeout: 2500 });
  return {
    code: await page.evaluate(() => window.__oracleQA.getState().code),
    quip: ((await page.locator('#ruling-receipt').textContent()).match(/^ORACLE: (.+)$/m) || [])[1] || '',
    label: await page.locator('#result-title').innerText(),
    reason: await page.locator('#result-reason').innerText(),
    action: await page.locator('#result-action').innerText(),
    receipt: await page.locator('#ruling-receipt').textContent(),
  };
}

const VERDICT_COLORS = {
  SHIP_IT: 'rgb(31, 78, 50)',
  NEXT_VERSION: 'rgb(58, 58, 140)',
  FIX_THEN_SHIP: 'rgb(158, 84, 21)',
  HARD_STOP: 'rgb(200, 50, 50)',
};

const browser = await chromium.launch();
for (const [viewportName, viewport] of [
  ['desktop-1440', { width: 1440, height: 1000 }],
  ['mobile-390', { width: 390, height: 844 }],
]) {
  const context = await browser.newContext({ viewport });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  const page = await context.newPage();
  const requests = [];
  const consoleErrors = [];
  const failedRequests = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('requestfailed', (request) => failedRequests.push(request.url()));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(String(error)));

  await page.goto(`${BASE}/objection-oracle.html`, { waitUntil: 'networkidle' });
  check(`${viewportName}: white 8 face is visible at rest`, await page.locator('#ball-eight').isVisible());
  check(`${viewportName}: no ambiguous answer labels`,
    !/\b(maybe|other|skip)\b/i.test(await page.locator('#oracle').innerText()));
  check(`${viewportName}: current family body scale is 16px`,
    await page.locator('body').evaluate((element) => getComputedStyle(element).fontSize) === '16px');
  check(`${viewportName}: current compact family top bar is present`,
    await page.locator('.site-bar').count() === 1 && await page.locator('.gen-top').count() === 0);
  check(`${viewportName}: current dark family colophon is present`,
    await page.locator('.site-colophon').evaluate((element) => (
      getComputedStyle(element).backgroundColor === 'rgb(22, 20, 15)'
    )));
  check(`${viewportName}: welcome has no horizontal overflow`, await noHorizontalOverflow(page));
  const initialStorage = await storageCounts(page);
  check(`${viewportName}: no browser persistence on load`,
    initialStorage.local === 0 && initialStorage.session === 0 && initialStorage.idb === 0,
    JSON.stringify(initialStorage));

  const outcomesToExercise = viewportName === 'desktop-1440'
    ? Object.keys(flows)
    : ['HARD_STOP'];

  for (const code of outcomesToExercise) {
    await loadFresh(page);
    check(`${viewportName}: keyboard start moves focus into the questions`,
      await page.evaluate(() => document.activeElement && document.activeElement.closest('.oo-question-list') !== null));
    check(`${viewportName}: five question rows with binary pairs`,
      (await page.locator('.oo-question-row').count()) === 5
        && (await page.locator('.oo-pair button').count()) === 10);
    await completeAnswers(page, flows[code], code === 'SHIP_IT');
    check(`${viewportName}: five selections are marked`,
      (await page.locator('.oo-pair button[aria-pressed="true"]').count()) === 5);
    check(`${viewportName}: questions state has no horizontal overflow`, await noHorizontalOverflow(page));
    const ruling = await askAndRead(page);
    const expected = OUTCOMES[code];
    check(`${viewportName}: ${code} canonical code`, ruling.code === code, ruling.code);
    check(`${viewportName}: ${code} canonical label`, ruling.label === expected.label, ruling.label);
    check(`${viewportName}: ${code} canonical reason`, ruling.reason === expected.reason);
    check(`${viewportName}: ${code} canonical action`, ruling.action === expected.action);
    check(`${viewportName}: ${code} response belongs to its bank`,
      RESPONSE_BANKS[code].includes(ruling.quip), ruling.quip);
    const generatedAt = ruling.receipt.match(/^GENERATED AT \(UTC\): (.+)$/m)?.[1];
    const expectedReceipt = generatedAt
      ? formatReceipt(flows[code], expected, ruling.quip, {generatedAt, rubricVersion: RUBRIC_VERSION})
      : '';
    check(`${viewportName}: ${code} receipt has a generated-at timestamp`,
      Boolean(generatedAt) && !Number.isNaN(Date.parse(generatedAt)), generatedAt || 'missing');
    check(`${viewportName}: ${code} receipt matches the five answers`,
      ruling.receipt === expectedReceipt);
    check(`${viewportName}: ${code} result heading receives focus`,
      await page.evaluate(() => document.activeElement && document.activeElement.id) === 'result-title');
    check(`${viewportName}: ${code} announced in live region`,
      (await page.locator('#oracle-status').innerText()).includes(expected.label));
    check(`${viewportName}: ${code} verdict block carries its semantic border`,
      await page.locator('.oo-verdict').evaluate((element) => {
        const style = getComputedStyle(element);
        return `${style.borderTopWidth}|${style.borderTopColor}`;
      }) === `2px|${VERDICT_COLORS[code]}`);
    check(`${viewportName}: ${code} result has no horizontal overflow`, await noHorizontalOverflow(page));

    if (code === 'SHIP_IT') {
      await page.click('#copy-button');
      await page.waitForTimeout(100);
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      const visibleReceipt = await page.locator('#ruling-receipt').textContent();
      check(`${viewportName}: copied ruling matches the visible receipt`,
        clipboardText.replace(/\r\n/g, '\n') === visibleReceipt.replace(/\r\n/g, '\n'));

      await page.click('#restart-button');
      await page.waitForSelector('#view-questions:not(.hidden)');
      check(`${viewportName}: ask again clears in-memory answers`,
        (await page.evaluate(() => window.__oracleQA.getState().answers.length)) === 0);
      check(`${viewportName}: ask again clears the marked selections`,
        (await page.locator('.oo-pair button[aria-pressed="true"]').count()) === 0);
    }
  }

  const finalStorage = await storageCounts(page);
  check(`${viewportName}: no browser persistence after interaction`,
    finalStorage.local === 0 && finalStorage.session === 0 && finalStorage.idb === 0,
    JSON.stringify(finalStorage));
  check(`${viewportName}: zero external requests`,
    requests.every((url) => url === `${BASE}/objection-oracle.html`),
    requests.filter((url) => url !== `${BASE}/objection-oracle.html`).join(', '));
  check(`${viewportName}: zero failed requests`, failedRequests.length === 0, failedRequests.join(', '));
  check(`${viewportName}: zero wrapper violations`,
    await page.evaluate(() => window.__oracleNetViolations()) === 0);
  check(`${viewportName}: zero console or page errors`, consoleErrors.length === 0, consoleErrors.join(' | '));
  await context.close();
}

const reducedContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: 'reduce',
});
const reducedPage = await reducedContext.newPage();
await loadFresh(reducedPage);
await completeAnswers(reducedPage, flows.HARD_STOP);
const reducedStart = Date.now();
await reducedPage.click('#ask-button');
await reducedPage.waitForSelector('#view-result:not(.hidden)', { timeout: 700 });
const reducedElapsed = Date.now() - reducedStart;
check('reduced motion: result arrives without full shake', reducedElapsed < 500, `${reducedElapsed}ms`);
check('reduced motion: canonical outcome is unchanged',
  await reducedPage.locator('#result-title').innerText() === OUTCOMES.HARD_STOP.label);
await reducedContext.close();
await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('\nAll browser checks passed.');
process.exit(0);
