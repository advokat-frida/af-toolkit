import test from 'node:test';
import assert from 'node:assert/strict';
import {createHarness,TOOLKIT,GUIDE} from '../../scripts/access-fixture.mjs';

const GHOST='https://advokatfrida.com';
const cookieJar=response=>response.headers.getSetCookie().filter(cookie=>!cookie.includes('Max-Age=0')).map(cookie=>cookie.split(';')[0]).join('; ');
const sessionJar=response=>response.headers.getSetCookie().find(cookie=>cookie.startsWith('__Host-af-member='))?.split(';')[0];
const recovery=response=>new URL(response.headers.get('location')).searchParams.get('result');

test('local setup protocol preserves destinations and rejects transaction misuse across both hosts',async t=>{
  const harness=await createHarness(undefined,{mode:'setup',guideMode:'public'});
  const {request}=harness;
  let requestId=0;
  async function start(site,target,cookie=''){
    const first=await request(site,'/_access/start?return='+encodeURIComponent(target),{headers:{Cookie:cookie,'cf-connecting-ip':'192.0.2.'+(++requestId)}});
    assert.equal(first.status,303);
    const central=site===TOOLKIT?first:await request(TOOLKIT,first.headers.get('location'),{headers:{'cf-connecting-ip':'192.0.2.'+(++requestId)}});
    assert.equal(central.status,303);
    const bridge=new URL(central.headers.get('location'));
    assert.equal(bridge.origin,GHOST);
    assert.equal(bridge.pathname,'/dispatch-access/');
    const fields=Object.fromEntries(['state','flow','return'].map(name=>[name,bridge.searchParams.get(name)]));
    assert.match(fields.state,/^[A-Za-z0-9_-]{43}$/);
    assert.match(fields.flow,/^[A-Za-z0-9_-]{43}$/);
    assert.equal(fields.return,target);
    assert(Number(bridge.searchParams.get('expires'))*1000>Date.now());
    assert(Number(bridge.searchParams.get('expires'))*1000<=Date.now()+600_000);
    return {fields,site,siteCookies:cookieJar(first),centralCookies:cookieJar(central)};
  }
  async function post(flow,{cookie=flow.centralCookies,fields=flow.fields,identity,origin=GHOST,body}={}){
    return request(TOOLKIT,'/_access/callback',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded',Cookie:cookie,'cf-connecting-ip':'198.51.100.'+(++requestId)},body:body??new URLSearchParams({...fields,identity:identity??await harness.identity()}).toString()});
  }
  async function complete(flow,callback,cookie=flow.siteCookies){
    assert.equal(callback.status,303);
    const location=new URL(callback.headers.get('location'));
    assert.equal(location.origin,flow.site);
    assert.equal(location.pathname,'/_access/complete');
    assert.equal(location.searchParams.get('flow'),flow.fields.flow);
    const response=await request(flow.site,location.href,{headers:{Cookie:cookie}});
    assert.equal(response.status,303);
    assert.equal(response.headers.get('location'),flow.fields.return);
    assert(sessionJar(response));
    assert(!response.headers.getSetCookie().join('').includes('Domain='));
    return response;
  }
  try{
    await t.test('both destinations retain query/hash and existing authorized sessions return directly',async()=>{
      for(const [site,target] of [[TOOLKIT,TOOLKIT+'/redactorium?view=table#findings'],[GUIDE,GUIDE+'/posters/page/2/?view=all#poster-2']]){
        const flow=await start(site,target),callback=await post(flow);
        const missingProof=await request(site,callback.headers.get('location'));
        assert.equal(missingProof.status,400);
        assert(!sessionJar(missingProof));
        const done=await complete(flow,callback);
        assert.equal((await request(site,callback.headers.get('location'),{headers:{Cookie:flow.siteCookies}})).status,400);
        const existing=await request(site,'/_access/start?return='+encodeURIComponent(target),{headers:{Cookie:sessionJar(done)}});
        assert.equal(existing.status,303);
        assert.equal(existing.headers.get('location'),target);
        assert.equal(existing.headers.get('set-cookie'),null);
      }
    });
    await t.test('independent tabs and simultaneous replay cannot overwrite or reuse a transaction',async()=>{
      const first=await start(TOOLKIT,TOOLKIT+'/safeseed');
      const second=await start(TOOLKIT,TOOLKIT+'/safelist',first.siteCookies);
      const cookies=first.siteCookies+'; '+second.siteCookies;
      assert.notEqual(first.fields.flow,second.fields.flow);
      const [a,b]=await Promise.all([post(first,{cookie:cookies}),post(first,{cookie:cookies})]);
      const callbacks=[a,b],success=callbacks.find(r=>new URL(r.headers.get('location')).origin===TOOLKIT),replay=callbacks.find(r=>new URL(r.headers.get('location')).origin===GHOST);
      assert(success&&replay);
      assert.equal(recovery(replay),'expired');
      assert(!sessionJar(replay));
      await complete(first,success,cookies);
      await complete(second,await post(second,{cookie:cookies}),cookies);
    });
    await t.test('missing state recovers safely; duplicate fields and tampered destinations are rejected',async()=>{
      const flow=await start(TOOLKIT,TOOLKIT+'/safeseed?view=table#rows');
      const missing=await post(flow,{cookie:''});
      assert.equal(recovery(missing),'expired');
      assert.equal(new URL(missing.headers.get('location')).searchParams.get('return'),flow.fields.return);
      assert(!sessionJar(missing));
      assert.equal((await post(flow,{fields:{...flow.fields,return:TOOLKIT+'/redactorium'}})).status,403);
      for(const name of ['state','flow','return','identity']){
        const body=new URLSearchParams({...flow.fields,identity:await harness.identity()});
        body.append(name,body.get(name));
        assert.equal((await post(flow,{body:body.toString()})).status,403,name);
      }
      assert.equal((await post(flow,{fields:{flow:flow.fields.flow,return:flow.fields.return}})).status,403);
      assert.equal((await post(flow,{origin:'https://evil.test'})).status,403);
      await complete(flow,await post(flow));
    });
    await t.test('invalid identity burns its transaction and returns only a safe recovery address',async()=>{
      const flow=await start(TOOLKIT,TOOLKIT+'/safelist');
      const invalid=await post(flow,{identity:'not-a-jwt'});
      assert.equal(recovery(invalid),'invalid');
      assert(!invalid.headers.get('location').includes('not-a-jwt'));
      assert.match(invalid.headers.get('set-cookie'),/Max-Age=0/);
      assert.equal(recovery(await post(flow)),'expired');
    });
    await t.test('subscription removal blocks existing sessions and new tickets; outage fails closed',async()=>{
      const flow=await start(TOOLKIT,TOOLKIT+'/safeseed'),done=await complete(flow,await post(flow));
      harness.fixture.subscribed=false;
      assert.equal((await request(TOOLKIT,'/_access/webhook',{method:'POST',...harness.webhook()})).status,204);
      const existing=await request(TOOLKIT,'/_access/start?return='+encodeURIComponent(TOOLKIT+'/safeseed'),{headers:{Cookie:sessionJar(done)}});
      assert.equal(new URL(existing.headers.get('location')).origin,GHOST,'inactive session does not skip permission check');
      const unsubscribed=await start(GUIDE,GUIDE+'/comics/');
      const rejected=await post(unsubscribed);
      assert.equal(recovery(rejected),'subscription');
      assert(!sessionJar(rejected));
      harness.fixture.unavailable=true;
      const outage=await start(TOOLKIT,TOOLKIT+'/safelist');
      const unavailable=await post(outage);
      assert.equal(recovery(unavailable),'unavailable');
      assert(!sessionJar(unavailable));
    });
  }finally{await harness.mf.dispose();}
});
