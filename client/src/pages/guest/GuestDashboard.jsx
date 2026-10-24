import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import guestAppointments from "../../data/guestAppointments";

function GuestDashboard() {
  const { user } = useAuth();

  const upcomingAppointments = guestAppointments.filter(
    (appointment) =>
      appointment.status === "Confirmed" ||
      appointment.status === "Pending"
  );

  const completedAppointments = guestAppointments.filter(
    (appointment) =>
      appointment.status === "Completed"
  );

  const nextAppointment = upcomingAppointments[0];

  const formatDate = (date) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  const getStatusClass = (status) => {
    if (status === "Confirmed") {
      return "badge-success";
    }

    if (status === "Pending") {
      return "badge-warning";
    }

    return "badge-secondary";
  };

  return (
    <>
      
      {/* Dashboard */}
      <div className="container-fluid py-5">
        <div className="container">
          {/* Welcome */}
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

          {/* Summary Cards */}
          <div className="row mb-5">
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
                        {upcomingAppointments.length}
                      </h2>
                    </div>

                    <i className="far fa-calendar-alt fa-3x text-primary"></i>
                  </div>
                </div>
              </Link>
            </div>

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
                        {completedAppointments.length}
                      </h2>
                    </div>

                    <i className="fas fa-spa fa-3x text-primary"></i>
                  </div>
                </div>
              </Link>
            </div>

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
                        2
                      </h2>
                    </div>

                    <i className="far fa-bell fa-3x text-primary"></i>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Main Content */}
          <div className="row">
            {/* Next Appointment */}
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

                {nextAppointment ? (
                  <div className="guest-appointment-preview bg-white p-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-start mb-3">
                      <div>
                        <h4 className="mb-1">
                          {nextAppointment.service}
                        </h4>

                        <p className="text-muted mb-0">
                          Appointment #{nextAppointment.id}
                        </p>
                      </div>

                      <span
                        className={`badge ${getStatusClass(
                          nextAppointment.status
                        )} px-3 py-2`}
                      >
                        {nextAppointment.status}
                      </span>
                    </div>

                    <hr />

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <p className="text-muted mb-1">
                          Therapist
                        </p>

                        <strong>
                          {nextAppointment.therapist}
                        </strong>
                      </div>

                      <div className="col-md-6 mb-3">
                        <p className="text-muted mb-1">
                          Date
                        </p>

                        <strong>
                          {formatDate(nextAppointment.date)}
                        </strong>
                      </div>

                      <div className="col-md-6 mb-3">
                        <p className="text-muted mb-1">
                          Time
                        </p>

                        <strong>
                          {nextAppointment.time}
                        </strong>
                      </div>

                      <div className="col-md-6 mb-3">
                        <p className="text-muted mb-1">
                          Duration
                        </p>

                        <strong>
                          {nextAppointment.duration} minutes
                        </strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-4 text-center">
                    <i className="far fa-calendar-times fa-3x text-muted mb-3"></i>

                    <h5>No upcoming appointments</h5>

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

            {/* Quick Actions */}
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