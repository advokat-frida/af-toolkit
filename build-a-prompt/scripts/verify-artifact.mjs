import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'dist', 'prompt-builder.html');
const html = fs.readFileSync(file, 'utf8');
const appSource = fs.readFileSync(path.join(root, 'src', 'App.svelte'), 'utf8');
const cssSource = fs.readFileSync(path.join(root, 'src', 'styles', 'app.css'), 'utf8');
const failures = [];

if (!html.includes("connect-src 'none'")) failures.push('missing connect-src none CSP');
if (!html.includes('Build-A-Prompt')) failures.push('missing product title');
if (!html.includes('Changelog (last updated:')) failures.push('missing canonical SafeSeed changelog summary');
if (/Product changelog|class=["']chevron["']|summary-date/.test(appSource)) failures.push('noncanonical changelog label or custom disclosure chrome remains');
if (!html.includes('Analytics by Plausible, cookieless and aggregate, no ad-tech.')) failures.push('missing canonical Advokat Frida footer');
if (!html.includes('href="https://advokatfrida.com/#/portal/signup"')) failures.push('missing canonical Subscribe action');
for (const [label, href] of [
  ['The Mercantile', 'https://shop.advokatfrida.com'],
  ['Contact us', 'mailto:hello@advokatfrida.com'],
  ['Privacy', 'https://advokatfrida.com/privacy/'],
]) {
  if (!html.includes(`href="${href}">${label}</a>`)) failures.push(`missing canonical chrome link: ${label}`);
}
if (/>The Den<\/a>/.test(html)) failures.push('retired The Den navigation label remains');
if (/>Members Den<\/a>/.test(html)) failures.push('retired Members Den navigation label remains');
if (!/\.site-bar\s*\{[^}]*background:\s*transparent/i.test(html)) failures.push('masthead background is not transparent');
if (/brand-mark|local-badge/i.test(html)) failures.push('legacy circular AF mark or local-status badge remains');
for (const pattern of [
  /Runs in this browser/i,
  /Runs entirely in your browser/i,
  /No accounts, analytics/i,
  /stays? in this tab/i,
  /starts? in this tab/i,
  /Not legal advice/i,
  /human stays accountable/i,
]) {
  if (pattern.test(html)) failures.push(`banned trust/disclaimer boilerplate remains: ${pattern}`);
}
if (/https?:\/\//i.test(html.replace(/https?:\/\/[^\s'\"]+/g, (url) => {
  // Authored framework links are allowed; executable external assets are not.
  return url;
}))) {
  const externalAsset = /<(?:script|link|img)[^>]+(?:src|href)=["']https?:\/\//i.test(html);
  if (externalAsset) failures.push('external executable or visual asset reference found');
}

const compactCss = cssSource.replace(/\s+/g, ' ');
const titleRule = compactCss.match(/h1\s*\{([^}]*)\}/)?.[1] || '';
for (const declaration of ['font-size: clamp(48px, 7vw, 86px)']) {
  if (!titleRule.includes(declaration)) failures.push(`shared title scale drift: h1 lacks ${declaration}`);
}
if (!compactCss.includes('line-height: 1.08')) failures.push('shared title line-height drift');
if (!compactCss.includes('font-size: clamp(44px, 16vw, 64px)') || !compactCss.includes('font-size: 46px')) {
  failures.push('shared responsive title scale is incomplete');
}
for (const [selector, expectedWidth] of [
  ['.orientation', 'max-width: 980px'],
  ['.workspace', 'max-width: 1280px'],
]) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = compactCss.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] || '';
  if (!rule.includes(expectedWidth)) failures.push(`tool canvas drift: ${selector} lacks ${expectedWidth}`);
}
for (const contract of [
  ['.changelog', ['margin: 16px 0', 'border-top: 1px solid var(--line-soft)', 'border-bottom: 1px solid var(--line-soft)']],
  ['.changelog summary', ['min-height: 44px', 'display: flex', 'align-items: center', 'font-family: var(--font-label)', 'font-size: 12px', 'font-weight: 700', 'letter-spacing: 0.04em', 'text-transform: uppercase']],
  ['.changelog-body', ['padding: 0 0 15px 20px', 'color: var(--ink-soft)', 'font-size: 14px', 'line-height: 1.5']],
  ['.changelog-body time', ['display: block', 'margin-bottom: 4px', 'color: var(--amber)', 'font-size: 12px']],
  ['.changelog-body ul', ['margin: 7px 0 0', 'padding-left: 18px']],
  ['.changelog-body li + li', ['margin-top: 4px']],
]) {
  const [selector, declarations] = contract;
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = compactCss.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] || '';
  for (const declaration of declarations) {
    if (!rule.includes(declaration)) failures.push(`changelog drift from SafeSeed canon: ${selector} lacks ${declaration}`);
  }
}

const hash = crypto.createHash('sha256').update(html).digest('hex');
const size = Buffer.byteLength(html);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(JSON.stringify({ file: 'dist/prompt-builder.html', bytes: size, sha256: hash }, null, 2));
