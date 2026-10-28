import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

function GuestDashboard() {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState({
    upcoming: [],
    history: [],
  });

  const [notifications, setNotifications] = useState({
    items: [],
    unread: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     LOAD REAL GUEST DATA
  ======================================================= */

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [appointmentData, notificationData] =
        await Promise.all([
          api("/me/appointments"),
          api("/me/notifications"),
        ]);

      setAppointments({
        upcoming: Array.isArray(appointmentData?.upcoming)
          ? appointmentData.upcoming
          : [],

        history: Array.isArray(appointmentData?.history)
          ? appointmentData.history
          : [],
      });

      setNotifications({
        items: Array.isArray(notificationData?.items)
          ? notificationData.items
          : [],

        unread: Number(notificationData?.unread || 0),
      });
    } catch (err) {
      console.error(
        "Unable to load guest dashboard:",
        err
      );

      setError(
        err?.message ||
          "Unable to load your dashboard information."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* =======================================================
     REAL DASHBOARD VALUES
  ======================================================= */

  const upcomingAppointments = useMemo(() => {
    return [...appointments.upcoming].sort((a, b) => {
      const first = new Date(
        `${a.appointment_date}T${a.start_time || "00:00:00"}`
      );

      const second = new Date(
        `${b.appointment_date}T${b.start_time || "00:00:00"}`
      );

      return first - second;
    });
  }, [appointments.upcoming]);

  const completedAppointments = useMemo(() => {
    return appointments.history.filter(
      (appointment) =>
        String(appointment.status || "").toLowerCase() ===
        "completed"
    );
  }, [appointments.history]);

  const nextAppointment =
    upcomingAppointments.length > 0
      ? upcomingAppointments[0]
      : null;

  const notificationCount =
    Number.isFinite(notifications.unread)
      ? notifications.unread
      : notifications.items.filter(
          (notification) => !notification.is_read
        ).length;

  /* =======================================================
     FORMATTERS
  ======================================================= */

  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    const rawDate = String(date).slice(0, 10);

    const parsedDate = new Date(
      `${rawDate}T00:00:00`
    );

    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }

    return parsedDate.toLocaleDateString(
      "en-PH",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  const formatTime = (time) => {
    if (!time) {
      return "Not available";
    }

    const parts = String(time).split(":");

    const hours = Number(parts[0]);
    const minutes = Number(parts[1] || 0);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return String(time);
    }

    const date = new Date();

    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString(
      "en-PH",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  const formatStatus = (status) => {
    const value = String(status || "").trim();

    if (!value) {
      return "Unknown";
    }

    return value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const getStatusClass = (status) => {
    const value = String(
      status || ""
    ).toLowerCase();

    if (value === "confirmed") {
      return "badge-success";
    }

    if (value === "pending") {
      return "badge-warning";
    }

    if (value === "completed") {
      return "badge-primary";
    }

    if (
      value === "cancelled" ||
      value === "canceled" ||
      value === "no-show" ||
      value === "no_show"
    ) {
      return "badge-danger";
    }

    return "badge-secondary";
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <div className="container-fluid py-5">
        <div className="container">

          {/* =============================================
              WELCOME
          ============================================= */}

          <div className="mb-5">
            <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
              Guest Dashboard
            </h6>

            <h1 className="mb-2">
              Welcome, {user?.firstName || "Guest"}!
            </h1>

            <p className="text-muted mb-0">
              Here's an overview of your spa appointments.
            </p>
          </div>

          {/* =============================================
              ERROR
          ============================================= */}

          {error && (
            <div
              className="alert alert-danger mb-4"
              role="alert"
            >
              <div className="d-flex flex-wrap align-items-center justify-content-between">
                <span>{error}</span>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger ml-2"
                  onClick={loadDashboard}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* =============================================
              SUMMARY CARDS
          ============================================= */}

          <div className="row mb-5">

            {/* Upcoming */}
            <div className="col-lg-4 col-md-6 mb-4">
              <Link
                to="/guest/appointments"
                className="text-decoration-none"
              >
                <div className="guest-dashboard-card bg-light p-4 h-100">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted text-uppercase mb-2">
                        Upcoming
                      </p>

                      <h2 className="mb-0">
                        {loading
                          ? "—"
                          : upcomingAppointments.length}
                      </h2>
                    </div>

                    <i className="far fa-calendar-alt fa-3x text-primary"></i>
                  </div>
                </div>
              </Link>
            </div>

            {/* Completed */}
            <div className="col-lg-4 col-md-6 mb-4">
              <Link
                to="/guest/history"
                className="text-decoration-none"
              >
                <div className="guest-dashboard-card bg-light p-4 h-100">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted text-uppercase mb-2">
                        Completed Visits
                      </p>

                      <h2 className="mb-0">
                        {loading
                          ? "—"
                          : completedAppointments.length}
                      </h2>
                    </div>

                    <i className="fas fa-spa fa-3x text-primary"></i>
                  </div>
                </div>
              </Link>
            </div>

            {/* Notifications */}
            <div className="col-lg-4 col-md-6 mb-4">
              <Link
                to="/guest/notifications"
                className="text-decoration-none"
              >
                <div className="guest-dashboard-card bg-light p-4 h-100">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted text-uppercase mb-2">
                        Notifications
                      </p>

                      <h2 className="mb-0">
                        {loading
                          ? "—"
                          : notificationCount}
                      </h2>
                    </div>

                    <i className="far fa-bell fa-3x text-primary"></i>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* =============================================
              MAIN CONTENT
          ============================================= */}

          <div className="row">

            {/* ===========================================
                NEXT APPOINTMENT
            =========================================== */}

            <div className="col-lg-8 mb-4">
              <div className="bg-light p-4 p-lg-5 h-100">

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h6 className="text-primary text-uppercase mb-2">
                      Next Appointment
                    </h6>

                    <h3 className="mb-0">
                      Upcoming Visit
                    </h3>
                  </div>

                  <Link
                    to="/guest/appointments"
                    className="btn btn-outline-primary"
                  >
                    View All
                  </Link>
                </div>

                {/* Loading */}
                {loading ? (
                  <div className="bg-white p-5 text-center">
                    <i className="fas fa-spinner fa-spin fa-2x text-primary mb-3"></i>

                    <p className="text-muted mb-0">
                      Loading your appointments...
                    </p>
                  </div>
                ) : nextAppointment ? (

                  /* =====================================
                     REAL NEXT APPOINTMENT
                  ===================================== */

                  <div className="guest-appointment-preview bg-white p-4">

                    <div className="d-flex flex-wrap justify-content-between align-items-start mb-3">
                      <div>
                        <h4 className="mb-1">
                          {nextAppointment.service_name ||
                            "Spa Service"}
                        </h4>

                        <p className="text-muted mb-0">
                          Appointment #
                          {nextAppointment.id}
                        </p>
                      </div>

                      <span
                        className={`badge ${getStatusClass(
                          nextAppointment.status
                        )} px-3 py-2`}
                      >
                        {formatStatus(
                          nextAppointment.status
                        )}
                      </span>
                    </div>

                    <hr />

                    <div className="row">

                      {/* Therapist */}
                      <div className="col-md-6 mb-3">
                        <p className="text-muted mb-1">
                          Therapist
                        </p>

                        <strong>
                          {nextAppointment.therapist_name ||
                            "Not assigned"}
                        </strong>
                      </div>

                      {/* Date */}
                      <div className="col-md-6 mb-3">
                        <p className="text-muted mb-1">
                          Date
                        </p>

                        <strong>
                          {formatDate(
                            nextAppointment.appointment_date
                          )}
                        </strong>
                      </div>

                      {/* Time */}
                      <div className="col-md-6 mb-3">
                        <p className="text-muted mb-1">
                          Time
                        </p>

                        <strong>
                          {formatTime(
                            nextAppointment.start_time
                          )}
                        </strong>
                      </div>

                      {/* Duration */}
                      <div className="col-md-6 mb-3">
                        <p className="text-muted mb-1">
                          Duration
                        </p>

                        <strong>
                          {nextAppointment.duration_minutes
                            ? `${nextAppointment.duration_minutes} minutes`
                            : "Not available"}
                        </strong>
                      </div>
                    </div>
                  </div>
                ) : (

                  /* =====================================
                     NO UPCOMING APPOINTMENT
                  ===================================== */

                  <div className="bg-white p-4 text-center">
                    <i className="far fa-calendar-times fa-3x text-muted mb-3"></i>

                    <h5>
                      No upcoming appointments
                    </h5>

                    <p className="text-muted">
                      You currently have no scheduled visits.
                    </p>

                    <Link
                      to="/appointment"
                      className="btn btn-primary"
                    >
                      Book Appointment
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* ===========================================
                QUICK ACTIONS
            =========================================== */}

            <div className="col-lg-4 mb-4">
              <div className="bg-dark text-white p-4 p-lg-5 h-100">

                <h4 className="text-white mb-4">
                  Quick Actions
                </h4>

                <Link
                  to="/appointment"
                  className="btn btn-primary btn-block mb-3 py-3"
                >
                  <i className="far fa-calendar-plus mr-2"></i>
                  Book Appointment
                </Link>

                <Link
                  to="/guest/appointments"
                  className="btn btn-outline-light btn-block mb-3 py-3"
                >
                  <i className="far fa-calendar-alt mr-2"></i>
                  My Appointments
                </Link>

                <Link
                  to="/guest/history"
                  className="btn btn-outline-light btn-block mb-3 py-3"
                >
                  <i className="fa fa-history mr-2"></i>
                  Booking History
                </Link>

                <Link
                  to="/guest/notifications"
                  className="btn btn-outline-light btn-block py-3"
                >
                  <i className="far fa-bell mr-2"></i>
                  Notifications

                  {!loading &&
                    notificationCount > 0 && (
                      <span className="badge badge-primary ml-2">
                        {notificationCount}
                      </span>
                    )}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default GuestDashboard;