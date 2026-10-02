const encoder=new TextEncoder();
const text=bytes=>new TextDecoder('utf-8',{fatal:true}).decode(bytes);
export const encode=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
export function decode(value){
  if(!/^[\w-]+$/.test(value))throw Error('Invalid encoding');
  return Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
}
const json=value=>encode(encoder.encode(JSON.stringify(value)));
export const nonce=()=>encode(crypto.getRandomValues(new Uint8Array(32)));
export const challenge=async value=>encode(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
async function hmacKey(secret,usage){
  if(typeof secret!=='string'||secret.length<32)throw Error('Missing signing secret');
  return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,[usage]);
}
export async function sign(payload,secret){
  const data=json({alg:'HS256',typ:'JWT'})+'.'+json(payload);
  return data+'.'+encode(await crypto.subtle.sign('HMAC',await hmacKey(secret,'sign'),encoder.encode(data)));
}
export async function verify(token,secret,purpose,now=Date.now()){
  if(typeof token!=='string'||token.length>4096)throw Error('Invalid token');
  const parts=token.split('.');if(parts.length!==3)throw Error('Invalid token');
  const header=JSON.parse(text(decode(parts[0])));
  if(header.alg!=='HS256'||header.typ!=='JWT')throw Error('Invalid algorithm');
  if(!await crypto.subtle.verify('HMAC',await hmacKey(secret,'verify'),decode(parts[2]),encoder.encode(parts[0]+'.'+parts[1])))throw Error('Invalid signature');
  const payload=JSON.parse(text(decode(parts[1])));
  if(payload.purpose!==purpose||!Number.isSafeInteger(payload.exp)||payload.exp<=now/1000)throw Error('Expired or wrong-purpose token');
  return payload;
}
export async function verifyIdentity(token,jwks,now=Date.now()){
  if(typeof token!=='string'||token.length>8192)throw Error('Invalid identity');
  const parts=token.split('.');if(parts.length!==3)throw Error('Invalid identity');
  const header=JSON.parse(text(decode(parts[0]))),claims=JSON.parse(text(decode(parts[1])));
  if(header.alg!=='RS512'||typeof header.kid!=='string'||header.crit)throw Error('Invalid identity algorithm');
  const jwk=jwks.keys?.find(key=>key.kid===header.kid&&key.kty==='RSA'&&(!key.use||key.use==='sig'));
  if(!jwk||decode(jwk.n).length<256)throw Error('Unknown or weak identity key');
  const key=await crypto.subtle.importKey('jwk',{...jwk,alg:'RS512'},{name:'RSASSA-PKCS1-v1_5',hash:'SHA-512'},false,['verify']);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),encoder.encode(parts[0]+'.'+parts[1])))throw Error('Invalid identity signature');
  // Ghost MembersConfigProvider.getTokenIssuer(), not the publication root.
  // Ghost's token-service tests assert /members/api without a trailing slash.
  const issuer='https://advokatfrida.com/members/api';
  if(claims.iss!==issuer||claims.aud!==issuer||claims.scope!=='members:identity'||!Number.isSafeInteger(claims.exp)||claims.exp<=now/1000||!Number.isSafeInteger(claims.iat)||claims.iat>now/1000+30||claims.exp-claims.iat>600||claims.nbf>now/1000)throw Error('Invalid identity claims');
  if(typeof claims.sub!=='string'||claims.sub.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(claims.sub)||/[\x00-\x1f\x7f]/.test(claims.sub))throw Error('Invalid member subject');
  return claims.sub;
}
export async function verifyWebhook(body,header,secret,now=Date.now()){
  const match=/^sha256=([a-f0-9]{64}),\s*t=(\d{13})$/.exec(header||'');
  if(!match||Math.abs(now-Number(match[2]))>300_000)return false;
  const signature=Uint8Array.from(match[1].match(/../g),hex=>parseInt(hex,16));
  return crypto.subtle.verify('HMAC',await hmacKey(secret,'verify'),signature,encoder.encode(body+match[2]));
}
