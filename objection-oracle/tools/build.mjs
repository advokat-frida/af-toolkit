import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const read = (path) => readFileSync(root(path), 'utf8');
const fonts = read('chrome/fonts.css');
const shared = read('chrome/shared.css');
const pageCss = read('src/page.css');
const body = read('src/page-body.html');
const core = read('src/core.js').replace(/^export /gm, '');
const app = read('src/app.js');

// The embed body drops every standalone-only block (site bar, page intro,
// legal footer, colophon); the Toolkit shell owns that chrome.
const embedBody = body.replace(/[ \t]*<!-- oo:standalone-start -->[\s\S]*?<!-- oo:standalone-end -->\r?\n?/g, '');

const embedCss = `
  /* Toolkit embed: the shell provides the frame; this page is only the stage. */
  html,body{height:100%}
  .wrap{max-width:none;min-height:100%;display:flex;flex-direction:column;padding:0 30px}
  .wrap>main{flex:1 1 auto;display:flex;flex-direction:column}
  .oo-stage{flex:1 1 auto;margin:26px 0 30px}
  .oo-stage[data-phase="questions"]{align-items:start}
  @media(max-width:640px){.wrap{padding:0 10px}.oo-stage{margin:12px 0 18px}}
`;

const netKill = `(function(){
  "use strict";
  var netCount=0;
  function bump(){netCount+=1;}
  try{window.fetch=function(){bump();return Promise.reject(new Error('blocked'));};}catch(error){}
  try{var NativeXHR=window.XMLHttpRequest;if(NativeXHR&&NativeXHR.prototype){NativeXHR.prototype.send=function(){bump();throw new Error('blocked');};}}catch(error){}
  try{Object.defineProperty(navigator,'sendBeacon',{value:function(){bump();return false;},configurable:true});}catch(error){}
  try{window.WebSocket=function(){bump();throw new Error('blocked');};}catch(error){}
  try{window.EventSource=function(){bump();throw new Error('blocked');};}catch(error){}
  window.__oracleNetViolations=function(){return netCount;};`;

function page({ bodyHtml, extraCss = '' }) {
  return `<!DOCTYPE html>
<!--
  Advokat Frida: Objection Oracle (ADVO-108)
  Five binary questions, four deterministic release-triage outcomes.
  Randomness selects phrasing only. It never changes the ruling.
-->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>Objection Oracle | Advokat Frida</title>
<style>
${fonts}
${shared}
${pageCss}
${extraCss}
</style>
</head>
<body>
${bodyHtml}
<script>
${netKill}

${core}
${app}
})();
</script>
</body>
</html>
`;
}

mkdirSync(root('dist'), { recursive: true });
const kb = (value) => `${(Buffer.byteLength(value) / 1024).toFixed(1)} KB`;

const standalone = page({ bodyHtml: body });
writeFileSync(root('dist/objection-oracle.html'), standalone);
console.log(`dist/objection-oracle.html ${kb(standalone)} (gzip ${kb(gzipSync(Buffer.from(standalone)))})`);

const embed = page({ bodyHtml: embedBody, extraCss: embedCss });
writeFileSync(root('dist/objection-oracle-embed.html'), embed);
console.log(`dist/objection-oracle-embed.html ${kb(embed)} (gzip ${kb(gzipSync(Buffer.from(embed)))})`);
