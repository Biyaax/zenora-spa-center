const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const bcrypt = require('bcryptjs');
process.env.JWT_SECRET = 'local-test-secret-only';
let row;
const password = ' Existing password ';
const hash = bcrypt.hashSync(password, 4);
const db = {query:async (sql) => ({rows:sql.includes('FROM users') && row ? [row] : []})};
require.cache[require.resolve('../database/postgres')] = {id:require.resolve('../database/postgres'),filename:require.resolve('../database/postgres'),loaded:true,exports:db};
const app = express();
app.use(express.json());
app.use('/api/auth',require('../routes/auth'));
app.use((error,req,res,next) => res.status(error.status || 500).json({message:error.message,details:error.details}));
let server, base;
before(async () => {
  server = await new Promise((resolve) => { const s=app.listen(0,'127.0.0.1',() => resolve(s)); });
  base='http://127.0.0.1:'+server.address().port;
});
after(() => new Promise((resolve) => server.close(resolve)));
function user(role='Receptionist', active=1) { return {id:1,role,is_active:active,email_verified:1,email:'staff@example.com',password_hash:hash,first_name:'Test',last_name:'Staff'}; }
async function request(body,path='/api/auth/staff/login') {
  const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  return {status:response.status,data:await response.json()};
}
test('staff endpoint returns validation errors for missing/invalid fields',async () => {
  const result=await request({email:'bad',password:' '});
  assert.equal(result.status,400);
  assert.ok(result.data.details.fields.email);
  assert.ok(result.data.details.fields.password);
});
test('all supported staff roles can sign in and password spaces are preserved',async () => {
  for (const role of ['Spa Manager','Receptionist','Massage Therapist']) {
    row=user(role);
    const result=await request({email:' STAFF@EXAMPLE.COM ',password});
    assert.equal(result.status,200);
    assert.ok(result.data.token);
    assert.equal(result.data.user.role,role);
    assert.equal(result.data.user.password_hash,undefined);
  }
});
test('guest, inactive, missing and wrong-password accounts get the same generic rejection and no token',async () => {
  for (const fixture of [user('Guest'),user('Receptionist',0),null,user()]) {
    row=fixture;
    const result=await request({email:'staff@example.com',password:fixture?.role==='Guest' || !fixture?.is_active ? password : 'wrong'});
    assert.equal(result.status,401);
    assert.equal(result.data.message,'Incorrect email or password.');
    assert.equal(result.data.token,undefined);
  }
});
test('existing guest login endpoint still accepts guest accounts',async () => {
  row=user('Guest');
  const result=await request({email:'staff@example.com',password},'/api/auth/login');
  assert.equal(result.status,200);
  assert.equal(result.data.user.role,'Guest');
});
test('unverified accounts receive no JWT on staff or existing shared login',async () => {
  row={...user(),email_verified:0};
  for (const path of ['/api/auth/staff/login','/api/auth/login']) {
    const result=await request({email:'staff@example.com',password},path);
    assert.equal(result.status,403);
    assert.match(result.data.message,/verify your email/i);
    assert.equal(result.data.token,undefined);
  }
});
test('existing guessing brake blocks the ninth failed attempt',async () => {
  row=null;
  for(let i=0;i<8;i++) assert.equal((await request({email:'locked@example.com',password:'wrong'})).status,401);
  assert.equal((await request({email:'locked@example.com',password:'wrong'})).status,429);
});
