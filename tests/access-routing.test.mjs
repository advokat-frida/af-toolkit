import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker.mjs';
import {gatedFetch} from '../access/gate.mjs';
import {returnURL,completeTicket,sessionCookie,authorize,TOOLKIT,GUIDE,SESSION_COOKIE} from '../access/session.mjs';
import {challenge,nonce} from '../access/crypto.mjs';
const secret='test-only-secret-with-more-than-thirty-two-characters';
const id='6a2b163946abeb0008d5380b';
test('default public mode serves tools without authentication or auth calls',async()=>{
  const env={ACCESS_MODE:'public',ASSETS:{fetch:()=>new Response('public tool')}};
  for(const key of ['DISPATCH_MEMBERS','SESSION_SECRET','LOGIN_GRANTS'])Object.defineProperty(env,key,{get(){throw Error('Public mode touched authentication');}});
  for(const path of ['/tools/safeseed.html','/tools/redactorium/']){
    const response=await worker.fetch(new Request(TOOLKIT+path),env);
    assert.equal(await response.text(),'public tool');assert.equal(response.headers.get('set-cookie'),null);
  }
  assert.match(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'),/"ACCESS_MODE":"public"/);
  assert.match(readFileSync(new URL('../wrangler.gated.jsonc',import.meta.url),'utf8'),/"run_worker_first":true/);
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
  const proof=nonce(),proofHash=await challenge(proof),ticket=nonce();let consumed=false;
  const env={SESSION_SECRET:secret,LOGIN_GRANTS:{getByName:()=>({consume:async(origin,hash)=>{
    if(consumed||origin!==GUIDE||hash!==proofHash)return null;consumed=true;return {member:id,target:GUIDE+'/comics/'};
  }})}};
  await assert.rejects(()=>completeTicket(ticket,GUIDE,nonce(),env));
  const result=await completeTicket(ticket,GUIDE,proof,env);assert.equal(result.target,GUIDE+'/comics/');
  await assert.rejects(()=>completeTicket(ticket,GUIDE,proof,env));
});
