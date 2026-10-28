const test = require('node:test');
const assert = require('node:assert/strict');
const v = require('../lib/validate');

test('IDs reject coercible non-identifiers and out-of-range integers', () => {
  for (const input of [true, false, [], [1], {}, '0x10', '1e2', '1.0', ' ', null, 0, -1, 1.2, Infinity, 2147483648]) {
    assert.throws(() => v.id(input, 'Service'), {status:400});
  }
  assert.equal(v.id('123', 'Service'), 123);
  assert.equal(v.id(123, 'Service'), 123);
  assert.equal(v.optionalId('', 'Therapist'), null);
});
test('login validates types, normalizes email, and preserves password bytes', () => {
  for (const input of [undefined, null, [], 'text']) assert.throws(() => v.loginFields(input), {status:400});
  assert.throws(() => v.loginFields({email: {}, password: []}), {status:400});
  assert.throws(() => v.loginFields({email: ' ', password: '   '}), (e) => Boolean(e.details.fields.email && e.details.fields.password));
  assert.deepEqual(v.loginFields({email:'  STAFF@EXAMPLE.COM ', password:' pass '}), {email:'staff@example.com', password:' pass '});
  assert.throws(() => v.loginFields({email:'a@b.com',password:'a'.repeat(4097)}), {status:400});
});
test('special request rejects oversized values, non-text and PostgreSQL NUL characters', () => {
  const opts = { required:false, max:500 };
  assert.equal(v.text('  hello  ', 'Special request', opts), 'hello');
  assert.equal(v.text('   ', 'Special request', opts), null);
  for (const value of ['x'.repeat(501), 'hello\0world', {}]) {
    assert.throws(() => v.text(value, 'Special request', opts), {status:400});
  }
});
