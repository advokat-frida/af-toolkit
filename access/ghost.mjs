import {encode,verifyIdentity} from './crypto.mjs';
export const MEMBER_ID=/^[a-f0-9]{24}$/;
export async function boundedText(response,limit){
  if(Number(response.headers.get('content-length'))>limit)throw Error('Body too large');
  if(!response.body)return '';
  const reader=response.body.getReader();let size=0;const chunks=[];
  try{
    for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw Error('Body too large');chunks.push(value);}
  }catch(error){await reader.cancel();throw error;}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
async function adminToken(secret){
  const [id,hex]=String(secret).split(':');
  if(!MEMBER_ID.test(id)||!/^([a-f0-9]{2}){32,}$/i.test(hex||''))throw Error('Missing Ghost credential');
  const seconds=Math.floor(Date.now()/1000),bytes=Uint8Array.from(hex.match(/../g),x=>parseInt(x,16));
  const json=value=>encode(new TextEncoder().encode(JSON.stringify(value)));
  const input=json({alg:'HS256',typ:'JWT',kid:id})+'.'+json({iat:seconds,exp:seconds+300,aud:'/admin/'});
  const key=await crypto.subtle.importKey('raw',bytes,{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return input+'.'+encode(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(input)));
}
async function admin(env,path,fetcher=fetch){
  const base=env.GHOST_ADMIN_ORIGIN;
  if(!['https://advokat-frida.ghost.io','https://advokatfrida.com'].includes(base))throw Error('Invalid Ghost admin origin');
  const response=await fetcher(base+'/ghost/api/admin'+path,{headers:{Authorization:'Ghost '+await adminToken(env.GHOST_ADMIN_API_KEY),'Accept-Version':'v6.0'},redirect:'manual',signal:AbortSignal.timeout(5000)});
  if(response.status===404)return null;
  if(!response.ok)throw Error('Ghost unavailable');
  return JSON.parse(await boundedText(response,256*1024));
}
export async function memberById(env,id,fetcher){
  if(!MEMBER_ID.test(id))throw Error('Invalid member');
  const data=await admin(env,`/members/${id}/?include=newsletters`,fetcher);
  const member=data?.members?.[0];
  return member?.id===id?member:null;
}
export async function memberByEmail(env,email,fetcher){
  const quoted=email.replaceAll('\\','\\\\').replaceAll("'","\\'");
  const query=new URLSearchParams({filter:`email:'${quoted}'`,include:'newsletters',limit:'2'});
  const data=await admin(env,'/members/?'+query,fetcher);
  if(data?.members?.length!==1)throw Error('Member not found');
  const member=data.members[0];
  if(!MEMBER_ID.test(member.id)||member.email?.toLowerCase()!==email.toLowerCase())throw Error('Member mismatch');
  return member;
}
let keys=null,keysUntil=0;
export async function ghostIdentity(token,fetcher=fetch){
  if(!keys||Date.now()>=keysUntil){
    try{
      const response=await fetcher('https://advokatfrida.com/members/.well-known/jwks.json',{redirect:'manual',signal:AbortSignal.timeout(5000)});
      if(!response.ok)throw Error('Identity keys unavailable');
      const current=JSON.parse(await boundedText(response,64*1024));
      if(!Array.isArray(current.keys))throw Error('Identity keys unavailable');
      keys=current;keysUntil=Date.now()+300_000;
    }catch{throw Error('Identity keys unavailable');}
  }
  try{return await verifyIdentity(token,keys);}catch(error){keysUntil=0;throw error;}
}
