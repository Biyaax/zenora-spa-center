const test=require('node:test');
const assert=require('node:assert/strict');
const {requireMailDomain}=require('../services/emailDomain');
const missing=()=>Promise.reject(Object.assign(new Error('No record'),{code:'ENODATA'}));
function resolver(mx){return {resolveMx:mx,resolve4:missing,resolve6:missing};}
test('MX-capable domains are accepted without a mailbox-existence claim',async()=>{
 let domain;
 await requireMailDomain('not-proven@example.com',resolver(async d=>{domain=d;return [{exchange:'mail.example.com',priority:10}];}));
 assert.equal(domain,'example.com');
});
test('null MX explicitly rejects a no-mail domain without IP fallback',async()=>{
 for(const exchange of ['.','']){
  const r=resolver(async()=>[{exchange,priority:0}]);r.resolve4=()=>{throw new Error('Fallback must not run');};
  await assert.rejects(requireMailDomain('a@example.com',r),{status:400});
 }
});
test('no MX falls back to A/AAAA records, including IPv6-only mail domains',async()=>{
 for(const family of ['resolve4','resolve6']){
  const r=resolver(missing);r[family]=async()=>[family==='resolve4'?'192.0.2.1':'2001:db8::1'];
  await requireMailDomain('a@example.com',r);
 }
});
test('nonexistent/no-record domains are rejected with an email field error',async()=>{
 const r=resolver(async()=>{throw Object.assign(new Error('NXDOMAIN'),{code:'ENOTFOUND'});});
 await assert.rejects(requireMailDomain('a@invalid.invalid',r),e=>e.status===400 && Boolean(e.details.fields.email));
 await assert.rejects(requireMailDomain('a@example.com',resolver(missing)),{status:400});
});
test('temporary DNS failure returns retryable 503 instead of declaring the email fake',async()=>{
 const timeout=async()=>{throw Object.assign(new Error('Timeout'),{code:'ETIMEOUT'});};
 await assert.rejects(requireMailDomain('a@example.com',resolver(timeout)),{status:503});
 const r=resolver(missing);r.resolve6=timeout;
 await assert.rejects(requireMailDomain('a@example.com',r),{status:503});
});
