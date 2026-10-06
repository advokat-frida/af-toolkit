import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {fileURLToPath} from 'node:url';

test('Durable Objects remain usable after alarm cleanup in the same instance',async()=>{
  const source=fileURLToPath(new URL('../access/entrypoint.mjs',import.meta.url));
  // Test-only subclasses let the real workerd SQLite objects run their alarm
  // methods immediately. Production workers have no corresponding HTTP route.
  const entry=`
    import {DispatchMember,LoginGrant} from ${JSON.stringify(source)};
    export class MemberFixture extends DispatchMember { fetch(){this.alarm();return new Response('cleared');} }
    export class GrantFixture extends LoginGrant {
      fetch(){this.alarm();return new Response('cleared');}
      expire(){this.sql.exec('UPDATE grant_state SET expires=? WHERE id=1',Date.now()-1);}
    }
    export default {async fetch(request,env){
      const member=env.MEMBERS.getByName('member');
      const before=await member.authorize('0123456789abcdef01234567');
      await member.fetch('https://fixture.test/cleanup');
      const after=await member.authorize('0123456789abcdef01234567');
      const state=env.GRANTS.getByName('state');
      const claimed=await state.claim(Date.now()+30000);
      const replay=await state.claim(Date.now()+30000);
      await state.fetch('https://fixture.test/cleanup');
      const reclaimed=await state.claim(Date.now()+30000);
      const ticket=env.GRANTS.getByName('ticket');
      const flow='f'.repeat(43),proofHash='p'.repeat(43);
      const grant={member:'0123456789abcdef01234567',target:'https://guide.advokatfrida.com/comics/',flow,proofHash,expires:Date.now()+30000};
      await ticket.issue(grant);
      const wrongFlow=await ticket.consume('https://guide.advokatfrida.com',proofHash,'w'.repeat(43));
      await ticket.consume('https://guide.advokatfrida.com',proofHash,flow);
      await ticket.fetch('https://fixture.test/cleanup');
      await ticket.issue(grant);
      const reused=await ticket.consume('https://guide.advokatfrida.com',proofHash,flow);
      const transaction=env.GRANTS.getByName('transaction');
      const record={flow,proofHash,target:grant.target,expires:Date.now()+30000};
      await transaction.begin(record);
      const wrongTarget=await transaction.claimState(flow,'https://guide.advokatfrida.com/posters/');
      const first=await transaction.claimState(flow,grant.target);
      const repeat=await transaction.claimState(flow,grant.target);
      await transaction.fetch('https://fixture.test/cleanup');
      await transaction.begin(record);
      await transaction.expire();
      const expired=await transaction.claimState(flow,grant.target);
      await ticket.fetch('https://fixture.test/cleanup');
      await ticket.issue(grant);
      await ticket.expire();
      const expiredTicket=await ticket.consume('https://guide.advokatfrida.com',proofHash,flow);
      return Response.json({before,after,claimed,replay,reclaimed,reused,wrongFlow,wrongTarget,first,repeat,expired,expiredTicket});
    }};
  `;
  const compiled=await build({stdin:{contents:entry,resolveDir:fileURLToPath(new URL('..',import.meta.url)),sourcefile:'lifecycle-fixture.mjs'},bundle:true,write:false,format:'esm',platform:'neutral',external:['cloudflare:workers']});
  let reads=0;
  const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:compiled.outputFiles[0].text,compatibilityDate:'2026-09-30',cf:false,
    bindings:{GHOST_ADMIN_ORIGIN:'https://advokat-frida.ghost.io',GHOST_ADMIN_API_KEY:'1234567890abcdef12345678:'+('11'.repeat(32)),DISPATCH_NEWSLETTER_ID:'6a2b163946abeb0008d5380b'},
    durableObjects:{MEMBERS:{className:'MemberFixture',useSQLite:true},GRANTS:{className:'GrantFixture',useSQLite:true}},
    outboundService:()=>{reads++;return Response.json({members:[{id:'0123456789abcdef01234567',subscribed:true,newsletters:[{id:'6a2b163946abeb0008d5380b',status:'active'}]}]});}
  }));
  try{
    const response=await mf.dispatchFetch('https://fixture.test/');
    assert.equal(response.status,200);
    const result=await response.json();
    assert.equal(result.before.allowed,true);
    assert.equal(result.after.allowed,true);
    assert.equal(reads,2,'cleanup discards the cached permission');
    assert.equal(result.claimed,true);
    assert.equal(result.replay,false);
    assert.equal(result.reclaimed,true);
    assert.equal(result.reused.member,'0123456789abcdef01234567');
    assert.equal(result.wrongFlow,null);
    assert.equal(result.wrongTarget.reason,'mismatch');
    assert.equal(result.first.target,'https://guide.advokatfrida.com/comics/');
    assert.equal(result.repeat.reason,'expired');
    assert.equal(result.expired.reason,'expired');
    assert.equal(result.expiredTicket,null);
  }finally{await mf.dispose();}
});
