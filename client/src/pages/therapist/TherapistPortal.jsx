import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import TherapistSidebar from "../../components/TherapistSidebar";

// FRONTEND SAMPLE ONLY. Do not use these records for real client or reporting data.
// Replace with authenticated, therapist-scoped API responses during backend integration.
const dateOffset = (days = 0) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const sampleAppointments = [
  { id: "APT-1001", date: dateOffset(0), time: "09:00", client: "Bea Mendoza", phone: "0917 000 0001", service: "Body Massage", duration: 60, status: "Confirmed", request: "Prefers gentle pressure", notes: "" },
  { id: "APT-1003", date: dateOffset(0), time: "14:00", client: "Carla Gomez", phone: "0917 000 0003", service: "Stone Therapy", duration: 75, status: "Checked In", request: "Avoid shoulder area", notes: "" },
  { id: "APT-1007", date: dateOffset(1), time: "11:00", client: "Nina Torres", phone: "0917 000 0007", service: "Aromatherapy", duration: 60, status: "Confirmed", request: "Lavender oil preferred", notes: "" },
  { id: "APT-1008", date: dateOffset(2), time: "15:30", client: "Paolo Reyes", phone: "0917 000 0008", service: "Swedish Massage", duration: 60, status: "Confirmed", request: "None", notes: "" },
  { id: "APT-1009", date: dateOffset(-1), time: "16:00", client: "Mia Ramos", phone: "0917 000 0009", service: "Body Massage", duration: 60, status: "Completed", request: "Focus on back and shoulders", notes: "" },
  { id: "APT-1010", date: dateOffset(-1), time: "10:00", client: "Leo Tan", phone: "0917 000 0010", service: "Facial Therapy", duration: 45, status: "No-Show", request: "None", notes: "" },
  { id: "APT-1011", date: dateOffset(-1), time: "08:30", client: "Ria Cruz", phone: "0917 000 0011", service: "Foot Massage", duration: 30, status: "Confirmed", request: "Gentle pressure", notes: "" },
];
const pages = {
  dashboard: ["Dashboard", "Your personal workday overview"],
  schedule: ["My Schedule", "Review your daily and weekly appointments"],
  appointments: ["My Appointments", "Review clients, manage session statuses, and see your session history"],
  availability: ["Availability & Time-Off", "Manage your available days and submit time-off requests"],
};
const statuses = ["All", "Confirmed", "Checked In", "Ongoing", "Completed", "No-Show"];
const formatDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
const formatTime = (value) => new Date(`2026-01-01T${value}:00`).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
const formatTimestamp = (value) => new Date(value).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const weekOf = (dateString) => {
  const start = new Date(`${dateString}T00:00:00`);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const local = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return [local(start), local(end)];
};
const scheduledEndPassed = (a) => new Date(`${a.date}T${a.time}:00`).getTime() + a.duration * 60000 <= Date.now();

function Badge({ status }) {
  return <span className={`therapist-badge badge-${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span>;
}

// One compact action menu per appointment. Render the popover in a portal so
// the responsive horizontally scrolling table does not clip the dropdown.
function AppointmentActions({ appointment, onViewDetails, onRequestStatus, onEditNotes, allowStatusChanges }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = `therapist-actions-${appointment.id}`;

  const options = [
    { label: "View details", icon: "far fa-eye", action: () => onViewDetails(appointment) },
  ];
  if (allowStatusChanges) {
    if (appointment.status === "Checked In") {
      options.push({ label: "Start session", icon: "fas fa-play", action: () => onRequestStatus(appointment, "Ongoing") });
    } else if (appointment.status === "Ongoing") {
      options.push({ label: "Complete session", icon: "far fa-check-circle", action: () => onRequestStatus(appointment, "Completed") });
    } else if (appointment.status === "Confirmed" && scheduledEndPassed(appointment)) {
      options.push({ label: "Mark No-Show", icon: "far fa-calendar-times", action: () => onRequestStatus(appointment, "No-Show") });
    } else if (appointment.status === "Completed") {
      options.push({ label: "Edit notes", icon: "far fa-edit", action: () => onEditNotes(appointment) });
    }
  }

  const openMenu = () => {
    if (isOpen) { setIsOpen(false); return; }
    const rect = triggerRef.current.getBoundingClientRect();
    // Keep the menu on screen even near the table's right or lower edge.
    const menuWidth = 188;
    const approximateHeight = 12 + options.length * 42;
    const placeAbove = window.innerHeight - rect.bottom < approximateHeight + 12 && rect.top > approximateHeight + 12;
    setPosition({
      top: placeAbove ? rect.top - approximateHeight - 6 : rect.bottom + 6,
      left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
    });
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(event) {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setIsOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") { setIsOpen(false); triggerRef.current?.focus(); }
    }
    function onViewportChange() { setIsOpen(false); }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [isOpen]);

  return <>
    <button type="button" ref={triggerRef} className="therapist-actions-trigger"
      aria-haspopup="menu" aria-expanded={isOpen} aria-controls={isOpen ? menuId : undefined}
      aria-label={`Actions for ${appointment.client}, ${appointment.id}`}
      onClick={openMenu}>
      Actions <i className="fas fa-chevron-down" aria-hidden="true" />
    </button>
    {isOpen && createPortal(
      <div id={menuId} ref={menuRef} role="menu" aria-label={`Actions for ${appointment.id}`}
        className="therapist-actions-popover" style={{ top: position.top, left: position.left }}>
        {options.map((option, index) => <button key={option.label} type="button" role="menuitem"
          className={`therapist-actions-item ${index === 1 ? "therapist-actions-item-separated" : ""}`}
          onClick={() => { setIsOpen(false); option.action(); }}>
          <i className={option.icon} aria-hidden="true" /> {option.label}
        </button>)}
      </div>, document.body)
    }
  </>;
}

function AppointmentTable({ rows, onRequestStatus, onEditNotes, onViewDetails, allowActions = false }) {
  if (!rows.length) return <div className="therapist-empty">No appointments match these filters. Choose All Dates or another status to view more sessions.</div>;
  return <div className="therapist-table-wrap">
    <table className="therapist-table">
      <thead><tr><th>Booking ID</th><th>Date / Time</th><th>Client</th><th>Service</th><th>Special Request</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>{rows.map(a => <tr key={a.id}>
        <td><strong>{a.id}</strong></td>
        <td>{formatDate(a.date)}<small>{formatTime(a.time)}</small></td>
        <td><strong>{a.client}</strong></td>
        <td>{a.service}<small>{a.duration} min</small></td>
        <td>{a.request || "None"}</td>
        <td><Badge status={a.status} /></td>
        <td>
          <AppointmentActions appointment={a} onViewDetails={onViewDetails}
            onRequestStatus={onRequestStatus} onEditNotes={onEditNotes} allowStatusChanges={allowActions} />
        </td>
      </tr>)}</tbody>
    </table>
  </div>;
}

// Read-only appointment information; editing stays exclusively in Actions > Edit notes.
function AppointmentDetailsDialog({ appointment, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => { closeRef.current?.focus(); }, []);
  if (!appointment) return null;
  return <div className="therapist-dialog-backdrop" role="presentation"
    onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="therapist-details-title"
      className="therapist-dialog therapist-details-dialog">
      <div className="therapist-details-heading">
        <div><p className="therapist-details-eyebrow">{appointment.id}</p><h3 id="therapist-details-title">Appointment Details</h3></div>
        <button type="button" className="therapist-details-close" aria-label="Close appointment details" onClick={onClose}>×</button>
      </div>
      <div className="therapist-details-grid">
        <div><span>Client</span><strong>{appointment.client}</strong></div>
        <div><span>Contact Number</span><strong>{appointment.phone || "—"}</strong></div>
        <div><span>Service</span><strong>{appointment.service}</strong></div>
        <div><span>Duration</span><strong>{appointment.duration} minutes</strong></div>
        <div><span>Date</span><strong>{formatDate(appointment.date)}</strong></div>
        <div><span>Time</span><strong>{formatTime(appointment.time)}</strong></div>
        <div className="therapist-details-full"><span>Status</span><Badge status={appointment.status} /></div>
        <div className="therapist-details-full"><span>Special Request</span><p>{appointment.request || "None"}</p></div>
        {appointment.status === "Completed" && <div className="therapist-details-full therapist-notes-readonly">
          <span>Service Notes</span><p>{appointment.notes.trim() || "No service notes recorded yet."}</p>
        </div>}
      </div>
      <div className="therapist-dialog-actions"><button ref={closeRef} type="button" className="therapist-btn primary" onClick={onClose}>Close</button></div>
    </section>
  </div>;
}

function ConfirmDialog({ pending, onConfirm, onCancel, onNoteChange, cancelRef }) {
  if (!pending) return null;
  const title = pending.kind === "completeWithNotes" ? "Complete session and record notes"
    : pending.kind === "undo" ? "Undo the last status change?"
    : pending.kind === "status" ? `Confirm ${pending.next} status?`
    : pending.kind === "editNote" ? "Edit service notes"
    : pending.kind === "availability" ? "Save regular availability?"
    : "Submit time-off request?";
  const details = pending.kind === "completeWithNotes"
    ? `Confirm that ${pending.appointment.client}'s ${pending.appointment.service} session (${pending.appointment.id}) is finished. Record the service notes before completing the session.`
    : pending.kind === "status"
    ? `${pending.appointment.client} (${pending.appointment.id}) will change from ${pending.appointment.status} to ${pending.next}.`
    : pending.kind === "undo" ? `${pending.action.id} will return from ${pending.action.next} to ${pending.action.previous}.`
    : pending.kind === "editNote" ? `Review and update the service notes for ${pending.appointment.client} (${pending.appointment.id}).`
    : pending.kind === "timeOff" ? `Add a time-off request for ${formatDate(pending.date)}?`
    : "Update your selected regular working days?";
  return <div className="therapist-dialog-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onCancel(); }}>
    <section role="alertdialog" aria-modal="true" aria-labelledby="therapist-dialog-title" aria-describedby="therapist-dialog-description" className="therapist-dialog">
      <div className="therapist-dialog-heading"><span className="therapist-dialog-icon"><i className="fas fa-question" aria-hidden="true" /></span><h3 id="therapist-dialog-title">{title}</h3></div>
      <p id="therapist-dialog-description">{details}</p>
      {pending.kind === "status" && pending.next === "No-Show" && <p className="therapist-warning">A no-show should only be recorded after the scheduled session has elapsed and attendance has been verified.</p>}
      {(pending.kind === "completeWithNotes" || pending.kind === "editNote") && <div className="therapist-completion-form">
        <label htmlFor="therapist-session-note-input">Service notes <span aria-hidden="true">*</span></label>
        <textarea id="therapist-session-note-input" rows="5" required autoFocus maxLength={2000}
          value={pending.note || ""}
          onChange={event => onNoteChange(event.target.value)}
          placeholder="Briefly document the service provided and relevant session observations." />
        <small>{pending.kind === "completeWithNotes"
          ? "Required to complete the session. You can review this note in View details, or edit it from the appointment Actions menu."
          : "Updated notes will appear in View details."}</small>
      </div>}
      <div className="therapist-dialog-actions">
        <button type="button" className="therapist-btn neutral" ref={cancelRef} onClick={onCancel}>Cancel</button>
        <button type="button" className="therapist-btn primary" onClick={onConfirm} disabled={["completeWithNotes", "editNote"].includes(pending.kind) && !(pending.note || "").trim()}>{pending.kind === "completeWithNotes" ? "Complete Session" : pending.kind === "editNote" ? "Save Changes" : "Confirm"}</button>
      </div>
    </section>
  </div>;
}

export default function TherapistPortal() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  // Show the authenticated therapist's name when staff login is integrated.
  // Current AuthContext handles Guest users, so never display a Guest identity as a therapist.
  const role = String(user?.role ?? "").replace(/[_-]/g, " ").trim().toLowerCase();
  const isTherapistAccount = ["therapist", "massage therapist"].includes(role);
  const signedInName = isTherapistAccount
    ? String(user?.fullName || user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ")).trim()
    : "";
  const therapistName = signedInName || "Therapist Name";
  const therapistInitial = signedInName ? signedInName.charAt(0).toUpperCase() : "T";
  const accountMenuRef = useRef(null);
  const cancelRef = useRef(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const section = location.pathname.split("/")[2] || "dashboard";
  const current = pages[section] ? section : "dashboard";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [appointments, setAppointments] = useState(sampleAppointments);
  const [selectedDate, setSelectedDate] = useState(dateOffset(0));
  const [view, setView] = useState("daily");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [appointmentTab, setAppointmentTab] = useState("list");
  const [history, setHistory] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [pending, setPending] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const [notice, setNotice] = useState({ page: "", message: "" });
  const [availableDays, setAvailableDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [timeOff, setTimeOff] = useState([]);
  const [offDate, setOffDate] = useState("");
  const [offReason, setOffReason] = useState("");

  useEffect(() => {
    function onOutside(event) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) setAccountOpen(false);
    }
    function onKey(event) {
      if (event.key === "Escape") { setAccountOpen(false); setPending(null); setDetailsId(null); }
    }
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onOutside); document.removeEventListener("keydown", onKey); };
  }, []);
  useEffect(() => { if (pending && !["completeWithNotes", "editNote"].includes(pending.kind)) cancelRef.current?.focus(); }, [pending]);

  const showNotice = (message) => setNotice({ page: current, message });
  const handleLogout = () => {
    // Frontend-only: backend teammates must replace with authenticated staff logout/session invalidation.
    logout(); setAccountOpen(false); navigate("/", { replace: true });
  };
  const [weekStart, weekEnd] = weekOf(selectedDate);
  const visibleRows = useMemo(() => appointments.filter(a => {
    const dateMatch = view === "all" || (view === "daily" ? a.date === selectedDate : a.date >= weekStart && a.date <= weekEnd);
    const matchText = `${a.id} ${a.client} ${a.service} ${a.status}`.toLowerCase().includes(query.trim().toLowerCase());
    return dateMatch && matchText && (statusFilter === "All" || a.status === statusFilter);
  }).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)), [appointments, selectedDate, weekStart, weekEnd, query, view, statusFilter]);
  const todayRows = appointments.filter(a => a.date === dateOffset(0));
  const byStatus = (status) => appointments.filter(a => a.status === status).length;
  const selectStatus = (status) => { setStatusFilter(status); if (status !== "All") setView("all"); };

  const confirmPending = () => {
    if (!pending) return;
    if (pending.kind === "completeWithNotes") {
      const { appointment } = pending;
      const latest = appointments.find(a => a.id === appointment.id);
      const text = (pending.note || "").trim();
      if (!latest || latest.status !== "Ongoing") {
        showNotice("This appointment has changed. Review its status before completing it.");
      } else if (!text) {
        showNotice("Enter a service note before completing the session.");
        return;
      } else {
        setAppointments(prev => prev.map(a => a.id === appointment.id ? { ...a, status: "Completed", notes: text } : a));
        setHistory(prev => [{ key: `${Date.now()}-${prev.length}`, id: appointment.id, client: appointment.client, previous: "Ongoing", next: "Completed", action: "Session completed · notes recorded", at: new Date().toISOString() }, ...prev]);
        // A completed session containing notes must not be silently undone.
        setLastAction(null);
        showNotice(`${appointment.id} marked Completed with service notes (sample data only).`);
      }
    } else if (pending.kind === "status") {
      const { appointment, next } = pending;
      const latest = appointments.find(a => a.id === appointment.id);
      if (!latest || latest.status !== appointment.status) {
        showNotice("This appointment has changed. Please review it before trying again.");
      } else if (next === "No-Show" && !scheduledEndPassed(latest)) {
        showNotice("The scheduled session has not ended. No-Show is not available yet.");
      } else {
        setAppointments(prev => prev.map(a => a.id === appointment.id ? { ...a, status: next } : a));
        setHistory(prev => [{ key: `${Date.now()}-${prev.length}`, id: appointment.id, client: appointment.client, previous: appointment.status, next, action: "Changed", at: new Date().toISOString() }, ...prev]);
        setLastAction({ id: appointment.id, previous: appointment.status, next });
        showNotice(`${appointment.id} updated to ${next}. This is a local sample change.`);
      }
    } else if (pending.kind === "undo") {
      const action = pending.action;
      const latest = appointments.find(a => a.id === action.id);
      if (!latest || latest.status !== action.next) {
        showNotice("Undo is no longer available for this appointment.");
      } else if (action.next === "Completed" && latest.notes.trim()) {
        showNotice("Status correction needs review because service notes are already recorded.");
      } else {
        setAppointments(prev => prev.map(a => a.id === action.id ? { ...a, status: action.previous } : a));
        setHistory(prev => [{ key: `${Date.now()}-${prev.length}`, id: action.id, client: latest.client, previous: action.next, next: action.previous, action: "Undid change", at: new Date().toISOString() }, ...prev]);
        showNotice(`${action.id} restored to ${action.previous}. The correction is recorded in this page's history.`);
      }
      setLastAction(null);
    } else if (pending.kind === "editNote") {
      const { appointment } = pending;
      const latest = appointments.find(a => a.id === appointment.id);
      const text = (pending.note || "").trim();
      if (!latest || latest.status !== "Completed") {
        showNotice("Only completed appointments can have their service notes edited.");
      } else if (!text) {
        showNotice("Enter a service note before saving.");
        return;
      } else if (text !== latest.notes) {
        setAppointments(prev => prev.map(a => a.id === appointment.id ? { ...a, notes: text } : a));
        setHistory(prev => [{ key: `${Date.now()}-${prev.length}`, id: appointment.id, client: appointment.client, previous: "—", next: "Notes updated", action: latest.notes ? "Service note edited" : "Service note added", at: new Date().toISOString() }, ...prev]);
        setLastAction(prev => prev?.id === appointment.id ? null : prev);
        showNotice(`Service notes for ${appointment.id} updated (sample data only).`);
      }
    } else if (pending.kind === "availability") {
      showNotice("Availability updated for this session only.");
    } else if (pending.kind === "timeOff") {
      setTimeOff(prev => [...prev, { id: Date.now(), date: pending.date, reason: pending.reason, status: "Pending" }]);
      setOffDate(""); setOffReason("");
      showNotice("Time-off request added to your sample list; it has not been sent to a manager.");
    }
    setPending(null);
  };

  // Keep old bookmarked /therapist/notes URLs from rendering a blank page.
  // App.jsx can remove the old route after teammates merge these UI changes.
  if (section === "notes") return <Navigate to="/therapist/appointments" replace />;

  return <div className="therapist-layout">
    <TherapistSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    <main className="therapist-main">
      <header className="therapist-topbar">
        <div className="therapist-heading"><button type="button" className="therapist-menu-btn" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><i className="fas fa-bars" /></button></div>
        <div className="therapist-user">
          <div className="therapist-user-menu-wrap" ref={accountMenuRef}>
            <button type="button" className="therapist-account-trigger" aria-expanded={accountOpen} aria-haspopup="true" aria-controls="therapist-account-options" onClick={() => setAccountOpen(open => !open)}>
              <span className="therapist-avatar" aria-hidden="true">{therapistInitial}</span><span className="therapist-user-text"><strong>{therapistName}</strong><small>Massage Therapist</small></span><i className={`fas fa-chevron-${accountOpen ? "up" : "down"} therapist-account-caret`} aria-hidden="true" />
            </button>
            {accountOpen && <div id="therapist-account-options" className="therapist-account-menu therapist-account-menu-compact" role="menu" aria-label="Therapist account options">
              <button type="button" role="menuitem" className="therapist-account-link therapist-account-logout" onClick={handleLogout}><i className="fas fa-sign-out-alt" aria-hidden="true" />Logout</button>
            </div>}
          </div>
        </div>
      </header>
      <div className="therapist-content">
        <div className="therapist-intro"><h1>{current === "dashboard" ? "Good day!" : pages[current][0]}</h1><p>{pages[current][1]}</p></div>
        {notice.page === current && notice.message && <div className="therapist-notice" role="status">{notice.message}<button type="button" onClick={() => setNotice({ page: "", message: "" })} aria-label="Dismiss notification">×</button></div>}

        {current === "dashboard" && <>
          <div className="therapist-stats">
            {[["Today's Sessions", todayRows.length, "far fa-calendar-alt"], ["Ready to Start", todayRows.filter(a => a.status === "Checked In").length, "far fa-clock"], ["Ongoing", todayRows.filter(a => a.status === "Ongoing").length, "fas fa-spa"], ["Completed", todayRows.filter(a => a.status === "Completed").length, "fas fa-check-circle"]].map(([label, value, icon]) => <div className="therapist-stat" key={label}><div><p>{label}</p><h2>{value}</h2></div><span><i className={icon} /></span></div>)}
          </div>
          <div className="therapist-panel"><div className="therapist-panel-title"><div><h4>Today's Appointments</h4><p>Sessions assigned to you for {formatDate(dateOffset(0))}.</p></div><Link to="/therapist/appointments" className="therapist-btn primary">View Appointments</Link></div><AppointmentTable rows={todayRows} onViewDetails={a => setDetailsId(a.id)} onEditNotes={appointment => setPending({ kind: "editNote", appointment, note: appointment.notes })} /></div>
          <div className="therapist-actions"><Link to="/therapist/schedule" className="therapist-action"><i className="far fa-calendar-alt"/><div><h5>My Schedule</h5><p>Review upcoming appointments.</p></div></Link><Link to="/therapist/appointments" className="therapist-action"><i className="fas fa-clipboard-list"/><div><h5>My Appointments</h5><p>View client details and update session notes.</p></div></Link><Link to="/therapist/availability" className="therapist-action"><i className="far fa-clock"/><div><h5>Availability</h5><p>Manage your days and time-off requests.</p></div></Link></div>
        </>}

        {(current === "schedule" || current === "appointments") && <div className="therapist-panel">
          <div className="therapist-panel-title"><div><h4>{current === "schedule" ? "Assigned Schedule" : "Appointment Management"}</h4><p>{current === "schedule" ? "Your assigned appointments, displayed by date." : "Review appointment statuses and your own session updates."}</p></div></div>
          {current === "appointments" && <div className="therapist-subtabs" aria-label="Appointment sections">
            <button type="button" className={appointmentTab === "list" ? "active" : ""} onClick={() => setAppointmentTab("list")}><i className="far fa-calendar-alt" aria-hidden="true" /> Appointment List</button>
            <button type="button" className={appointmentTab === "history" ? "active" : ""} onClick={() => setAppointmentTab("history")}><i className="fas fa-history" aria-hidden="true" /> My Status History {history.length > 0 && <span className="therapist-counter">{history.length}</span>}</button>
          </div>}
          {(current === "schedule" || appointmentTab === "list") && <>
            <div className="therapist-filters"><div className="therapist-switch" aria-label="Date range"><button type="button" className={view === "daily" ? "selected" : ""} onClick={() => setView("daily")}>Daily</button><button type="button" className={view === "weekly" ? "selected" : ""} onClick={() => setView("weekly")}>Weekly</button><button type="button" className={view === "all" ? "selected" : ""} onClick={() => setView("all")}>All Dates</button></div>{view !== "all" && <label>Date <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}/></label>}<label className="therapist-search">Search <input type="search" placeholder="Client, booking, service..." value={query} onChange={e => setQuery(e.target.value)}/></label></div>
            {current === "appointments" && <div className="therapist-status-filters" role="group" aria-label="Filter appointments by status">{statuses.map(status => <button type="button" key={status} className={statusFilter === status ? "selected" : ""} aria-pressed={statusFilter === status} onClick={() => selectStatus(status)}>{status} <span>{status === "All" ? appointments.length : byStatus(status)}</span></button>)}</div>}
            <div className="therapist-list-summary"><span>{visibleRows.length} appointment{visibleRows.length === 1 ? "" : "s"} found</span>{current === "appointments" && (statusFilter !== "All" || view !== "daily") && <button type="button" className="therapist-text-link therapist-reset" onClick={() => { setView("daily"); setStatusFilter("All"); setQuery(""); setSelectedDate(dateOffset(0)); }}>Reset filters</button>}</div>
            <AppointmentTable rows={visibleRows} onViewDetails={a => setDetailsId(a.id)} allowActions={current === "appointments"} onEditNotes={appointment => setPending({ kind: "editNote", appointment, note: appointment.notes })} onRequestStatus={(appointment, next) => setPending(next === "Completed" ? { kind: "completeWithNotes", appointment, note: appointment.notes } : { kind: "status", appointment, next })}/>
            {current === "appointments" && lastAction && <div className="therapist-undo-bar"><span>Last update: <strong>{lastAction.id}</strong> → {lastAction.next}</span><button type="button" className="therapist-btn outline" onClick={() => setPending({ kind: "undo", action: lastAction })}><i className="fas fa-undo" aria-hidden="true" /> Undo last change</button></div>}
          </>}
          {current === "appointments" && appointmentTab === "history" && <>
            <div className="therapist-history-intro"><p>Your session status changes and service-note updates appear here. The Spa Manager maintains the system-wide activity log.</p></div>
            {history.length === 0 ? <div className="therapist-empty">No changes recorded in this session yet. Try confirming a status change in Appointment List.</div> : <div className="therapist-table-wrap"><table className="therapist-table therapist-history-table"><thead><tr><th>When</th><th>Booking / Client</th><th>Action</th><th>Previous</th><th>New status</th></tr></thead><tbody>{history.map(entry => <tr key={entry.key}><td>{formatTimestamp(entry.at)}</td><td><strong>{entry.id}</strong><small>{entry.client}</small></td><td>{entry.action}</td><td>{entry.previous}</td><td>{entry.next}</td></tr>)}</tbody></table></div>}
            {lastAction && <div className="therapist-undo-bar"><span>Made a mistake on <strong>{lastAction.id}</strong>?</span><button type="button" className="therapist-btn outline" onClick={() => setPending({ kind: "undo", action: lastAction })}><i className="fas fa-undo" aria-hidden="true" /> Undo last change</button></div>}
          </>}
        </div>}


        {current === "availability" && <div className="therapist-two-col"><div className="therapist-panel"><h4>Regular Availability</h4><p className="therapist-subtle">Choose your regular working days.</p><div className="therapist-day-options">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <label key={day}><input type="checkbox" checked={availableDays.includes(day)} onChange={e => setAvailableDays(cur => e.target.checked ? [...cur, day] : cur.filter(x => x !== day))}/> {day}</label>)}</div><button type="button" className="therapist-btn primary" onClick={() => setPending({ kind: "availability" })}>Save Availability</button></div>
          <div className="therapist-panel"><h4>Request Time Off</h4><form className="therapist-form" onSubmit={e => { e.preventDefault(); if (!offDate || !offReason.trim()) return; setPending({ kind: "timeOff", date: offDate, reason: offReason.trim() }); }}><label>Date <input type="date" required min={dateOffset(0)} value={offDate} onChange={e => setOffDate(e.target.value)} /></label><label>Reason <textarea required rows="3" value={offReason} onChange={e => setOffReason(e.target.value)} placeholder="Reason for requested time off"/></label><button className="therapist-btn primary" type="submit">Submit Request</button></form>{timeOff.length > 0 && <div className="therapist-requests"><h5>My Time-Off Requests</h5>{timeOff.map(t => <p key={t.id}>{formatDate(t.date)} — {t.reason} <Badge status={t.status}/></p>)}</div>}</div>
        </div>}
      </div>
    </main>
    <AppointmentDetailsDialog appointment={appointments.find(a => a.id === detailsId) || null} onClose={() => setDetailsId(null)} />
    <ConfirmDialog pending={pending} onConfirm={confirmPending} onCancel={() => setPending(null)} onNoteChange={note => setPending(prev => prev && ["completeWithNotes", "editNote"].includes(prev.kind) ? { ...prev, note } : prev)} cancelRef={cancelRef}/>
  </div>;
}
