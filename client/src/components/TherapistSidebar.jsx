import { NavLink } from "react-router-dom";

const items = [
  ["/therapist/dashboard", "fas fa-home", "Dashboard"],
  ["/therapist/schedule", "far fa-calendar-alt", "My Schedule"],
  ["/therapist/appointments", "fas fa-clipboard-list", "My Appointments"],
  ["/therapist/availability", "far fa-clock", "Availability & Time-Off"],
];

export default function TherapistSidebar({ mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && <button className="therapist-overlay" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`therapist-sidebar ${mobileOpen ? "open" : ""}`}>
        <NavLink to="/therapist/dashboard" className="therapist-sidebar-brand" onClick={onClose}>
          ZENORA<span>THERAPIST PORTAL</span>
        </NavLink>
        <div className="therapist-sidebar-caption">WORKSPACE</div>
        <nav className="therapist-nav" aria-label="Therapist navigation">
          {items.map(([path, icon, title]) => (
            <NavLink key={path} to={path} onClick={onClose}
              className={({ isActive }) => `therapist-nav-link ${isActive ? "active" : ""}`}>
              <i className={icon} aria-hidden="true" /><span>{title}</span>
            </NavLink>
          ))}
        </nav>
        <div className="therapist-sidebar-foot">ZENORA · SPA & WELLNESS</div>
      </aside>
    </>
  );
}
