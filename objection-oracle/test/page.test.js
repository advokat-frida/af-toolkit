import { describe, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

execFileSync(process.execPath, [
  fileURLToPath(new URL('../tools/build.mjs', import.meta.url)),
]);

const html = readFileSync(
  fileURLToPath(new URL('../dist/objection-oracle.html', import.meta.url)),
  'utf8',
);
const packageJson = JSON.parse(readFileSync(
  fileURLToPath(new URL('../package.json', import.meta.url)),
  'utf8',
));
const harnessSource = [
  '../harness/server.mjs',
  '../harness/checks.mjs',
  '../harness/capture.mjs',
].map((path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')).join('\n');

describe('built standalone page', () => {
  test('oracle.hasFiveBinaryQuestionsAndNoAmbiguousControl', () => {
    expect(html.match(/id:\s*'q[1-5]'/g)).toHaveLength(5);
    expect(html).toContain('id="question-list"');
    expect(html).toContain("textContent=value?'Yes':'No'");
    expect(html).not.toMatch(/data-answer="(?:maybe|other|skip)"/i);
    expect(html).not.toMatch(/<input[^>]+type="text"|<textarea/i);
  });

  test('oracle.usesFamilyChromeAndSixteenPixelRoot', () => {
    expect(html).toContain('--forest:#1f4e32');
    expect(html).toContain('--indigo:#3a3a8c');
    expect(html).toContain('html{font-size:16px}');
    expect(html).toContain('body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--font);font-size:16px');
    expect(html).toContain('class="site-bar"');
    expect(html).toContain('.site-colophon{background:var(--ink)');
    expect(html).not.toContain('class="gen-top"');
    expect(html).toMatch(/border-radius:\s*(?:4px|999px)/);
  });

  test('oracle.carriesDisclaimerAndFourCanonicalLabels', () => {
    expect(html).toContain('This is a release-triage aid, not legal advice.');
    for (const label of ['SHIP IT', 'NEXT VERSION', 'FIX IT, THEN SHIP', 'HARD STOP']) {
      expect(html).toContain(label);
    }
  });

  test('oracle.receiptCarriesTimestampAndRubricVersion', () => {
    expect(html).toContain('RUBRIC VERSION:');
    expect(html).toContain('GENERATED AT (UTC):');
    expect(html).toContain('AF-OO-2026-08-24.1');
  });

  test('oracle.hasEightFaceTriangleAndReducedMotionMode', () => {
    expect(html).toContain('id="ball-eight"');
    expect(html).toContain('id="ball-window"');
    expect(html).toContain('clip-path:polygon(');
    expect(html).toContain('@media(prefers-reduced-motion:reduce)');
  });

  test('oracle.isOneLocalClassicScriptWithNoExternalDependencies', () => {
    expect(html.match(/<script\b/g)).toHaveLength(1);
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toMatch(/<link[^>]+href=/);
    expect(html).not.toMatch(/url\((?!data:)/);
  });

  test('oracle.cspForbidsConnectionsAndNoStorageApiAppears', () => {
    expect(html).toContain("default-src 'none'; connect-src 'none'");
    expect(html).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie|caches\./);
    expect(html).toContain('__oracleNetViolations');
  });

  test('oracle.qaHarnessUsesOnlyRepoLocalDependencies', () => {
    expect(packageJson.devDependencies.playwright).toBeTruthy();
    expect(harnessSource).not.toMatch(/[A-Z]:[\\/](?:Users|Documents)[\\/]/i);
    expect(harnessSource).not.toContain('frida-console');
    expect(harnessSource).not.toContain('prompt-builder.html');
  });
});
