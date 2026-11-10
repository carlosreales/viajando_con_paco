import {test} from 'node:test';import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';import {configFrom} from '../lib/config.mjs';
test('HTTP configuration safe, uploads fail closed, no env file served',async()=>{
 const config=configFrom({HOST:'0.0.0.0'});const server=createServer(config);await new Promise(resolve=>server.listen(0,config.host,resolve));
 const url='http://127.0.0.1:'+server.address().port;
 try{
  const health=await fetch(url+'/api/health');assert.equal(health.status,200);assert.deepEqual(await health.json(),{status:'ok'});
  const config=await fetch(url+'/api/config');assert.equal(config.status,200);assert.equal((await config.json()).configured,false);
  const upload=await fetch(url+'/api/photos',{method:'POST'});assert.equal(upload.status,503);
  const secret=await fetch(url+'/.env');assert.equal(secret.status,404);
  assert.match(config.headers.get('content-security-policy'),/object-src 'none'/);
  const post=await fetch(url+'/api/config',{method:'POST'});assert.equal(post.status,405);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});

