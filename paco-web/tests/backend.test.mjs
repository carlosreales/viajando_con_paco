import {test} from 'node:test';import assert from 'node:assert/strict';import {createBackend} from '../src/backend.js';
test('Auth calls provider; verification scopes recovery and signup; reset signs out globally',async()=>{
 const calls=[];const auth={};
 for(const method of ['signInWithPassword','signUp','verifyOtp','resetPasswordForEmail','updateUser','signOut','resend']){
  auth[method]=async params=>{calls.push([method,params]);return {data:{},error:null};};
 }
 const api=createBackend({}, {auth});
 await api.login('a@example.com','password-123');await api.verify('a@example.com','123456','signup');
 await api.verify('a@example.com','123456','recovery');await api.reset('new-password-123');
 assert.equal(calls[0][0],'signInWithPassword');
 assert.equal(calls[1][1].type,'signup');assert.equal(calls[2][1].type,'recovery');
 assert.deepEqual(calls.at(-1),['signOut',{scope:'global'}]);
});
test('Registration refuses unverified auto-login configuration',async()=>{
 let out=false;
 const api=createBackend({}, {auth:{signUp:async()=>({data:{session:{}},error:null}),signOut:async()=>{out=true;return {};}}});
 await assert.rejects(api.register('a@example.com','password-123'),/EMAIL_CONFIRMATION_REQUIRED/);assert.equal(out,true);
});

