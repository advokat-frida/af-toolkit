import {sign,verify,challenge} from './crypto.mjs';
import {MEMBER_ID} from './ghost.mjs';
export const TOOLKIT='https://toolkit.advokatfrida.com';
export const GUIDE='https://guide.advokatfrida.com';
export const GHOST='https://advokatfrida.com';
export const SESSION_COOKIE='__Host-af-member';
export const STATE_COOKIE='__Host-af-login';
export const PROOF_COOKIE='__Host-af-proof';
export const SESSION_SECONDS=7*24*60*60;
export const allowedOrigin=origin=>origin===TOOLKIT||origin===GUIDE;
export function returnURL(input){
  const url=new URL(input||'/',TOOLKIT);
  if(!allowedOrigin(url.origin)||url.username||url.password||url.pathname.startsWith('/_access/')||url.href.length>2048)throw Error('Invalid return address');
  return url.href;
}
export function cookieValue(header,name){
  const values=String(header||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(name+'='));
  return values.length===1?values[0].slice(name.length+1):null;
}
export const cookie=(name,value,maxAge)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
export async function sessionCookie(id,origin,env){
  if(!MEMBER_ID.test(id)||!allowedOrigin(origin))throw Error('Invalid session scope');
  const token=await sign({purpose:'session',sub:id,aud:origin,exp:Math.floor(Date.now()/1000)+SESSION_SECONDS},env.SESSION_SECRET);
  return cookie(SESSION_COOKIE,token,SESSION_SECONDS);
}
export async function authorize(header,origin,env){
  if(!allowedOrigin(origin))return {allowed:false};
  try{
    const token=cookieValue(header,SESSION_COOKIE);
    if(!token)return {allowed:false,reason:'signin'};
    const claims=await verify(token,env.SESSION_SECRET,'session');
    if(claims.aud!==origin||!MEMBER_ID.test(claims.sub))return {allowed:false,reason:'signin'};
    return await env.DISPATCH_MEMBERS.getByName(claims.sub).authorize(claims.sub);
  }catch{return {allowed:false,reason:'unavailable'};}
}
export async function completeTicket(ticket,origin,proof,env){
  if(!allowedOrigin(origin)||!/^[\w-]{43}$/.test(ticket||'')||!/^[\w-]{43}$/.test(proof||''))throw Error('Invalid ticket');
  const grant=await env.LOGIN_GRANTS.getByName('ticket:'+ticket).consume(origin,await challenge(proof));
  if(!grant||!MEMBER_ID.test(grant.member))throw Error('Expired or consumed ticket');
  const target=returnURL(grant.target);
  if(new URL(target).origin!==origin)throw Error('Ticket origin mismatch');
  return {cookie:await sessionCookie(grant.member,origin,env),target};
}
export function privateResponse(response){
  const headers=new Headers(response.headers);
  headers.set('Cache-Control','private, no-store');headers.set('CDN-Cache-Control','no-store');
  headers.set('Vary','Cookie');headers.set('Referrer-Policy','no-referrer');
  headers.delete('etag');headers.delete('last-modified');
  return new Response(response.body,{status:response.status,headers});
}
