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
  .wrap{width:100%;max-width:1130px;margin:0 auto;min-height:100%;display:flex;flex-direction:column;padding:0 32px}
  .wrap>main{flex:1 1 auto;display:flex;flex-direction:column}
  .oo-stage{flex:1 1 auto;margin:26px 0 30px}
  .oo-stage[data-phase="questions"]{align-items:start}
  @media(max-width:640px){.wrap{padding:0 10px}.oo-stage{margin:12px 0 18px}}

  /* Article host (?host=article): the Ship It essay on advokatfrida.com frames this file and
     sizes the frame from the height message, so here the page sizes to its content and never
     to the frame. The ball sits beside the panel whenever the column is wide enough. */
  html[data-host="article"],html[data-host="article"] body{height:auto}
  html[data-host="article"] .wrap{min-height:0;padding:0 8px}
  html[data-host="article"] .wrap>main{flex:none}
  html[data-host="article"] .oo-stage{flex:none;margin:8px 0 12px}
  @media(min-width:700px){
    html[data-host="article"] .oo-stage,html[data-host="article"] .oo-stage[data-phase="result"]{grid-template-columns:220px minmax(0,1fr);gap:40px;align-items:center;padding-left:0}
    html[data-host="article"] .oo-stage[data-phase="questions"]{grid-template-columns:minmax(0,1fr);align-items:start}
    html[data-host="article"] .oo-ball,html[data-host="article"] .oo-stage[data-phase="result"] .oo-ball{width:220px}
  }

  /* Large-display scale (Ben, 2026-09-04): on a desktop monitor, scale the whole
     composition rather than stretch it. Breakpoints are the width of THIS FRAME,
     not the window - embedded, the frame is the window minus the Toolkit rail,
     so these land on the same windows as 1500/1800/2200 in public/toolkit.css. */
  @media(min-width:1252px){.wrap{max-width:1240px}body{zoom:1.08}}
  @media(min-width:1528px){.wrap{max-width:1320px}body{zoom:1.18}}
  @media(min-width:1900px){.wrap{max-width:1400px}body{zoom:1.30}}
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

// Article embed contract. The Ship It essay on advokatfrida.com embeds this file in an
// iframe and sizes it from this message, exactly as it sized the old inline copy. Only
// speaks when framed; the Toolkit shell ignores it because its stage fills the frame.
const heightPost = `(function(){
  "use strict";
  if(window.parent===window)return;
  var last=0;
  var article=document.documentElement.getAttribute('data-host')==='article';
  function report(){var h=Math.ceil(article?document.documentElement.scrollHeight:document.documentElement.getBoundingClientRect().height);if(h&&h!==last){last=h;try{window.parent.postMessage({type:'af-objection-oracle-resize',height:h},'*');}catch(error){}}}
  if(typeof ResizeObserver==='function'){new ResizeObserver(report).observe(article?document.body:document.documentElement);}
  window.addEventListener('load',report);
  document.addEventListener('DOMContentLoaded',report);
  setTimeout(report,300);})();`;

function page({ bodyHtml, extraCss = '' }) {
  return `<!DOCTYPE html>
<!--
  Advokat Frida: Objection Oracle (ADVO-108)
  Five binary questions, four deterministic release-triage outcomes.
  Randomness selects phrasing only. It never changes the ruling.
-->
<html lang="en">
<head>
<script>if(/[?&]host=article(?:&|$)/.test(location.search))document.documentElement.setAttribute("data-host","article");</script>
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
${heightPost}

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
