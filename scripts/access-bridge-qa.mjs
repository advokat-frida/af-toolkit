import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const theme=resolve(process.env.AF_WEBSITE_SOURCE||resolve(root,'../website'),'advokat-frida-theme');
const template=await readFile(resolve(theme,'custom-dispatch-access.hbs'),'utf8');
const script=await readFile(resolve(theme,'assets/js/dispatch-access.js'),'utf8');
const body=template.replace(/{{!--[\s\S]*?--}}/g,'').replace(/{{asset "([^"]+)"}}/g,'/assets/$1').replace(/{{[^}]*}}/g,'');
const origin='https://advokatfrida.com';
const state='fixture.'+Buffer.from(JSON.stringify({purpose:'state',exp:Date.now()/1000+600,target:'https://guide.advokatfrida.com/comics/'})).toString('base64url')+'.fixture';
// Browser behavior only. Worker integration separately verifies real RSA signatures.
const identity='synthetic.identity.fixture';
let signedIn=false,submitted;
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext();
  const page=await context.newPage();
  await page.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin===origin&&url.pathname==='/dispatch-access/')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><body>'+body+'</body></html>'});
    if(url.origin===origin&&url.pathname==='/assets/js/dispatch-access.js')return route.fulfill({contentType:'text/javascript',body:script});
    if(url.origin===origin&&url.pathname==='/assets/css/dispatch-access.css')return route.fulfill({contentType:'text/css',body:''});
    if(url.origin===origin&&url.pathname==='/members/api/session/')return route.fulfill({status:signedIn?200:204,body:signedIn?identity:''});
    if(url.origin==='https://toolkit.advokatfrida.com'&&url.pathname==='/_access/callback'){
      submitted={method:request.method(),body:new URLSearchParams(request.postData()),origin:request.headers().origin};
      return route.fulfill({contentType:'text/html',body:'Synthetic callback received'});
    }
    throw Error('Unexpected browser egress: '+url.origin+url.pathname);
  });
  await page.goto(origin+'/dispatch-access/?state='+encodeURIComponent(state));
  await page.waitForFunction(()=>document.getElementById('dispatch-access-status').textContent.includes('Open your sign-in email'));
  assert.equal(page.url(),origin+'/dispatch-access/','state removed from address bar');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('af-dispatch-access-state')),state);
  signedIn=true;
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.waitForURL('https://toolkit.advokatfrida.com/_access/callback');
  assert.equal(submitted.method,'POST');
  assert.equal(submitted.origin,origin);
  assert.equal(submitted.body.get('identity'),identity);
  assert.equal(submitted.body.get('state'),state);
  assert.equal(new URL(page.url()).search,'','identity never enters callback URL');
  signedIn=false;
  await page.goto(origin+'/dispatch-access/');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('af-dispatch-access-state')),null,'state consumed before submission');
  assert.equal(await page.evaluate(()=>Object.values(localStorage).join('|')+'|'+Object.values(sessionStorage).join('|')),'|','identity never persisted');
  console.log('PASS: Ghost bridge handles unsigned-in state, resumes with a POST, clears state, and keeps identity out of URLs and storage. Real emails sent: 0.');
}finally{await browser.close();}
