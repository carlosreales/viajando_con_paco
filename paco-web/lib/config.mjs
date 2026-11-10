export function configFrom(env){
 const port=Number(env.PORT||4174);
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('INVALID_PORT');
 const host=env.HOST||'127.0.0.1';
 if(!['127.0.0.1','localhost','0.0.0.0'].includes(host))throw Error('INVALID_HOST');
 const origin=env.APP_ORIGIN||'http://127.0.0.1:'+port;
 const app=new URL(origin);
 if(app.origin!==origin||!['http:','https:'].includes(app.protocol))throw Error('INVALID_ORIGIN');
 if(app.protocol==='http:'&&!['127.0.0.1','localhost'].includes(app.hostname))throw Error('HTTPS_REQUIRED');
 const url=env.SUPABASE_URL||'',key=env.SUPABASE_PUBLISHABLE_KEY||'';
 if(url){const u=new URL(url);if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co')||u.pathname!=='/'||u.search||u.username||u.password)throw Error('INVALID_SUPABASE_URL');}
 if(key&&!key.startsWith('sb_publishable_')){
  try{const claims=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString());if(claims.role!=='anon')throw Error();}catch{throw Error('PUBLIC_KEY_MUST_BE_ANON');}
 }
 return {port,host,origin,url,key,serviceKey:env.SUPABASE_SERVICE_ROLE_KEY||'',ready:!!(url&&key)};
}
export function publicConfig(config){return {configured:config.ready,url:config.ready?config.url:'',publishableKey:config.ready?config.key:'',origin:config.origin,photosEnabled:config.ready&&!!config.serviceKey};}

