import test from 'node:test';
import assert from 'node:assert/strict';
import {createHarness,TOOLKIT} from '../scripts/access-fixture.mjs';

for(const identityBits of [2048,1024])test(`release setup keeps tools public and ${identityBits===2048?'accepts strong':'rejects legacy'} Ghost identities`,async()=>{
  const harness=await createHarness(null,{mode:'setup',identityBits});
  try{
    const {request}=harness;
    const tool=await request(TOOLKIT,'/tools/safeseed.html?embed=1');
    assert.equal(tool.status,200);
    assert.equal(tool.headers.get('set-cookie'),null);
    const start=await request(TOOLKIT,'/_access/start');
    assert.equal(start.status,303);
    const state=new URL(start.headers.get('location')).searchParams.get('state');
    const cookie=start.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
    const response=await request(TOOLKIT,'/_access/callback',{method:'POST',headers:{Origin:'https://advokatfrida.com','Content-Type':'application/x-www-form-urlencoded',Cookie:cookie},body:new URLSearchParams({state,identity:await harness.identity()}).toString()});
    assert.equal(response.status,303);
    if(identityBits===1024){assert.equal(new URL(response.headers.get('location')).searchParams.get('result'),'keys');assert.equal(harness.fixture.ghostCalls,0);assert.match(response.headers.get('set-cookie'),/Max-Age=0/);}
    assert.equal((await request(TOOLKIT,'/_access/webhook',{method:'POST',...harness.webhook()})).status,204);
  }finally{await harness.mf.dispose();}
});
