import assert from 'node:assert/strict';
import {createServer} from 'node:https';
import {createRequire} from 'node:module';
import {readFile, mkdir} from 'node:fs/promises';
import {resolve, dirname, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createHarness, TOOLKIT, GUIDE} from './access-fixture.mjs';

// Real browser HTTPS, cookies, POSTs and 303 navigation, backed by real workerd
// Workers/RPC/SQLite DOs. Only Ghost identity/member data and destination markup
// are fixtures. There is no redirect adapter and no route.fulfill redirect chain.
// All three production-looking hosts resolve to this loopback server; every
// other hostname fails DNS. The browser cannot reach production or send email.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const theme = resolve(process.env.AF_WEBSITE_SOURCE || resolve(root, '../website'), 'advokat-frida-theme');
const ghost = 'https://advokatfrida.com';
const origins = [ghost, TOOLKIT, GUIDE];
const proofs = resolve(process.env.AF_ACCESS_FLOW_PROOFS || resolve(root, '.local-working/access-finish/flows'));
const template = await readFile(resolve(theme, 'custom-dispatch-access.hbs'), 'utf8');
const bridge = template.replace(/{{!--[\s\S]*?--}}/g, '').replace(/{{asset "([^"]+)"}}/g, '/assets/$1').replace(/{{[^}]*}}/g, '');
const bridgeScript = await readFile(resolve(theme, 'assets/js/dispatch-access.js'), 'utf8');
const require = createRequire(import.meta.url);
// Reuse only the public, synthetic development pair shipped by the installed
// Miniflare package. No certificate is installed, generated on disk, or trusted.
const mfSource = await readFile(require.resolve('miniflare'), 'utf8');
const developmentKey = mfSource.match(/var KEY = `\s*(-----BEGIN EC PRIVATE KEY-----[\s\S]+?-----END EC PRIVATE KEY-----)\s*`;/)?.[1];
const developmentCert = mfSource.match(/var CERT = `\s*(-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----)\s*`;/)?.[1];
assert(developmentKey && developmentCert, 'Installed Miniflare development TLS pair must be available');
const harness = await createHarness(process.env.AF_GUIDE_SOURCE, {mode: 'setup', guideMode: 'public'});
const identity = await harness.identity();
const clients = new Map();
const serverErrors = [], blockedRequests = [];
let browser, passed = 0, clientSequence = 0;

function send(res, response, bytes) {
  res.statusCode = response.status;
  for (const [name, value] of response.headers) if (name.toLowerCase() !== 'set-cookie') res.setHeader(name, value);
  const cookies = response.headers.getSetCookie();
  if (cookies.length) res.setHeader('Set-Cookie', cookies);
  res.end(bytes);
}
function html(content, status = 200) {
  return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + content + '</body></html>', {status, headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}});
}
const server = createServer({key: developmentKey, cert: developmentCert}, async (req, res) => {
  try {
    const url = new URL(req.url, 'https://' + req.headers.host);
    assert(origins.includes(url.origin), 'Unexpected local fixture origin');
    const client = clients.get(req.headers['x-fixture-client']);
    assert(client, 'Unknown fixture client');
    const requestBody = Buffer.concat(await Array.fromAsync(req));
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) if (value !== undefined && !['host', 'content-length', 'connection', 'x-fixture-client'].includes(name)) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    headers.set('cf-connecting-ip', '192.0.2.' + client.number);
    const entry = {url: url.href, method: req.method, headers, body: requestBody.toString()};
    client.requests.push(entry);
    let response;
    if (url.origin === ghost) {
      if (url.pathname === '/dispatch-access/') {
        response = html(bridge);
      } else if (url.pathname === '/members/api/session/') {
        client.sessionChecks++;
        const signedIn = (req.headers.cookie || '').split(';').some(value => value.trim() === 'fixture-ghost=signed-in');
        response = new Response(signedIn ? identity : null, {status: signedIn ? 200 : 204, headers: {'Cache-Control': 'no-store'}});
      } else if (url.pathname === '/__fixture/signin') {
        // Synthetic email/OTP completion navigation. It cannot call Ghost APIs.
        const target = new URL(url.searchParams.get('return'));
        assert.equal(target.origin, ghost);
        assert.equal(target.pathname, '/dispatch-access/');
        response = new Response(null, {status: 303, headers: {Location: target.href, 'Set-Cookie': 'fixture-ghost=signed-in; Path=/; HttpOnly; Secure; SameSite=Lax', 'Cache-Control': 'no-store'}});
      } else if (url.pathname === '/assets/js/dispatch-access.js') {
        response = new Response(bridgeScript, {headers: {'Content-Type': 'text/javascript'}});
      } else if (url.pathname.startsWith('/assets/css/') || url.pathname.startsWith('/assets/fonts/')) {
        const path = resolve(theme, '.' + url.pathname);
        assert(path.startsWith(theme + sep));
        response = new Response(await readFile(path), {headers: {'Content-Type': extname(path) === '.css' ? 'text/css' : 'font/woff2'}});
      } else if (url.pathname === '/favicon.ico') {
        response = new Response(null, {status: 204});
      } else throw Error('Unexpected synthetic Ghost route: ' + url.pathname);
    } else {
      response = await harness.request(url.origin, url.pathname + url.search, {method: req.method, headers, ...(['GET', 'HEAD'].includes(req.method) ? {} : {body: requestBody})});
      entry.status = response.status;
      entry.location = response.headers.get('location');
      entry.cookies = response.headers.getSetCookie();
      if (client.nextBridgeHint && entry.location?.startsWith(ghost + '/dispatch-access/')) {
        const next = new URL(entry.location);
        if (client.nextBridgeHint === 'expired') next.searchParams.set('expires', String(Math.floor(Date.now() / 1000) - 1));
        if (client.nextBridgeHint === 'missing-flow') next.searchParams.delete('flow');
        client.nextBridgeHint = null;
        response.headers.set('Location', next.href);
        entry.location = next.href;
      }
      if (!url.pathname.startsWith('/_access/')) {
        // The real Worker must serve the destination successfully. Replace only
        // its page body so this focused test doesn't exercise unrelated app UI.
        assert.equal(response.status, 200, 'Real Worker destination response: ' + url.href);
        const destinationHeaders = new Headers(response.headers);
        destinationHeaders.delete('content-length');
        destinationHeaders.set('Content-Type', 'text/html; charset=utf-8');
        response = new Response('<!doctype html><html><title>Local destination fixture</title><main id="destination">Local destination fixture</main></html>', {status: response.status, headers: destinationHeaders});
      }
    }
    send(res, response, Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    serverErrors.push(error.message);
    res.statusCode = 500;
    res.end('Local fixture failure');
  }
});

async function fixture({signedIn = true, nextBridgeHint = null} = {}) {
  const number = ++clientSequence, key = String(number);
  const client = {number, requests: [], sessionChecks: 0, nextBridgeHint};
  clients.set(key, client);
  const context = await browser.newContext({ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: {width: 1000, height: 850}, extraHTTPHeaders: {'X-Fixture-Client': key}});
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (origins.includes(url.origin)) return route.continue();
    blockedRequests.push(url.href);
    return route.abort('blockedbyclient');
  });
  if (signedIn) await context.addCookies([{name: 'fixture-ghost', value: 'signed-in', url: ghost, httpOnly: true, secure: true, sameSite: 'Lax'}]);
  const page = await context.newPage();
  page.on('pageerror', error => serverErrors.push(error.message));
  const done = async () => {
    for (const record of client.requests) assert(!record.url.includes(identity), 'Identity must stay out of every request URL');
    for (const openPage of context.pages()) {
      const storage = await openPage.evaluate(() => JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)]));
      assert(!storage.includes(identity), 'Identity must stay out of browser storage');
    }
    const cookies = await context.cookies();
    for (const cookie of cookies.filter(value => value.name.startsWith('__Host-af-'))) {
      assert(cookie.secure && cookie.httpOnly && cookie.sameSite === 'Lax');
      assert.equal(cookie.path, '/');
      assert(['toolkit.advokatfrida.com', 'guide.advokatfrida.com'].includes(cookie.domain), 'Sessions/proofs must be host-only');
    }
    assert.deepEqual(serverErrors, []);
    assert.deepEqual(blockedRequests, []);
    await context.close();
  };
  return {context, page, client, done};
}
const start = target => new URL('/_access/start?return=' + encodeURIComponent(target), target).href;
const stateIs = (page, state) => page.waitForFunction(state => document.getElementById('dispatch-access')?.dataset.accessState === state, state);
async function arrived(page, target) {
  await page.waitForURL(target);
  await page.locator('#destination').waitFor();
  assert.equal(page.url(), target);
}
async function signIn(context) {
  await context.addCookies([{name: 'fixture-ghost', value: 'signed-in', url: ghost, httpOnly: true, secure: true, sameSite: 'Lax'}]);
}
async function test(name, run) {
  await run(); passed++;
  console.log('PASS: ' + name);
}
async function invalidate(subscribed) {
  harness.fixture.subscribed = subscribed;
  assert.equal((await harness.request(TOOLKIT, '/_access/webhook', {method: 'POST', ...harness.webhook()})).status, 204);
}

try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  const mappings = origins.map(origin => 'MAP ' + new URL(origin).hostname + ' 127.0.0.1:' + port);
  browser = await chromium.launch({headless: true, args: ['--no-proxy-server', '--disable-background-networking', '--disable-component-update', '--disable-default-apps', '--host-resolver-rules=' + [...mappings, 'MAP * ~NOTFOUND'].join(', ')]});
  await mkdir(proofs, {recursive: true});
  for (const [name, target] of [['Toolkit', TOOLKIT + '/safeseed?view=compact#settings'], ['Guide', GUIDE + '/comics/page/2/?view=grid#example']]) {
    await test(name + ' signed-in Ghost completes real one-use handoff with native host-only cookies and deep link', async () => {
      const f = await fixture();
      await f.page.goto(start(target)); await arrived(f.page, target);
      const callback = f.client.requests.find(record => record.url === TOOLKIT + '/_access/callback');
      assert(callback && callback.method === 'POST');
      assert.equal(callback.headers.get('origin'), ghost);
      assert.equal(new URLSearchParams(callback.body).get('identity'), identity);
      const sessions = (await f.context.cookies()).filter(cookie => cookie.name === '__Host-af-member');
      assert.equal(sessions.length, 1); assert.equal(sessions[0].domain, new URL(target).hostname);
      const checks = f.client.sessionChecks, callbacks = f.client.requests.filter(record => record.url.endsWith('/_access/callback')).length;
      await f.context.clearCookies({name: 'fixture-ghost'});
      await f.page.goto(start(target)); await arrived(f.page, target);
      assert.equal(f.client.sessionChecks, checks, 'Existing app session bypasses Ghost');
      assert.equal(f.client.requests.filter(record => record.url.endsWith('/_access/callback')).length, callbacks);
      await f.done();
    });
  }
  await test('bare bridge checks both existing Ghost session and guest without transaction', async () => {
    const f = await fixture(); await f.page.goto(ghost + '/dispatch-access/'); await stateIs(f.page, 'ready');
    assert.equal(await f.page.locator('#dispatch-access-signin').isVisible(), false);
    await f.context.clearCookies({name: 'fixture-ghost'}); await f.page.reload(); await stateIs(f.page, 'guest');
    assert.equal(await f.page.locator('#dispatch-access-signin').isVisible(), true);
    await f.page.screenshot({path: resolve(proofs, 'bare-guest.png')}); await f.done();
  });
  for (const [name, target] of [['Toolkit', TOOLKIT + '/redactorium?view=compact#review'], ['Guide', GUIDE + '/posters/page/2/?view=grid#poster']]) {
    await test(name + ' guest email link in a new tab recovers only the safe deep link', async () => {
      const f = await fixture({signedIn: false}); await f.page.goto(start(target)); await stateIs(f.page, 'guest');
      const clean = new URL(f.page.url());
      assert.deepEqual([...clean.searchParams.keys()], ['return']); assert.equal(clean.searchParams.get('return'), target);
      const emailPage = await f.context.newPage();
      await emailPage.goto(ghost + '/__fixture/signin?return=' + encodeURIComponent(clean.href));
      await arrived(emailPage, target);
      const sessions = (await f.context.cookies()).filter(cookie => cookie.name === '__Host-af-member');
      assert(sessions.some(cookie => cookie.domain === new URL(target).hostname));
      await f.done();
    });
  }
  await test('synthetic inline emailed-code navigation returns through safe bridge and starts fresh', async () => {
    const target = TOOLKIT + '/safelist#check';
    const f = await fixture({signedIn: false}); await f.page.goto(start(target)); await stateIs(f.page, 'guest');
    const clean = f.page.url(); await f.page.goto(ghost + '/__fixture/signin?return=' + encodeURIComponent(clean));
    await arrived(f.page, target); await f.done();
  });
  await test('concurrent Toolkit and Guide tabs keep independent browser proof and transaction cookies', async () => {
    const targets = [TOOLKIT + '/safeseed#first', GUIDE + '/comics/page/3/#second'];
    const f = await fixture({signedIn: false}), second = await f.context.newPage();
    await Promise.all([f.page.goto(start(targets[0])), second.goto(start(targets[1]))]);
    await Promise.all([stateIs(f.page, 'guest'), stateIs(second, 'guest')]);
    const cookies = await f.context.cookies();
    assert.equal(cookies.filter(cookie => cookie.name.startsWith('__Host-af-login-')).length, 2);
    assert.equal(cookies.filter(cookie => cookie.name.startsWith('__Host-af-proof-')).length, 2);
    await signIn(f.context);
    await Promise.all([f.page.evaluate(() => window.dispatchEvent(new Event('focus'))), second.evaluate(() => window.dispatchEvent(new Event('focus')))]);
    await Promise.all([arrived(f.page, targets[0]), arrived(second, targets[1])]);
    assert.equal((await f.context.cookies()).filter(cookie => cookie.name === '__Host-af-member').length, 2);
    await f.done();
  });
  for (const hint of ['expired', 'missing-flow']) await test(hint + ' bridge parameters recover through a fresh real server transaction', async () => {
    const target = GUIDE + '/posters/page/3/#recovered';
    const f = await fixture({nextBridgeHint: hint}); await f.page.goto(start(target)); await arrived(f.page, target);
    assert.equal(f.client.requests.filter(record => record.url.startsWith(GUIDE + '/_access/start')).length, 2);
    assert.equal(f.client.requests.filter(record => record.url.endsWith('/_access/callback')).length, 1);
    await f.done();
  });
  await test('server missing transaction cookie recovers once from expired result', async () => {
    const target = TOOLKIT + '/privacy-wizards#question';
    const f = await fixture({signedIn: false}); await f.page.goto(start(target)); await stateIs(f.page, 'guest');
    await f.context.clearCookies({name: /^__Host-af-login-/}); await signIn(f.context);
    await f.page.evaluate(() => window.dispatchEvent(new Event('focus'))); await arrived(f.page, target);
    const callbacks = f.client.requests.filter(record => record.url.endsWith('/_access/callback'));
    assert.equal(callbacks.length, 2); assert(new URL(callbacks[0].location).searchParams.get('result') === 'expired');
    await f.done();
  });
  await test('unsubscribed signed-in member receives preferences and no app session', async () => {
    await invalidate(false);
    const f = await fixture(); await f.page.goto(start(GUIDE + '/posters/')); await stateIs(f.page, 'subscription');
    assert.equal(await f.page.locator('#dispatch-access-signin').isVisible(), false);
    assert.equal(await f.page.locator('#dispatch-access-preferences').isVisible(), true);
    assert.equal((await f.context.cookies()).filter(cookie => cookie.name === '__Host-af-member').length, 0);
    await f.page.screenshot({path: resolve(proofs, 'unsubscribed.png')}); await f.done(); await invalidate(true);
  });
  await test('native callback and completed ticket replays fail without granting another session', async () => {
    const target = TOOLKIT + '/safeseed';
    const f = await fixture(); await f.page.goto(start(target)); await arrived(f.page, target);
    const callback = f.client.requests.find(record => record.url.endsWith('/_access/callback'));
    const repeated = await harness.request(TOOLKIT, '/_access/callback', {method: 'POST', headers: callback.headers, body: callback.body});
    assert.equal(repeated.status, 303); assert.equal(new URL(repeated.headers.get('location')).searchParams.get('result'), 'expired');
    assert(!repeated.headers.getSetCookie().some(cookie => cookie.startsWith('__Host-af-member=')));
    const replay = await f.page.goto(callback.location); assert.equal(replay.status(), 400);
    assert.match(await f.page.textContent('body'), /expired|already used/i); await f.done();
  });
  await test('unsafe redirect is rejected locally before any Ghost session or callback request', async () => {
    const f = await fixture();
    for (const target of ['https://evil.test/', TOOLKIT + '/_access/start', GUIDE + '/comics/page/0/', TOOLKIT + '/?access_token=secret']) {
      const response = await f.page.goto(TOOLKIT + '/_access/start?return=' + encodeURIComponent(target));
      assert.equal(response.status(), 400);
    }
    assert.equal(f.client.sessionChecks, 0); assert.equal(f.client.requests.filter(record => record.url.endsWith('/_access/callback')).length, 0); await f.done();
  });
  console.log(JSON.stringify({passed, transport: 'loopback HTTPS with native browser redirects/cookies; all nonfixture DNS blocked', realWorkersAndDurableObjects: true, destinationBodies: 'minimal fixture only after actual Worker returns 200', identitySource: 'synthetic RSA-2048; no real member/email requests', expiredCoverage: 'expired browser hint and server missing-cookie rejection; real clock expiry covered separately', nativeGhostPortalLoaded: false, productionChecked: false, proofs}, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
  await harness.mf.dispose();
}
