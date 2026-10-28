const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
process.env.JWT_SECRET='local-test-secret-only';
let stored=null,verified=0;
const db={connect:async()=>({query:async(sql,args)=>{
 if(sql.includes('FROM email_verification_tokens t'))return {rows:stored&&stored.hash===args[0]?[stored]:[]};
 if(sql.includes('UPDATE users'))verified++;
 if(sql.includes('DELETE FROM email_verification_tokens'))stored=null;
 return {rows:[]};
},release:()=>{}})};
const id=require.resolve('../database/postgres');require.cache[id]={id,filename:id,loaded:true,exports:db};
const service=require('../services/emailVerification');
const raw='a'.repeat(64);
function token(expires){return {id:1,user_id:42,hash:crypto.createHash('sha256').update(raw).digest('hex'),expires_at:new Date(expires).toISOString(),email_verified:0};}
test('an absent/forged verification token cannot activate an account',async()=>{
 stored=token(Date.now()+60000);verified=0;
 assert.deepEqual(await service.verify('short'),{success:false,reason:'invalid'});
 assert.deepEqual(await service.verify('b'.repeat(64)),{success:false,reason:'invalid'});
 assert.equal(verified,0);
});
test('an expired link cannot activate an account',async()=>{
 stored=token(Date.now()-60000);verified=0;
 assert.deepEqual(await service.verify(raw),{success:false,reason:'expired'});assert.equal(verified,0);
});
test('a valid emailed link activates the account once and cannot be replayed',async()=>{
 stored=token(Date.now()+60000);verified=0;
 assert.deepEqual(await service.verify(raw),{success:true,userId:42});assert.equal(verified,1);
 assert.deepEqual(await service.verify(raw),{success:false,reason:'invalid'});assert.equal(verified,1);
});
