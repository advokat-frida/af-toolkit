import {TOOLS,HOME,routeForPath} from '../routes.mjs';
import {accessEndpoint} from './http.mjs';
import {authorize,TOOLKIT,privateResponse,returnURL} from './session.mjs';
const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const publicAsset=path=>['/toolkit.css','/access.css','/access-return.js','/favicon-32.png','/favicon-64.png','/apple-touch-icon.png','/assets/frida-fox-forest.png'].includes(path)||/^\/fonts\/[\w.-]+\.(woff2|txt)$/.test(path)||/^\/licenses\/[\w.-]+$/.test(path);
export function preview(route,reason,requestedTarget){
  const tool=TOOLS[route],title=tool?.title||'AF Toolkit',description=tool?.description||HOME.description;
  const path=tool?'/'+route:'/';
  let target=TOOLKIT+path;
  try{if(requestedTarget)target=returnURL(requestedTarget);}catch{/* Unsafe query data is not carried into sign-in. */}
  const start='/_access/start?return='+encodeURIComponent(target);
  const intro=reason==='unavailable'?'We could not check your subscription. Please try again.':'The Toolkit is included with a free subscription to The Dispatch.';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · AF Toolkit</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${TOOLKIT+path}"><link rel="stylesheet" href="/toolkit.css"><link rel="stylesheet" href="/access.css"><link rel="icon" href="/favicon-32.png"></head><body class="access-preview"><a class="skip-link" href="#main-content">Skip to content</a><header class="access-header"><a href="/" class="access-brand"><img src="/assets/frida-fox-forest.png" width="36" height="36" alt="">AF Toolkit</a><nav aria-label="Advokat Frida"><a href="https://advokatfrida.com/">The Dispatch</a><a href="https://guide.advokatfrida.com/">Survival Guide</a></nav></header><main id="main-content" class="access-main"><h1>${title}</h1><p class="access-description">${escape(description)}</p><section class="access-invitation" aria-label="Subscriber access"><p>${intro}</p><p>Stay subscribed to keep access to the tools and the complete Survival Guide.</p><div class="access-actions"><a data-access-start href="${start}">Continue to ${title}</a></div></section><nav class="access-tools" aria-label="Tools">${Object.entries(TOOLS).map(([id,t])=>`<a class="tool-card" href="/${id}"${id===route?' aria-current="page"':''}><strong>${t.title}</strong><span class="card-desc">${escape(t.description)}</span></a>`).join('')}</nav></main><footer class="access-footer"><a href="https://advokatfrida.com/about/">About</a><a href="https://advokatfrida.com/privacy/">Privacy</a><a href="mailto:hello@advokatfrida.com">Contact</a></footer><script src="/access-return.js" defer></script></body></html>`;
}
function deny(request,status=401){return privateResponse(new Response(request.method==='HEAD'?null:'An active Dispatch subscription is required.',{status,headers:{'Content-Type':'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff'}}));}
export async function gatedFetch(request,env,serve){
  const url=new URL(request.url);
  const endpoint=await accessEndpoint(request,env);if(endpoint)return endpoint;
  if(!['GET','HEAD'].includes(request.method))return deny(request,405);
  if(publicAsset(url.pathname))return env.ASSETS.fetch(request);
  if(url.pathname==='/robots.txt')return new Response(`User-agent: *\nAllow: /\nDisallow: /_access/\nDisallow: /tools/\nSitemap: ${TOOLKIT}/sitemap.xml\n`,{headers:{'Content-Type':'text/plain'}});
  if(url.pathname==='/sitemap.xml')return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['/',...Object.keys(TOOLS).map(id=>'/'+id)].map(path=>`<url><loc>${TOOLKIT+path}</loc></url>`).join('')+'</urlset>',{headers:{'Content-Type':'application/xml'}});
  const permission=await authorize(request.headers.get('cookie'),TOOLKIT,env);
  if(permission.allowed&&permission.expiresAt>Date.now()){
    const clean=new Headers(request.headers);clean.delete('if-none-match');clean.delete('if-modified-since');
    const response=await serve(new Request(request,{headers:clean}),env);
    if(Date.now()>=permission.expiresAt)return deny(request,503);
    return privateResponse(response);
  }
  const route=routeForPath(url.pathname);
  if(!route)return deny(request,permission.reason==='unavailable'?503:401);
  const body=preview(route,permission.reason,TOOLKIT+url.pathname+url.search);
  return privateResponse(new Response(request.method==='HEAD'?null:body,{headers:{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"}}));
}
