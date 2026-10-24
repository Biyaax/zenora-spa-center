import ReceptionistSidebar from "../../components/ReceptionistSidebar";

function ReceptionistDashboard() {
  const todaysAppointments = [
    {
      id: "APT-1001",
      client: "Bea Mendoza",
      service: "Body Massage",
      therapist: "Maria Santos",
      time: "9:00 AM",
      status: "Confirmed",
    },
    {
      id: "APT-1002",
      client: "Angela Cruz",
      service: "Facial Therapy",
      therapist: "Angela Reyes",
      time: "11:00 AM",
      status: "Pending",
    },
    {
      id: "APT-1003",
      client: "Carla Gomez",
      service: "Stone Therapy",
      therapist: "Maria Santos",
      time: "2:00 PM",
      status: "Checked In",
    },
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case "Confirmed":
        return "badge-success";

      case "Pending":
        return "badge-warning";

      case "Checked In":
        return "badge-primary";

      default:
        return "badge-secondary";
    }
  };

  return (
    <div className="receptionist-layout">
      <ReceptionistSidebar />

      <main className="receptionist-main">
        {/* Topbar */}
        <div className="receptionist-topbar">
          <div>
            <p className="text-muted mb-1">
              Receptionist Portal
            </p>

            <h3 className="mb-0">
              Dashboard
            </h3>
          </div>

          <div className="receptionist-topbar-user">
            <i className="far fa-bell mr-3"></i>

            <div className="receptionist-user-circle">
              R
            </div>

            <div className="ml-2">
              <strong>Receptionist</strong>
              <small className="d-block text-muted">
                Front Desk
              </small>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="receptionist-content">
          <div className="mb-5">
            <h1 className="mb-2">
              Good day!
            </h1>

            <p className="text-muted mb-0">
              Here's today's spa activity and appointment overview.
            </p>
          </div>

          {/* Summary */}
          <div className="row">
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="receptionist-stat-card">
                <div>
                  <p className="text-muted mb-1">
                    Today's Appointments
                  </p>

                  <h2 className="mb-0">
                    8
                  </h2>
                </div>

                <div className="receptionist-stat-icon">
                  <i className="far fa-calendar-alt"></i>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="receptionist-stat-card">
                <div>
                  <p className="text-muted mb-1">
                    Pending Requests
                  </p>

                  <h2 className="mb-0">
                    3
                  </h2>
                </div>

                <div className="receptionist-stat-icon">
                  <i className="far fa-clock"></i>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="receptionist-stat-card">
                <div>
                  <p className="text-muted mb-1">
                    Checked In
                  </p>

                  <h2 className="mb-0">
                    2
                  </h2>
                </div>

                <div className="receptionist-stat-icon">
                  <i className="fas fa-user-check"></i>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="receptionist-stat-card">
                <div>
                  <p className="text-muted mb-1">
                    Payments Today
                  </p>

                  <h2 className="mb-0">
                    ₱3,400
                  </h2>
                </div>

                <div className="receptionist-stat-icon">
                  <i className="fas fa-wallet"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Appointments */}
          <div className="receptionist-panel mt-3">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
              <div>
                <h4 className="mb-1">
                  Today's Appointments
                </h4>

                <p className="text-muted mb-0">
                  Monitor today's scheduled clients.
                </p>
              </div>

              <a
                href="/receptionist/bookings"
                className="btn btn-primary mt-3 mt-md-0"
              >
                View All Appointments
              </a>
            </div>

            <div className="table-responsive">
              <table className="table receptionist-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Client</th>
                    <th>Service</th>
                    <th>Therapist</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {todaysAppointments.map(
                    (appointment) => (
                      <tr key={appointment.id}>
                        <td>
                          {appointment.id}
                        </td>

                        <td>
                          <strong>
                            {appointment.client}
                          </strong>
                        </td>

                        <td>
                          {appointment.service}
                        </td>

                        <td>
                          {appointment.therapist}
                        </td>

                        <td>
                          {appointment.time}
                        </td>

                        <td>
                          <span
                            className={`badge ${getStatusClass(
                              appointment.status
                            )} px-3 py-2`}
                          >
                            {appointment.status}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="row mt-4">
            <div className="col-lg-4 mb-4">
              <a
                href="/receptionist/walk-in"
                className="receptionist-action-card"
              >
                <i className="fas fa-user-plus"></i>

                <div>
                  <h5>
                    New Walk-In
                  </h5>

                  <p>
                    Create a booking for a walk-in client.
                  </p>
                </div>
              </a>
            </div>

            <div className="col-lg-4 mb-4">
              <a
                href="/receptionist/check-in-out"
                className="receptionist-action-card"
              >
                <i className="fas fa-door-open"></i>

                <div>
                  <h5>
                    Check-In / Out
                  </h5>

                  <p>
                    Process arriving and completed clients.
                  </p>
                </div>
              </a>
            </div>

            <div className="col-lg-4 mb-4">
              <a
                href="/receptionist/payments"
                className="receptionist-action-card"
              >
                <i className="fas fa-money-bill-wave"></i>

                <div>
                  <h5>
                    Record Payment
                  </h5>

                  <p>
                    Record client payments and receipts.
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ReceptionistDashboard;