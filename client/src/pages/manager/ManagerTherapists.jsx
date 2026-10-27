import { useMemo, useState } from 'react';
import { getManager, writeManager, isActive, personName, timeText, dateText } from '../../components/manager/api';
import { Button, Card, ConfirmDialog, DataTable, EmptyState, ErrorState, Field, Loading, Modal, Notice, PageHeader, StatusBadge, useLoad, useToast } from '../../components/manager/UI';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const blank = { first_name:'', last_name:'', email:'', phone:'', role:'Massage Therapist', specialties:'', service_ids:[], temporary_password:'' };
const freshDays = () => DAYS.map((name, i) => ({ day_of_week:i, enabled:false, start_time:'09:00', end_time:'18:00', name }));
const listSpecialties = value => {
  if (!value) return [];
  try { const a=JSON.parse(value); if (Array.isArray(a)) return a; } catch { /* comma-separated text */ }
  return String(value).split(',').map(v=>v.trim()).filter(Boolean);
};
export default function ManagerTherapists() {
  const notify = useToast();
  const {data,loading,error,retry} = useLoad(() => getManager('/staff'), []);
  const {data:serviceData,loading:servicesLoading,error:servicesError} = useLoad(() => getManager('/services'), []);
  const services=(serviceData?.services||[]).filter(s=>isActive(s.is_active));
  const people = data?.staff || [];
  const [search,setSearch]=useState(''), [roleFilter,setRoleFilter]=useState('All');
  const [formOpen,setFormOpen]=useState(false), [edit,setEdit]=useState(null), [form,setForm]=useState(blank);
  const [formError,setFormError]=useState(''), [busy,setBusy]=useState(false);
  const [target,setTarget]=useState(null), [resetTarget,setResetTarget]=useState(null), [resetPassword,setResetPassword]=useState('');
  const [view,setView]=useState(null), [windows,setWindows]=useState([]), [appointments,setAppointments]=useState([]);
  const [viewLoading,setViewLoading]=useState(false),[viewError,setViewError]=useState('');
  const [scheduleOpen,setScheduleOpen]=useState(false), [days,setDays]=useState(freshDays());
  const [multipleWindows,setMultipleWindows]=useState(false),[scheduleError,setScheduleError]=useState('');

  const filtered=useMemo(()=>people.filter(p=>
    (roleFilter==='All'||p.role===roleFilter) &&
    `${personName(p)} ${p.email||''}`.toLowerCase().includes(search.toLowerCase())
  ),[people,roleFilter,search]);

  const startCreate=()=>{setEdit(null);setForm(blank);setFormError('');setFormOpen(true);};
  const startEdit=p=>{setEdit(p);setForm({first_name:p.first_name||'',last_name:p.last_name||'',email:p.email||'',phone:p.phone||'',role:p.role,specialties:p.specialties||'',service_ids:p.service_ids||[],temporary_password:''});setFormError('');setFormOpen(true);};
  const saveStaff=async(e)=>{
    e.preventDefault();
    if (!form.first_name.trim()||!form.last_name.trim()||!form.email.trim()) {setFormError('Name and email are required.');return;}
    if (!edit && form.temporary_password.length<12){setFormError('Use a temporary password of at least 12 characters.');return;}
    if(form.role==='Massage Therapist'&&!form.service_ids.length){setFormError('Assign at least one active service for this therapist.');return;}
    setBusy(true);setFormError('');
    try {
      const payload={first_name:form.first_name.trim(),last_name:form.last_name.trim(),email:form.email.trim(),phone:form.phone.trim()};
      if(form.role==='Massage Therapist'){payload.specialties=form.specialties.trim();payload.service_ids=form.service_ids;}
      if(!edit){payload.role=form.role;payload.temporary_password=form.temporary_password;}
      await writeManager(edit?`/staff/${edit.id}`:'/staff',edit?'PATCH':'POST',payload);
      notify(edit?'Staff account updated.':'Staff account created. Share the temporary password privately.');
      setFormOpen(false);setForm(blank);retry();
    } catch(ex){setFormError(ex.message||'Unable to save staff account.');}
    finally{setBusy(false);}
  };

  const toggleStatus=async()=>{
    if(!target)return;
    setBusy(true);
    try{await writeManager(`/staff/${target.id}`,'PATCH',{is_active:isActive(target.is_active)?0:1});notify('Account status updated.');setTarget(null);retry();}
    catch(ex){notify(ex.message,'error');}finally{setBusy(false);}
  };
  const saveReset=async(e)=>{
    e.preventDefault();if(!resetTarget)return;
    if(resetPassword.length<12){notify('Temporary password must contain at least 12 characters.','error');return;}
    setBusy(true);
    try{await writeManager(`/staff/${resetTarget.id}/reset-password`,'POST',{temporary_password:resetPassword});notify('Temporary password set. Share it securely.');setResetTarget(null);setResetPassword('');}
    catch(ex){notify(ex.message,'error');}finally{setBusy(false);}
  };
  const viewSchedule=async(p)=>{
    setView(p);setViewError('');setViewLoading(true);setWindows([]);setAppointments([]);setScheduleOpen(false);
    try {
      const [s,a]=await Promise.all([getManager(`/staff/${p.id}/schedule`),getManager(`/staff/${p.id}/appointments`)]);
      setWindows(s.windows||[]);setAppointments(a.appointments||[]);
    }catch(ex){setViewError(ex.message||'Could not load schedule.');}
    finally{setViewLoading(false);}
  };
  const openAssign=()=>{
    const merged=freshDays();let multi=false;
    for(const d of DAYS.map((_,i)=>i)){
      const w=windows.filter(x=>Number(x.day_of_week)===d && isActive(x.is_available));
      if(w.length>1)multi=true;
      if(w.length){merged[d].enabled=true;merged[d].start_time=String(w[0].start_time).slice(0,5);merged[d].end_time=String(w[0].end_time).slice(0,5);}
    }
    setDays(merged);setMultipleWindows(multi);setScheduleError('');setScheduleOpen(true);
  };
  const saveSchedule=async(e)=>{
    e.preventDefault();if(!view||multipleWindows)return;
    const active=days.filter(x=>x.enabled).map(x=>({day_of_week:x.day_of_week,start_time:x.start_time,end_time:x.end_time}));
    if(active.some(x=>x.start_time>=x.end_time)){setScheduleError('Each start time must be before its end time.');return;}
    setBusy(true);setScheduleError('');
    try {
      await writeManager(`/staff/${view.id}/schedule`,'PUT',{windows:active});
      notify('Weekly working hours saved.');setScheduleOpen(false);await viewSchedule(view);
    }catch(ex){setScheduleError(ex.message||'Could not save schedule.');}finally{setBusy(false);}
  };

  return <>
    <PageHeader title="Therapists & Staff" subtitle="Manage staff accounts, roles and therapist working hours." action={<Button onClick={startCreate}><i className="fa fa-user-plus"/> Create Staff Account</Button>}/>
    <Card>
      <Notice>Staff roles and therapist services are assigned to accounts. Changing an existing role is restricted; contact the backend team for an audited transfer workflow. Password resets set a new temporary password, not reveal the old one.</Notice>
      <div className="zm-toolbar">
        <label className="zm-search-label">Search staff<input placeholder="Name or email" value={search} onChange={e=>setSearch(e.target.value)}/></label>
        <label>Role<select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}><option>All</option><option value="Massage Therapist">Massage Therapist</option><option value="Receptionist">Receptionist</option></select></label>
      </div>
      {error&&<ErrorState message={error} onRetry={retry}/>} {loading?<Loading/>:!error&&
        <DataTable headers={['Staff member','Role','Specialties','Account','Availability','Actions']} empty="No matching staff accounts">
          {filtered.map(p=><tr key={p.id}>
            <td><strong>{personName(p)}</strong><div className="zm-small">{p.email}</div></td>
            <td>{p.role}</td>
            <td>{p.role==='Massage Therapist'?(listSpecialties(p.specialties).length?listSpecialties(p.specialties).map(x=><span className="zm-chip" key={x}>{x}</span>):<span className="zm-small">Not specified</span>):<span className="zm-small">Not applicable</span>}</td>
            <td><StatusBadge value={isActive(p.is_active)?'Active':'Inactive'}/></td>
            <td>{p.role==='Massage Therapist'?<StatusBadge value={isActive(p.is_available)?'Available':'Unavailable'}/>:<span className="zm-small">Not applicable</span>}</td>
            <td><div className="zm-actions">
              {p.role==='Massage Therapist'&&<Button kind="outline" onClick={()=>viewSchedule(p)}>View Schedule</Button>}
              <Button kind="outline" onClick={()=>startEdit(p)}>Edit</Button>
              <Button kind="outline" onClick={()=>{setResetTarget(p);setResetPassword('');}}>Reset Password</Button>
              <Button kind={isActive(p.is_active)?'danger':'outline'} onClick={()=>setTarget(p)}>{isActive(p.is_active)?'Deactivate':'Activate'}</Button>
            </div></td>
          </tr>)}
        </DataTable>}
    </Card>

    <Modal open={formOpen} title={edit?'Edit Staff Account':'Create Staff Account'} onClose={()=>!busy&&setFormOpen(false)} footer={<><Button kind="outline" onClick={()=>setFormOpen(false)} disabled={busy}>Cancel</Button><Button type="submit" form="zm-staff-form" disabled={busy}>{busy?'Saving...':'Save Account'}</Button></>}>
      <form id="zm-staff-form" onSubmit={saveStaff} className="zm-form-grid">
        <Field label="First name *" id="zm-staff-first"><input id="zm-staff-first" required value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})}/></Field>
        <Field label="Last name *" id="zm-staff-last"><input id="zm-staff-last" required value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})}/></Field>
        <Field label="Email *" id="zm-staff-email"><input id="zm-staff-email" required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Field>
        <Field label="Phone" id="zm-staff-phone"><input id="zm-staff-phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></Field>
        <Field label="Role" id="zm-staff-role"><select id="zm-staff-role" value={form.role} disabled={!!edit} onChange={e=>setForm({...form,role:e.target.value})}><option>Massage Therapist</option><option>Receptionist</option></select></Field>
        {form.role==='Massage Therapist'&&<>
          <Field label="Specialties (comma-separated)" id="zm-staff-specialties"><input id="zm-staff-specialties" value={form.specialties} onChange={e=>setForm({...form,specialties:e.target.value})}/></Field>
          <Field label="Services this therapist can perform *" id="zm-staff-services">
            <select id="zm-staff-services" multiple size={Math.max(3,Math.min(6,services.length))} disabled={servicesLoading||!!servicesError} value={form.service_ids.map(String)} onChange={e=>setForm({...form,service_ids:Array.from(e.target.selectedOptions,option=>Number(option.value))})}>
              {services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <small>Use Ctrl+click to select multiple services. Assigning services is required for online booking eligibility.</small>
            {servicesError&&<p role="alert" className="zm-field-error">Unable to load active services: {servicesError}</p>}
          </Field>
        </>}
        {!edit&&<Field label="Temporary password * (12+ characters)" id="zm-staff-password"><input id="zm-staff-password" type="password" minLength="12" required autoComplete="new-password" value={form.temporary_password} onChange={e=>setForm({...form,temporary_password:e.target.value})}/></Field>}
        {formError&&<p role="alert" className="zm-field-error">{formError}</p>}
      </form>
    </Modal>

    <Modal open={!!resetTarget} title={resetTarget?`Reset Password · ${personName(resetTarget)}`:'Reset Password'} onClose={()=>!busy&&setResetTarget(null)} footer={<><Button kind="outline" onClick={()=>setResetTarget(null)} disabled={busy}>Cancel</Button><Button form="zm-reset-form" type="submit" disabled={busy}>Set Temporary Password</Button></>}>
      <form id="zm-reset-form" onSubmit={saveReset}>
        <Notice>This action replaces the staff member's existing password. Share the temporary password using a secure channel. Do not email or log it in plain text.</Notice>
        <Field id="zm-new-password" label="New temporary password *"><input id="zm-new-password" type="password" minLength="12" required autoComplete="new-password" value={resetPassword} onChange={e=>setResetPassword(e.target.value)}/></Field>
      </form>
    </Modal>

    <Modal open={!!view} title={view?`${personName(view)} · Weekly Schedule`:'Weekly Schedule'} onClose={()=>{setView(null);setScheduleOpen(false);}} footer={<><Button kind="outline" onClick={()=>setView(null)}>Close</Button>{!viewLoading&&!viewError&&<Button onClick={openAssign}>Assign Schedule</Button>}</>}>
      {viewLoading?<Loading/>:viewError?<ErrorState message={viewError} onRetry={()=>viewSchedule(view)}/>:<>
        <h3 className="zm-subheading">Assigned working hours</h3>
        {windows.length?<DataTable headers={['Day','Start','End']}>
          {windows.filter(x=>isActive(x.is_available)).map((w,i)=><tr key={i}><td>{DAYS[w.day_of_week]}</td><td>{timeText(w.start_time)}</td><td>{timeText(w.end_time)}</td></tr>)}
        </DataTable>:<EmptyState title="No assigned working hours"/>}
        <h3 className="zm-subheading">Assigned appointments (recent and upcoming)</h3>
        {appointments.length?<DataTable headers={['Date','Time','Client','Service','Status']}>
          {appointments.map(a=><tr key={a.id}><td>{dateText(a.appointment_date)}</td><td>{timeText(a.start_time)}</td><td>{[a.client_first_name,a.client_last_name].filter(Boolean).join(' ')}</td><td>{a.service_name}</td><td><StatusBadge value={a.status}/></td></tr>)}
        </DataTable>:<EmptyState title="No appointments assigned"/>}
      </>}
    </Modal>

    <Modal open={scheduleOpen} title={view?`Assign Schedule · ${personName(view)}`:'Assign Schedule'} onClose={()=>!busy&&setScheduleOpen(false)} footer={<><Button kind="outline" disabled={busy} onClick={()=>setScheduleOpen(false)}>Cancel</Button><Button type="submit" form="zm-schedule-form" disabled={busy||multipleWindows}>{busy?'Saving...':'Save Weekly Hours'}</Button></>}>
      <Notice>Changes update the real weekly working hours. Existing future appointments outside the proposed windows will block saving. Use a single shift per day.</Notice>
      {multipleWindows&&<ErrorState message="This therapist has multiple shifts on at least one day. The simplified editor cannot safely overwrite them; ask the backend team to add a multi-shift editor."/>}
      <form id="zm-schedule-form" onSubmit={saveSchedule}>
        <div className="zm-table-scroll"><table className="zm-table"><thead><tr><th>Work day</th><th>Start</th><th>End</th></tr></thead><tbody>
          {days.map((d,i)=><tr key={d.day_of_week}><td><label><input type="checkbox" checked={d.enabled} onChange={e=>setDays(s=>s.map((v,k)=>k===i?{...v,enabled:e.target.checked}:v))}/> {d.name}</label></td>
            <td><input type="time" aria-label={`${d.name} start`} disabled={!d.enabled} value={d.start_time} onChange={e=>setDays(s=>s.map((v,k)=>k===i?{...v,start_time:e.target.value}:v))}/></td>
            <td><input type="time" aria-label={`${d.name} end`} disabled={!d.enabled} value={d.end_time} onChange={e=>setDays(s=>s.map((v,k)=>k===i?{...v,end_time:e.target.value}:v))}/></td>
          </tr>)}
        </tbody></table></div>
        {scheduleError&&<p role="alert" className="zm-field-error">{scheduleError}</p>}
      </form>
    </Modal>

    <ConfirmDialog open={!!target} onClose={()=>setTarget(null)} onConfirm={toggleStatus} busy={busy} destructive={isActive(target?.is_active)} title={isActive(target?.is_active)?'Deactivate staff account?':'Activate staff account?'} message={`${isActive(target?.is_active)?'Deactivate':'Activate'} ${personName(target)}? Inactive accounts cannot sign in.`}/>
  </>;
}
