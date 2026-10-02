import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {createHarness,root,TOOLKIT,GUIDE} from './access-fixture.mjs';
const output=resolve(root,'.local-working/dispatch-access');await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const harness=await createHarness(process.env.AF_GUIDE_SOURCE);
const results=[];
async function ready(page){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.loading!=='lazy'||i.getBoundingClientRect().top<innerHeight).map(i=>i.decode().catch(()=>{})));});}
async function capture(page,name){await ready(page);const info=await page.evaluate(()=>({overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),h1:[...document.querySelectorAll('h1')].map(h=>h.textContent.trim()),brokenVisibleImages:[...document.images].filter(i=>i.getBoundingClientRect().top<innerHeight&&(!i.complete||!i.naturalWidth)).length}));assert.equal(info.overflow,0,name+' overflow');assert.equal(info.brokenVisibleImages,0,name+' images');await page.screenshot({path:resolve(output,name+'.png')});results.push({name,...info});}
try{
  for(const width of [1440,1034,960,959,768,720,719,390,320]){
    const context=await browser.newContext({viewport:{width,height:width<720?844:1000}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4193/comics/',{waitUntil:'networkidle'});await capture(page,'guide-comics-'+width);
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
    await page.goto('http://127.0.0.1:4193/posters/page/2/',{waitUntil:'networkidle'});assert.equal(await page.locator('.gallery-grid img').count(),6);
    if([1440,768,390,320].includes(width))await capture(page,'guide-posters-'+width);
    await page.goto('http://127.0.0.1:4193/',{waitUntil:'networkidle'});
    if([1440,390].includes(width))await capture(page,'guide-home-'+width);
    assert.deepEqual(errors,[],width+' console');await context.close();
  }
  for(const width of [1440,768,390,320]){
    const context=await browser.newContext({viewport:{width,height:width<720?844:1000},javaScriptEnabled:false}),page=await context.newPage();
    await page.goto('http://127.0.0.1:4193/comics/');await capture(page,'guide-no-js-'+width);
    await page.getByRole('link',{name:'Next page',exact:true}).first().click();assert(page.url().endsWith('/comics/page/2/'));
    await context.close();
  }
  for(const width of [1440,1034,768,390,320]){
    const context=await browser.newContext({viewport:{width,height:width<720?844:1000}}),page=await context.newPage();
    await page.route('https://*.advokatfrida.com/**',async route=>{
      const req=route.request(),site=new URL(req.url()).origin;
      if(![TOOLKIT,GUIDE].includes(site))return route.abort();
      const response=await harness.request(site,req.url(),{method:req.method(),headers:req.headers()});
      const headers=Object.fromEntries(response.headers);delete headers['content-encoding'];
      await route.fulfill({status:response.status,headers,body:Buffer.from(await response.arrayBuffer())});
    });
    await page.goto(TOOLKIT+'/safeseed',{waitUntil:'networkidle'});await capture(page,'toolkit-gated-'+width);
    await page.goto(GUIDE+'/comics/',{waitUntil:'networkidle'});await capture(page,'guide-gated-'+width);
    await context.close();
  }
  // Render the exact new bridge body in the existing theme's inner-page chrome.
  const theme=resolve(root,'../website/advokat-frida-theme');
  const source=await readFile(resolve(theme,'custom-dispatch-access.hbs'),'utf8');
  const body=source.replace(/{{!--[\s\S]*?--}}/g,'').replace(/{{asset "([^"]+)"}}/g,'/assets/$1').replace(/{{[^}]*}}/g,'');
  const chrome=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/css/fonts.css"><link rel="stylesheet" href="/assets/css/screen.css"></head><body class="page-template"><div class="viewport"><header class="site-bar"><a class="bar-wordmark" href="/">Advokat Frida</a><nav class="bar-nav" aria-label="Sections"><ul class="nav"><li><a href="/">The Dispatch</a></li><li><a href="https://toolkit.advokatfrida.com/">Toolkit</a></li><li><a href="https://guide.advokatfrida.com/">Survival Guide</a></li></ul><a class="chip chip-subscribe" href="#/portal/signup">Subscribe</a></nav></header><main id="site-main" class="site-main">${body}</main><footer class="colophon"><div class="colophon-inner"><p class="colophon-name">Advokat Frida</p><nav class="colophon-nav"><a href="/about/">About</a></nav></div></footer></div></body></html>`;
  for(const width of [1440,768,390,320]){
    const context=await browser.newContext({viewport:{width,height:width<720?844:1000}}),page=await context.newPage();
    await page.route('https://advokatfrida.com/**',async route=>{
      const url=new URL(route.request().url());
      if(url.pathname==='/dispatch-access/')return route.fulfill({contentType:'text/html',body:chrome});
      if(url.pathname==='/members/api/session/')return route.fulfill({status:204,body:''});
      if(url.pathname.startsWith('/assets/')){
        const path=resolve(theme,'.'+url.pathname);if(!path.startsWith(theme))return route.abort();
        try{return route.fulfill({contentType:{'.css':'text/css','.js':'text/javascript','.woff2':'font/woff2'}[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:''});}
      }
      return route.abort();
    });
    await page.goto('https://advokatfrida.com/dispatch-access/',{waitUntil:'networkidle'});await capture(page,'ghost-bridge-'+width);
    await page.goto('https://advokatfrida.com/dispatch-access/?result=subscription&return='+encodeURIComponent(GUIDE+'/comics/'),{waitUntil:'networkidle'});assert((await page.locator('#dispatch-access-status').textContent()).includes('active subscription'));
    if([1440,390].includes(width))await capture(page,'ghost-subscription-'+width);
    await context.close();
  }
  // Read-only visual references, captured separately from the local candidates.
  for(const width of [1440,390]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:1000}}),page=await context.newPage();
    await page.goto('https://guide.advokatfrida.com/',{waitUntil:'networkidle'});await ready(page);await page.screenshot({path:resolve(output,'reference-guide-'+width+'.png')});
    await page.goto('https://advokatfrida.com/members/',{waitUntil:'networkidle'});await ready(page);await page.screenshot({path:resolve(output,'reference-members-'+width+'.png')});
    await context.close();
  }
  await writeFile(resolve(output,'browser-checks.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({screenshots:results.length,overflow:0,brokenVisibleImages:0,output},null,2));
}finally{await browser.close();await harness.mf.dispose();}
