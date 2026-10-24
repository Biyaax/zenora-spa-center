import { NavLink } from "react-router-dom";

function ReceptionistSidebar() {
  const linkClass = ({ isActive }) =>
    `receptionist-nav-link ${isActive ? "active" : ""}`;

  return (
    <aside className="receptionist-sidebar">
      <div className="receptionist-sidebar-brand">
        <h2 className="mb-0">
          <span className="text-primary">ZENORA</span>
        </h2>

        <small>Receptionist Portal</small>
      </div>

      <nav className="receptionist-nav">
        <NavLink
          to="/receptionist/dashboard"
          className={linkClass}
        >
          <i className="fas fa-home"></i>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/receptionist/bookings"
          className={linkClass}
        >
          <i className="far fa-calendar-alt"></i>
          <span>Appointments</span>
        </NavLink>

        <NavLink
          to="/receptionist/walk-in"
          className={linkClass}
        >
          <i className="fas fa-user-plus"></i>
          <span>Walk-In Booking</span>
        </NavLink>

        <NavLink
          to="/receptionist/check-in-out"
          className={linkClass}
        >
          <i className="fas fa-door-open"></i>
          <span>Check-In / Out</span>
        </NavLink>

        <NavLink
          to="/receptionist/payments"
          className={linkClass}
        >
          <i className="fas fa-money-bill-wave"></i>
          <span>Payments</span>
        </NavLink>

        <NavLink
          to="/receptionist/clients"
          className={linkClass}
        >
          <i className="fas fa-users"></i>
          <span>Client Records</span>
        </NavLink>
      </nav>

      <div className="receptionist-sidebar-footer">
        <p className="mb-1">
          Logged in as
        </p>

        <strong>Receptionist</strong>

        <button
          type="button"
          className="btn btn-outline-light btn-sm btn-block mt-3"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default ReceptionistSidebar;