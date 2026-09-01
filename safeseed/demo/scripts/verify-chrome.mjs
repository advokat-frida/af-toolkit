import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const artifacts = ['safeseed-demo.html', 'safeseed-generator.html'];
const required = [
  'Privacy and AI governance, by design and in practice.',
  'Analytics by Plausible, cookieless and aggregate, no ad-tech.',
  'https://advokatfrida.com/#/portal/signup',
  'https://advokatfrida.com/tag/field-guides/',
  'https://advokatfrida.com/tag/toolkit/',
  'https://advokatfrida.com/members/',
  'Members Den',
  'https://shop.advokatfrida.com/',
  'Shop',
  'mailto:hello@advokatfrida.com',
  'Contact us',
  'https://advokatfrida.com/privacy/',
  'Privacy',
];
const banned = [
  /Runs in this browser/i,
  /No accounts, analytics, cookies/i,
  /Guided practitioner aid/i,
  /Not legal advice/i,
  /qualified human owns/i,
  /human stays accountable/i,
  /Both files stay in this browser/i,
  /Files stay local/i,
  /No production file is accepted/i,
  /Demo version\.[^<]{0,80}Not for distribution/i,
  /html\[data-standalone[^}]+--font(?:-display|-label|-chrome)?:\s*(?:Impact|system-ui)/i,
  /class=["'][^"']*(?:brand-mark|local-badge)/i,
  />The Den<\/a>/i,
];

const problems = [];
const demoSource = readFileSync(resolve('src/App.tsx'), 'utf8');
const demoCss = readFileSync(resolve('src/demo-skin.css'), 'utf8').replace(/\s+/g, ' ');
const generatorSource = readFileSync(resolve('src/generator/Generator.tsx'), 'utf8');
const generatorCss = readFileSync(resolve('src/generator/generator.css'), 'utf8').replace(/\s+/g, ' ');
const generatorTitleRule = generatorCss.match(/\.gen-intro h1\s*\{([^}]*)\}/)?.[1] || '';
const generatorLedeRule = generatorCss.match(/\.gen-lede\s*\{([^}]*)\}/)?.[1] || '';
const generatorChangelogRules = [...generatorCss.matchAll(/\.gen-changelog\s*\{([^}]*)\}/g)].map((match) => match[1]);
const generatorChangelogSummaryRule = generatorCss.match(/\.gen-changelog summary,\s*\.tier-disclosure summary\s*\{([^}]*)\}/)?.[1] || '';
const demoTitleRule = demoCss.match(/\.hero-headline\s*\{([^}]*)\}/)?.[1] || '';
const demoLedeRule = demoCss.match(/\.hero-sub\s*\{([^}]*)\}/)?.[1] || '';
for (const declaration of ['font-size: clamp(48px, 7vw, 86px)', 'line-height: 1.02']) {
  if (!demoTitleRule.includes(declaration)) problems.push(`demo title scale drift: missing ${declaration}`);
}
for (const declaration of ['max-width: 700px', 'font-size: 19px', 'line-height: 1.5']) {
  if (!demoLedeRule.includes(declaration)) problems.push(`demo lede scale drift: missing ${declaration}`);
}
if (!demoCss.includes('font-size: clamp(44px, 16vw, 64px)') ||
    !demoCss.includes('font-size: 46px') ||
    !demoCss.includes('font-size: 16px') ||
    !demoCss.includes('line-height: 1.38')) {
  problems.push('demo responsive title/lede scale is incomplete');
}
for (const declaration of ['font-size: clamp(48px, 7vw, 86px)', 'line-height: 1.08']) {
  if (!generatorTitleRule.includes(declaration)) problems.push(`generator title scale drift: missing ${declaration}`);
}
for (const declaration of ['max-width: 700px', 'font-size: 19px', 'line-height: 1.5']) {
  if (!generatorLedeRule.includes(declaration)) problems.push(`generator lede scale drift: missing ${declaration}`);
}
if (!generatorCss.includes('font-size: clamp(44px, 16vw, 64px)') ||
    !generatorCss.includes('font-size: 46px') ||
    !generatorCss.includes('font-size: 16px') ||
    !generatorCss.includes('line-height: 1.38')) {
  problems.push('generator responsive title/lede scale is incomplete');
}
if (!generatorChangelogRules.some((rule) => rule.includes('line-height: 1.5')) ||
    !generatorChangelogSummaryRule.includes('line-height: 1.5')) {
  problems.push('generator changelog line-height has drifted from the shared tool changelog');
}
const changelogIndex = generatorSource.indexOf('className="gen-changelog"');
const modeIndex = generatorSource.indexOf('className="gen-modes"');
const taskIndex = generatorSource.indexOf('aria-labelledby="columns-heading"');
if (changelogIndex < 0 || modeIndex < 0 || taskIndex < 0 || !(changelogIndex < modeIndex && modeIndex < taskIndex)) {
  problems.push('Generator.tsx: changelog must sit after the promise and before the first active control');
}
const demoLedeIndex = demoSource.indexOf('className="hero-sub"');
const demoChangelogIndex = demoSource.indexOf('className="gen-changelog"');
const demoControlIndex = demoSource.indexOf('className="verb-chips"');
if (demoLedeIndex < 0 || demoChangelogIndex < 0 || demoControlIndex < 0 ||
    !(demoLedeIndex < demoChangelogIndex && demoChangelogIndex < demoControlIndex)) {
  problems.push('App.tsx: changelog must sit after the promise and before the first active control');
}
if (!demoCss.includes('.gen-intro .gen-changelog { margin: 16px 0; border-top: 1px solid var(--hair); }') ||
    !demoCss.includes('.gen-changelog { border-bottom: 1px solid var(--hair); line-height: 1.5; }')) {
  problems.push('demo changelog frame has drifted from the SafeSeed canon');
}

for (const artifact of artifacts) {
  const html = readFileSync(resolve(artifact), 'utf8');
  for (const text of required) {
    if (!html.includes(text)) problems.push(`${artifact}: missing ${JSON.stringify(text)}`);
  }
  if (!/(?:class|className)(?:=|:)\s*[`"']page-shell/i.test(html)) {
    problems.push(`${artifact}: chrome is not outside the bounded tool canvas`);
  }
  if (!/\.site-bar\s*\{[^}]*background(?:-color)?:\s*(?:transparent|#0000|0 0)/i.test(html)) {
    problems.push(`${artifact}: masthead background is not transparent`);
  }
  const siteBarRules = [...html.matchAll(/\.site-bar\s*\{([^}]*)\}/gi)].map((match) => match[1]);
  if (!siteBarRules.some((rule) => /min-height:\s*42px/i.test(rule) && /padding:\s*4px\s+clamp\(16px,\s*4vw,\s*56px\)/i.test(rule)) ||
      !siteBarRules.some((rule) => /padding:\s*8px\s+16px/i.test(rule)) ||
      !/\.bar-nav ul\s*\{[^}]*min-height:\s*24px/i.test(html)) {
    problems.push(`${artifact}: masthead geometry has drifted from the shared tool header`);
  }
  if (!/\.site-colophon\s*\{[^}]*(?=[^}]*width:\s*100%)(?=[^}]*line-height:\s*1\.5)/i.test(html)) {
    problems.push(`${artifact}: footer width or base line-height has drifted from the shared tool footer`);
  }
  const footerNameRules = [...html.matchAll(/\.site-colophon-name\s*\{([^}]*)\}/gi)].map((match) => match[1]);
  const footerDescRules = [...html.matchAll(/\.site-colophon-desc\s*\{([^}]*)\}/gi)].map((match) => match[1]);
  const footerNavRules = [...html.matchAll(/\.site-colophon-nav\s*\{([^}]*)\}/gi)].map((match) => match[1]);
  const footerLinkRules = [...html.matchAll(/\.site-colophon-nav a\s*\{([^}]*)\}/gi)].map((match) => match[1]);
  if (!footerNameRules.some((rule) =>
    /font-size:\s*26px/i.test(rule) &&
    /font-weight:\s*400/i.test(rule) &&
    /line-height:\s*1(?:;|\s|$)/i.test(rule))) {
    problems.push(`${artifact}: footer name typography has drifted from the shared tool footer`);
  }
  if (!footerDescRules.some((rule) =>
    /max-width:\s*520px/i.test(rule) &&
    /font-size:\s*13px/i.test(rule) &&
    /line-height:\s*1\.55/i.test(rule))) {
    problems.push(`${artifact}: footer description typography has drifted from the shared tool footer`);
  }
  if (!footerLinkRules.some((rule) =>
    /font-size:\s*11px/i.test(rule) &&
    /font-weight:\s*400/i.test(rule) &&
    /letter-spacing:\s*0?\.1em/i.test(rule) &&
    /line-height:\s*1\.5/i.test(rule))) {
    problems.push(`${artifact}: footer link typography has drifted from the shared tool footer`);
  }
  if (!footerNavRules.some((rule) => /line-height:\s*1\.5/i.test(rule))) {
    problems.push(`${artifact}: footer navigation line box has drifted from the shared tool footer`);
  }
  const siteRules = [...html.matchAll(/\.site\s*\{([^}]*)\}/gi)].map((match) => match[1]);
  if (!siteRules.some((rule) =>
    /width:\s*min\(980px,\s*(?:calc\()?100%\s*-\s*32px\)?\)/i.test(rule) &&
    /max-width:\s*none/i.test(rule) &&
    /padding:\s*0/i.test(rule))) {
    problems.push(`${artifact}: primary canvas is not the canonical 980px tool width`);
  }
  if (!siteRules.some((rule) => /width:\s*min\(100%\s*-\s*20px,\s*680px\)/i.test(rule))) {
    problems.push(`${artifact}: primary canvas is missing the canonical tablet/mobile gutter`);
  }
  if (!siteRules.some((rule) => /width:\s*calc\(100%\s*-\s*16px\)/i.test(rule))) {
    problems.push(`${artifact}: primary canvas is missing the canonical narrow-mobile gutter`);
  }
  if (!/--font-display:\s*["']?Anton["']?/i.test(html) || !/--font-label:\s*["']?Archivo["']?/i.test(html)) {
    problems.push(`${artifact}: Advokat Frida display or label face is missing`);
  }
  const bodyFace = artifact === 'safeseed-demo.html'
    ? /--sans:\s*["']?Space Grotesk["']?/i
    : /--font:\s*["']?Space Grotesk["']?/i;
  if (!bodyFace.test(html)) {
    problems.push(`${artifact}: body copy is not using Space Grotesk`);
  }
  if (!/\.bar-nav ul\s*\{[^}]*gap:\s*7px\s+14px/i.test(html) ||
      !/\.bar-nav a\s*\{[^}]*(?:font-size:\s*10px[^}]*letter-spacing:\s*0|letter-spacing:\s*0[^}]*font-size:\s*10px)/i.test(html)) {
    problems.push(`${artifact}: mobile navigation spacing has drifted from the shared tool header`);
  }
  const displayTitle = artifact === 'safeseed-demo.html'
    ? /\.hero-headline\s*\{[^}]*font-family:\s*var\(--font-display\)/i
    : /\.gen-intro h1\s*\{[^}]*font-family:\s*var\(--font-display\)/i;
  if (!displayTitle.test(html)) {
    problems.push(`${artifact}: primary title is not using the Advokat Frida display face`);
  }
  for (const pattern of banned) {
    if (pattern.test(html)) problems.push(`${artifact}: banned copy or legacy mark ${pattern}`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

console.log(`verified canonical chrome, typography, canvas, and anti-theater contract in ${artifacts.length} SafeSeed artifacts`);
