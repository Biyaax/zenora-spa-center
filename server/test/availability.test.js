const test = require('node:test');
const assert = require('node:assert/strict');
process.env.JWT_SECRET = 'local-test-secret-only';
// Replace the PostgreSQL boundary before loading the production services.
// No production credentials or network database are used by these tests.
const calls = [];
const db = { query: async () => { throw new Error('Unexpected pool query'); } };
require.cache[require.resolve('../database/postgres')] = { id:require.resolve('../database/postgres'), filename:require.resolve('../database/postgres'), loaded:true, exports:db };
const time = require('../lib/time');
time.nowInSpa = () => ({date:'2026-10-28', minutes:540, time:'09:00'});
const availability = require('../services/availability');
const guest = require('../services/guest');

function repository({busy=[], clash=false, unavailable=false, off=false, inactive=false} = {}) {
  return { query: async (sql) => {
    if (sql.includes('FROM services')) return {rows:inactive ? [] : [{id:1, name:'Massage',price:500,duration_minutes:60}]};
    if (sql.includes('FROM therapist_profiles')) return {rows:unavailable ? [] : [{id:2,first_name:'Test',last_name:'Therapist'}]};
    if (sql.includes('FROM therapist_availability')) return {rows:[{start_time:'09:00',end_time:'19:00'}]};
    if (sql.includes('FROM time_off_requests')) return {rows:off ? [{}] : []};
    if (sql.includes('SELECT 1') && sql.includes('FROM appointments')) return {rows:clash ? [{}] : []};
    if (sql.includes('GROUP BY therapist_id')) return {rows:[]};
    if (sql.includes('FROM appointments')) return {rows:busy};
    throw new Error('Unexpected query: '+sql);
  }};
}
const booking = {serviceId:1,therapistId:2,date:'2026-10-28',start:'10:00',clientId:3};

test('slots honor lead time, service duration and existing appointments', async () => {
  const result = await availability.getSlots({...booking, queryable:repository({busy:[{start_time:'10:30',end_time:'11:30'}]})});
  assert.equal(result.slots[0].start, '11:30');
  assert.equal(result.slots.at(-1).start, '18:00');
  assert.ok(result.slots.every((slot) => !['09:00','09:30','10:00','10:30','11:00'].includes(slot.start)));
});
test('booking succeeds for an eligible therapist and exact valid slot', async () => {
  const result = await availability.resolveBooking({...booking,queryable:repository()});
  assert.equal(result.therapistId,2);
  assert.equal(result.end,'11:00');
});
test('server rejects malformed, closed, past, too-soon and off-grid bookings', async () => {
  for (const patch of [{date:'2026-02-30'}, {start:'25:00'}, {date:'2026-11-01'}, {date:'2026-10-27'}, {start:'09:30'}, {start:'10:15'}, {start:'18:30'}]) {
    await assert.rejects(availability.resolveBooking({...booking,...patch,queryable:repository()}), (e) => [400,409].includes(e.status));
  }
});
test('server rejects inactive services, wrong therapist, time off, guest and therapist overlaps', async () => {
  for (const data of [{inactive:true},{unavailable:true},{off:true},{clash:true},{busy:[{start_time:'10:30',end_time:'11:30'}]}]) {
    await assert.rejects(availability.resolveBooking({...booking,queryable:repository(data)}), (e) => [400,404,409].includes(e.status));
  }
});
test('touching appointment endpoints do not overlap', async () => {
  const result = await availability.resolveBooking({...booking,queryable:repository({busy:[{start_time:'11:00',end_time:'12:00'}]})});
  assert.equal(result.end, '11:00');
});
test('booking transactions acquire the shared lock before checking/writing and release on failure', async () => {
  db.connect = async () => ({query:async (sql) => { calls.push(sql); return {rows:[]}; }, release:() => calls.push('RELEASE')});
  const value = await guest.atomically(async () => { calls.push('CHECK_AND_WRITE'); return 123; });
  assert.equal(value,123);
  assert.deepEqual(calls.splice(0), ['BEGIN','SELECT pg_advisory_xact_lock(724016, 1)','CHECK_AND_WRITE','COMMIT','RELEASE']);
  await assert.rejects(guest.atomically(async () => {throw new Error('failed');}), /failed/);
  assert.deepEqual(calls.splice(0), ['BEGIN','SELECT pg_advisory_xact_lock(724016, 1)','ROLLBACK','RELEASE']);
});
