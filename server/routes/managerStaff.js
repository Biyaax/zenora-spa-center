// Zenora Manager Phase 2A — SQLite-backed staff and schedule management.
// Mount at /api/manager BEFORE the legacy managerRoutes. Caller must also mount
// requireAuth and requireRole('Spa Manager') at the Express level.
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const router = express.Router();

const allowedRoles = new Set(['Massage Therapist', 'Receptionist']);
const isId = value => /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value));
const emailOk = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
const text = (value, max=80) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
const normalizeEmail = input => String(input || '').trim().toLowerCase();
const timeOk = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const fail = (res, error) => {
  if (error?.code?.startsWith?.('SQLITE_CONSTRAINT')) return res.status(409).json({success:false,message:'That record conflicts with existing data.'});
  console.error('Manager staff API error:', error);
  return res.status(500).json({success:false,message:'An internal server error occurred.'});
};
const staffRow = db.prepare(`
  SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.is_active,
         r.name AS role, p.specialties, p.is_available
  FROM users u JOIN roles r ON r.id=u.role_id
  LEFT JOIN therapist_profiles p ON p.user_id=u.id
  WHERE u.id=? AND r.name IN ('Massage Therapist', 'Receptionist')
`);
const findRole = db.prepare('SELECT id FROM roles WHERE name=?');
const emailExists = db.prepare('SELECT 1 FROM users WHERE LOWER(email)=? AND id!=?');
const writeLog = db.prepare(`INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (?, ?, ?, ?, ?)`);
const audit = (by, action, target, details) => writeLog.run(by, action, 'staff', target, JSON.stringify(details));
const serviceIdsFor = id => db.prepare('SELECT service_id FROM therapist_services WHERE therapist_id=? ORDER BY service_id').all(id).map(x=>x.service_id);
const shape = row => ({...row, specialties: row.specialties || '', service_ids: row.role==='Massage Therapist'?serviceIdsFor(row.id):[]});
const validServices = ids => {
  if (!Array.isArray(ids) || ids.length > 50 || ids.some(x=>!Number.isSafeInteger(x)||x<=0)) return false;
  if (new Set(ids).size!==ids.length) return false;
  return ids.every(id=>Boolean(db.prepare('SELECT 1 FROM services WHERE id=? AND is_active=1').get(id)));
};
const replaceServices=(id,ids)=>{
  db.prepare('DELETE FROM therapist_services WHERE therapist_id=?').run(id);
  const ins=db.prepare('INSERT INTO therapist_services(therapist_id,service_id) VALUES(?,?)');
  ids.forEach(sid=>ins.run(id,sid));
};

// Defense in depth: this router MUST NEVER be mounted for unauthenticated users.
router.use((req, res, next) => {
  if (!req.user) return res.status(401).json({success:false,message:'Authentication required.'});
  if (req.user.role !== 'Spa Manager' || !req.user.is_active) return res.status(403).json({success:false,message:'Manager access required.'});
  next();
});

router.get('/staff', (req, res) => {
  try {
    const staff = db.prepare(`SELECT u.id,u.first_name,u.last_name,u.email,u.phone,u.is_active,
          r.name AS role,p.specialties,p.is_available
        FROM users u JOIN roles r ON r.id=u.role_id
        LEFT JOIN therapist_profiles p ON p.user_id=u.id
        WHERE r.name IN ('Massage Therapist','Receptionist')
        ORDER BY r.name,u.last_name,u.first_name`).all();
    return res.json({success:true,staff:staff.map(shape)});
  } catch(error) {return fail(res,error);}
});

router.post('/staff', (req, res) => {
  try {
    const b = req.body || {};
    const email = normalizeEmail(b.email);
    if (!text(b.first_name) || !text(b.last_name) || !emailOk(email) ||
        !allowedRoles.has(b.role) || typeof b.temporary_password !== 'string' ||
        b.temporary_password.length < 12 || b.temporary_password.length > 72 ||
        (b.phone !== undefined && b.phone !== null && typeof b.phone !== 'string') ||
        (b.specialties !== undefined && b.specialties !== null && typeof b.specialties !== 'string') ||
        (b.role === 'Massage Therapist' && (!validServices(b.service_ids)||b.service_ids.length===0))) {
      return res.status(400).json({success:false,message:'Provide names, email, a permitted staff role, and a temporary password of 12–72 characters.'});
    }
    if (emailExists.get(email,0)) return res.status(409).json({success:false,message:'Email is already registered.'});
    const role = findRole.get(b.role);
    if (!role) return res.status(409).json({success:false,message:'Required staff role has not been initialized.'});
    // Password is hashed before being stored. It is never logged or returned.
    const hash = bcrypt.hashSync(b.temporary_password, 12);
    const id = db.transaction(() => {
      const created = db.prepare(`INSERT INTO users
        (role_id,first_name,last_name,email,password_hash,phone)
        VALUES (?,?,?,?,?,?)`).run(role.id,b.first_name.trim(),b.last_name.trim(),email,hash,(b.phone||'').trim()||null);
      const newId = Number(created.lastInsertRowid);
      if (b.role === 'Massage Therapist') {
        db.prepare(`INSERT INTO therapist_profiles(user_id,specialties,is_available)
          VALUES (?,?,1)`).run(newId, (b.specialties||'').trim()||null);
        replaceServices(newId,b.service_ids);
      }
      audit(req.user.id,'staff.create',newId,{role:b.role,email});
      return newId;
    })();
    return res.status(201).json({success:true,message:'Staff account created. Share the temporary password securely.',staff:shape(staffRow.get(id))});
  } catch(error) {return fail(res,error);}
});

router.patch('/staff/:id', (req,res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({success:false,message:'Invalid staff record.'});
    const id = Number(req.params.id), existing = staffRow.get(id), b=req.body||{};
    if (!existing) return res.status(404).json({success:false,message:'Staff account not found.'});
    const fields = Object.keys(b);
    const allowed = ['first_name','last_name','email','phone','specialties','service_ids','is_active'];
    if (!fields.length || fields.some(k=>!allowed.includes(k))) return res.status(400).json({success:false,message:'Invalid staff update fields. Changing roles requires a separate reviewed workflow.'});
    if ((b.first_name!==undefined&&!text(b.first_name)) || (b.last_name!==undefined&&!text(b.last_name)) ||
        (b.email!==undefined&&!emailOk(normalizeEmail(b.email))) ||
        (b.phone!==undefined&&b.phone!==null&&typeof b.phone!=='string') ||
        (b.specialties!==undefined&&b.specialties!==null&&typeof b.specialties!=='string') ||
        (b.is_active!==undefined&&![true,false,0,1].includes(b.is_active)) ||
        (b.specialties!==undefined&&existing.role!=='Massage Therapist') ||
        (b.service_ids!==undefined&&(existing.role!=='Massage Therapist'||!validServices(b.service_ids)||b.service_ids.length===0))) {
      return res.status(400).json({success:false,message:'Invalid staff update values.'});
    }
    const email = normalizeEmail(b.email ?? existing.email);
    if (emailExists.get(email,id)) return res.status(409).json({success:false,message:'Email already belongs to another account.'});
    db.transaction(()=>{
      db.prepare(`UPDATE users SET first_name=?,last_name=?,email=?,phone=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
       .run((b.first_name??existing.first_name).trim(), (b.last_name??existing.last_name).trim(), email,
         b.phone===undefined?existing.phone:(b.phone?.trim()||null),
         b.is_active===undefined?existing.is_active:Number(b.is_active),id);
      if (b.specialties!==undefined) db.prepare('UPDATE therapist_profiles SET specialties=? WHERE user_id=?').run(b.specialties?.trim()||null,id);
      if (b.service_ids!==undefined) replaceServices(id,b.service_ids);
      audit(req.user.id,'staff.update',id,{fields});
    })();
    return res.json({success:true,message:'Staff account updated.',staff:shape(staffRow.get(id))});
  } catch(error){return fail(res,error);}
});

router.post('/staff/:id/reset-password', (req,res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({success:false,message:'Invalid staff record.'});
    const id=Number(req.params.id), person=staffRow.get(id), newPassword=req.body?.temporary_password;
    if (!person) return res.status(404).json({success:false,message:'Staff account not found.'});
    if (typeof newPassword !== 'string' || newPassword.length<12 || newPassword.length>72)
      return res.status(400).json({success:false,message:'Temporary password must be 12–72 characters.'});
    const hash=bcrypt.hashSync(newPassword,12);
    db.transaction(()=>{
      db.prepare('UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(hash,id);
      audit(req.user.id,'staff.password_reset',id,{role:person.role});
    })();
    return res.json({success:true,message:'Temporary password set. Share it privately and require a password change before production use.'});
  } catch(error){return fail(res,error);}
});

router.get('/staff/:id/appointments', (req,res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({success:false,message:'Invalid staff record.'});
    const id=Number(req.params.id), person=staffRow.get(id);
    if (!person || person.role !== 'Massage Therapist') return res.status(404).json({success:false,message:'Therapist not found.'});
    const appointments=db.prepare(`SELECT a.id,a.appointment_date,a.start_time,a.end_time,a.status,
      s.name AS service_name,c.first_name AS client_first_name,c.last_name AS client_last_name
      FROM appointments a JOIN services s ON s.id=a.service_id
      JOIN clients c ON c.id=a.client_id
      WHERE a.therapist_id=? AND a.appointment_date >= date('now','-30 days')
      ORDER BY a.appointment_date DESC,a.start_time DESC LIMIT 100`).all(id);
    return res.json({success:true,appointments});
  }catch(error){return fail(res,error);}
});

router.get('/staff/:id/schedule', (req,res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({success:false,message:'Invalid staff record.'});
    const id=Number(req.params.id),person=staffRow.get(id);
    if (!person || person.role !== 'Massage Therapist') return res.status(404).json({success:false,message:'Therapist not found.'});
    const windows=db.prepare(`SELECT day_of_week,start_time,end_time,is_available
      FROM therapist_availability WHERE therapist_id=? ORDER BY day_of_week,start_time`).all(id);
    return res.json({success:true,windows});
  }catch(error){return fail(res,error);}
});

router.put('/staff/:id/schedule', (req,res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({success:false,message:'Invalid staff record.'});
    const id=Number(req.params.id),person=staffRow.get(id),windows=req.body?.windows;
    if (!person || person.role !== 'Massage Therapist') return res.status(404).json({success:false,message:'Therapist not found.'});
    if (!Array.isArray(windows) || windows.length>14) return res.status(400).json({success:false,message:'Provide up to 14 weekly working-hour windows.'});
    const byDay = new Map();
    for (const w of windows) {
      if (!Number.isInteger(w?.day_of_week) || w.day_of_week<0 || w.day_of_week>6 ||
        !timeOk(w?.start_time) || !timeOk(w?.end_time) || w.start_time>=w.end_time) {
        return res.status(400).json({success:false,message:'Each window needs a weekday and valid start/end times (HH:MM).'});
      }
      if (!byDay.has(w.day_of_week)) byDay.set(w.day_of_week,[]);
      byDay.get(w.day_of_week).push(w);
    }
    for (const dayWindows of byDay.values()) {
      dayWindows.sort((a,b)=>a.start_time.localeCompare(b.start_time));
      for(let i=1;i<dayWindows.length;i++){
        if(dayWindows[i].start_time<dayWindows[i-1].end_time)
          return res.status(400).json({success:false,message:'Overlapping schedule windows are not permitted.'});
      }
    }
    const conflicts=db.prepare(`SELECT appointment_date,start_time,end_time FROM appointments
      WHERE therapist_id=? AND appointment_date >= date('now')
      AND status NOT IN ('cancelled','no-show')`).all(id);
    for(const a of conflicts){
      const weekday=new Date(`${a.appointment_date}T12:00:00Z`).getUTCDay();
      if(!(byDay.get(weekday)||[]).some(w=>a.start_time.slice(0,5)>=w.start_time && a.end_time.slice(0,5)<=w.end_time))
        return res.status(409).json({success:false,message:`Cannot save: an existing appointment on ${a.appointment_date} falls outside these hours.`});
    }
    db.transaction(()=>{
      db.prepare('DELETE FROM therapist_availability WHERE therapist_id=?').run(id);
      const insert=db.prepare(`INSERT INTO therapist_availability (therapist_id,day_of_week,start_time,end_time,is_available)
          VALUES(?,?,?,?,1)`);
      for(const w of windows)insert.run(id,w.day_of_week,w.start_time,w.end_time);
      audit(req.user.id,'therapist.schedule_assign',id,{windows});
    })();
    return res.json({success:true,message:'Weekly working hours saved.',windows});
  }catch(error){return fail(res,error);}
});

module.exports=router;
