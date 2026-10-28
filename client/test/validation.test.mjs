import test from 'node:test';
import assert from 'node:assert/strict';
import { emailError, validateStaffLogin, spaNow, dateError, validateAppointment, isDate } from '../src/utils/validation.js';
const now = { date: '2026-10-28', minutes: 9 * 60 };
const rules = { timezone: 'Asia/Manila', hours: { 0: null, 1: ['09:00','19:00'], 2: ['09:00','19:00'], 3: ['09:00','19:00'], 4: ['09:00','19:00'], 5: ['09:00','19:00'], 6: ['09:00','18:00'] }, onlineLeadMinutes: 60 };
const form = { serviceId: '1', therapistId: '2', date: now.date, time: '10:00', specialRequest: '' };
const options = { services: [{id:1}], therapists: [{id:2}], slots: [{start:'10:00'}], rules, now };

test('login rejects blank/invalid email and blank passwords without enforcing new password rules', () => {
  assert.deepEqual(Object.keys(validateStaffLogin('  ', '   ')), ['email', 'password']);
  assert.ok(emailError('bad@@mail.com'));
  assert.ok(emailError('a'.repeat(250) + '@x.com'));
  assert.equal(emailError('  user@example.com  '), '');
  assert.deepEqual(validateStaffLogin('staff@example.com', ' old '), {});
  assert.ok(validateStaffLogin('staff@example.com', 'a'.repeat(4097)).password);
});
test('Manila date at UTC midnight boundary, leap days and calendar rollovers', () => {
  assert.equal(spaNow('Asia/Manila', new Date('2026-10-28T16:30:00Z')).date, '2026-10-29');
  assert.equal(isDate('2026-02-30'), false);
  assert.equal(isDate('2028-02-29'), true);
  assert.equal(isDate('2026-02-29'), false);
});
test('past dates and Sundays are rejected; future open day is accepted', () => {
  assert.ok(dateError('2026-10-27', rules, now));
  assert.match(dateError('2026-11-01', rules, now), /closed/);
  assert.equal(dateError('2026-10-29', rules, now), '');
});
test('booking validates selected IDs and times against the current options', () => {
  assert.deepEqual(validateAppointment(form, options), {});
  assert.ok(validateAppointment({...form, serviceId:'99'}, options).serviceId);
  assert.ok(validateAppointment({...form, therapistId:'99'}, options).therapistId);
  assert.ok(validateAppointment(form, {...options, slots:[]}).time);
  assert.ok(validateAppointment(form, {...options, therapists:[]}).therapistId);
});
test('expired lead time and special request bounds', () => {
  assert.ok(validateAppointment(form, {...options, now:{...now, minutes:541}}).time);
  assert.deepEqual(validateAppointment({...form, specialRequest:'a'.repeat(500)}, options), {});
  assert.ok(validateAppointment({...form, specialRequest:'a'.repeat(501)}, options).specialRequest);
  assert.ok(validateAppointment({...form, specialRequest:'hello\0world'}, options).specialRequest);
});
