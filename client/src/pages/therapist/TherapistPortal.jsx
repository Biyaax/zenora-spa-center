import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import TherapistSidebar from "../../components/TherapistSidebar";
import {
  localDate, shiftDay, weekDays, weekdayForDate, dateFromLocal, dateTimeMs,
  formatDate, formatTime, formatDateTime, formatElapsed, formatCountdown,
  STATUSES, WEEKDAYS, demoStaff, createAppointments, createAvailability,
  createTimeOff, createNotifications, createHistory
} from "./therapistDemoData";

const TITLES = {
  dashboard: ["Good day!", "Here's your appointments and session activity for today."],
  schedule: ["My Schedule", "View your assigned shifts and appointments in a calendar."],
  appointments: ["My Appointments", "Manage your assigned sessions and view your status history."],
  availability: ["Availability & Time-Off", "Manage regular working hours and request time off."],
  profile: ["My Profile", "Review your therapist information and account settings."]
};
const STATUS_ICONS = {
  "Confirmed": "far fa-calendar-check", "Checked In": "fas fa-user-check", "Ongoing": "fas fa-play-circle", "Completed": "fas fa-check-circle", "No-Show": "far fa-calendar-times"
};
const newNotes = () => ({ areas: "", pressure: "Medium", observations: "", recommendations: "" });
function Status({ value }) { return <span className={`therapist-badge therapist-badge-${value.toLowerCase().replaceAll(" ", "-")}`}>{value}</span>; }
function Btn({ children, variant="primary", className="", ...props }) {
  return <button type="button" className={`therapist-btn ${variant} ${className}`} {...props}>{children}</button>;
}
function Icon({name}) { return <i className={name} aria-hidden="true" />; }
function NoteReadout({ notes }) {
  if (!notes) return <p className="therapist-muted">No service notes recorded.</p>;
  return <div className="therapist-detail-pairs">
    <div><span>Areas worked</span><strong>{notes.areas}</strong></div>
    <div><span>Pressure used</span><strong>{notes.pressure}</strong></div>
    <div><span>Observations</span><p>{notes.observations}</p></div>
    <div><span>Recommendations</span><p>{notes.recommendations}</p></div>
  </div>;
}
function Dialog({ title, onClose, children, wide=false, description }) {
  const titleId = useId();
  const descId = useId();
  const elRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const priorFocusRef = useRef(null);
  useEffect(() => {
    priorFocusRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = elRef.current;
    dialog?.querySelector("[data-autofocus],input:not([disabled]),textarea:not([disabled]),button:not([disabled])")?.focus();
    const onKey = e => {
      if (e.key === "Escape") { e.preventDefault(); closeRef.current(); }
      if (e.key !== "Tab" || !dialog) return;
      const elements = [...dialog.querySelectorAll("button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href]")];
      if (!elements.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = originalOverflow; document.removeEventListener("keydown", onKey); priorFocusRef.current?.focus?.(); };
  }, []);
  return createPortal(<div className="therapist-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section ref={elRef} className={`therapist-modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descId : undefined}>
      <div className="therapist-modal-heading"><div><h2 id={titleId}>{title}</h2>{description && <p id={descId}>{description}</p>}</div><button type="button" className="therapist-icon-btn" aria-label="Close dialog" onClick={onClose}><Icon name="fas fa-times" /></button></div>
      {children}
    </section>
  </div>, document.body);
}

// Uses a document-level menu to avoid clipping inside a scrolling table.
function Actions({ appt, onDetails, onChange, onEdit }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null), menuRef = useRef(null);
  const [position, setPosition] = useState({left:0,top:0});
  const items = [{ label:"View details", icon:"far fa-eye", action:()=>onDetails(appt) }];
  if (appt.status === "Checked In") items.push({label:"Start Session", icon:"fas fa-play", action:()=>onChange(appt,"Ongoing")});
  if (appt.status === "Ongoing") items.push({label:"End Session", icon:"fas fa-stop-circle", action:()=>onChange(appt,"Completed")});
  if (["Confirmed","Checked In"].includes(appt.status)) items.push({label:"Mark No-Show", icon:"far fa-calendar-times", action:()=>onChange(appt,"No-Show")});
  if (appt.status === "Completed") items.push({label:"Edit service notes", icon:"far fa-edit", action:()=>onEdit(appt)});
  const toggle = () => {
    if (open) return setOpen(false);
    const rect = buttonRef.current.getBoundingClientRect();
    const height = 12 + items.length * 40;
    const above = window.innerHeight - rect.bottom < height + 12 && rect.top > height;
    setPosition({top:above ? rect.top - height - 5 : rect.bottom + 5, left:Math.max(8, Math.min(rect.right - 198, window.innerWidth - 206))});
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    const pointer = e => { if (!buttonRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false); };
    const esc = e => { if (e.key === "Escape") { setOpen(false); buttonRef.current?.focus(); } };
    const close = () => setOpen(false);
    document.addEventListener("pointerdown", pointer); document.addEventListener("keydown", esc);
    window.addEventListener("resize", close); window.addEventListener("scroll", close, true);
    return () => {document.removeEventListener("pointerdown", pointer);document.removeEventListener("keydown", esc);window.removeEventListener("resize", close);window.removeEventListener("scroll", close, true);};
  },[open]);
  return <>
    <Btn variant="outline" className="therapist-action-trigger" ref={buttonRef} aria-label={`Actions for ${appt.client}`} aria-expanded={open} aria-haspopup="menu" onClick={toggle}>Actions <Icon name="fas fa-chevron-down" /></Btn>
    {open && createPortal(<div ref={menuRef} role="menu" aria-label={`${appt.id} actions`} className="therapist-actions-popover" style={position}>
      {items.map(item => <button key={item.label} role="menuitem" type="button" onClick={() => {setOpen(false);item.action();}}><Icon name={item.icon}/>{item.label}</button>)}
    </div>,document.body)}
  </>;
}
function AppointmentsTable({rows, onDetails, onChange, onEdit, actions=true}) {
  if (!rows.length) return <div className="therapist-empty"><Icon name="far fa-calendar-times" /><h4>No appointments found</h4><p>Try another date or filter. Only your assigned appointments appear here.</p></div>;
  return <div className="therapist-table-wrap"><table className="therapist-table"><thead><tr><th>Booking ID</th><th>Date & Time</th><th>Client</th><th>Service</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    {rows.map(a => <tr key={a.id}><td><strong>{a.id}</strong></td><td>{formatDate(a.date)}<small>{formatTime(a.time)}</small></td><td><strong>{a.client}</strong><small>{a.specialRequest || "No special request"}</small></td><td>{a.service}<small>{a.duration} minutes</small></td><td><Status value={a.status}/>{a.status === "Ongoing" && <Elapsed startedAt={a.startedAt}/>}</td><td>{actions ? <Actions appt={a} onDetails={onDetails} onChange={onChange} onEdit={onEdit}/> : <Btn variant="outline" onClick={()=>onDetails(a)}>View details</Btn>}</td></tr>)}
  </tbody></table></div>;
}
function Elapsed({startedAt}) {
  const [tick,setTick] = useState(Date.now());
  useEffect(()=>{const id=setInterval(()=>setTick(Date.now()),1000);return()=>clearInterval(id);},[]);
  return <span className="therapist-timer" aria-label="Session elapsed time"><Icon name="far fa-clock"/> {formatElapsed(tick - new Date(startedAt || tick).getTime())}</span>;
}
function NotesFields({notes,setNotes}) {
  return <div className="therapist-note-fields">
    <label htmlFor="therapist-notes-areas">Areas worked <span>*</span><input id="therapist-notes-areas" autoFocus required maxLength={180} value={notes.areas} onChange={e=>setNotes(n=>({...n,areas:e.target.value}))} placeholder="e.g. Back and shoulders"/></label>
    <label htmlFor="therapist-notes-pressure">Pressure used <span>*</span><select id="therapist-notes-pressure" value={notes.pressure} required onChange={e=>setNotes(n=>({...n,pressure:e.target.value}))}><option>Light</option><option>Medium</option><option>Firm</option><option>Varied</option></select></label>
    <label htmlFor="therapist-notes-observations">Observations <span>*</span><textarea id="therapist-notes-observations" rows={3} required maxLength={1000} value={notes.observations} onChange={e=>setNotes(n=>({...n,observations:e.target.value}))} placeholder="Note session observations without adding an unverified diagnosis."/></label>
    <label htmlFor="therapist-notes-recommendations">Recommendations <span>*</span><textarea id="therapist-notes-recommendations" rows={3} required maxLength={1000} value={notes.recommendations} onChange={e=>setNotes(n=>({...n,recommendations:e.target.value}))} placeholder="e.g. Hydrate and use gentle stretches."/></label>
  </div>;
}
function ModalContent({modal, appointment, notes, setNotes, onConfirm, onClose}) {
  if (!modal) return null;
  if (modal.type === "details" && appointment) return <Dialog onClose={onClose} title="Appointment Details" description={appointment.id} wide>
    <div className="therapist-detail-pairs">
      {[ ["Booking ID",appointment.id], ["Client name",appointment.client], ["Service",appointment.service], ["Duration",`${appointment.duration} minutes`], ["Date",formatDate(appointment.date)], ["Time",formatTime(appointment.time)], ["Status",<Status value={appointment.status}/>], ["Special request",appointment.specialRequest || "None"] ].map(([k,v])=><div key={k}><span>{k}</span><strong>{v}</strong></div>)}
      {appointment.phone && <div><span>Contact number</span><strong>{appointment.phone}</strong></div>}
      {appointment.allergies && <div><span>Allergies / health notes</span><strong>{appointment.allergies}</strong></div>}
    </div>
    {appointment.notes && <div className="therapist-notes-summary"><h3>Recorded service notes</h3><NoteReadout notes={appointment.notes}/></div>}
    <div className="therapist-modal-actions"><Btn variant="neutral" onClick={onClose}>Close</Btn></div>
  </Dialog>;
  if (["end","editNotes"].includes(modal.type) && appointment) {
    const complete = modal.type === "end";
    const valid = [notes.areas,notes.pressure,notes.observations,notes.recommendations].every(v=>String(v).trim());
    return <Dialog onClose={onClose} wide title={complete ? "End Session & Record Notes" : "Edit Service Notes"} description={`${appointment.client} · ${appointment.service} · ${appointment.id}`}>
      {complete && <div className="therapist-callout">The appointment will be marked <strong>Completed</strong> only after you submit these required notes.</div>}
      <form onSubmit={e=>{e.preventDefault();if(valid)onConfirm();}}><NotesFields notes={notes} setNotes={setNotes}/>
        <div className="therapist-modal-actions"><Btn variant="neutral" onClick={onClose}>Cancel</Btn><button type="submit" className="therapist-btn primary" disabled={!valid}>{complete ? "Complete Session" : "Save Notes"}</button></div>
      </form>
    </Dialog>;
  }
  if (modal.type === "noShow" && appointment) return <Dialog title="Mark as No-Show?" onClose={onClose} description={`Appointment ${appointment.id} · ${appointment.client}`}>
    <p className="therapist-dialog-text">Confirm that the client did not attend the scheduled session. This action will change the status to <strong>No-Show</strong>.</p>
    <div className="therapist-modal-actions"><Btn variant="neutral" onClick={onClose}>Cancel</Btn><Btn variant="danger" onClick={onConfirm}>Confirm No-Show</Btn></div>
  </Dialog>;
  if (modal.type === "start" && appointment) return <Dialog title="Start Session?" description={`${appointment.client} · ${appointment.id}`} onClose={onClose}>
    <p className="therapist-dialog-text">Only clients already checked in by Receptionist can start a session. Start the live session timer now?</p>
    <div className="therapist-modal-actions"><Btn variant="neutral" onClick={onClose}>Cancel</Btn><Btn onClick={onConfirm}>Start Session</Btn></div>
  </Dialog>;
  if (modal.type === "cancelTimeOff") return <Dialog title="Cancel time-off request?" onClose={onClose} description={`Request for ${formatDate(modal.date)}`}>
    <p className="therapist-dialog-text">Only Pending requests can be cancelled. This change is only stored in the frontend demo.</p>
    <div className="therapist-modal-actions"><Btn variant="neutral" onClick={onClose}>Keep request</Btn><Btn variant="danger" onClick={onConfirm}>Cancel request</Btn></div>
  </Dialog>;
  if (modal.type === "requestConflict") return <Dialog title="Appointments already assigned" onClose={onClose} description={formatDate(modal.date)}>
    <p className="therapist-dialog-text">You have {modal.count} assigned appointment(s) on this date. Sending a time-off request does not cancel or reassign them; the Spa Manager must review the conflict.</p>
    <div className="therapist-modal-actions"><Btn variant="neutral" onClick={onClose}>Go back</Btn><Btn onClick={onConfirm}>Submit anyway</Btn></div>
  </Dialog>;
  return null;
}
const CAL_START=8, CAL_END=20, SLOTS=(CAL_END-CAL_START)*2;
const toMinutes = hhmm => {const [h,m]=hhmm.split(":").map(Number);return h*60+m;};
function calendarSlot(hhmm) {return Math.max(0,Math.min(SLOTS,Math.floor((toMinutes(hhmm)-CAL_START*60)/30)));}
function isApprovedTimeOff(date,requests) {return requests.some(r=>r.date===date && r.status==="Approved");}
function isTentativeTimeOff(date,requests) {return requests.some(r=>r.date===date && r.status==="Pending");}
function Calendar({days,appointments,availability,requests,onDetails}) {
  const isWeek=days.length===7;
  const active = appointments.filter(a => days.includes(a.date));
  const blockFor = date => {
    const shift=availability[weekdayForDate(date)];
    if (!shift?.enabled) return {label:"Non-working day", type:"off"};
    if (isApprovedTimeOff(date,requests)) return {label:"Approved time off",type:"off"};
    if (isTentativeTimeOff(date,requests)) return {label:"Pending time off",type:"pending"};
    return null;
  };
  return <div className="therapist-calendar-scroll"><div className={`therapist-calendar ${isWeek?"week":"day"}`} style={{"--day-count":days.length,"--slot-count":SLOTS}}>
    <div className="therapist-calendar-corner">Time</div>
    {days.map((date,i)=><div className={`therapist-calendar-dayhead ${date===localDate()?"today":""}`} key={date} style={{gridColumn:i+2,gridRow:1}}><strong>{dateFromLocal(date).toLocaleDateString("en-US",{weekday:"short"})}</strong><span>{formatDate(date)}</span></div>)}
    {Array.from({length:SLOTS},(_,index) => <div key={`time-${index}`} className={`therapist-calendar-hour ${index%2?"half":""}`} style={{gridColumn:1,gridRow:index+2}}>{index%2===0 ? formatTime(`${String(CAL_START+index/2).padStart(2,"0")}:00`) : ""}</div>)}
    {days.map((date,i)=>{
      const shift=availability[weekdayForDate(date)];
      const block=blockFor(date);
      const before=shift?.enabled?calendarSlot(shift.start):0;
      const after=shift?.enabled?calendarSlot(shift.end):SLOTS;
      return <div key={`bg-${date}`} className="therapist-calendar-column" style={{gridColumn:i+2,gridRow:`2 / span ${SLOTS}`}}>
        {block ? <div className={`therapist-cal-blocked ${block.type}`}><Icon name="fas fa-ban"/> {block.label}</div> : <>
          {before>0 && <div className="therapist-cal-outside" style={{top:0,height:`${before/SLOTS*100}%`}}>Outside working hours</div>}
          {after<SLOTS && <div className="therapist-cal-outside" style={{top:`${after/SLOTS*100}%`,height:`${(SLOTS-after)/SLOTS*100}%`}}>Outside working hours</div>}
        </>}
      </div>;
    })}
    {active.map(a=>{
      const start=calendarSlot(a.time);
      const span=Math.max(1,Math.ceil(a.duration/30));
      if (start>=SLOTS) return null;
      return <button type="button" key={a.id} onClick={()=>onDetails(a)}
        aria-label={`${a.client}, ${a.service}, ${formatDate(a.date)}, ${formatTime(a.time)}, ${a.status}. Open details`}
        className={`therapist-calendar-event event-${a.status.toLowerCase().replaceAll(" ","-")}`}
        style={{gridColumn:days.indexOf(a.date)+2,gridRow:`${start+2} / span ${Math.min(span,SLOTS-start)}`}}>
        <strong>{a.client}</strong><span>{a.service}</span><small>{formatTime(a.time)} · {a.status}</small>
        {a.status === "Ongoing" && <Elapsed startedAt={a.startedAt}/> }
      </button>;
    })}
  </div></div>;
}
function SchedulePage({appointments,availability,requests,onDetails}) {
  const [date,setDate]=useState(localDate());
  const [mode,setMode]=useState("day");
  const days=mode==="week"?weekDays(date):[date];
  const list=appointments.filter(a=>days.includes(a.date)).sort((a,b)=>dateTimeMs(a)-dateTimeMs(b));
  const changeDate = delta => setDate(d=>shiftDay(d,delta*(mode==="week"?7:1)));
  return <div className="therapist-panel">
    <div className="therapist-panel-title"><div><h2>Assigned Schedule</h2><p>Select an appointment block to view its details.</p></div><div className="therapist-segmented" role="group" aria-label="Schedule view">
      {["day","week","list"].map(m=><button type="button" key={m} aria-pressed={mode===m} className={mode===m?"active":""} onClick={()=>setMode(m)}>{m==="day"?"Day":m==="week"?"Week":"List"}</button>)}
    </div></div>
    <div className="therapist-calendar-controls"><div className="therapist-date-arrows"><Btn variant="outline" aria-label="Previous date range" onClick={()=>changeDate(-1)}><Icon name="fas fa-chevron-left"/></Btn><Btn variant="outline" onClick={()=>setDate(localDate())}>Today</Btn><Btn variant="outline" aria-label="Next date range" onClick={()=>changeDate(1)}><Icon name="fas fa-chevron-right"/></Btn></div>
      <label>Selected date<input type="date" value={date} onChange={e=>setDate(e.target.value||localDate())}/></label><span className="therapist-range-caption">{days.length===1?formatDate(days[0]):`${formatDate(days[0])} – ${formatDate(days[6])}`}</span></div>
    <div className="therapist-legend" aria-label="Calendar status colors">{["Confirmed","Checked In","Ongoing","Completed","No-Show"].map(s=><span key={s}><i className={`therapist-legend-dot event-${s.toLowerCase().replaceAll(" ","-")}`}/>{s}</span>)}<span><i className="therapist-legend-dot is-blocked"/>Blocked / time off</span></div>
    {mode==="list" ? <AppointmentsTable rows={list} onDetails={onDetails} actions={false}/> : <Calendar days={days} appointments={appointments} availability={availability} requests={requests} onDetails={onDetails}/>}
    <p className="therapist-help">Approved time off and non-working hours appear as blocked. Pending requests are shown as tentative. This is a sample-data calendar.</p>
  </div>;
}
function HistoryTimeline({items}) {
  if (!items.length) return <div className="therapist-empty"><h4>No status changes yet</h4><p>Session updates will appear here after an action is confirmed.</p></div>;
  return <ol className="therapist-history-timeline">{[...items].sort((a,b)=>new Date(b.at)-new Date(a.at)).map(entry=><li key={entry.id}><div className="therapist-timeline-dot"><Icon name="fas fa-history"/></div><div className="therapist-timeline-card"><div className="therapist-timeline-top"><strong>{entry.booking} · {entry.client}</strong><time dateTime={entry.at}>{formatDateTime(entry.at)}</time></div><p>{entry.from} <Icon name="fas fa-long-arrow-alt-right"/> <strong>{entry.to}</strong></p><small>Changed by <strong>{entry.actor}</strong></small></div></li>)}</ol>;
}
function AppointmentsPage({appointments,history,onDetails,onChange,onEdit}) {
  const [date,setDate]=useState(localDate());
  const [range,setRange]=useState("day");
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState("All");
  const [tab,setTab]=useState("appointments");
  const days=weekDays(date);
  const inRange=a=>range==="all" || (range==="day"?a.date===date:a.date>=days[0]&&a.date<=days[6]);
  const relevant=appointments.filter(a=>inRange(a) && `${a.id} ${a.client} ${a.service}`.toLowerCase().includes(search.toLowerCase().trim()));
  const counts=Object.fromEntries(STATUSES.map(s=>[s, s==="All"?relevant.length:relevant.filter(a=>a.status===s).length]));
  const shown=relevant.filter(a=>status==="All"||a.status===status).sort((a,b)=>dateTimeMs(a)-dateTimeMs(b));
  return <div className="therapist-panel"><div className="therapist-panel-title"><div><h2>Appointment Management</h2><p>Check-In is performed by Receptionist; therapists manage sessions only.</p></div></div>
    <div className="therapist-tabs" role="group" aria-label="Appointment sections"><button type="button" className={tab==="appointments"?"active":""} aria-pressed={tab==="appointments"} onClick={()=>setTab("appointments")}>Appointment List</button><button type="button" className={tab==="history"?"active":""} aria-pressed={tab==="history"} onClick={()=>setTab("history")}>My Status History</button></div>
    {tab==="history" ? <HistoryTimeline items={history}/> : <>
      <div className="therapist-filter-bar"><div className="therapist-segmented" role="group" aria-label="Date range">{[["day","Daily"],["week","Weekly"],["all","All Dates"]].map(([value,label])=><button key={value} type="button" className={range===value?"active":""} aria-pressed={range===value} onClick={()=>setRange(value)}>{label}</button>)}</div>
        {range!=="all"&&<label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value||localDate())}/></label>}
        <label className="therapist-search-label">Search appointments<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Booking ID, client, service..."/></label>
      </div>
      <div className="therapist-chips" role="group" aria-label="Filter by appointment status">{STATUSES.map(s=><button type="button" key={s} className={status===s?"active":""} aria-pressed={status===s} onClick={()=>setStatus(s)}>{s}<span>{counts[s]}</span></button>)}</div>
      <div className="therapist-results-row"><p>{shown.length} appointment{shown.length!==1?"s":""} found {range==="day"?`on ${formatDate(date)}`:range==="week"?"in selected week":"across all dates"}</p><button type="button" className="therapist-text-button" onClick={()=>{setRange("day");setDate(localDate());setStatus("All");setSearch("");}}>Reset filters</button></div>
      <AppointmentsTable rows={shown} onDetails={onDetails} onChange={onChange} onEdit={onEdit}/>
    </>}
  </div>;
}
function DashboardPage({appointments,notifications,onDetails,onChange,now}) {
  const today=localDate();
  const rows=appointments.filter(a=>a.date===today).sort((a,b)=>dateTimeMs(a)-dateTimeMs(b));
  const future=appointments.filter(a=>["Confirmed","Checked In"].includes(a.status)&&dateTimeMs(a)+a.duration*60000>=now).sort((a,b)=>dateTimeMs(a)-dateTimeMs(b));
  const next=future[0]||null;
  const stats=[
    {label:"Today's Sessions",count:rows.length,icon:"far fa-calendar-alt"},
    {label:"Ready to Start",count:rows.filter(a=>a.status==="Checked In").length,icon:"fas fa-user-check"},
    {label:"Ongoing",count:rows.filter(a=>a.status==="Ongoing").length,icon:"fas fa-spa"},
    {label:"Completed",count:rows.filter(a=>a.status==="Completed").length,icon:"fas fa-check-circle"}
  ];
  return <>
    <div className="therapist-stats">{stats.map(s=><div className="therapist-stat" key={s.label}><div><p>{s.label}</p><h2>{s.count}</h2></div><span><Icon name={s.icon}/></span></div>)}</div>
    <div className="therapist-dashboard-columns"><div className="therapist-panel therapist-next"><h2>Next Appointment</h2>{next?<>
      <div className="therapist-next-main"><div><strong>{next.client}</strong><p>{next.service} · {next.duration} min</p><span>{formatDate(next.date)} at {formatTime(next.time)}</span></div><Status value={next.status}/></div>
      <div className="therapist-next-countdown"><Icon name="far fa-clock"/> {formatCountdown(dateTimeMs(next)-now)}</div><p className="therapist-muted"><strong>Special request:</strong> {next.specialRequest||"None"}</p>
      <div className="therapist-next-actions"><Btn onClick={()=>onDetails(next)} variant="outline">View details</Btn><Btn onClick={()=>onChange(next,"Ongoing")} disabled={next.status!=="Checked In"} title={next.status==="Checked In"?"Start session":"Client must be checked in by Receptionist"}>Start Session</Btn></div>
    </>:<div className="therapist-empty"><p>No upcoming assigned appointments.</p></div>}</div>
    <div className="therapist-panel therapist-notification-panel"><h2>Notifications</h2><div className="therapist-notification-list">{notifications.map(n=><div key={n.id} className="therapist-notification"><span><Icon name={n.icon}/></span><div><strong>{n.label}</strong><p>{n.text}</p><small>{n.when}</small></div></div>)}</div></div></div>
    <div className="therapist-panel"><div className="therapist-panel-title"><div><h2>Today's Appointments</h2><p>Sessions assigned to you for {formatDate(today)}.</p></div><Link to="/therapist/appointments" className="therapist-btn primary">View all appointments</Link></div><AppointmentsTable rows={rows} onDetails={onDetails} actions={false}/></div>
  </>;
}
function AvailabilityPage({availability,setAvailability,requests,appointments,onSubmitRequest,onCancelRequest,toast}) {
  const [offDate,setOffDate]=useState("");
  const [reason,setReason]=useState("");
  const [error,setError]=useState("");
  const assigned=appointments.filter(a=>a.date===offDate && !["No-Show"].includes(a.status));
  const validHours=Object.values(availability).every(v=>!v.enabled||toMinutes(v.start)<toMinutes(v.end));
  const update=(day,key,value)=>setAvailability(prev=>({...prev,[day]:{...prev[day],[key]:value}}));
  const submit=e=>{
    e.preventDefault();setError("");
    if (!offDate || offDate<localDate()) return setError("Choose today or a future date.");
    if (!reason.trim()) return setError("Please enter a reason for your request.");
    if (requests.some(r=>r.date===offDate&&r.status!=="Rejected")) return setError("You already have a Pending or Approved request for that date.");
    onSubmitRequest({date:offDate,reason:reason.trim(),conflicts:assigned.length},()=>{setOffDate("");setReason("");});
  };
  return <div className="therapist-availability-layout">
    <section className="therapist-panel"><h2>Regular Availability</h2><p className="therapist-muted">Choose working days and set the start and end time for each day.</p>
      <div className="therapist-hours-table"><div className="therapist-hours-header"><span>Day</span><span>Available</span><span>Start</span><span>End</span></div>
        {WEEKDAYS.map(day=><div className={`therapist-hours-row ${!availability[day].enabled?"inactive":""}`} key={day}>
          <strong>{day}</strong><label className="therapist-check"><input type="checkbox" checked={availability[day].enabled} onChange={e=>update(day,"enabled",e.target.checked)}/><span className="sr-only">Available on {day}</span></label>
          <label className="therapist-field-silent"><span className="sr-only">{day} start time</span><input type="time" value={availability[day].start} disabled={!availability[day].enabled} onChange={e=>update(day,"start",e.target.value)}/></label>
          <label className="therapist-field-silent"><span className="sr-only">{day} end time</span><input type="time" value={availability[day].end} disabled={!availability[day].enabled} onChange={e=>update(day,"end",e.target.value)}/></label>
        </div>)}
      </div>
      {!validHours && <p role="alert" className="therapist-field-error">End time must be later than start time for each selected day.</p>}
      <Btn disabled={!validHours} onClick={()=>toast("Availability saved for this frontend demo.")}>Save Availability</Btn>
    </section>
    <div><section className="therapist-panel"><h2>Request Time Off</h2><form className="therapist-form" onSubmit={submit}>
      <label htmlFor="therapist-off-date">Requested date <span>*</span><input id="therapist-off-date" type="date" required min={localDate()} value={offDate} onChange={e=>{setOffDate(e.target.value);setError("");}}/></label>
      <label htmlFor="therapist-off-reason">Reason <span>*</span><textarea id="therapist-off-reason" required rows={3} maxLength={500} value={reason} onChange={e=>{setReason(e.target.value);setError("");}} placeholder="Explain your request"/></label>
      {offDate && assigned.length>0 && <p className="therapist-inline-warning" role="status"><Icon name="fas fa-exclamation-triangle"/> You have {assigned.length} assigned appointment(s) on {formatDate(offDate)}. Your manager will need to review the conflict.</p>}
      {error && <p role="alert" className="therapist-field-error">{error}</p>}
      <button className="therapist-btn primary" type="submit">Submit Request</button>
    </form></section>
    <section className="therapist-panel"><h2>My Time-Off Requests</h2>{!requests.length?<div className="therapist-empty"><p>No time-off requests recorded.</p></div>:
      <div className="therapist-request-list">{[...requests].sort((a,b)=>b.date.localeCompare(a.date)).map(r=><div className="therapist-request" key={r.id}><div><strong>{formatDate(r.date)}</strong><p>{r.reason}</p></div><div className="therapist-request-actions"><Status value={r.status}/>{r.status==="Pending"&&<Btn variant="outline" onClick={()=>onCancelRequest(r)}>Cancel</Btn>}</div></div>)}</div>}
    </section></div>
  </div>;
}
function ProfilePage({name,role,staff,onLogout,toast}) {
  const [currentPw,setCurrentPw]=useState("");
  const [newPw,setNewPw]=useState("");
  const [confirmPw,setConfirmPw]=useState("");
  const [error,setError]=useState("");
  const submit=e=>{
    e.preventDefault();
    if (!currentPw||!newPw||!confirmPw) return setError("Complete all password fields.");
    if (newPw.length<8) return setError("New password must have at least 8 characters.");
    if (currentPw===newPw) return setError("Choose a different password.");
    if (newPw!==confirmPw) return setError("New password and confirmation do not match.");
    // No simulated success. Credentials must NEVER be sent or stored until real authentication exists.
    setCurrentPw("");setNewPw("");setConfirmPw("");setError("");
    toast("Password change is not available until the authentication backend is connected.","info");
  };
  return <div className="therapist-profile-grid"><section className="therapist-panel"><h2>Therapist Information</h2><div className="therapist-profile-avatar">{name.charAt(0)}</div>
    <div className="therapist-detail-pairs"><div><span>Name</span><strong>{name}</strong></div><div><span>Role</span><strong>{role}</strong></div><div><span>Specialties</span><strong>{staff.specialties.join(", ")}</strong></div><div><span>Email</span><strong>{staff.email}</strong></div><div><span>Contact number</span><strong>{staff.phone}</strong></div></div>
    <Btn variant="outline" onClick={onLogout}><Icon name="fas fa-sign-out-alt"/> Logout</Btn>
  </section><section className="therapist-panel"><h2>Change Password</h2><p className="therapist-muted">This form is prepared for staff authentication integration. It does not change a password yet.</p>
    <form className="therapist-form" onSubmit={submit} autoComplete="off">
      <label htmlFor="therapist-current-password">Current password<input id="therapist-current-password" type="password" autoComplete="current-password" required value={currentPw} onChange={e=>setCurrentPw(e.target.value)}/></label>
      <label htmlFor="therapist-new-password">New password<input id="therapist-new-password" type="password" minLength={8} required autoComplete="new-password" value={newPw} onChange={e=>setNewPw(e.target.value)}/></label>
      <label htmlFor="therapist-confirm-password">Confirm new password<input id="therapist-confirm-password" type="password" minLength={8} required autoComplete="new-password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)}/></label>
      {error&&<p className="therapist-field-error" role="alert">{error}</p>}
      <button className="therapist-btn primary" type="submit">Change Password</button>
    </form></section></div>;
}
export default function TherapistPortal() {
  const location=useLocation(), navigate=useNavigate();
  const {user}=useAuth();
  const role=String(user?.role||"").toLowerCase().replace(/[_-]/g," ").trim();
  const authenticatedTherapist=["therapist","massage therapist"].includes(role);
  const staffName=authenticatedTherapist ? String(user?.fullName||user?.name||[user?.firstName,user?.lastName].filter(Boolean).join(" ")).trim()||demoStaff.name : demoStaff.name;
  const [appointments,setAppointments]=useState(createAppointments);
  const [availability,setAvailability]=useState(createAvailability);
  const [timeOff,setTimeOff]=useState(createTimeOff);
  const [notifications]=useState(createNotifications);
  const [history,setHistory]=useState(()=>createHistory(staffName));
  const [modal,setModal]=useState(null);
  const [notes,setNotes]=useState(newNotes);
  const [onRequestComplete,setOnRequestComplete]=useState(null);
  const [toastMessage,setToastMessage]=useState(null);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [profileOpen,setProfileOpen]=useState(false);
  const menuRef=useRef(null);
  const [now,setNow]=useState(Date.now());
  const section=location.pathname.split("/")[2]||"dashboard";
  const page=TITLES[section]?section:"dashboard";

  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{setMobileOpen(false);setProfileOpen(false);},[location.pathname]);
  useEffect(()=>{if(!toastMessage)return;const timer=setTimeout(()=>setToastMessage(null),5000);return()=>clearTimeout(timer);},[toastMessage]);
  useEffect(()=>{
    const onPointer=e=>{if(menuRef.current&&!menuRef.current.contains(e.target))setProfileOpen(false);};
    const onKey=e=>{if(e.key==="Escape")setProfileOpen(false);};
    document.addEventListener("pointerdown",onPointer);document.addEventListener("keydown",onKey);
    return()=>{document.removeEventListener("pointerdown",onPointer);document.removeEventListener("keydown",onKey);};
  },[]);
  const showToast=(message,type="success")=>setToastMessage({message,type});
  const closeModal=()=>{setModal(null);setOnRequestComplete(null);};
  const currentAppointment=modal?.appointmentId?appointments.find(a=>a.id===modal.appointmentId):null;
  const handleLogout=()=>{
    // End the STAFF session; do not alter the separate Guest login session.
    sessionStorage.removeItem("zenoraStaffToken");
    sessionStorage.removeItem("zenoraStaffUser");
    navigate("/", { replace: true });
  };
  const staffDetails = authenticatedTherapist ? { ...demoStaff, email:user?.email||demoStaff.email, phone:user?.phone||demoStaff.phone, specialties:Array.isArray(user?.specialties)?user.specialties:demoStaff.specialties } : demoStaff;
  const addHistory=(a,from,to)=>setHistory(prev=>[{id:`H-${Date.now()}-${prev.length}`,booking:a.id,client:a.client,from,to,actor:`Me (${staffName})`,at:new Date().toISOString()},...prev]);
  const onDetails=a=>setModal({type:"details",appointmentId:a.id});
  const onChange=(a,next)=>{
    // A receptionist, not this portal, performs Check-In.
    if(next==="Ongoing"&&a.status==="Checked In")setModal({type:"start",appointmentId:a.id});
    else if(next==="Completed"&&a.status==="Ongoing"){setNotes(a.notes||newNotes());setModal({type:"end",appointmentId:a.id});}
    else if(next==="No-Show"&&["Confirmed","Checked In"].includes(a.status))setModal({type:"noShow",appointmentId:a.id});
    else showToast("That status transition is not permitted for Massage Therapists.","error");
  };
  const onEdit=a=>{if(a.status!=="Completed")return;setNotes(a.notes||newNotes());setModal({type:"editNotes",appointmentId:a.id});};
  const onConfirm=()=>{
    if(!modal)return;
    const a=currentAppointment;
    if(["start","end","noShow","editNotes"].includes(modal.type)&&!a){closeModal();return;}
    if(modal.type==="start"){
      if(a.status!=="Checked In")return closeModal();
      setAppointments(prev=>prev.map(p=>p.id===a.id?{...p,status:"Ongoing",startedAt:new Date().toISOString()}:p));
      addHistory(a,"Checked In","Ongoing");showToast("Session started. Elapsed timer is running in this demo.");
    }
    if(modal.type==="end"){
      if(a.status!=="Ongoing"||![notes.areas,notes.pressure,notes.observations,notes.recommendations].every(x=>String(x).trim()))return;
      setAppointments(prev=>prev.map(p=>p.id===a.id?{...p,status:"Completed",notes:{...notes}}:p));
      addHistory(a,"Ongoing","Completed");showToast("Session completed with required service notes (demo data).");
    }
    if(modal.type==="noShow"){
      if(!["Confirmed","Checked In"].includes(a.status))return closeModal();
      setAppointments(prev=>prev.map(p=>p.id===a.id?{...p,status:"No-Show"}:p));
      addHistory(a,a.status,"No-Show");showToast("No-Show recorded in the frontend demo.");
    }
    if(modal.type==="editNotes"){
      if(a.status!=="Completed"||![notes.areas,notes.pressure,notes.observations,notes.recommendations].every(x=>String(x).trim()))return;
      setAppointments(prev=>prev.map(p=>p.id===a.id?{...p,notes:{...notes}}:p));
      addHistory(a,"Service notes","Notes updated");showToast("Service notes updated in the frontend demo.");
    }
    if(modal.type==="cancelTimeOff"){
      setTimeOff(prev=>prev.filter(r=>r.id!==modal.id||r.status!=="Pending"));showToast("Pending request cancelled in the frontend demo.");
    }
    if(modal.type==="requestConflict"){
      setTimeOff(prev=>[{id:`TO-${Date.now()}`,date:modal.date,reason:modal.reason,status:"Pending"},...prev]);
      onRequestComplete?.();showToast("Time-off request submitted in this frontend demo; manager review is required.");
    }
    closeModal();
  };
  const submitTimeOff=(request,onSuccess)=>{
    if(request.conflicts){setOnRequestComplete(()=>onSuccess);setModal({type:"requestConflict",...request});return;}
    setTimeOff(prev=>[{id:`TO-${Date.now()}`,date:request.date,reason:request.reason,status:"Pending"},...prev]);
    onSuccess();showToast("Time-off request submitted in this frontend demo; manager review is required.");
  };
  // Preserve old /therapist/notes bookmarks. Notes are edited via appointment actions only.
  if(section==="notes")return <Navigate to="/therapist/appointments" replace/>;
  return <div className="therapist-layout">
    <TherapistSidebar mobileOpen={mobileOpen} onClose={()=>setMobileOpen(false)}/>
    <main className="therapist-main"><header className="therapist-topbar">
      <button type="button" className="therapist-menu-btn" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={()=>setMobileOpen(true)}><Icon name="fas fa-bars"/></button>
      <span className="therapist-workspace-label">Therapist Workspace</span>
      <div className="therapist-user-menu-wrap" ref={menuRef}>
        <button className="therapist-account-trigger" type="button" aria-expanded={profileOpen} aria-haspopup="menu" onClick={()=>setProfileOpen(v=>!v)}>
          <span className="therapist-avatar" aria-hidden="true">{staffName.charAt(0).toUpperCase()}</span><span className="therapist-user-text"><strong>{staffName}</strong><small>Massage Therapist</small></span><Icon name={profileOpen?"fas fa-chevron-up":"fas fa-chevron-down"}/>
        </button>{profileOpen&&<div className="therapist-account-menu" role="menu" aria-label="Staff account menu"><Link role="menuitem" to="/therapist/profile"><Icon name="far fa-user"/> My Profile</Link><button role="menuitem" type="button" onClick={handleLogout}><Icon name="fas fa-sign-out-alt"/> Logout</button></div>}
      </div>
    </header>
    <div className="therapist-content"><div className="therapist-intro"><h1>{TITLES[page][0]}</h1><p>{TITLES[page][1]}</p></div>
      {page==="dashboard"&&<DashboardPage appointments={appointments} notifications={notifications} onDetails={onDetails} onChange={onChange} now={now}/>}
      {page==="schedule"&&<SchedulePage appointments={appointments} availability={availability} requests={timeOff} onDetails={onDetails}/>}
      {page==="appointments"&&<AppointmentsPage appointments={appointments} history={history} onDetails={onDetails} onChange={onChange} onEdit={onEdit}/>}
      {page==="availability"&&<AvailabilityPage availability={availability} setAvailability={setAvailability} requests={timeOff} appointments={appointments} onSubmitRequest={submitTimeOff} onCancelRequest={r=>setModal({type:"cancelTimeOff",id:r.id,date:r.date})} toast={showToast}/>}
      {page==="profile"&&<ProfilePage name={staffName} role="Massage Therapist" staff={staffDetails} onLogout={handleLogout} toast={showToast}/>}
    </div></main>
    {toastMessage&&<div className={`therapist-toast ${toastMessage.type}`} role="status"><Icon name={toastMessage.type==="error"?"fas fa-exclamation-triangle":"fas fa-check-circle"}/><span>{toastMessage.message}</span><button type="button" aria-label="Dismiss message" onClick={()=>setToastMessage(null)}>×</button></div>}
    {modal&&<ModalContent modal={modal} appointment={currentAppointment} notes={notes} setNotes={setNotes} onConfirm={onConfirm} onClose={closeModal}/>}
  </div>;
}
