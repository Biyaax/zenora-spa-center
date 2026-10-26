import { NavLink } from "react-router-dom";

const items = [
  ["/therapist/dashboard", "fas fa-home", "Dashboard"],
  ["/therapist/schedule", "far fa-calendar-alt", "My Schedule"],
  ["/therapist/appointments", "fas fa-clipboard-list", "My Appointments"],
  ["/therapist/notes", "far fa-sticky-note", "Service Notes"],
  ["/therapist/availability", "far fa-clock", "Availability & Time-Off"],
];

export default function TherapistSidebar({ mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && <button className="therapist-overlay" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`therapist-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="therapist-sidebar-brand">
          <h2 className="mb-0 text-primary">ZENORA</h2>
          <small>Massage Therapist Portal</small>
        </div>
        <nav className="therapist-nav" aria-label="Therapist navigation">
          {items.map(([path, icon, title]) => (
            <NavLink key={path} to={path} onClick={onClose}
              className={({ isActive }) => `therapist-nav-link ${isActive ? "active" : ""}`}>
              <i className={icon} aria-hidden="true" /><span>{title}</span>
            </NavLink>
          ))}
        </nav>
        <div className="therapist-sidebar-footer">
          <p className="mb-1">Portal access</p>
          <strong>Massage Therapist</strong>
        </div>
      </aside>
    </>
  );
}
