import test from 'node:test';
import assert from 'node:assert/strict';
import { nameError, registrationEmailError, normalizePhPhone, phoneError, passwordError, validateRegistration } from '../src/utils/registrationValidation.js';
const valid={firstName:'María',lastName:"Dela Cruz-Santos",email:'student+spa@gmail.com',phone:'+63 917 123 4567',password:'My pass 123',confirmPassword:'My pass 123'};
test('registration names allow accents, initials, hyphens and apostrophes, and reject numbers/HTML/blank',()=>{
 for(const name of ['Ñina','José','O’Connor',"O'Neil",'Dela Cruz','Anne-Marie','J.','李'])assert.equal(nameError(name,'Name'),'');
 for(const name of ['   ','123','A12','<script>','---','A\0B','a'.repeat(81)])assert.ok(nameError(name,'Name'));
});
test('email syntax accepts plus aliases and rejects malformed mailbox/domain boundaries',()=>{
 for(const value of ['student+spa@gmail.com',"student.name@gmail.com",' USER@GMAIL.COM '])assert.equal(registrationEmailError(value),'');
 for(const value of ['a@example.com','a@googlemail.com','a@gmail.com.fake','a..b@gmail.com','.a@gmail.com','a.@gmail.com','a@-gmail.com','a@gmail..com','a@gmail','a@b.1','a'.repeat(65)+'@gmail.com','<a>@gmail.com'])assert.ok(registrationEmailError(value),value);
});
test('Philippine mobile numbers accept common local/international formatting and normalize',()=>{
 for(const value of ['09171234567','+639171234567','639171234567','+63 917 123 4567','0917-123-4567']){
  assert.equal(phoneError(value),'');assert.equal(normalizePhPhone(value),'09171234567');
 }
 for(const value of ['0917','12345678901','08171234567','091712345678','0917abc4567','+1 202 555 0123'])assert.ok(phoneError(value));
});
test('new passwords reject spaces-only, short, NUL and bcrypt-truncating Unicode values',()=>{
 assert.equal(passwordError(' Existing pass '),'');
 assert.equal(passwordError('a'.repeat(72)),'');
 for(const value of ['        ','1234567','a'.repeat(73),'😀'.repeat(19),'abc\0defghi'])assert.ok(passwordError(value));
});
test('registration validates all six fields and exact password confirmation',()=>{
 assert.deepEqual(validateRegistration(valid),{});
 assert.equal(Object.keys(validateRegistration({})).length,6);
 assert.ok(validateRegistration({...valid,confirmPassword:'different'}).confirmPassword);
 assert.ok(validateRegistration({...valid,confirmPassword:'My pass 123 '}).confirmPassword);
});
