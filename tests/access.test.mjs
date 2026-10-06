import test from 'node:test';
import assert from 'node:assert/strict';
import {sign,verify,verifyIdentity,verifyWebhook,rsaModulusBits} from '../access/crypto.mjs';
import {PermissionCache,subscribedToDispatch} from '../access/permissions.mjs';
const secret='test-only-secret-with-more-than-thirty-two-characters';
const now=1_800_000_000_000;
const b64=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const keyPair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-512'},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',keyPair.publicKey),kid:'fixture',use:'sig'};
async function identity(changes={},header={}){
  const part=b64({alg:'RS512',kid:'fixture',...header})+'.'+b64({sub:'reader@example.com',iss:'https://advokatfrida.com/members/api',aud:'https://advokatfrida.com/members/api',scope:'members:identity',iat:now/1000,exp:now/1000+600,...changes});
  return part+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keyPair.privateKey,new TextEncoder().encode(part))).toString('base64url');
}
test('rejects forged, expired, wrong-origin and wrong-scope identity tokens',async()=>{
  const valid=await identity();
  assert.equal(await verifyIdentity(valid,{keys:[jwk]},now),'reader@example.com');
  for(const token of [valid.slice(0,-12)+'aaaaaaaaaaaa',await identity({exp:now/1000}),await identity({aud:'https://other.example/'}),await identity({iss:'https://other.example/'}),await identity({iss:'https://advokatfrida.com/',aud:'https://advokatfrida.com/'}),await identity({scope:'members:entitlements:read'}),await identity({}, {alg:'HS256'}),await identity({iat:now/1000+100})])await assert.rejects(()=>verifyIdentity(token,{keys:[jwk]},now));
  await assert.rejects(()=>verifyIdentity(valid,{keys:[{...jwk,n:'abc'}]},now));
});
test('signed sessions enforce expiry and purpose',async()=>{
  const token=await sign({purpose:'session',exp:now/1000+10},secret);
  assert.equal((await verify(token,secret,'session',now)).purpose,'session');
  await assert.rejects(()=>verify(token,secret,'state',now));
  await assert.rejects(()=>verify(token,secret,'session',now+10_000));
  await assert.rejects(()=>verify(token,secret+'changed','session',now));
});

test('RSA minimum measures the unsigned modulus rather than padded byte length',async()=>{
  const modulus=(size,first,padding=0)=>Buffer.concat([Buffer.alloc(padding),Buffer.from([first]),Buffer.alloc(size-1,255)]).toString('base64url');
  for(const [value,bits] of [[modulus(256,128),2048],[modulus(256,127),2047],[modulus(256,1),2041],[modulus(128,128,128),1024],[modulus(256,128,3),2048],[modulus(256,0),2040],[Buffer.alloc(256).toString('base64url'),0]])assert.equal(rsaModulusBits(value),bits);
  const valid=await identity();
  for(const n of [modulus(256,127),modulus(128,128,128),modulus(256,1),modulus(128,128,300),jwk.n+'=',null])await assert.rejects(()=>verifyIdentity(valid,{keys:[{...jwk,n}]},now),/Unknown or weak identity key/);
  // A zero prefix does not increase the size, but the mathematical 2048-bit key remains strong.
  const prefixed=Buffer.concat([Buffer.alloc(2),Buffer.from(jwk.n,'base64url')]).toString('base64url');
  assert.equal(rsaModulusBits(prefixed),2048);
  assert.equal(await verifyIdentity(valid,{keys:[{...jwk,n:prefixed}]},now),'reader@example.com');
});
test('requires the specific active Dispatch subscription',()=>{
  const id='6a2b163946abeb0008d5380b';
  assert(subscribedToDispatch({subscribed:true,newsletters:[{id,status:'active'}]},id));
  for(const member of [{subscribed:false,newsletters:[{id,status:'active'}]},{subscribed:true,newsletters:[{id:'different',status:'active'}]},{subscribed:true,newsletters:[{id,status:'archived'}]},{status:'paid',newsletters:[]},{subscribed:true}])assert.equal(subscribedToDispatch(member,id),false);
});
function cacheFixture(){
  let state={revision:0,until:0,allowed:false},time=now;
  return {cache:new PermissionCache({read:()=>({...state}),write:value=>{state={...value};}},()=>time),advance:ms=>{time+=ms;}};
}
test('expires an allow decision at 60 seconds without extending it on failure',async()=>{
  const {cache,advance}=cacheFixture();let calls=0;
  const allow=async()=>{calls++;return true;};
  assert((await cache.check(allow)).allowed);advance(59_999);
  assert((await cache.check(allow)).allowed);assert.equal(calls,1);advance(1);
  assert.equal((await cache.check(async()=>{throw Error('Ghost unavailable');})).allowed,false);
  assert.equal((await cache.check(async()=>false)).allowed,false);
});
test('network duration counts against the permission lifetime',async()=>{
  const {cache,advance}=cacheFixture();
  assert.equal((await cache.check(async()=>{advance(60_000);return true;})).allowed,false);
});
test('webhook invalidation wins over an in-flight stale refresh',async()=>{
  const {cache}=cacheFixture();let finish;
  const pending=cache.check(()=>new Promise(resolve=>{finish=resolve;}));
  cache.invalidate();finish(true);
  assert.equal((await pending).allowed,false);
  assert.equal((await cache.check(async()=>false)).allowed,false);
});
test('verifies Ghost millisecond webhook signatures and rejects stale or altered bodies',async()=>{
  const body='{"member":{"current":{"id":"6a2b163946abeb0008d5380b"}}}';
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const digest=Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(body+now))).toString('hex');
  const header=`sha256=${digest}, t=${now}`;
  assert(await verifyWebhook(body,header,secret,now));
  assert.equal(await verifyWebhook(body+' ',header,secret,now),false);
  assert.equal(await verifyWebhook(body,header,secret,now+300_001),false);
});
