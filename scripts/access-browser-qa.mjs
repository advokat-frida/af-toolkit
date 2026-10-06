import {chromium} from 'playwright';
import {mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
import {createHarness,root,TOOLKIT,GUIDE} from './access-fixture.mjs';
const output=resolve(process.env.AF_ACCESS_BROWSER_PROOFS||resolve(root,'.local-working/access-finish/browser'));await mkdir(output,{recursive:true});
const guideDist=resolve(process.env.AF_GUIDE_SOURCE||resolve(root,'../af-survival-guide'),'dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain'};
// Own the loopback static server: no separately running :4193 process is needed.
const localServer=createServer(async(req,res)=>{try{
  let path=resolve(guideDist,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(path!==guideDist&&!path.startsWith(guideDist+sep)){res.writeHead(403).end();return;}
  if((await stat(path)).isDirectory())path=resolve(path,'index.html');
  res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(path));
}catch{res.writeHead(404).end('Not found');}});
await new Promise((resolve,reject)=>{localServer.once('error',reject);localServer.listen(0,'127.0.0.1',resolve);});
const localGuide='http://127.0.0.1:'+localServer.address().port;
// Production-looking preview URLs are fulfilled from local workerd below.
// Unknown browser requests are blocked; DNS cannot fall through to live sites.
const browser=await chromium.launch({headless:true,args:['--no-proxy-server','--disable-background-networking','--host-resolver-rules=EXCLUDE 127.0.0.1, MAP * ~NOTFOUND']});
const harness=await createHarness(process.env.AF_GUIDE_SOURCE);
const results=[],blocked=[],helpersOnly=process.env.AF_ACCESS_HELPERS_ONLY==='1';let helperChecks=0;
async function contextFor(options){
  const context=await browser.newContext({...options,serviceWorkers:'block'});
  await context.route('**/*',route=>{
    if(new URL(route.request().url()).origin===localGuide)return route.continue();
    blocked.push(route.request().url());return route.abort('blockedbyclient');
  });
  return context;
}
async function gatedRoutes(page){
  await page.route('https://*.advokatfrida.com/**',async route=>{
    const req=route.request(),site=new URL(req.url()).origin;
    if(![TOOLKIT,GUIDE].includes(site)){blocked.push(req.url());return route.abort();}
    const requestHeaders={...req.headers()},path=new URL(req.url()).pathname;
    // Miniflare's local service-proxy Origin guard is not the application's
    // static-asset policy. Module script fetches carry Origin; strip it only
    // from this read-only static transport, never from /_access/ requests.
    if(req.method()==='GET'&&!path.startsWith('/_access/')&&/\.(?:m?js|css|woff2?|png|svg|ico)$/.test(path))delete requestHeaders.origin;
    const response=await harness.request(site,req.url(),{method:req.method(),headers:requestHeaders});
    // This visual harness never follows access redirects. Native multi-hop
    // handoffs/cookies are verified in access-flow-browser-qa.mjs instead.
    assert(!response.headers.has('location'),'Unexpected navigation in preview fixture');
    const headers=Object.fromEntries(response.headers);delete headers['content-encoding'];
    await route.fulfill({status:response.status,headers,body:Buffer.from(await response.arrayBuffer())});
  });
}
async function ready(page){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.loading!=='lazy'||i.getBoundingClientRect().top<innerHeight).map(i=>i.decode().catch(()=>{})));});}
async function capture(page,name){await ready(page);const info=await page.evaluate(()=>({overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),h1:[...document.querySelectorAll('h1')].map(h=>h.textContent.trim()),brokenVisibleImages:[...document.images].filter(i=>i.getBoundingClientRect().top<innerHeight&&(!i.complete||!i.naturalWidth)).length}));assert.equal(info.overflow,0,name+' overflow');assert.equal(info.brokenVisibleImages,0,name+' images');await page.screenshot({path:resolve(output,name+'.png')});results.push({name,...info});}
try{
  for(const width of helpersOnly?[]:[1440,1034,960,959,768,720,719,390,320]){
    const context=await contextFor({viewport:{width,height:width<720?844:1000}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(localGuide+'/comics/',{waitUntil:'networkidle'});await capture(page,'guide-comics-'+width);
    assert.equal(await page.locator('.gallery-grid img').count(),9);
    await page.getByRole('link',{name:'Next page',exact:true}).first().click();
    assert(page.url().endsWith('/comics/page/2/'));
    await page.reload({waitUntil:'networkidle'});assert.equal(await page.title(),'Comics · Page 2 · AF Survival Guide');
    const artwork=page.locator('.gallery-grid a').first();await artwork.focus();await page.keyboard.press('Enter');
    await page.getByRole('dialog',{name:'Artwork viewer'}).waitFor();
    if([1440,390].includes(width))await capture(page,'guide-viewer-'+width);
    await page.keyboard.press('ArrowRight');await page.keyboard.press('Escape');
    assert.equal(await page.locator('.gallery-grid a').first().evaluate(el=>document.activeElement===el),true);
    await page.goBack({waitUntil:'networkidle'});assert(page.url().endsWith('/comics/'));
    await page.goto(localGuide+'/posters/page/2/',{waitUntil:'networkidle'});assert.equal(await page.locator('.gallery-grid img').count(),6);
    if([1440,768,390,320].includes(width))await capture(page,'guide-posters-'+width);
    await page.goto(localGuide+'/',{waitUntil:'networkidle'});
    if([1440,390].includes(width))await capture(page,'guide-home-'+width);
    assert.deepEqual(errors,[],width+' console');await context.close();
  }
  for(const width of helpersOnly?[]:[1440,768,390,320]){
    const context=await contextFor({viewport:{width,height:width<720?844:1000},javaScriptEnabled:false}),page=await context.newPage();
    await page.goto(localGuide+'/comics/');await capture(page,'guide-no-js-'+width);
    await page.getByRole('link',{name:'Next page',exact:true}).first().click();assert(page.url().endsWith('/comics/page/2/'));
    await context.close();
  }
  for(const width of helpersOnly?[]:[1440,1034,768,390,320]){
    const context=await contextFor({viewport:{width,height:width<720?844:1000}}),page=await context.newPage();
    await gatedRoutes(page);
    await page.goto(TOOLKIT+'/safeseed',{waitUntil:'networkidle'});await capture(page,'toolkit-gated-'+width);
    await page.goto(GUIDE+'/comics/',{waitUntil:'networkidle'});await capture(page,'guide-gated-'+width);
    await context.close();
  }
  for(const [site,path,selector] of [[TOOLKIT,'/safeseed','[data-access-start]'],[GUIDE,'/comics/page/2/','[data-access-return]']]){
    const context=await contextFor({viewport:{width:1000,height:850}}),page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});await gatedRoutes(page);
    const base=site+path+'?view=grid';await page.goto(base+'#first',{waitUntil:'networkidle'});
    async function expected(hash,label){
      const target=base+hash;
      await page.waitForFunction(({selector,target})=>{
        const link=document.querySelector(selector);return link&&new URL(link.href).searchParams.get('return')===target;
      },{selector,target},{timeout:5000}).catch(async()=>assert.fail(site+' '+label+': expected '+target+'; actual '+await page.locator(selector).getAttribute('href')+'; errors '+JSON.stringify(errors)));
      const href=new URL(await page.locator(selector).getAttribute('href'),page.url());
      assert.equal(href.origin,site,label+' fixed origin');assert.equal(href.pathname,'/_access/start',label+' entrypoint');
      assert.equal(href.searchParams.get('return'),target,label+' safe query/hash');helperChecks++;
    }
    await expected('#first','initial preview');
    await page.evaluate(()=>{location.hash='#two';});await expected('#two','updated preview');
    await page.evaluate(()=>{location.hash='#token=fixture-secret';});await expected('','unsafe fragment excluded');
    await page.evaluate(()=>{location.hash='';});await expected('','removed fragment cleared');
    assert.deepEqual(errors,[],'preview helper console');await context.close();
  }
  // Render the exact new bridge body in the existing theme's inner-page chrome.
  const theme=resolve(process.env.AF_WEBSITE_SOURCE||resolve(root,'../website'),'advokat-frida-theme');
  const source=await readFile(resolve(theme,'custom-dispatch-access.hbs'),'utf8');
  const body=source.replace(/{{!--[\s\S]*?--}}/g,'').replace(/{{asset "([^"]+)"}}/g,'/assets/$1').replace(/{{[^}]*}}/g,'');
  const chrome=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/css/fonts.css"><link rel="stylesheet" href="/assets/css/screen.css"></head><body class="page-template"><div class="viewport"><header class="site-bar"><a class="bar-wordmark" href="/">Advokat Frida</a><nav class="bar-nav" aria-label="Sections"><ul class="nav"><li><a href="/">The Dispatch</a></li><li><a href="https://toolkit.advokatfrida.com/">Toolkit</a></li><li><a href="https://guide.advokatfrida.com/">Survival Guide</a></li></ul><a class="chip chip-subscribe" href="#/portal/signup">Subscribe</a></nav></header><main id="site-main" class="site-main">${body}</main><footer class="colophon"><div class="colophon-inner"><p class="colophon-name">Advokat Frida</p><nav class="colophon-nav"><a href="/about/">About</a></nav></div></footer></div></body></html>`;
  for(const width of helpersOnly?[]:[1440,768,390,320]){
    const context=await contextFor({viewport:{width,height:width<720?844:1000}}),page=await context.newPage();let signedIn=false;
    await page.route('https://advokatfrida.com/**',async route=>{
      const url=new URL(route.request().url());
      if(url.pathname==='/dispatch-access/')return route.fulfill({contentType:'text/html',body:chrome});
      if(url.pathname==='/members/api/session/')return route.fulfill({status:signedIn?200:204,body:signedIn?'synthetic.identity.fixture':''});
      if(url.pathname.startsWith('/assets/')){
        const path=resolve(theme,'.'+url.pathname);if(!path.startsWith(theme+sep))return route.abort();
        try{return route.fulfill({contentType:{'.css':'text/css','.js':'text/javascript','.woff2':'font/woff2'}[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:''});}
      }
      return route.abort();
    });
    await page.goto('https://advokatfrida.com/dispatch-access/',{waitUntil:'networkidle'});await capture(page,'ghost-bridge-'+width);
    const denied='https://advokatfrida.com/dispatch-access/?result=subscription&return='+encodeURIComponent(GUIDE+'/comics/');
    await page.goto(denied,{waitUntil:'networkidle'});
    assert.equal(await page.locator('#dispatch-access').getAttribute('data-access-state'),'guest');
    assert.equal(await page.locator('#dispatch-access-signin').isVisible(),true);
    assert.equal(await page.locator('#dispatch-access-preferences').isVisible(),false);
    signedIn=true;await page.goto(denied,{waitUntil:'networkidle'});
    assert.equal(await page.locator('#dispatch-access').getAttribute('data-access-state'),'subscription');
    assert.equal(await page.locator('#dispatch-access-signin').isVisible(),false);
    assert.equal(await page.locator('#dispatch-access-preferences').isVisible(),true);
    assert.match(await page.locator('#dispatch-access-status').textContent(),/Turn on The Dispatch/);
    if([1440,390].includes(width))await capture(page,'ghost-subscription-'+width);
    await context.close();
  }
  assert.deepEqual(blocked,[],'No nonfixture browser requests');
  await writeFile(resolve(output,helpersOnly?'browser-helper-checks.json':'browser-checks.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({screenshots:results.length,helperChecks,helpersOnly,overflow:0,brokenVisibleImages:0,externalRequests:0,localOnly:true,output},null,2));
}finally{await browser.close();await harness.mf.dispose();await new Promise(resolve=>localServer.close(resolve));}
