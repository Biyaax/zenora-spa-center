import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import TherapistSidebar from "../../components/TherapistSidebar";

// UI DEMO ONLY. Replace sample data and local state with authenticated API responses.
const sampleAppointments = [
  { id: "APT-1001", date: "2026-10-27", time: "09:00", client: "Bea Mendoza", service: "Body Massage", duration: 60, status: "Confirmed", request: "Prefers gentle pressure", notes: "" },
  { id: "APT-1003", date: "2026-10-27", time: "14:00", client: "Carla Gomez", service: "Stone Therapy", duration: 75, status: "Checked In", request: "Avoid shoulder area", notes: "" },
  { id: "APT-1007", date: "2026-10-28", time: "11:00", client: "Nina Torres", service: "Aromatherapy", duration: 60, status: "Confirmed", request: "Lavender oil preferred", notes: "" },
  { id: "APT-1008", date: "2026-10-29", time: "15:30", client: "Paolo Reyes", service: "Swedish Massage", duration: 60, status: "Confirmed", request: "None", notes: "" },
];
const pages = {
  dashboard: ["Dashboard", "Your personal workday overview"],
  schedule: ["My Schedule", "Review your daily and weekly appointments"],
  appointments: ["My Appointments", "Review assigned clients and update session statuses"],
  notes: ["Service Notes", "Record notes after each completed service"],
  availability: ["Availability & Time-Off", "Manage your available days and send time-off requests"],
};
const formatDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
const formatTime = (value) => new Date(`2026-01-01T${value}:00`).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
const weekOf = (dateString) => {
  const d = new Date(`${dateString}T00:00:00`);
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  const start = new Date(d);
  const end = new Date(d); end.setDate(start.getDate() + 6);
  const localDate = (v) => `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
  return [localDate(start), localDate(end)];
};
function Badge({ status }) {
  return <span className={`therapist-badge badge-${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span>;
}
function AppointmentTable({ rows, onUpdate, showActions = false }) {
  if (!rows.length) return <p className="therapist-empty">No appointments match your selection.</p>;
  return <div className="therapist-table-wrap"><table className="therapist-table">
    <thead><tr><th>Booking ID</th><th>Date / Time</th><th>Client</th><th>Service</th><th>Special Request</th><th>Status</th>{showActions && <th>Actions</th>}</tr></thead>
    <tbody>{rows.map(a => <tr key={a.id}>
      <td><strong>{a.id}</strong></td><td>{formatDate(a.date)}<small>{formatTime(a.time)}</small></td><td><strong>{a.client}</strong></td><td>{a.service}<small>{a.duration} min</small></td><td>{a.request}</td><td><Badge status={a.status} /></td>
      {showActions && <td><div className="therapist-inline-actions">
        {a.status === "Checked In" && <button className="therapist-btn primary" onClick={() => onUpdate(a.id, "Ongoing")}>Start</button>}
        {a.status === "Ongoing" && <button className="therapist-btn primary" onClick={() => onUpdate(a.id, "Completed")}>Complete</button>}
        {["Confirmed", "Checked In"].includes(a.status) && <button className="therapist-btn outline" onClick={() => onUpdate(a.id, "No-Show")}>No-Show</button>}
        {["Completed", "No-Show"].includes(a.status) && <span className="therapist-subtle">No actions</span>}
        {a.status === "Confirmed" && <span className="therapist-subtle">Awaiting check-in</span>}
      </div></td>}
    </tr>)}</tbody>
  </table></div>;
}
export default function TherapistPortal() {
  const location = useLocation();
  const section = location.pathname.split("/")[2] || "dashboard";
  const current = pages[section] ? section : "dashboard";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [appointments, setAppointments] = useState(sampleAppointments);
  const [selectedDate, setSelectedDate] = useState("2026-10-27");
  const [view, setView] = useState("daily");
  const [query, setQuery] = useState("");
  const [editingNotes, setEditingNotes] = useState({});
  const [notice, setNotice] = useState("");
  const [availableDays, setAvailableDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [timeOff, setTimeOff] = useState([]);
  const [offDate, setOffDate] = useState("");
  const [offReason, setOffReason] = useState("");

  const [weekStart, weekEnd] = weekOf(selectedDate);
  const visibleRows = useMemo(() => appointments.filter(a => {
    const dateMatch = view === "daily" ? a.date === selectedDate : (a.date >= weekStart && a.date <= weekEnd);
    const textMatch = `${a.id} ${a.client} ${a.service} ${a.status}`.toLowerCase().includes(query.toLowerCase());
    return dateMatch && textMatch;
  }).sort((a,b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)), [appointments, query, selectedDate, view, weekStart, weekEnd]);
  const todayRows = appointments.filter(a => a.date === "2026-10-27");
  const updateStatus = (id, status) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setNotice(`${id} marked ${status} in this frontend preview only.`);
  };
  const saveNote = (id) => {
    const note = (editingNotes[id] ?? appointments.find(a => a.id === id)?.notes ?? "").trim();
    if (!note) { setNotice("Please enter a service note before saving."); return; }
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, notes: note } : a));
    setNotice(`Notes for ${id} saved in this frontend preview only.`);
  };
  return <div className="therapist-layout">
    <TherapistSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    <main className="therapist-main">
      <header className="therapist-topbar">
        <div className="therapist-heading"><button className="therapist-menu-btn" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><i className="fas fa-bars" /></button><div><p>Massage Therapist Portal</p><h3>{pages[current][0]}</h3></div></div>
        <div className="therapist-user"><span className="therapist-avatar">T</span><div><strong>Therapist</strong><small>Staff Portal</small></div></div>
      </header>
      <div className="therapist-content">
        <div className="therapist-intro"><h1>{current === "dashboard" ? "Good day!" : pages[current][0]}</h1><p>{pages[current][1]}</p></div>
        <div className="therapist-demo-label"><i className="fas fa-info-circle" /> UI preview with sample appointments. Changes aren't stored in the database.</div>
        {notice && <div className="therapist-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}
        {current === "dashboard" && <>
          <div className="therapist-stats">
            {[["Today's Sessions", todayRows.length, "far fa-calendar-alt"], ["Ready to Start", todayRows.filter(a => a.status === "Checked In").length, "far fa-clock"], ["Ongoing", todayRows.filter(a => a.status === "Ongoing").length, "fas fa-spa"], ["Completed", todayRows.filter(a => a.status === "Completed").length, "fas fa-check-circle"]].map(([label, value, icon]) => <div className="therapist-stat" key={label}><div><p>{label}</p><h2>{value}</h2></div><span><i className={icon} /></span></div>)}
          </div>
          <div className="therapist-panel"><div className="therapist-panel-title"><div><h4>Today's Appointments</h4><p>Sessions assigned to you for October 27, 2026.</p></div><Link to="/therapist/appointments" className="therapist-btn primary">View Appointments</Link></div><AppointmentTable rows={todayRows}/></div>
          <div className="therapist-actions"><Link to="/therapist/schedule" className="therapist-action"><i className="far fa-calendar-alt"/><div><h5>My Schedule</h5><p>Review upcoming appointments.</p></div></Link><Link to="/therapist/notes" className="therapist-action"><i className="far fa-sticky-note"/><div><h5>Service Notes</h5><p>Record post-session notes.</p></div></Link><Link to="/therapist/availability" className="therapist-action"><i className="far fa-clock"/><div><h5>Availability</h5><p>Manage days and time-off requests.</p></div></Link></div>
        </>}
        {(current === "schedule" || current === "appointments") && <div className="therapist-panel"><div className="therapist-panel-title"><div><h4>{current === "schedule" ? "Assigned Schedule" : "Appointment List"}</h4><p>Only sessions assigned to this sample therapist are shown.</p></div></div>
          <div className="therapist-filters"><div className="therapist-switch"><button className={view === "daily" ? "selected" : ""} onClick={() => setView("daily")}>Daily</button><button className={view === "weekly" ? "selected" : ""} onClick={() => setView("weekly")}>Weekly</button></div><label>Date <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}/></label><label className="therapist-search">Search <input placeholder="Client, booking, service..." value={query} onChange={e => setQuery(e.target.value)}/></label></div>
          <AppointmentTable rows={visibleRows} showActions={current === "appointments"} onUpdate={updateStatus}/></div>}
        {current === "notes" && <div className="therapist-panel"><div className="therapist-panel-title"><div><h4>Session Notes</h4><p>Only completed appointments can receive post-service notes.</p></div></div>{appointments.filter(a => a.status === "Completed").length === 0 ? <p className="therapist-empty">No completed sessions yet. Mark an ongoing session completed in My Appointments to add notes.</p> : appointments.filter(a => a.status === "Completed").map(a => <div className="therapist-note-entry" key={a.id}><div><strong>{a.client} — {a.service}</strong><small>{a.id} · {formatDate(a.date)}</small></div><label htmlFor={`note-${a.id}`}>Service notes</label><textarea id={`note-${a.id}`} rows="3" value={editingNotes[a.id] ?? a.notes} onChange={e => setEditingNotes(v => ({...v, [a.id]:e.target.value}))} placeholder="Enter factual service notes..."/><button className="therapist-btn primary" onClick={() => saveNote(a.id)}>Save Notes (Preview)</button></div>)}</div>}
        {current === "availability" && <div className="therapist-two-col"><div className="therapist-panel"><h4>Regular Availability</h4><p className="therapist-subtle">Select your available days (demo only).</p><div className="therapist-day-options">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day => <label key={day}><input type="checkbox" checked={availableDays.includes(day)} onChange={e => setAvailableDays(cur => e.target.checked ? [...cur, day] : cur.filter(x => x !== day))}/> {day}</label>)}</div><button className="therapist-btn primary" onClick={() => setNotice("Availability selection kept in this page preview only.")}>Save Availability (Preview)</button></div>
          <div className="therapist-panel"><h4>Request Time Off</h4><form className="therapist-form" onSubmit={e => {e.preventDefault(); if (!offDate || !offReason.trim()) return; setTimeOff(rows => [...rows, {id: rows.length + 1,date:offDate,reason:offReason.trim(),status:"Pending"}]); setOffDate("");setOffReason("");setNotice("Time-off request added to the UI preview; it was not submitted to a manager.");}}><label>Date <input type="date" required value={offDate} onChange={e => setOffDate(e.target.value)} /></label><label>Reason <textarea required rows="3" value={offReason} onChange={e => setOffReason(e.target.value)} placeholder="Reason for requested time off"/></label><button className="therapist-btn primary" type="submit">Submit Request (Preview)</button></form>{timeOff.length > 0 && <div className="therapist-requests"><h5>Preview requests</h5>{timeOff.map(t => <p key={t.id}>{formatDate(t.date)} — {t.reason} <Badge status={t.status}/></p>)}</div>}</div></div>}
      </div>
    </main>
  </div>;
}
