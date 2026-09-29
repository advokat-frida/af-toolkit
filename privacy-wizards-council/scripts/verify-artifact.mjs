import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'dist', 'wizards.html');
const html = fs.readFileSync(file, 'utf8');
const appSource = fs.readFileSync(path.join(root, 'src', 'App.svelte'), 'utf8');
const cssSource = fs.readFileSync(path.join(root, 'src', 'styles', 'app.css'), 'utf8');
const failures = [];
if (!html.includes("connect-src 'none'")) failures.push('missing connect-src none CSP');
if (!html.includes('Privacy Wizards Council')) failures.push('missing product title');
if (!html.includes('Changelog (last updated:')) failures.push('missing canonical SafeSeed changelog summary');
if (/Product changelog|class=["']chevron["']|summary-date/.test(appSource)) failures.push('noncanonical changelog label or custom disclosure chrome remains');
if (!html.includes('automated-check-only')) failures.push('missing fail-closed legal review state');
// src/styles/fonts.css carries the self-hosted faces; without them the tool renders in fallback fonts.
if ((html.match(/@font-face/g) || []).length < 3) failures.push('missing the self-hosted font faces from src/styles/fonts.css');
// The footer is the Toolkit shell's one-row band (public/index.html .toolkit-footer): brand link, then four links.
if (!html.includes('<footer class="colophon">')) failures.push('missing canonical Advokat Frida footer');
if (!html.includes('href="https://advokatfrida.com/#/portal/signup"')) failures.push('missing canonical Subscribe action');
for (const [label, href] of [
  ['The Mercantile', 'https://shop.advokatfrida.com'],
  ['Advokat Frida', 'https://advokatfrida.com/'],
  ['About', 'https://advokatfrida.com/about/'],
  ['Contact', 'mailto:hello@advokatfrida.com'],
  ['Privacy', 'https://advokatfrida.com/privacy/'],
  ['RSS', 'https://advokatfrida.com/rss/'],
]) {
  if (!html.includes(`href="${href}">${label}</a>`)) failures.push(`missing canonical chrome link: ${label}`);
}
if (/>The Den<\/a>/.test(html)) failures.push('retired The Den navigation label remains');
if (/>Members Den<\/a>/.test(html)) failures.push('retired Members Den navigation label remains');
if (/>Contact us<\/a>/.test(html)) failures.push('retired Contact us footer label remains (the shell says Contact)');
// The tab icon is the Toolkit shell's public/favicon-32.png inlined as a data URI (CSP: img-src data:); it must stay byte-identical to that single source.
const faviconSource = path.resolve(root, '..', 'public', 'favicon-32.png');
const iconLink = html.match(/<link rel="icon" type="image\/png" sizes="32x32" href="data:image\/png;base64,([A-Za-z0-9+/=]+)" \/>/);
if (!iconLink) failures.push('missing the Toolkit tab icon: rel="icon" type="image/png" with a data:image/png;base64 href');
else if (!fs.existsSync(faviconSource) || !Buffer.from(iconLink[1], 'base64').equals(fs.readFileSync(faviconSource))) {
  failures.push('tab icon drifted from the Toolkit shell favicon (public/favicon-32.png)');
}
if (!/\.site-bar\s*\{[^}]*background:\s*transparent/i.test(html)) failures.push('masthead background is not transparent');
if (/brand-mark|local-badge/i.test(html)) failures.push('legacy circular AF mark or local-status badge remains');
for (const pattern of [
  /Runs in this browser/i,
  /Runs entirely in your browser/i,
  /No accounts, analytics/i,
  /Guided practitioner aid, not legal advice/i,
  /qualified human owns/i,
  /stays? in this tab/i,
  /leaves the page only/i,
  // The Toolkit runs no analytics (the design system bans them); the old footer's Plausible line was false.
  /Analytics by Plausible/i,
]) {
  if (pattern.test(html)) failures.push(`banned trust/disclaimer boilerplate remains: ${pattern}`);
}
if (/<(?:script|link|img)[^>]+(?:src|href)=["']https?:\/\//i.test(html)) failures.push('external executable or visual asset reference found');

const compactCss = cssSource.replace(/\s+/g, ' ');
const titleRule = compactCss.match(/h1\s*\{([^}]*)\}/)?.[1] || '';
for (const declaration of ['font-size: clamp(48px, 7vw, 86px)']) {
  if (!titleRule.includes(declaration)) failures.push(`shared title scale drift: h1 lacks ${declaration}`);
}
if (!compactCss.includes('line-height: 1.08')) failures.push('shared title line-height drift');
if (!compactCss.includes('font-size: clamp(44px, 16vw, 64px)') || !compactCss.includes('font-size: 46px')) {
  failures.push('shared responsive title scale is incomplete');
}
const orientationRule = compactCss.match(/\.orientation\s*\{([^}]*)\}/)?.[1] || '';
if (!orientationRule.includes('max-width: 980px')) failures.push('tool canvas drift: .orientation lacks max-width: 980px');
if (!/\.finder-stage,\s*\.determination-shell,\s*\.integrity-error,\s*\.notice\s*\{[^}]*max-width:\s*980px/.test(compactCss)) {
  failures.push('tool canvas drift: finder stage lacks canonical 980px width');
}
// Each contract names a selector, the declarations its first rule must carry, and the canon it answers to.
const cssContract = (selector, declarations, canon) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = compactCss.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] || '';
  for (const declaration of declarations) {
    if (!rule.includes(declaration)) failures.push(`${canon}: ${selector} lacks ${declaration}`);
  }
};
for (const [selector, declarations] of [
  ['.changelog', ['margin: 16px 0', 'border-top: 1px solid var(--line-soft)', 'border-bottom: 1px solid var(--line-soft)']],
  ['.changelog summary', ['min-height: 44px', 'display: flex', 'align-items: center', 'font-family: var(--font-label)', 'font-size: 12px', 'font-weight: 700', 'letter-spacing: 0.04em', 'text-transform: uppercase']],
  ['.changelog-body', ['padding: 0 0 15px 20px', 'color: var(--ink-soft)', 'font-size: 14px', 'line-height: 1.5']],
  ['.changelog-body time', ['display: block', 'margin-bottom: 4px', 'color: var(--amber)', 'font-size: 12px']],
  ['.changelog-body ul', ['margin: 7px 0 0', 'padding-left: 18px']],
  ['.changelog-body li + li', ['margin-top: 4px']],
]) {
  cssContract(selector, declarations, 'changelog drift from SafeSeed canon');
}
// The footer mirrors public/toolkit.css (.toolkit-footer, .footer-brand, .toolkit-footer nav a) value for value.
for (const [selector, declarations] of [
  ['.colophon', ['display: flex', 'flex-wrap: wrap', 'align-items: center', 'justify-content: flex-start', 'gap: 8px 32px', 'padding: 12px 32px', 'color: var(--paper)', 'background: var(--ink)']],
  ['.colophon a', ['color: var(--paper)', 'text-decoration: none']],
  ['.colophon-brand', ['display: inline-flex', 'align-items: center', 'min-height: 44px', 'font-family: var(--font-display)', 'font-size: 21px', 'font-weight: 400', 'line-height: var(--lh-display)', 'letter-spacing: 0.02em', 'text-transform: uppercase']],
  ['.colophon-nav', ['display: flex', 'flex-wrap: wrap', 'gap: 0 20px']],
  ['.colophon-nav a', ['display: inline-flex', 'align-items: center', 'min-height: 44px', 'font-family: var(--font-label)', 'font-size: 13px', 'font-weight: 400', 'line-height: var(--lh-label)']],
]) {
  cssContract(selector, declarations, 'footer drift from the Toolkit shell');
}
if (!compactCss.includes('@media (max-width: 820px) { .colophon { padding: 12px 20px; gap: 0 24px; } }')) {
  failures.push('footer drift from the Toolkit shell: the 820px responsive rule (padding: 12px 20px; gap: 0 24px) is missing');
}
if (!/@media print \{[^@]*\.colophon \{ display: none !important; \}/.test(compactCss)) failures.push('footer must stay hidden in print');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  JSON.stringify(
    {
      file: 'dist/wizards.html',
      bytes: Buffer.byteLength(html),
      sha256: crypto.createHash('sha256').update(html).digest('hex')
    },
    null,
    2
  )
);
