export const PERMISSION_MS=60_000;
export function subscribedToDispatch(member,newsletterId){
  return member?.subscribed===true&&Array.isArray(member.newsletters)&&member.newsletters.some(n=>n.id===newsletterId&&n.status==='active');
}
// Backed by synchronous SQLite in the Durable Object. Revision fences make an
// invalidation arriving during external I/O win over that in-flight response.
export class PermissionCache{
  constructor(store,now=Date.now){this.store=store;this.now=now;this.pending=null;}
  invalidate(){const state=this.store.read();this.store.write({revision:state.revision+1,allowed:false,until:0});}
  async check(refresh){
    const state=this.store.read(),started=this.now();
    if(state.until>started)return {allowed:state.allowed,expiresAt:state.until};
    if(this.pending)return this.pending;
    this.pending=(async()=>{
      let allowed;
      try{allowed=await refresh();}catch{return {allowed:false,reason:'unavailable'};}
      if(this.store.read().revision!==state.revision)return {allowed:false,reason:'changed'};
      const until=started+PERMISSION_MS;
      if(until<=this.now())return {allowed:false,reason:'expired'};
      this.store.write({revision:state.revision,allowed:allowed===true,until});
      return {allowed:allowed===true,expiresAt:until};
    })();
    try{return await this.pending;}finally{this.pending=null;}
  }
}
