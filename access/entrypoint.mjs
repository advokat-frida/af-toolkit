import {DurableObject,WorkerEntrypoint} from 'cloudflare:workers';
import worker from '../worker.mjs';
import {PermissionCache,subscribedToDispatch} from './permissions.mjs';
import {memberById,MEMBER_ID} from './ghost.mjs';
import {authorize,completeTicket} from './session.mjs';
import {gatedFetch} from './gate.mjs';
import {accessEndpoint} from './http.mjs';

export class DispatchMember extends DurableObject{
  constructor(ctx,env){
    super(ctx,env);
    this.sql=ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS permission (id INTEGER PRIMARY KEY, revision INTEGER, allowed INTEGER, until INTEGER)');
    this.cache=new PermissionCache({
      read:()=>{const row=this.sql.exec('SELECT revision, allowed, until FROM permission WHERE id=1').toArray()[0];return row?{...row,allowed:row.allowed===1}:{revision:0,allowed:false,until:0};},
      write:state=>this.sql.exec('INSERT OR REPLACE INTO permission VALUES (1,?,?,?)',state.revision,state.allowed?1:0,state.until)
    });
  }
  async authorize(id){
    if(!MEMBER_ID.test(id)||!MEMBER_ID.test(this.env.DISPATCH_NEWSLETTER_ID||''))return {allowed:false};
    await this.ctx.storage.setAlarm(Date.now()+24*60*60*1000);
    return this.cache.check(async()=>subscribedToDispatch(await memberById(this.env,id),this.env.DISPATCH_NEWSLETTER_ID));
  }
  async invalidate(){this.cache.invalidate();await this.ctx.storage.setAlarm(Date.now()+24*60*60*1000);}
  alarm(){this.sql.exec('DELETE FROM permission');}
}

export class LoginGrant extends DurableObject{
  constructor(ctx,env){super(ctx,env);this.sql=ctx.storage.sql;this.sql.exec('CREATE TABLE IF NOT EXISTS grant_state (id INTEGER PRIMARY KEY, data TEXT, expires INTEGER)');}
  async claim(expires){
    if(expires<=Date.now()||expires>Date.now()+600_000)return false;
    const rows=this.sql.exec('INSERT OR IGNORE INTO grant_state VALUES (1,?,?) RETURNING id','used',expires).toArray();
    if(!rows.length)return false;
    await this.ctx.storage.setAlarm(expires+1000);return true;
  }
  async issue(grant){
    if(!MEMBER_ID.test(grant.member)||grant.expires<=Date.now()||grant.expires>Date.now()+60_000)throw Error('Invalid grant');
    this.sql.exec('INSERT INTO grant_state VALUES (1,?,?)',JSON.stringify(grant),grant.expires);
    await this.ctx.storage.setAlarm(grant.expires+1000);
  }
  consume(origin,proofHash){
    const row=this.sql.exec('SELECT data, expires FROM grant_state WHERE id=1').toArray()[0];
    if(!row||row.expires<=Date.now()||row.data==='used')return null;
    const grant=JSON.parse(row.data);
    if(new URL(grant.target).origin!==origin||grant.proofHash!==proofHash)return null;
    this.sql.exec('UPDATE grant_state SET data=? WHERE id=1','used');return grant;
  }
  alarm(){this.sql.exec('DELETE FROM grant_state');}
}

// Private service binding only. No member identity or admin API is exposed over HTTP.
export class DispatchAccess extends WorkerEntrypoint{
  authorize(cookie,origin){return ['gated','setup'].includes(this.env.ACCESS_MODE)?authorize(cookie,origin,this.env):{allowed:false};}
  complete(ticket,origin,proof){if(!['gated','setup'].includes(this.env.ACCESS_MODE))throw Error('Gate disabled');return completeTicket(ticket,origin,proof,this.env);}
}
export default {async fetch(request,env){
  if(env.ACCESS_MODE==='public')return worker.fetch(request,env);
  // An explicit release setup mode exercises native sign-in and webhooks while
  // keeping application access public. It never activates the subscriber gate.
  if(env.ACCESS_MODE==='setup')return await accessEndpoint(request,env)||worker.fetch(request,env);
  if(env.ACCESS_MODE!=='gated')return new Response('Access configuration unavailable',{status:503,headers:{'Cache-Control':'no-store'}});
  return gatedFetch(request,env,worker.fetch);
}};
