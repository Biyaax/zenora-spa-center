// Zenora Manager staff and weekly schedule management for PostgreSQL.
// Mount under /api/manager with requireAuth + requireRole('Spa Manager').
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database/postgres');
const router = express.Router();

const roles = new Set(['Massage Therapist', 'Receptionist']);
const idOk = v => /^[1-9]\d*$/.test(String(v)) && Number.isSafeInteger(Number(v));
const requiredText = (v, max = 80) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
const emailOf = v => String(v ?? '').trim().toLowerCase();
const emailOk = v => v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const timeOk = v => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const stamp = "to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS')";
const answer = (res, status, message) => res.status(status).json({ success: false, message });
function fail(res, e) {
  if (e?.code === '23505') return answer(res, 409, 'Email or record already exists.');
  if (e?.code === '23503' || e?.code === '23514') return answer(res, 409, 'This update conflicts with related records.');
  console.error('Manager staff API error:', e);
  return answer(res, 500, 'An internal server error occurred.');
}
async function transaction(action) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await action(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
async function audit(client, managerId, action, staffId, details) {
  await client.query(`INSERT INTO activity_logs(user_id,action,entity_type,entity_id,details)
    VALUES($1,$2,'staff',$3,$4)`, [managerId, action, staffId, JSON.stringify(details)]);
}
async function staffById(queryable, id) {
  const result = await queryable.query(`SELECT u.id,u.first_name,u.last_name,u.email,u.phone,u.is_active,
    r.name AS role,p.specialties,p.is_available FROM users u
    JOIN roles r ON r.id=u.role_id LEFT JOIN therapist_profiles p ON p.user_id=u.id
    WHERE u.id=$1 AND r.name IN ('Massage Therapist','Receptionist')`, [id]);
  return result.rows[0];
}
async function shaped(queryable, row) {
  if (!row) return null;
  const ids = row.role === 'Massage Therapist'
    ? (await queryable.query('SELECT service_id FROM therapist_services WHERE therapist_id=$1 ORDER BY service_id', [row.id])).rows.map(x => x.service_id)
    : [];
  return { ...row, specialties: row.specialties || '', service_ids: ids };
}
async function validateServices(queryable, ids) {
  if (!Array.isArray(ids) || ids.length > 50 || ids.some(x => !Number.isSafeInteger(x) || x <= 0) || new Set(ids).size !== ids.length) return false;
  if (!ids.length) return true;
  const r = await queryable.query('SELECT COUNT(*)::INTEGER AS count FROM services WHERE id=ANY($1::INTEGER[]) AND is_active=1', [ids]);
  return r.rows[0].count === ids.length;
}
async function setServices(client, userId, ids) {
  await client.query('DELETE FROM therapist_services WHERE therapist_id=$1', [userId]);
  for (const id of ids) await client.query('INSERT INTO therapist_services(therapist_id,service_id) VALUES($1,$2)', [userId,id]);
}
router.use((req,res,next) => {
  if (!req.user) return answer(res,401,'Authentication required.');
  if (req.user.role !== 'Spa Manager' || !req.user.is_active) return answer(res,403,'Manager access required.');
  next();
});

router.get('/staff', async (req,res) => {
  try {
    const result = await db.query(`SELECT u.id,u.first_name,u.last_name,u.email,u.phone,u.is_active,
      r.name AS role,p.specialties,p.is_available FROM users u
      JOIN roles r ON r.id=u.role_id LEFT JOIN therapist_profiles p ON p.user_id=u.id
      WHERE r.name IN ('Massage Therapist','Receptionist') ORDER BY r.name,u.last_name,u.first_name`);
    const staff = await Promise.all(result.rows.map(row => shaped(db,row)));
    return res.json({success:true,staff});
  } catch(e) {return fail(res,e);}
});

router.post('/staff', async (req,res) => {
  const b = req.body || {}, email = emailOf(b.email);
  if (!requiredText(b.first_name) || !requiredText(b.last_name) || !emailOk(email) || !roles.has(b.role) ||
    typeof b.temporary_password !== 'string' || b.temporary_password.length < 12 || b.temporary_password.length > 72 ||
    (b.phone != null && (typeof b.phone !== 'string' || b.phone.length > 80)) ||
    (b.specialties != null && (typeof b.specialties !== 'string' || b.specialties.length > 1000)) ||
    (b.role === 'Massage Therapist' && (!Array.isArray(b.service_ids) || !b.service_ids.length)))
    return answer(res,400,'Provide valid staff details and a 12–72 character temporary password.');
  try {
    const row = await transaction(async client => {
      const role = await client.query('SELECT id FROM roles WHERE name=$1',[b.role]);
      if (!role.rowCount) return { error:'Required role is missing.' };
      if (b.role === 'Massage Therapist' && !(await validateServices(client,b.service_ids))) return {error:'Choose valid active services.'};
      const hash = await bcrypt.hash(b.temporary_password,12);
      const created = await client.query(`INSERT INTO users(role_id,first_name,last_name,email,password_hash,phone)
        VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,[role.rows[0].id,b.first_name.trim(),b.last_name.trim(),email,hash,b.phone?.trim()||null]);
      const id = created.rows[0].id;
      if (b.role === 'Massage Therapist') {
        await client.query('INSERT INTO therapist_profiles(user_id,specialties,is_available) VALUES($1,$2,1)',[id,b.specialties?.trim()||null]);
        await setServices(client,id,b.service_ids);
      }
      await audit(client,req.user.id,'staff.create',id,{role:b.role,email});
      return shaped(client,await staffById(client,id));
    });
    if (row.error) return answer(res,400,row.error);
    return res.status(201).json({success:true,message:'Staff account created.',staff:row});
  } catch(e) {return fail(res,e);}
});

router.patch('/staff/:id', async (req,res) => {
  if (!idOk(req.params.id)) return answer(res,400,'Invalid staff ID.');
  const id = Number(req.params.id), b = req.body || {}, fields=Object.keys(b);
  const allowed=['first_name','last_name','email','phone','specialties','service_ids','is_active'];
  if (!fields.length || fields.some(f=>!allowed.includes(f))) return answer(res,400,'Invalid update fields; role changes are not supported.');
  if ((b.first_name !== undefined && !requiredText(b.first_name)) || (b.last_name !== undefined && !requiredText(b.last_name)) ||
    (b.email !== undefined && !emailOk(emailOf(b.email))) || (b.phone != null && (typeof b.phone !== 'string' || b.phone.length > 80)) ||
    (b.specialties != null && (typeof b.specialties !== 'string' || b.specialties.length > 1000)) ||
    (b.is_active !== undefined && ![0,1,true,false].includes(b.is_active))) return answer(res,400,'Invalid update values.');
  try {
    const result = await transaction(async client => {
      const previous = await staffById(client,id);
      if (!previous) return {notFound:true};
      if ((b.specialties !== undefined || b.service_ids !== undefined) && previous.role !== 'Massage Therapist') return {error:'Specialties and services apply only to therapists.'};
      if (b.service_ids !== undefined && (!Array.isArray(b.service_ids) || !b.service_ids.length || !(await validateServices(client,b.service_ids)))) return {error:'Choose valid active services.'};
      const updated = await client.query(`UPDATE users SET first_name=$1,last_name=$2,email=$3,phone=$4,is_active=$5,
        updated_at=${stamp} WHERE id=$6 RETURNING id`,[
          (b.first_name ?? previous.first_name).trim(),(b.last_name ?? previous.last_name).trim(),emailOf(b.email ?? previous.email),
          b.phone===undefined ? previous.phone : b.phone?.trim()||null,
          b.is_active===undefined ? previous.is_active : Number(b.is_active),id]);
      if (!updated.rowCount) return {notFound:true};
      if (b.specialties !== undefined) await client.query('UPDATE therapist_profiles SET specialties=$1 WHERE user_id=$2',[b.specialties?.trim()||null,id]);
      if (b.service_ids !== undefined) await setServices(client,id,b.service_ids);
      await audit(client,req.user.id,'staff.update',id,{fields});
      return {staff:await shaped(client,await staffById(client,id))};
    });
    if (result.notFound) return answer(res,404,'Staff account not found.');
    if (result.error) return answer(res,400,result.error);
    return res.json({success:true,message:'Staff account updated.',staff:result.staff});
  } catch(e) {return fail(res,e);}
});

router.post('/staff/:id/reset-password', async (req,res) => {
  if (!idOk(req.params.id)) return answer(res,400,'Invalid staff ID.');
  const id=Number(req.params.id), pw=req.body?.temporary_password;
  if (typeof pw!=='string' || pw.length<12 || pw.length>72) return answer(res,400,'Temporary password must be 12–72 characters.');
  try {
    const found = await transaction(async client => {
      const staff=await staffById(client,id);
      if (!staff) return false;
      await client.query(`UPDATE users SET password_hash=$1,updated_at=${stamp} WHERE id=$2`,[await bcrypt.hash(pw,12),id]);
      await audit(client,req.user.id,'staff.password_reset',id,{role:staff.role});
      return true;
    });
    if (!found) return answer(res,404,'Staff account not found.');
    return res.json({success:true,message:'Temporary password set. Share it privately.'});
  } catch(e) {return fail(res,e);}
});

router.get('/staff/:id/appointments', async (req,res) => {
  if (!idOk(req.params.id)) return answer(res,400,'Invalid staff ID.');
  const id=Number(req.params.id);
  try {
    const staff=await staffById(db,id);
    if (!staff || staff.role!=='Massage Therapist') return answer(res,404,'Therapist not found.');
    const result=await db.query(`SELECT a.id,a.appointment_date,a.start_time,a.end_time,a.status,
      s.name AS service_name,c.first_name AS client_first_name,c.last_name AS client_last_name
      FROM appointments a JOIN services s ON s.id=a.service_id JOIN clients c ON c.id=a.client_id
      WHERE a.therapist_id=$1 AND a.appointment_date >= to_char(CURRENT_DATE - INTERVAL '30 days','YYYY-MM-DD')
      ORDER BY a.appointment_date DESC,a.start_time DESC LIMIT 100`,[id]);
    return res.json({success:true,appointments:result.rows});
  } catch(e) {return fail(res,e);}
});
router.get('/staff/:id/schedule', async (req,res) => {
  if (!idOk(req.params.id)) return answer(res,400,'Invalid staff ID.');
  const id=Number(req.params.id);
  try {
    const staff=await staffById(db,id);
    if (!staff || staff.role!=='Massage Therapist') return answer(res,404,'Therapist not found.');
    const result=await db.query('SELECT day_of_week,start_time,end_time,is_available FROM therapist_availability WHERE therapist_id=$1 ORDER BY day_of_week,start_time',[id]);
    return res.json({success:true,windows:result.rows});
  } catch(e) {return fail(res,e);}
});
router.put('/staff/:id/schedule', async (req,res) => {
  if (!idOk(req.params.id)) return answer(res,400,'Invalid staff ID.');
  const id=Number(req.params.id), windows=req.body?.windows;
  if (!Array.isArray(windows) || windows.length>14) return answer(res,400,'Provide at most 14 weekly windows.');
  const byDay=new Map();
  for (const w of windows) {
    if (!Number.isInteger(w?.day_of_week) || w.day_of_week<0 || w.day_of_week>6 || !timeOk(w.start_time) || !timeOk(w.end_time) || w.start_time>=w.end_time)
      return answer(res,400,'Invalid weekday or working hours.');
    if (!byDay.has(w.day_of_week)) byDay.set(w.day_of_week,[]);
    byDay.get(w.day_of_week).push(w);
  }
  for (const day of byDay.values()) {
    day.sort((a,b)=>a.start_time.localeCompare(b.start_time));
    for (let i=1;i<day.length;i++) if (day[i].start_time<day[i-1].end_time) return answer(res,400,'Overlapping shifts are not allowed.');
  }
  try {
    const result=await transaction(async client => {
      // Serialize schedule updates for this therapist.
      const locked=await client.query(`SELECT u.id FROM users u JOIN roles r ON r.id=u.role_id
        WHERE u.id=$1 AND r.name='Massage Therapist' FOR UPDATE OF u`,[id]);
      if (!locked.rowCount) return {notFound:true};
      const appointments=await client.query(`SELECT appointment_date,start_time,end_time FROM appointments
        WHERE therapist_id=$1 AND appointment_date>=to_char(CURRENT_DATE,'YYYY-MM-DD')
        AND status NOT IN ('cancelled','no-show')`,[id]);
      for (const a of appointments.rows) {
        const date=String(a.appointment_date).slice(0,10);
        const day=new Date(`${date}T12:00:00Z`).getUTCDay();
        if (!(byDay.get(day)||[]).some(w=>String(a.start_time).slice(0,5)>=w.start_time && String(a.end_time).slice(0,5)<=w.end_time))
          return {conflict:date};
      }
      await client.query('DELETE FROM therapist_availability WHERE therapist_id=$1',[id]);
      for (const w of windows) await client.query(`INSERT INTO therapist_availability(therapist_id,day_of_week,start_time,end_time,is_available)
        VALUES($1,$2,$3,$4,1)`,[id,w.day_of_week,w.start_time,w.end_time]);
      await audit(client,req.user.id,'therapist.schedule_assign',id,{windows});
      return {ok:true};
    });
    if (result.notFound) return answer(res,404,'Therapist not found.');
    if (result.conflict) return answer(res,409,`Existing appointment on ${result.conflict} falls outside the new hours.`);
    return res.json({success:true,message:'Weekly working hours saved.',windows});
  } catch(e) {return fail(res,e);}
});
module.exports=router;
