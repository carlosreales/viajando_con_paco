import {test} from 'node:test';import assert from 'node:assert/strict';
import {configFrom,publicConfig} from '../lib/config.mjs';
test('config fails closed and never exposes server secret',()=>{
 assert.equal(configFrom({}).ready,false);
 const c=configFrom({SUPABASE_URL:'https://project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_example',SUPABASE_SERVICE_ROLE_KEY:'secret'});
 assert.equal(c.ready,true);assert.equal(JSON.stringify(publicConfig(c)).includes('secret'),false);
 assert.equal(publicConfig(c).photosEnabled,true);
});
test('rejects secret used as public key, arbitrary upstream and remote HTTP origin',()=>{
 for(const env of [
 {SUPABASE_PUBLISHABLE_KEY:'sb_secret_nope'},
 {SUPABASE_URL:'http://project.supabase.co'},
 {SUPABASE_URL:'https://attacker.test'},
 {APP_ORIGIN:'http://public.test'},
 {HOST:'public.test'},
 {PORT:'-1'}
 ])assert.throws(()=>configFrom(env));
});
test('accepts the Hostinger bind address and platform-assigned port',()=>{
 const config=configFrom({HOST:'0.0.0.0',PORT:'8080',APP_ORIGIN:'https://paco.example.com'});
 assert.equal(config.host,'0.0.0.0');assert.equal(config.port,8080);
});
test('uses Hostinger’s production port when PORT is not configured',()=>{
 assert.equal(configFrom({NODE_ENV:'production'}).port,3000);
 assert.equal(configFrom({}).port,4174);
});

