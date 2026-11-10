import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {configFrom,publicConfig} from './lib/config.mjs';
import {PhotoError,normalizePhoto,readLimited,validId,MAX_FILE} from './lib/photos.mjs';
const root=fileURLToPath(new URL('./dist',import.meta.url));
export function createServer(config){
 const opts={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
 const admin=config.ready&&config.serviceKey?createClient(config.url,config.serviceKey,opts):null;
 const recent=new Map();let active=0;
 return http.createServer(async(req,res)=>{
  const connect=config.ready?config.url:'';
  res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self' https://esm.sh; style-src 'self'; img-src 'self' blob: ${connect}; connect-src 'self' ${connect} https://esm.sh; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; form-action 'self'`);
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(body));};
  try{
   const url=new URL(req.url,config.origin);
   if(url.pathname==='/api/health'&&req.method==='GET')return send(200,{status:'ok'});
   if(url.pathname==='/api/config'&&req.method==='GET')return send(200,publicConfig(config));
   if(url.pathname==='/api/photos'&&req.method==='POST'){
    if(!admin)return send(503,{error:'PHOTOS_NOT_CONFIGURED'});
    if(req.headers.origin!==config.origin)return send(403,{error:'ORIGIN_NOT_ALLOWED'});
    if(Number(req.headers['content-length']||0)>MAX_FILE)return send(413,{error:'PHOTO_TOO_LARGE'});
    const token=/^Bearer (.+)$/.exec(req.headers.authorization||'')?.[1];
    if(!token||token.length>8192)return send(401,{error:'UNAUTHENTICATED'});
    const client=createClient(config.url,config.key,{...opts,global:{headers:{Authorization:'Bearer '+token}}});
    const {data:auth,error:authError}=await client.auth.getUser(token);
    if(authError||!auth.user)return send(401,{error:'UNAUTHENTICATED'});
    const id=url.searchParams.get('id'),kind=url.searchParams.get('kind');
    if(!validId(id)||!['pet','memory'].includes(kind))return send(400,{error:'INVALID_INPUT'});
    const table=kind==='pet'?'paco_pets':'paco_memories';
    const {data:record,error:recordError}=await client.from(table).select('*').eq('id',id).single();
    if(recordError||!record||record.owner_id!==auth.user.id)return send(404,{error:'NOT_FOUND'});
    const now=Date.now();for(const [key,times]of recent)if(!times.some(t=>now-t<60000))recent.delete(key);
    const times=(recent.get(auth.user.id)||[]).filter(t=>now-t<60000);
    if(times.length>=10||active>=2)return send(429,{error:'TRY_LATER'});
    recent.set(auth.user.id,[...times,now]);active++;
    try{
     const bytes=await normalizePhoto(await readLimited(req));
     const petId=kind==='pet'?id:record.pet_id;
     const photoPath=auth.user.id+'/'+petId+'/'+randomUUID()+'.jpg';
     const {error:uploadError}=await admin.storage.from('paco-photos').upload(photoPath,bytes,{contentType:'image/jpeg',upsert:false});
     if(uploadError)return send(502,{error:'PHOTO_UPLOAD_FAILED'});
     // The owner was authenticated and authorized above; scope service writes to that same owner.
     const {data:updated,error:updateError}=await admin.from(table).update({photo_path:photoPath}).eq('id',id).eq('owner_id',auth.user.id).select('id').single();
     if(updateError||!updated){await admin.storage.from('paco-photos').remove([photoPath]);return send(502,{error:'PHOTO_LINK_FAILED'});}
     if(record.photo_path){const {error:cleanup}=await admin.storage.from('paco-photos').remove([record.photo_path]);if(cleanup)console.warn('PHOTO_CLEANUP_PENDING');}
     return send(200,{photo_path:photoPath});
    }finally{active--;}
   }
   if(!['GET','HEAD'].includes(req.method))return send(405,{error:'METHOD_NOT_ALLOWED'});
   const name=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname).slice(1);
   const target=path.resolve(root,name);
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
   if(!target.startsWith(root+path.sep)||!types[path.extname(target)])return send(404,{error:'NOT_FOUND'});
   const bytes=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]});res.end(req.method==='HEAD'?undefined:bytes);
  }catch(error){
   if(error instanceof PhotoError)return send(error.status,{error:error.code});
   if(error.code==='ENOENT')return send(404,{error:'NOT_FOUND'});
   console.warn('REQUEST_FAILED');if(!res.headersSent)send(500,{error:'SERVER_ERROR'});else res.end();
  }
 });
}
export function startServer(env=process.env){
 const config=configFrom(env),server=createServer(config);
 server.requestTimeout=30000;server.headersTimeout=15000;
 server.on('error',error=>console.error('SERVER_LISTEN_FAILED',error.code||'UNKNOWN'));
 server.listen(config.port,config.host,()=>console.log('Paco: '+config.origin+' — '+(config.ready?'Supabase configurado':'Pendiente de configuración')));
 return server;
}
if(!process.env.NODE_TEST_CONTEXT){
 try{startServer();}
 catch{console.error('Configuración inválida. Revisa .env y CONFIGURAR.md.');process.exitCode=1;}
}

