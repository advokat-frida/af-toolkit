import {sign,verify,challenge} from './crypto.mjs';
import {MEMBER_ID} from './ghost.mjs';
import {TOOLS} from '../routes.mjs';
export const TOOLKIT='https://toolkit.advokatfrida.com';
export const GUIDE='https://guide.advokatfrida.com';
export const GHOST='https://advokatfrida.com';
export const SESSION_COOKIE='__Host-af-member';
export const STATE_COOKIE='__Host-af-login';
export const PROOF_COOKIE='__Host-af-proof';
export const FLOW_ID=/^[A-Za-z0-9_-]{43}$/;
export const MAX_FLOW_COOKIES=4;
export const SESSION_SECONDS=7*24*60*60;
export const allowedOrigin=origin=>origin===TOOLKIT||origin===GUIDE;
const credentialNames=new Set(['state','identity','token','jwt','accesstoken','refreshtoken','idtoken','authtoken','ticket','code','key','apikey','secret','clientsecret','password','authorization','auth','session','sessionid','sessiontoken','signature','sig']);
const jwtValue=/(?:^|[^A-Za-z0-9_-])[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}(?:$|[^A-Za-z0-9_-])/;
function safeComponent(value){
  for(let depth=0;depth<4;depth++){
    if(/[\x00-\x1f\x7f\\]/.test(value)||/%(?![0-9a-f]{2})/i.test(value)||jwtValue.test(value))throw Error('Invalid return address');
    if(!value.includes('%'))return value;
    value=decodeURIComponent(value);
  }
  if(value.includes('%')||/[\x00-\x1f\x7f\\]/.test(value)||jwtValue.test(value))throw Error('Invalid return address');
  return value;
}
function safeParameters(value){
  const decoded=safeComponent(value);
  for(const [name,part] of new URLSearchParams(decoded.replace(/^\?/,''))){
    if(credentialNames.has(safeComponent(name).toLowerCase().replace(/[^a-z0-9]/g,'')))throw Error('Invalid return address');
    safeComponent(part);
  }
}
export function returnURL(input){
  if(input===undefined||input===null||input==='')input='/';
  if(typeof input!=='string'||input.length>2048||input!==input.trim()||/[\x00-\x1f\x7f\\]/.test(input)||/%(?![0-9a-f]{2})/i.test(input))throw Error('Invalid return address');
  // Validate before URL normalization can hide escaped dots or traversal segments.
  if(!input.startsWith('https://')&&!/^\/(?!\/)/.test(input))throw Error('Invalid return address');
  if(/^https:\/\/([^/?#]*)/.exec(input)?.[1].includes('%'))throw Error('Invalid return address');
  const rawPath=input.replace(/^https:\/\/[^/?#]*/, '').split(/[?#]/,1)[0];
  if(rawPath.includes('%')||rawPath.split('/').some(part=>part==='.'||part==='..'))throw Error('Invalid return address');
  const url=new URL(input,TOOLKIT);
  if(!allowedOrigin(url.origin)||url.username||url.password||url.href.length>2048||url.search.length>1024||url.hash.length>512||url.pathname.includes('%'))throw Error('Invalid return address');
  const path=url.pathname;
  if(url.origin===TOOLKIT){
    const slug=path.replace(/^\/|\/$/g,'');
    if(path!=='/'&&!Object.hasOwn(TOOLS,slug))throw Error('Invalid return address');
    url.pathname=path==='/'?'/':'/'+slug;
  }else if(path!=='/'){
    if(!/^\/(comics|posters)(?:\/page\/[1-9][0-9]{0,3})?\/?$/.test(path))throw Error('Invalid return address');
    url.pathname=path.endsWith('/')?path:path+'/';
  }
  safeParameters(url.search.slice(1));
  safeParameters(url.hash.slice(1));
  return url.href;
}
export function cookieValue(header,name){
  const values=String(header||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(name+'='));
  return values.length===1?values[0].slice(name.length+1):null;
}
export const cookie=(name,value,maxAge)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
export function flowCookieName(prefix,flow){
  if(![STATE_COOKIE,PROOF_COOKIE].includes(prefix)||!FLOW_ID.test(flow||''))throw Error('Invalid flow');
  return prefix+'-'+flow;
}
export function setFlowCookie(response,header,prefix,flow,value){
  const name=flowCookieName(prefix,flow);
  // Keep each tab's transaction independent. Expire old, known flows in cookie
  // creation order; simultaneous starts may briefly add unseen cookies (TTL 10m).
  const names=[...new Set(String(header||'').split(';').map(v=>v.trim().split('=')[0]).filter(n=>n.startsWith(prefix+'-')&&FLOW_ID.test(n.slice(prefix.length+1))&&n!==name))];
  for(const stale of names.slice(0,Math.max(0,names.length-(MAX_FLOW_COOKIES-1))))response.headers.append('Set-Cookie',cookie(stale,'',0));
  if(cookieValue(header,prefix)!==null)response.headers.append('Set-Cookie',cookie(prefix,'',0));
  response.headers.append('Set-Cookie',cookie(name,value,600));
}
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
export async function completeTicket(ticket,origin,proof,env,flow){
  if(!allowedOrigin(origin)||!FLOW_ID.test(ticket||'')||!FLOW_ID.test(proof||'')||!FLOW_ID.test(flow||''))throw Error('Invalid ticket');
  const grant=await env.LOGIN_GRANTS.getByName('ticket:'+ticket).consume(origin,await challenge(proof),flow);
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
