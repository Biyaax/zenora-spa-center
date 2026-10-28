const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
process.env.JWT_SECRET='local-test-secret-only';
let existing=null,created=0,mailCalls=0,smtpSent=true,dnsError=null,inserted;
const db={
 query:async(sql)=>{
  if(sql.includes('FROM users'))return {rows:existing?[existing]:[]};
  if(sql.includes('FROM roles'))return {rows:[{id:1}]};
  if(sql.includes('INSERT INTO activity_logs'))return {rows:[]};
  throw new Error('Unexpected pool query: '+sql);
 },
 connect:async()=>({query:async(sql,args)=>{
  if(sql.includes('INSERT INTO users')){created++;inserted=args;return {rows:[{id:42}]};}
  return {rows:[]};
 },release:()=>{}}),
};
function stub(path,exports){const id=require.resolve(path);require.cache[id]={id,filename:id,loaded:true,exports};}
stub('../database/postgres',db);
stub('../services/emailDomain',{requireMailDomain:async()=>{if(dnsError)throw dnsError;}});
stub('../services/emailVerification',{sendForUser:async()=>{mailCalls++;return {sent:smtpSent};}});
const app=express();app.use(express.json());app.use('/api/auth',require('../routes/auth'));
app.use((error,req,res,next)=>res.status(error.status||500).json({message:error.message,details:error.details}));
let server,base;
before(async()=>{server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});base='http://127.0.0.1:'+server.address().port;});
after(()=>new Promise(resolve=>server.close(resolve)));
const valid={firstName:'  María  ',lastName:"O'Neil-Santos",email:' STUDENT+SPA@EXAMPLE.COM ',phone:'+63 917 123 4567',password:' Keep spaces 123 ',confirmPassword:' Keep spaces 123 '};
async function request(body){const r=await fetch(base+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
test('register rejects all invalid field types and malformed bodies before inserting',async()=>{
 for(const body of [{},[],{firstName:123,phone:true}, {...valid,firstName:'123'}, {...valid,phone:'123'}, {...valid,email:'a..b@gmail.com'}, {...valid,password:'        ',confirmPassword:'        '}, {...valid,password:'😀'.repeat(19),confirmPassword:'😀'.repeat(19)}, {...valid,confirmPassword:'wrong'}]){
  const result=await request(body);assert.equal(result.status,400);assert.equal(created,0);
 }
});
test('register normalizes fields, creates a pending account, sends verification and issues no token',async()=>{
 const result=await request(valid);
 assert.equal(result.status,201);assert.equal(result.data.requiresEmailVerification,true);
 assert.equal(result.data.verificationEmailSent,true);assert.equal(result.data.token,undefined);
 assert.equal(result.data.email,'student+spa@example.com');assert.equal(mailCalls,1);
 assert.equal(inserted[1],'María');assert.equal(inserted[5],'09171234567');assert.equal(require('bcryptjs').compareSync(valid.password,inserted[4]),true);
});
test('verified and unverified duplicate emails show field errors without creating a second account',async()=>{
 for(const email_verified of [1,0]){
  existing={id:42,email_verified};const count=created;const result=await request(valid);
  assert.equal(result.status,409);assert.ok(result.data.details.fields.email);assert.equal(created,count);
 }
 existing=null;
});
test('failed domain checks cannot create an account',async()=>{
 const {badRequest}=require('../lib/errors');dnsError=badRequest('Invalid email domain',{fields:{email:'Use a domain that accepts mail.'}});
 const count=created;const result=await request(valid);assert.equal(result.status,400);assert.equal(created,count);dnsError=null;
});
test('SMTP failure leaves the account pending, returns an honest retry message and never issues a token',async()=>{
 smtpSent=false;const result=await request(valid);
 assert.equal(result.status,201);assert.equal(result.data.verificationEmailSent,false);
 assert.equal(result.data.requiresEmailVerification,true);assert.equal(result.data.token,undefined);
 assert.match(result.data.message,/could not be sent/);
});
