import {nonce,sign,verify,verifyWebhook,challenge} from './crypto.mjs';
import {boundedText,ghostIdentity,memberByEmail,MEMBER_ID} from './ghost.mjs';
import {TOOLKIT,GHOST,STATE_COOKIE,PROOF_COOKIE,cookie,cookieValue,returnURL,completeTicket,privateResponse} from './session.mjs';
const reply=(body,status=400)=>privateResponse(new Response(body,{status,headers:{'Content-Type':'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff'}}));
const redirect=(target,extra={})=>privateResponse(new Response(null,{status:303,headers:{Location:target,...extra}}));
export async function accessEndpoint(request,env){
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/_access/'))return null;
  if(url.origin!==TOOLKIT)return reply('Not found',404);
  let failedTarget;
  try{
    if(['/_access/start','/_access/callback'].includes(url.pathname)){
      const limit=await env.ACCESS_LIMITER.limit({key:url.pathname+':'+(request.headers.get('cf-connecting-ip')||'unknown')});
      if(!limit.success)return reply('Too many sign-in attempts. Please try again in a minute.',429);
    }
    if(url.pathname==='/_access/start'&&request.method==='GET'){
      const target=returnURL(url.searchParams.get('return'));
      const proof=nonce(),local=new URL(target).origin===TOOLKIT;
      const proofHash=local?await challenge(proof):url.searchParams.get('challenge');
      if(!/^[\w-]{43}$/.test(proofHash||''))return reply('Start sign-in from the Guide.',400);
      const state=await sign({purpose:'state',nonce:nonce(),target,proofHash,exp:Math.floor(Date.now()/1000)+600},env.SESSION_SECRET);
      const bridge=new URL('/dispatch-access/',GHOST);bridge.searchParams.set('state',state);
      const response=redirect(bridge.href,{'Set-Cookie':cookie(STATE_COOKIE,state,600)});
      if(local)response.headers.append('Set-Cookie',cookie(PROOF_COOKIE,proof,600));
      return response;
    }
    if(url.pathname==='/_access/callback'&&request.method==='POST'){
      if(request.headers.get('origin')!==GHOST||!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded'))return reply('Sign-in origin rejected',403);
      const form=new URLSearchParams(await boundedText(request,12*1024));
      const state=form.get('state');
      if(!state||cookieValue(request.headers.get('cookie'),STATE_COOKIE)!==state)return reply('Sign-in expired. Please start again.',403);
      const claims=await verify(state,env.SESSION_SECRET,'state');
      if(!/^[\w-]{43}$/.test(claims.nonce||''))return reply('Invalid sign-in',403);
      const target=returnURL(claims.target);
      failedTarget=target;
      // Burn the browser-bound transaction before identity/API I/O. A retry starts
      // a fresh transaction, and simultaneous callbacks cannot both issue tickets.
      if(!await env.LOGIN_GRANTS.getByName('state:'+claims.nonce).claim(claims.exp*1000))return reply('Sign-in already used. Please start again.',403);
      const email=await ghostIdentity(form.get('identity'));
      const member=await memberByEmail(env,email);
      const permission=await env.DISPATCH_MEMBERS.getByName(member.id).authorize(member.id);
      if(!permission.allowed)return redirect(GHOST+'/dispatch-access/?result='+(permission.reason==='unavailable'?'unavailable':'subscription')+'&return='+encodeURIComponent(target),{'Set-Cookie':cookie(STATE_COOKIE,'',0)});
      const ticket=nonce();
      await env.LOGIN_GRANTS.getByName('ticket:'+ticket).issue({member:member.id,target,proofHash:claims.proofHash,expires:Date.now()+60_000});
      return redirect(new URL('/_access/complete?ticket='+ticket,new URL(target).origin).href,{'Set-Cookie':cookie(STATE_COOKIE,'',0)});
    }
    if(url.pathname==='/_access/complete'&&request.method==='GET'){
      const result=await completeTicket(url.searchParams.get('ticket'),TOOLKIT,cookieValue(request.headers.get('cookie'),PROOF_COOKIE),env);
      const response=redirect(result.target,{'Set-Cookie':result.cookie});
      response.headers.append('Set-Cookie',cookie(PROOF_COOKIE,'',0));return response;
    }
    if(url.pathname==='/_access/webhook'&&request.method==='POST'){
      const body=await boundedText(request,128*1024);
      if(!await verifyWebhook(body,request.headers.get('x-ghost-signature'),env.GHOST_WEBHOOK_SECRET))return reply('Invalid signature',403);
      const data=JSON.parse(body),id=data.member?.current?.id||data.member?.previous?.id;
      if(!MEMBER_ID.test(id||''))return reply('Invalid member event');
      await env.DISPATCH_MEMBERS.getByName(id).invalidate();
      return reply(null,204);
    }
    return reply('Not found',404);
  }catch(error){
    if(error.message==='Unknown or weak identity key')return redirect(GHOST+'/dispatch-access/?result=keys'+(failedTarget?'&return='+encodeURIComponent(failedTarget):''),{'Set-Cookie':cookie(STATE_COOKIE,'',0)});
    return reply('Could not complete sign-in. Return to the site and try signing in again.',400);
  }
}
