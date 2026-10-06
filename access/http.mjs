import {nonce,verifyWebhook,challenge} from './crypto.mjs';
import {boundedText,ghostIdentity,memberByEmail,MEMBER_ID} from './ghost.mjs';
import {TOOLKIT,GHOST,STATE_COOKIE,PROOF_COOKIE,FLOW_ID,cookie,cookieValue,flowCookieName,setFlowCookie,returnURL,authorize,completeTicket,privateResponse} from './session.mjs';
const reply=(body,status=400)=>privateResponse(new Response(body,{status,headers:{'Content-Type':'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff'}}));
const redirect=(target,extra={})=>privateResponse(new Response(null,{status:303,headers:{Location:target,...extra}}));
const recover=(result,target,flow)=>redirect(GHOST+'/dispatch-access/?result='+result+'&return='+encodeURIComponent(target),flow?{'Set-Cookie':cookie(flowCookieName(STATE_COOKIE,flow),'',0)}:{});
export async function accessEndpoint(request,env){
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/_access/'))return null;
  if(url.origin!==TOOLKIT)return reply('Not found',404);
  let failedTarget,failedFlow,failureResult='invalid';
  try{
    if(['/_access/start','/_access/callback'].includes(url.pathname)){
      const limit=await env.ACCESS_LIMITER.limit({key:url.pathname+':'+(request.headers.get('cf-connecting-ip')||'unknown')});
      if(!limit.success)return reply('Too many sign-in attempts. Please try again in a minute.',429);
    }
    if(url.pathname==='/_access/start'&&request.method==='GET'){
      const target=returnURL(url.searchParams.get('return'));
      if(['return','flow','challenge'].some(name=>url.searchParams.getAll(name).length>1))return reply('Invalid sign-in request');
      const local=new URL(target).origin===TOOLKIT;
      if(local&&(await authorize(request.headers.get('cookie'),TOOLKIT,env)).allowed)return redirect(target);
      const proof=nonce(),flow=local?nonce():url.searchParams.get('flow');
      const proofHash=local?await challenge(proof):url.searchParams.get('challenge');
      if(!FLOW_ID.test(proofHash||'')||!FLOW_ID.test(flow||''))return reply('Start sign-in from the Guide.',400);
      const state=nonce(),expires=Math.floor(Date.now()/1000)+600;
      await env.LOGIN_GRANTS.getByName('state:'+state).begin({flow,target,proofHash,expires:expires*1000});
      const bridge=new URL('/dispatch-access/',GHOST);
      for(const [key,value] of Object.entries({state,flow,expires,return:target}))bridge.searchParams.set(key,String(value));
      const response=redirect(bridge.href);
      setFlowCookie(response,request.headers.get('cookie'),STATE_COOKIE,flow,state);
      if(local)setFlowCookie(response,request.headers.get('cookie'),PROOF_COOKIE,flow,proof);
      return response;
    }
    if(url.pathname==='/_access/callback'&&request.method==='POST'){
      if(request.headers.get('origin')!==GHOST||!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded'))return reply('Sign-in origin rejected',403);
      const form=new URLSearchParams(await boundedText(request,12*1024));
      if(['state','flow','return','identity'].some(name=>form.getAll(name).length!==1))return reply('Invalid sign-in',403);
      const state=form.get('state'),flow=form.get('flow');
      if(!FLOW_ID.test(state||'')||!FLOW_ID.test(flow||''))return reply('Invalid sign-in',403);
      const target=returnURL(form.get('return'));
      if(cookieValue(request.headers.get('cookie'),flowCookieName(STATE_COOKIE,flow))!==state)return recover('expired',target);
      // Burn the browser-bound transaction before identity/API I/O. A retry starts
      // a fresh transaction, and simultaneous callbacks cannot both issue tickets.
      const claims=await env.LOGIN_GRANTS.getByName('state:'+state).claimState(flow,target);
      if(claims.reason==='mismatch')return reply('Sign-in target rejected',403);
      if(claims.reason==='expired')return recover('expired',target,flow);
      failedTarget=target;failedFlow=flow;
      const email=await ghostIdentity(form.get('identity'));
      failureResult='unavailable';
      const member=await memberByEmail(env,email);
      const permission=await env.DISPATCH_MEMBERS.getByName(member.id).authorize(member.id);
      if(!permission.allowed)return redirect(GHOST+'/dispatch-access/?result='+(permission.reason==='unavailable'?'unavailable':'subscription')+'&return='+encodeURIComponent(target),{'Set-Cookie':cookie(flowCookieName(STATE_COOKIE,flow),'',0)});
      const ticket=nonce();
      await env.LOGIN_GRANTS.getByName('ticket:'+ticket).issue({member:member.id,target,flow,proofHash:claims.proofHash,expires:Date.now()+60_000});
      return redirect(new URL('/_access/complete?ticket='+ticket+'&flow='+flow,new URL(target).origin).href,{'Set-Cookie':cookie(flowCookieName(STATE_COOKIE,flow),'',0)});
    }
    if(url.pathname==='/_access/complete'&&request.method==='GET'){
      if(['ticket','flow'].some(name=>url.searchParams.getAll(name).length!==1))return reply('Invalid ticket');
      const flow=url.searchParams.get('flow'),name=flowCookieName(PROOF_COOKIE,flow);
      const result=await completeTicket(url.searchParams.get('ticket'),TOOLKIT,cookieValue(request.headers.get('cookie'),name),env,flow);
      const response=redirect(result.target,{'Set-Cookie':result.cookie});
      response.headers.append('Set-Cookie',cookie(name,'',0));return response;
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
    if(failedTarget)return recover(error.message==='Unknown or weak identity key'?'keys':error.message==='Identity keys unavailable'?'unavailable':failureResult,failedTarget,failedFlow);
    if(url.pathname==='/_access/complete')return privateResponse(new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Access link expired · AF Toolkit</title><main><h1>Access link expired</h1><p>This link expired or was already used.</p><p><a href="/">Return to the Toolkit</a> to sign in again.</p></main></html>',{status:400,headers:{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; base-uri 'none'; frame-ancestors 'none'"}}));
    return reply('Could not complete sign-in. Return to the site and try signing in again.',400);
  }
}
