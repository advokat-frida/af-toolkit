import assert from 'node:assert/strict';
import {createHarness,TOOLKIT,GUIDE} from './access-fixture.mjs';
const harness=await createHarness(process.env.AF_GUIDE_SOURCE);
const {request,fixture}=harness;
const jar=response=>response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
let checks=0;
const check=(actual,expected,label)=>{assert.equal(actual,expected,label);checks++;};
try{
  const toolkitAnon=await request(TOOLKIT,'/safeseed');check(toolkitAnon.status,200,'public preview');assert(!(await toolkitAnon.text()).includes('<iframe'));
  for(const [origin,paths] of [[TOOLKIT,['/tools/safeseed.html?embed=1','/tools/redactorium/index.html','/tools%2fsafeseed.html','/index.html','/toolkit.js']],[GUIDE,['/catalog.mjs','/assets/art/'+harness.privateArt,'/_access-preview/comics/']]])for(const path of paths){const response=await request(origin,path);assert([401,404].includes(response.status),path+' '+response.status);checks++;}
  const guideAnon=await request(GUIDE,'/comics/');
  if(guideAnon.status!==200)console.log('Guide preview error:',(await guideAnon.text()).slice(0,3000));
  check(guideAnon.status,200,'Guide anonymous preview');
  check((await request(TOOLKIT,'/_access/start?return=https://evil.test/')).status,400,'open redirect blocked');
  async function login(site){
    const start=await request(site,'/_access/start?return='+encodeURIComponent(site+(site===GUIDE?'/comics/':'/safeseed')));
    check(start.status,303,'start');
    const siteJar=jar(start);
    const central=site===TOOLKIT?start:await request(TOOLKIT,start.headers.get('location'));
    const toolkitJar=site===TOOLKIT?siteJar:jar(central);
    const state=new URL(central.headers.get('location')).searchParams.get('state');
    const body=new URLSearchParams({state,identity:await harness.identity()}).toString();
    const headers={Origin:'https://advokatfrida.com','Content-Type':'application/x-www-form-urlencoded',Cookie:toolkitJar};
    check((await request(TOOLKIT,'/_access/callback',{method:'POST',headers:{...headers,Origin:'https://evil.test'},body})).status,403,'callback origin');
    check((await request(TOOLKIT,'/_access/callback',{method:'POST',headers:{...headers,Cookie:''},body})).status,403,'callback state cookie');
    const callback=await request(TOOLKIT,'/_access/callback',{method:'POST',headers,body});
    if(callback.status!==303)console.log('Synthetic callback failure:',await callback.clone().text());
    check(callback.status,303,'signed Ghost identity');
    const complete=callback.headers.get('location');assert(complete.startsWith(site+'/_access/complete?ticket='),complete);
    check((await request(TOOLKIT,'/_access/callback',{method:'POST',headers,body})).status,403,'callback replay');
    check((await request(site,complete)).status,400,'ticket cannot sign another browser in');
    const completed=await request(site,complete,{headers:{Cookie:siteJar}});check(completed.status,303,'browser-bound completion');
    check((await request(site,complete,{headers:{Cookie:siteJar}})).status,400,'ticket replay');
    const session=completed.headers.getSetCookie().find(c=>c.startsWith('__Host-af-member='));assert(session&&!session.includes('Domain='));
    return session.split(';')[0];
  }
  const toolkitCookie=await login(TOOLKIT),guideCookie=await login(GUIDE);
  const member=await request(TOOLKIT,'/tools/safeseed.html?embed=1',{headers:{Cookie:toolkitCookie,'If-None-Match':'fake'}});
  check(member.status,200,'member tool');check(member.headers.get('cache-control'),'private, no-store','member caching');check(member.headers.get('etag'),null,'member validator removed');
  check((await request(GUIDE,'/catalog.mjs',{headers:{Cookie:guideCookie}})).status,200,'member catalog');
  check((await request(GUIDE,'/catalog.mjs',{headers:{Cookie:toolkitCookie}})).status,401,'cookie audience');
  const durations=[];for(let i=0;i<12;i++){const start=performance.now();const r=await request(GUIDE,'/catalog.mjs',{headers:{Cookie:guideCookie}});await r.arrayBuffer();durations.push(performance.now()-start);}
  fixture.subscribed=false;
  check((await request(TOOLKIT,'/_access/webhook',{method:'POST',body:'{}',headers:{'X-Ghost-Signature':'forged'}})).status,403,'webhook signature');
  check((await request(TOOLKIT,'/_access/webhook',{method:'POST',...harness.webhook()})).status,204,'signed invalidation');
  check((await request(TOOLKIT,'/tools/safeseed.html',{headers:{Cookie:toolkitCookie}})).status,401,'unsubscribe Toolkit');
  check((await request(GUIDE,'/catalog.mjs',{headers:{Cookie:guideCookie}})).status,401,'unsubscribe Guide');
  fixture.unavailable=true;
  await request(TOOLKIT,'/_access/webhook',{method:'POST',...harness.webhook()});
  check((await request(GUIDE,'/catalog.mjs',{headers:{Cookie:guideCookie}})).status,503,'outage fails closed');
  durations.sort((a,b)=>a-b);
  console.log(JSON.stringify({checks,artworkOriginalsVerifiedSeparately:true,localWarmRequestMs:{median:+durations[6].toFixed(2),p95:+durations.at(-1).toFixed(2)},ghostFixtureReads:fixture.ghostCalls,productionLatencyMeasured:false,realMembersChanged:0},null,2));
}finally{await harness.mf.dispose();}
