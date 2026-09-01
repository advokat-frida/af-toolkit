import './server.mjs';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { OUTCOME_CODES, RESPONSE_BANKS } from '../src/core.js';

const BASE = 'http://localhost:8794';
const shots = fileURLToPath(new URL('../shots/', import.meta.url));
mkdirSync(shots, { recursive: true });

async function save(page, name, fullPage = true) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${shots}${name}.png`, fullPage });
  console.log(`shot: shots/${name}.png`);
}

const browser = await chromium.launch();
const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await desktop.newPage();
await page.goto(`${BASE}/objection-oracle.html`, { waitUntil: 'networkidle' });
await save(page, 'welcome-desktop-1440');

await page.click('#start-button');
await page.click('[data-answer="yes"]');
await page.click('[data-answer="yes"]');
await save(page, 'question-q3-desktop-1440');
await page.click('[data-answer="yes"]');
await page.click('[data-answer="no"]');
await page.click('[data-answer="yes"]');
await save(page, 'ready-desktop-1440');

for (const code of OUTCOME_CODES) {
  await page.evaluate(([outcome]) => window.__oracleQA.showOutcome(outcome, 0), [code]);
  await save(page, `outcome-${code.toLowerCase()}-desktop-1440`);
  const longestForOutcome = RESPONSE_BANKS[code]
    .map((response, index) => ({ response, index }))
    .sort((a, b) => b.response.length - a.response.length)[0];
  await page.evaluate(
    ([outcome, index]) => window.__oracleQA.showOutcome(outcome, index),
    [code, longestForOutcome.index],
  );
  await save(page, `outcome-${code.toLowerCase()}-longest-desktop-1440`);
}

for (const keyframe of [0, 18, 36, 54, 72, 100]) {
  await page.evaluate((progress) => window.__oracleQA.freezeShake(progress), keyframe / 100);
  await save(page, `shake-${String(keyframe).padStart(3, '0')}-desktop-1440`);
}

await desktop.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mobilePage = await mobile.newPage();
await mobilePage.goto(`${BASE}/objection-oracle.html`, { waitUntil: 'networkidle' });
await save(mobilePage, 'welcome-mobile-390');
await mobilePage.click('#start-button');
await mobilePage.click('[data-answer="yes"]');
await mobilePage.click('[data-answer="yes"]');
await save(mobilePage, 'question-q3-mobile-390');

const longest = Object.entries(RESPONSE_BANKS)
  .flatMap(([code, bank]) => bank.map((response, index) => ({ code, index, response })))
  .sort((a, b) => b.response.length - a.response.length)[0];
await mobilePage.evaluate(
  ([code, index]) => window.__oracleQA.showOutcome(code, index),
  [longest.code, longest.index],
);
await save(mobilePage, 'longest-response-mobile-390');
await mobilePage.evaluate(() => window.__oracleQA.showOutcome('HARD_STOP', 2));
await save(mobilePage, 'hard-stop-mobile-390');
await mobile.close();

const reduced = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: 'reduce',
});
const reducedPage = await reduced.newPage();
await reducedPage.goto(`${BASE}/objection-oracle.html`, { waitUntil: 'networkidle' });
await reducedPage.evaluate(() => window.__oracleQA.showOutcome('FIX_THEN_SHIP', 9));
await save(reducedPage, 'reduced-motion-result-mobile-390');
await reduced.close();

await browser.close();
process.exit(0);
