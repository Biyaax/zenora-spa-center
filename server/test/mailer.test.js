const test=require('node:test');
const assert=require('node:assert/strict');
const id=require.resolve('../config');require.cache[id]={id,filename:id,loaded:true,exports:{smtp:{host:''}}};
const {sendMail}=require('../lib/mailer');
test('missing SMTP is reported as unsent and verification URLs are not printed',async()=>{
 const messages=[],warn=console.warn,log=console.log;
 console.warn=(...args)=>messages.push(args.join(' '));console.log=(...args)=>messages.push(args.join(' '));
 try{
  const result=await sendMail({to:'a@example.com',subject:'Verify',text:'https://example.com/verify-email?token=secret-test-token'});
  assert.equal(result.sent,false);assert.equal(messages.some(m=>m.includes('secret-test-token')),false);
 }finally{console.warn=warn;console.log=log;}
});
