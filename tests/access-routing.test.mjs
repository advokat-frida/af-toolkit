import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker.mjs';
import {gatedFetch} from '../access/gate.mjs';
import {returnURL,completeTicket,sessionCookie,authorize,TOOLKIT,GUIDE,SESSION_COOKIE,STATE_COOKIE,PROOF_COOKIE,flowCookieName,setFlowCookie,MAX_FLOW_COOKIES} from '../access/session.mjs';
import {challenge,nonce} from '../access/crypto.mjs';
const secret='test-only-secret-with-more-than-thirty-two-characters';
const id='6a2b163946abeb0008d5380b';
test('explicit public mode serves tools without authentication or auth calls',async()=>{
  const env={ACCESS_MODE:'public',ASSETS:{fetch:()=>new Response('public tool')}};
  for(const key of ['DISPATCH_MEMBERS','SESSION_SECRET','LOGIN_GRANTS'])Object.defineProperty(env,key,{get(){throw Error('Public mode touched authentication');}});
  for(const path of ['/tools/safeseed.html','/tools/redactorium/']){
    const response=await worker.fetch(new Request(TOOLKIT+path),env);
    assert.equal(await response.text(),'public tool');assert.equal(response.headers.get('set-cookie'),null);
  }
});
test('ordinary deployment preserves setup access state without activating gating or preview hosts',()=>{
  const config=name=>JSON.parse(readFileSync(new URL('../'+name,import.meta.url),'utf8').replace(/^\s*\/\/.*$/gm,''));
  const current=config('wrangler.jsonc'),future=config('wrangler.gated.jsonc');
  assert.equal(current.vars.ACCESS_MODE,'setup');
  assert.equal(current.main,'access/entrypoint.mjs');
  assert.equal(current.workers_dev,false);assert.equal(current.preview_urls,false);
  assert.equal(current.assets.run_worker_first,true);
  assert.deepEqual(current,{...future,vars:{...future.vars,ACCESS_MODE:'setup'}},'default deploy retains every existing service binding, migration and limit');
});
test('anonymous tool routes are crawlable descriptions; direct files and alternate hosts stay gated',async()=>{
  const env={ASSETS:{fetch(){throw Error('Protected bytes were fetched');}}};
  for(const origin of [TOOLKIT,'https://example.workers.dev']){
    for(const path of ['/tools/safeseed.html?embed=1','/tools/redactorium/index.html','/toolkit.js','/index.html','/tools%2fsafeseed.html','/tools//safeseed.html']){
      const response=await gatedFetch(new Request(origin+path),env,()=>{throw Error('Tool served');});
      assert.equal(response.status,401,path);assert.match(response.headers.get('cache-control'),/no-store/);
    }
    const response=await gatedFetch(new Request(origin+'/safeseed'),env);
    const html=await response.text();assert.equal(response.status,200);assert.match(html,/<h1>SafeSeed<\/h1>/);assert(!html.includes('<iframe'));assert(!html.includes('toolkit.js'));
  }
});
test('host-only sessions reject wrong-site and duplicate cookies',async()=>{
  const env={SESSION_SECRET:secret,DISPATCH_MEMBERS:{getByName:()=>({authorize:async()=>({allowed:true,expiresAt:Date.now()+60_000})})}};
  const serialized=await sessionCookie(id,TOOLKIT,env),header=serialized.split(';')[0];
  assert(serialized.includes('Secure'));assert(serialized.includes('HttpOnly'));assert(!serialized.includes('Domain='));
  assert((await authorize(header,TOOLKIT,env)).allowed);
  assert.equal((await authorize(header,GUIDE,env)).allowed,false);
  assert.equal((await authorize(header+'; '+SESSION_COOKIE+'=forged',TOOLKIT,env)).allowed,false);
});
test('return destinations and cross-site completion require a browser-bound one-use ticket',async()=>{
  for(const url of ['https://evil.test/','//evil.test/','https://toolkit.advokatfrida.com.evil.test/','https://user:pass@guide.advokatfrida.com/','https://guide.advokatfrida.com/_access/start'])assert.throws(()=>returnURL(url));
  const proof=nonce(),proofHash=await challenge(proof),ticket=nonce(),flow=nonce();let consumed=false;
  const env={SESSION_SECRET:secret,LOGIN_GRANTS:{getByName:()=>({consume:async(origin,hash,candidateFlow)=>{
    if(consumed||origin!==GUIDE||hash!==proofHash||candidateFlow!==flow)return null;consumed=true;return {member:id,target:GUIDE+'/comics/'};
  }})}};
  await assert.rejects(()=>completeTicket(ticket,GUIDE,nonce(),env,flow));
  await assert.rejects(()=>completeTicket(ticket,GUIDE,proof,env,nonce()));
  const result=await completeTicket(ticket,GUIDE,proof,env,flow);assert.equal(result.target,GUIDE+'/comics/');
  await assert.rejects(()=>completeTicket(ticket,GUIDE,proof,env,flow));
});

test('return recovery retains safe deep links and rejects escaped credentials and paths',()=>{
  for(const [input,expected] of [['/safeseed/?view=table#rows',TOOLKIT+'/safeseed?view=table#rows'],[GUIDE+'/posters/page/9999?view=all#poster-2',GUIDE+'/posters/page/9999/?view=all#poster-2'],['/#redactorium',TOOLKIT+'/#redactorium']])assert.equal(returnURL(input),expected);
  for(const input of ['https://%74oolkit.advokatfrida.com/','https://%67uide.advokatfrida.com/','/safeseed?client_secret=hidden','/safeseed#auth_token=hidden','/safeseed?session_id=hidden','/safeseed?x=%2525250a','/safeseed?x=%2525255c'])assert.throws(()=>returnURL(input),input);
  for(const input of ['https://evil.test/', '//evil.test/', 'https://user@toolkit.advokatfrida.com/', 'https://toolkit.advokatfrida.com:444/', 'http://toolkit.advokatfrida.com/', '/tools/safeseed.html','/safeseed/../','/%2e%2e/','/safe%73eed','/_access/start','/safeseed?%2574oken=secret','/safeseed#%2569dentity=secret','/safeseed?value=%250a','/safeseed?value=%255c','/safeseed?value=abcdefgh.ijklmnop.qrstuvwx','/safeseed?secret=hidden','/safeseed?x=%','/safeseed?x=%25252525250a',GUIDE+'/comics/page/0/',GUIDE+'/posters/page/10000/',GUIDE+'/comics/page/01/',' safeseed','safeseed'])assert.throws(()=>returnURL(input),input);
});

test('flow cookies isolate tabs, prune known oldest flows, and remain host-only',()=>{
  const flows=Array.from({length:MAX_FLOW_COOKIES+1},()=>nonce()),value=nonce();
  const header=flows.slice(0,-1).map(flow=>flowCookieName(STATE_COOKIE,flow)+'='+nonce()).join('; ');
  const response=new Response();
  setFlowCookie(response,header,STATE_COOKIE,flows.at(-1),value);
  const output=response.headers.getSetCookie();
  assert.equal(output.length,2);
  assert(output[0].startsWith(flowCookieName(STATE_COOKIE,flows[0])+'=;'));
  assert.match(output[0],/Max-Age=0/);
  assert(output[1].startsWith(flowCookieName(STATE_COOKIE,flows.at(-1))+'='+value+';'));
  assert.match(output[1],/HttpOnly; Secure; SameSite=Lax; Max-Age=600/);
  assert(!output.join('').includes('Domain='));
  assert.notEqual(flowCookieName(PROOF_COOKIE,flows[0]),flowCookieName(PROOF_COOKIE,flows[1]));
});
