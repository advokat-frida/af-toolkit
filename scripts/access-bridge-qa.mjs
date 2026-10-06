import assert from 'node:assert/strict';
import {readFile, mkdir} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {returnURL} from '../access/session.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const theme = resolve(process.env.AF_WEBSITE_SOURCE || resolve(root, '../website'), 'advokat-frida-theme');
const template = await readFile(resolve(theme, 'custom-dispatch-access.hbs'), 'utf8');
const script = await readFile(resolve(theme, 'assets/js/dispatch-access.js'), 'utf8');
const body = template.replace(/{{!--[\s\S]*?--}}/g, '').replace(/{{asset "([^"]+)"}}/g, '/assets/$1').replace(/{{[^}]*}}/g, '');
// Representative inner-page chrome with exact local theme CSS/fonts and body.
// Portal and Ghost helpers are intentionally absent from this isolated UI test.
const documentHTML = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/css/fonts.css"><link rel="stylesheet" href="/assets/css/screen.css"></head><body class="page-template"><div class="viewport"><header class="site-bar"><a class="bar-wordmark" href="/">Advokat Frida</a><nav class="bar-nav" aria-label="Sections"><a href="/">The Dispatch</a></nav></header><main id="site-main" class="site-main">' + body + '</main><footer class="colophon"><div class="colophon-inner"><p class="colophon-name">Advokat Frida</p><nav class="colophon-nav"><a href="/about/">About</a></nav></div></footer></div></body></html>';
const ghost = 'https://advokatfrida.com';
const toolkit = 'https://toolkit.advokatfrida.com';
const guide = 'https://guide.advokatfrida.com';
const state = 's'.repeat(43), flow = 'f'.repeat(43);
const identity = 'synthetic.identity.fixture';
const target = guide + '/comics/page/2/?view=grid#example';
const outputs = process.env.AF_ACCESS_BRIDGE_PROOFS ? resolve(process.env.AF_ACCESS_BRIDGE_PROOFS) : null;
// No fixture navigation may resolve a real host, including redirect chains.
const browser = await chromium.launch({headless: true, args: ['--host-resolver-rules=MAP * ~NOTFOUND']});
let passed = 0;

function bridgeURL(options = {}) {
  const url = new URL('/dispatch-access/', ghost);
  if (options.target !== null) url.searchParams.set('return', options.target || target);
  if (options.transaction !== false) {
    url.searchParams.set('state', options.state || state);
    url.searchParams.set('flow', flow);
    url.searchParams.set('expires', String(options.expires || Math.floor(Date.now() / 1000) + 600));
  }
  if (options.result) url.searchParams.set('result', options.result);
  return url.href;
}

async function fixture(options = {}) {
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}, serviceWorkers: 'block'});
  context.setDefaultTimeout(15000);
  context.setDefaultNavigationTimeout(15000);
  let member = options.member ?? true;
  let releaseSession;
  const sessionReady = new Promise(resolve => { releaseSession = resolve; });
  const calls = {sessions: 0, starts: [], callbacks: [], errors: []};
  if (options.fastPoll) await context.addInitScript(() => {
    const original = window.setTimeout;
    window.setTimeout = (handler, delay, ...args) => original(handler, delay === 2000 ? 5 : delay, ...args);
  });
  if (options.submitFailure) await context.addInitScript(() => {
    const original = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function () {
      if (!sessionStorage.getItem('af-fixture-submit-failed')) { sessionStorage.setItem('af-fixture-submit-failed', 'true'); throw Error('Synthetic submit failure'); }
      return original.call(this);
    };
  });
  if (options.storageBlocked) await context.addInitScript(() => {
    for (const method of ['getItem', 'setItem', 'removeItem']) Storage.prototype[method] = () => { throw Error('Storage blocked'); };
  });
  if (options.oldStoredState) await context.addInitScript(() => sessionStorage.setItem('af-dispatch-access-state', 'old.signed.state'));
  if (options.recoveryUsed) await context.addInitScript(({target}) => sessionStorage.setItem('af-dispatch-access-recovery', JSON.stringify([{target, until: Date.now() + 600000}])), {target});
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === ghost && url.pathname === '/dispatch-access/') return route.fulfill({contentType: 'text/html; charset=utf-8', body: documentHTML});
    if (url.origin === ghost && url.pathname === '/assets/js/dispatch-access.js') return route.fulfill({contentType: 'text/javascript', body: script});
    if (url.origin === ghost && /^\/assets\/css\/(fonts|screen|dispatch-access)\.css$/.test(url.pathname)) return route.fulfill({contentType: 'text/css; charset=utf-8', body: await readFile(resolve(theme, '.' + url.pathname), 'utf8')});
    if (url.origin === ghost && /^\/assets\/fonts\/[\w.-]+\.(woff2?|ttf)$/.test(url.pathname)) return route.fulfill({body: await readFile(resolve(theme, '.' + url.pathname))});
    if (url.origin === ghost && url.pathname === '/members/api/session/') {
      calls.sessions++;
      if (options.holdSession && calls.sessions === 1) await sessionReady;
      if (options.sessionFailure) return route.fulfill({status: 503, body: ''});
      if (options.sessionHang) return route.abort('timedout');
      return route.fulfill({status: member ? 200 : 204, body: member ? identity : ''});
    }
    if ([toolkit, guide].includes(url.origin) && url.pathname === '/_access/start') {
      calls.starts.push(url);
      const next = bridgeURL({target: url.searchParams.get('return'), transaction: !options.brokenStart});
      // Playwright does not reroute every HTTP redirect hop. A local navigation
      // adapter keeps this UI-only mock isolated; real HTTP hops have separate QA.
      return route.fulfill({contentType: 'text/html', body: '<script>location.replace(' + JSON.stringify(next).replaceAll('<', '\\u003c') + ')</script>'});
    }
    if (url.origin === toolkit && url.pathname === '/_access/callback') {
      const form = new URLSearchParams(request.postData());
      calls.callbacks.push({method: request.method(), origin: request.headers().origin, form});
      return route.fulfill({contentType: 'text/html', body: '<!doctype html><title>Access complete</title><p>Synthetic callback received.</p>'});
    }
    calls.errors.push('Unexpected fixture request: ' + url.origin + url.pathname);
    return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', error => calls.errors.push(error.message));
  const done = async () => { assert.deepEqual(calls.errors, []); await context.close(); };
  return {context, page, calls, member: value => { member = value; }, releaseSession, done};
}

async function stateIs(page, expected) {
  await page.waitForFunction(expected => document.getElementById('dispatch-access')?.dataset.accessState === expected, expected);
}
async function controls(page, guest) {
  assert.equal(await page.locator('#dispatch-access-signin').isVisible(), guest);
  assert.equal(await page.locator('#dispatch-access-email-instruction').isVisible(), guest);
}
async function noCredentialsStored(page) {
  const stored = await page.evaluate(() => JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)]));
  for (const value of [identity, state, flow, 'old.signed.state']) assert(!stored.includes(value), 'No credentials or correlation state in storage');
}
async function callback(f, expectedTarget = target) {
  try { await f.page.waitForURL(toolkit + '/_access/callback'); }
  catch (error) {
    console.error({url: f.page.url(), status: await f.page.locator('#dispatch-access-status').textContent(), sessions: f.calls.sessions, starts: f.calls.starts.length, callbacks: f.calls.callbacks.length, errors: f.calls.errors});
    throw error;
  }
  assert.equal(f.calls.callbacks.length, 1);
  const received = f.calls.callbacks[0];
  assert.equal(received.method, 'POST');
  assert.equal(received.origin, ghost);
  assert.equal(received.form.get('identity'), identity);
  assert.equal(received.form.get('state'), state);
  assert.equal(received.form.get('flow'), flow);
  assert.equal(received.form.get('return'), expectedTarget);
  assert.equal(new URL(f.page.url()).search, '');
}
async function test(name, run) {
  if (process.env.AF_ACCESS_CASE && !name.includes(process.env.AF_ACCESS_CASE)) return;
  await run(); passed++; console.log('PASS: ' + name);
}

try {
  await test('guest sees native sign-in; opaque transaction is stripped and never stored', async () => {
    const f = await fixture({member: false, oldStoredState: true});
    await f.page.goto(bridgeURL()); await stateIs(f.page, 'guest'); await controls(f.page, true);
    assert.equal(new URL(f.page.url()).searchParams.get('return'), target);
    assert.equal(new URL(f.page.url()).searchParams.has('state'), false);
    assert.equal(new URL(f.page.url()).searchParams.has('flow'), false);
    await noCredentialsStored(f.page); assert.equal(f.calls.callbacks.length, 0); await f.done();
  });
  await test('a changed session is detected without a focus event or Continue click', async () => {
    const f = await fixture({member: false}); await f.page.clock.install();
    await f.page.goto(bridgeURL()); await stateIs(f.page, 'guest'); f.member(true);
    await f.page.clock.runFor(2100); await callback(f); await f.done();
  });
  await test('existing Ghost member with a fresh transaction proceeds automatically', async () => {
    const f = await fixture(); await f.page.goto(bridgeURL()); await callback(f);
    assert.equal(f.calls.starts.length, 0); await f.done();
  });
  await test('existing Ghost member without transaction starts once and preserves a deep link', async () => {
    const f = await fixture(); await f.page.goto(bridgeURL({transaction: false})); await callback(f);
    assert.equal(f.calls.starts.length, 1); assert.equal(f.calls.starts[0].searchParams.get('return'), target); await f.done();
  });
  await test('email return in a new tab recovers the destination without old tab storage', async () => {
    const f = await fixture({member: false}); await f.page.goto(bridgeURL()); await stateIs(f.page, 'guest');
    f.member(true); const emailPage = await f.context.newPage();
    await emailPage.goto(bridgeURL({transaction: false}));
    await emailPage.waitForURL(toolkit + '/_access/callback');
    assert.equal(f.calls.starts.length, 1); assert.equal(f.calls.callbacks[0].form.get('return'), target); await f.done();
  });
  await test('expired transaction recovers once without submitting the expired transaction', async () => {
    const f = await fixture(); await f.page.goto(bridgeURL({expires: Math.floor(Date.now() / 1000) - 1})); await callback(f);
    assert.equal(f.calls.starts.length, 1); await f.done();
  });
  await test('expired callback result recovers once', async () => {
    const f = await fixture(); await f.page.goto(bridgeURL({transaction: false, result: 'expired'})); await callback(f);
    assert.equal(f.calls.starts.length, 1); await f.done();
  });
  await test('broken recovery endpoint stops after one automatic redirect', async () => {
    const f = await fixture({brokenStart: true}); await f.page.goto(bridgeURL({transaction: false})); await stateIs(f.page, 'error');
    assert.equal(f.calls.starts.length, 1); assert.equal(f.calls.callbacks.length, 0); await controls(f.page, false);
    await f.page.evaluate(() => window.dispatchEvent(new Event('focus'))); assert.equal(f.calls.starts.length, 1); await f.done();
  });
  await test('blocked browser storage offers explicit Continue, without a recovery loop', async () => {
    const f = await fixture({storageBlocked: true}); await f.page.goto(bridgeURL({transaction: false})); await stateIs(f.page, 'error');
    await controls(f.page, false); assert.equal(f.calls.starts.length, 0);
    await f.page.locator('#dispatch-access-continue').click(); await callback(f); assert.equal(f.calls.starts.length, 1); await f.done();
  });
  for (const result of ['subscription', 'keys', 'unavailable', 'invalid']) await test(result + ' result stays signed in and waits for an explicit retry', async () => {
    const f = await fixture(); await f.page.clock.install();
    await f.page.goto(bridgeURL({transaction: false, result})); await stateIs(f.page, result === 'subscription' ? 'subscription' : 'error');
    await controls(f.page, false); assert(await f.page.locator('#dispatch-access-preferences').isVisible());
    await f.page.evaluate(() => window.dispatchEvent(new Event('focus'))); await f.page.clock.runFor(15000);
    assert.equal(f.calls.starts.length, 0); assert.equal(f.calls.callbacks.length, 0);
    await f.page.locator('#dispatch-access-continue').click(); await callback(f); await f.done();
  });
  await test('subscription result cannot impersonate a signed-in browser', async () => {
    const f = await fixture({member: false}); await f.page.goto(bridgeURL({transaction: false, result: 'subscription'}));
    await stateIs(f.page, 'guest'); await controls(f.page, true); assert(!(await f.page.locator('#dispatch-access-preferences').isVisible())); await f.done();
  });
  await test('signed-in direct bridge visit offers destinations without sign-in controls', async () => {
    const f = await fixture(); await f.page.goto(bridgeURL({transaction: false, target: null})); await stateIs(f.page, 'ready');
    await controls(f.page, false); assert(await f.page.locator('#dispatch-access-destinations').isVisible()); assert.equal(f.calls.starts.length, 0); await f.done();
  });
  for (const badTarget of ['https://evil.test/', 'https://%74oolkit.advokatfrida.com/', toolkit + '/_access/start', toolkit + '/%73afeseed', toolkit + '/fake/../safeseed', guide + '/comics/page/0/', toolkit + '/?token=private', toolkit + '/#access_token=private', toolkit + '/safeseed?q=%0a', toolkit + '/?api_key=private', toolkit + '/?client_secret=private', toolkit + '/?auth_token=private', toolkit + '/?session_id=private', toolkit + '/?q=%2525250a', toolkit + '/?q=%252525255c']) await test('unsafe destination is rejected: ' + new URL(badTarget).pathname, async () => {
    assert.throws(() => returnURL(badTarget), 'Server agrees with bridge rejection');
    const f = await fixture(); await f.page.goto(bridgeURL({target: badTarget})); await stateIs(f.page, 'error');
    await controls(f.page, false); assert.equal(f.calls.starts.length, 0); assert.equal(f.calls.callbacks.length, 0);
    assert.equal(new URL(f.page.url()).search, ''); await f.done();
  });
  for (const selected of [toolkit + '/safeseed/?view=compact#settings', guide + '/posters/page/10']) await test('allowed destination canonicalizes path without dropping query or fragment', async () => {
    const expected = selected.includes('safeseed') ? toolkit + '/safeseed?view=compact#settings' : guide + '/posters/page/10/';
    assert.equal(returnURL(selected), expected, 'Server and bridge canonicalize identically');
    const f = await fixture(); await f.page.goto(bridgeURL({target: selected})); await callback(f, expected); await f.done();
  });
  await test('session service failure has a retry state and no automatic loop', async () => {
    const f = await fixture({sessionFailure: true}); await f.page.clock.install(); await f.page.goto(bridgeURL()); await stateIs(f.page, 'error');
    await controls(f.page, false); await f.page.clock.runFor(15000); assert.equal(f.calls.sessions, 1); assert.equal(f.calls.callbacks.length, 0); await f.done();
  });
  await test('concurrent focus and visibility events produce only one callback', async () => {
    const f = await fixture({member: false}); await f.page.goto(bridgeURL()); await stateIs(f.page, 'guest'); f.member(true);
    await f.page.evaluate(() => { for (let i = 0; i < 10; i++) { window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); } });
    await callback(f); await f.done();
  });
  await test('guest polling stops after its bounded window', async () => {
    const f = await fixture({member: false, fastPoll: true}); await f.page.goto(bridgeURL()); await stateIs(f.page, 'guest');
    await f.page.getByRole('button', {name: 'Check my access'}).waitFor();
    const count = f.calls.sessions; await f.page.waitForTimeout(100);
    assert.equal(count, 61); assert.equal(f.calls.sessions, count);
    assert(await f.page.getByRole('button', {name: 'Check my access'}).isVisible());
    f.member(true); await f.page.getByRole('button', {name: 'Check my access'}).click(); await callback(f); await f.done();
  });
  await test('OTP-style navigation to the clean email return URL restores the deep link', async () => {
    const f = await fixture({member: false}); await f.page.goto(bridgeURL()); await stateIs(f.page, 'guest');
    const emailReturn = f.page.url(); f.member(true);
    await f.page.evaluate(url => location.assign(url), emailReturn); await callback(f); await f.done();
  });
  await test('a failed form submission leaves a working retry', async () => {
    const f = await fixture({submitFailure: true}); await f.page.goto(bridgeURL()); await stateIs(f.page, 'error');
    assert.equal(await f.page.locator('#dispatch-access form').count(), 0);
    await f.page.getByRole('button', {name: 'Try again'}).click(); await callback(f); await f.done();
  });
  await test('BFCache invalidates an in-flight check and requires a fresh explicit retry', async () => {
    const f = await fixture({holdSession: true}); await f.page.goto(bridgeURL());
    await f.page.waitForFunction(() => document.getElementById('dispatch-access')?.dataset.accessState === 'checking');
    await f.page.evaluate(() => { window.dispatchEvent(new PageTransitionEvent('pagehide', {persisted: true})); window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true})); });
    f.releaseSession(); await stateIs(f.page, 'ready');
    assert.equal(f.calls.callbacks.length, 0); assert.equal(f.calls.starts.length, 0);
    await f.page.getByRole('button', {name: 'Continue', exact: true}).click(); await callback(f); await f.done();
  });
  if (outputs) {
    await mkdir(outputs, {recursive: true});
    for (const kind of ['guest', 'ready', 'subscription', 'error']) {
      const f = await fixture({member: kind !== 'guest', sessionFailure: kind === 'error'});
      await f.page.goto(bridgeURL({transaction: false, target: kind === 'ready' ? null : target, result: kind === 'subscription' ? 'subscription' : undefined}));
      await stateIs(f.page, kind);
      for (const width of [1440, 768, 390, 320]) {
        await f.page.setViewportSize({width, height: width === 1440 ? 1000 : 844});
        await f.page.evaluate(() => document.fonts.ready);
        await f.page.screenshot({path: resolve(outputs, kind + '-' + width + '.png'), fullPage: true});
        assert(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
      }
      await f.done();
    }
  }
  console.log(`PASS: ${passed} bridge scenarios. Synthetic session and callback only; no emails, member changes, or live credentials.`);
} finally { await browser.close(); }
