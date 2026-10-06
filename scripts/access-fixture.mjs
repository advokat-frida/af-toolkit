import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {build} from 'esbuild';
import {readFileSync} from 'node:fs';
import {readFile,stat} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHmac} from 'node:crypto';
export const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const TOOLKIT='https://toolkit.advokatfrida.com',GUIDE='https://guide.advokatfrida.com';
export const memberId='0123456789abcdef01234567';
const newsletter='6a2b163946abeb0008d5380b';
const secret='synthetic-fixture-only-never-use-this-secret-in-production';
// An asset binding fixture uses real built bytes. The real static-assets router
// is also exercised by the separate Wrangler/browser smoke check.
function assets(directory){return async request=>{
  try{
    let file=resolve(directory,'.'+decodeURIComponent(new URL(request.url).pathname));
    if(!file.startsWith(directory+sep)&&file!==directory)return new Response(null,{status:403});
    try{if((await stat(file)).isDirectory())file=resolve(file,'index.html');}catch{if(!extname(file))file+='.html';}
    const body=await readFile(file);
    const type={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2','.json':'application/json'}[extname(file)]||'text/plain';
    return new Response(request.method==='HEAD'?null:body,{headers:{'Content-Type':type,ETag:'fixture-asset','Cache-Control':'public, max-age=3600'}});
  }catch{return new Response('Not found',{status:404});}
};}
// Pass null for standalone Toolkit tests. Shared checks require the real Guide.
export async function createHarness(guideRoot=resolve(root,'../af-survival-guide'),{mode='gated',guideMode='gated',identityBits=2048}={}){
  const fixture={subscribed:true,unavailable:false,ghostCalls:0};
  const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:identityBits,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-512'},true,['sign','verify']);
  const jwk={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'synthetic-identity',use:'sig'};
  const bundle=async entry=>(await build({entryPoints:[entry],bundle:true,write:false,format:'esm',platform:'neutral',external:['cloudflare:workers']})).outputFiles[0].text;
  async function ghost(request){
    const url=new URL(request.url);
    if(url.href==='https://advokatfrida.com/members/.well-known/jwks.json')return Response.json({keys:[jwk]});
    if(url.origin==='https://advokat-frida.ghost.io'&&url.pathname.startsWith('/ghost/api/admin/members/')){
      fixture.ghostCalls++;
      if(fixture.unavailable)return new Response('Synthetic outage',{status:503});
      return Response.json({members:[{id:memberId,email:'reader@example.test',subscribed:fixture.subscribed,newsletters:fixture.subscribed?[{id:newsletter,status:'active'}]:[]}]});
    }
    throw Error('Unexpected external request blocked in fixture: '+url.origin+url.pathname);
  }
  const common={modules:true,compatibilityDate:'2026-09-30'};
  const toolkit={...common,name:'toolkit',routes:['toolkit.advokatfrida.com/*','advokatfrida.com/*','evil.test/*'],script:await bundle(resolve(root,'access/entrypoint.mjs')),
    bindings:{ACCESS_MODE:mode,SESSION_SECRET:secret,GHOST_WEBHOOK_SECRET:secret,GHOST_ADMIN_ORIGIN:'https://advokat-frida.ghost.io',GHOST_ADMIN_API_KEY:'1234567890abcdef12345678:'+('11'.repeat(32)),DISPATCH_NEWSLETTER_ID:newsletter},
    serviceBindings:{ASSETS:assets(resolve(root,'public'))},
    durableObjects:{DISPATCH_MEMBERS:{className:'DispatchMember',useSQLite:true},LOGIN_GRANTS:{className:'LoginGrant',useSQLite:true}},
    ratelimits:{ACCESS_LIMITER:{namespace_id:'1001',simple:{limit:20,period:60}}},outboundService:ghost};
  const guide=guideRoot?{...common,name:'guide',script:await bundle(resolve(guideRoot,guideMode==='public'?'worker.mjs':'worker.gated.mjs')),bindings:{ACCESS_MODE:guideMode},serviceBindings:{ASSETS:assets(resolve(guideRoot,'dist')),DISPATCH_ACCESS:{name:'toolkit',entrypoint:'DispatchAccess'}},outboundService:ghost}:null;
  const mf=new Miniflare(convertV4MiniflareOptions({workers:guide?[toolkit,guide]:[toolkit],cf:false,logRequests:false}));
  await mf.ready;
  const toolkitWorker=await mf.getWorker('toolkit'),guideWorker=guide?await mf.getWorker('guide'):null;
  const request=(site,path,options={})=>{
    const worker=site===TOOLKIT?toolkitWorker:guideWorker;
    if(!worker)throw Error('Guide was not included in this test harness');
    return worker.fetch(new URL(path,site),{...options,redirect:'manual'});
  };
  async function identity(changes={}){
    const b64=value=>Buffer.from(JSON.stringify(value)).toString('base64url'),seconds=Math.floor(Date.now()/1000);
    const input=b64({alg:'RS512',kid:jwk.kid})+'.'+b64({sub:'reader@example.test',iss:'https://advokatfrida.com/members/api',aud:'https://advokatfrida.com/members/api',scope:'members:identity',iat:seconds,exp:seconds+600,...changes});
    return input+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(input))).toString('base64url');
  }
  function webhook(id=memberId){const body=JSON.stringify({member:{current:{id}}}),time=Date.now();return {body,headers:{'X-Ghost-Signature':`sha256=${createHmac('sha256',secret).update(body+time).digest('hex')}, t=${time}`,'Content-Type':'application/json'}};}
  return {mf,request,identity,webhook,fixture,toolkitWorker,guideWorker,guideRoot,privateArt:guideRoot?JSON.parse(readFileSync(resolve(guideRoot,'content/catalog.json'))).items.find(item=>!JSON.parse(readFileSync(resolve(guideRoot,'content/public-previews.json'))).ids.includes(item.id)&&item.file!=='7b35f782acb0ad6cbd4069b56ad830be4c19f869.png').file:null};
}
