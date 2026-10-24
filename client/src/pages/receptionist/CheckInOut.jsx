import { useState } from "react";
import ReceptionistSidebar from "../../components/ReceptionistSidebar";

const initialAppointments = [
  {
    id: "APT-1001",
    client: "Bea Mendoza",
    service: "Body Massage",
    therapist: "Maria Santos",
    date: "2026-10-24",
    time: "9:00 AM",
    status: "Confirmed",
  },
  {
    id: "APT-1002",
    client: "Angela Cruz",
    service: "Facial Therapy",
    therapist: "Angela Reyes",
    date: "2026-10-24",
    time: "11:00 AM",
    status: "Confirmed",
  },
  {
    id: "APT-1003",
    client: "Carla Gomez",
    service: "Stone Therapy",
    therapist: "Maria Santos",
    date: "2026-10-24",
    time: "2:00 PM",
    status: "Checked In",
  },
];

function CheckInOut() {
  const [appointments, setAppointments] =
    useState(initialAppointments);

  const [search, setSearch] = useState("");

  const updateStatus = (id, newStatus) => {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === id
          ? {
              ...appointment,
              status: newStatus,
            }
          : appointment
      )
    );
  };

  const filteredAppointments =
    appointments.filter((appointment) => {
      const keyword = search.toLowerCase();

      return (
        appointment.id
          .toLowerCase()
          .includes(keyword) ||
        appointment.client
          .toLowerCase()
          .includes(keyword) ||
        appointment.service
          .toLowerCase()
          .includes(keyword)
      );
    });

  const getStatusClass = (status) => {
    switch (status) {
      case "Confirmed":
        return "badge-success";

      case "Checked In":
        return "badge-primary";

      case "Completed":
        return "badge-secondary";

      default:
        return "badge-light";
    }
  };

  return (
    <div className="receptionist-layout">
      <ReceptionistSidebar />

      <main className="receptionist-main">
        <div className="receptionist-topbar">
          <div>
            <p className="text-muted mb-1">
              Receptionist Portal
            </p>

            <h3 className="mb-0">
              Check-In / Check-Out
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

        <div className="receptionist-content">
          <div className="mb-4">
            <h1 className="mb-2">
              Client Check-In / Check-Out
            </h1>

            <p className="text-muted mb-0">
              Process arriving clients and complete
              finished appointments.
            </p>
          </div>

          <div className="receptionist-panel mb-4">
            <div className="receptionist-search-box">
              <i className="fas fa-search"></i>

              <input
                type="text"
                placeholder="Search booking ID, client, or service..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          </div>

          <div className="receptionist-panel">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 className="mb-1">
                  Today's Clients
                </h4>

                <p className="text-muted mb-0">
                  {filteredAppointments.length} appointment
                  {filteredAppointments.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>
            </div>

            {filteredAppointments.length > 0 ? (
              <div className="table-responsive">
                <table className="table receptionist-table receptionist-check-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Client</th>
                      <th>Service</th>
                      <th>Therapist</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAppointments.map(
                      (appointment) => (
                        <tr key={appointment.id}>
                          <td>
                            <strong>
                              {appointment.id}
                            </strong>
                          </td>

                          <td>
                            {appointment.client}
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

                          <td>
                            {appointment.status ===
                              "Confirmed" && (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() =>
                                  updateStatus(
                                    appointment.id,
                                    "Checked In"
                                  )
                                }
                              >
                                <i className="fas fa-sign-in-alt mr-1"></i>
                                Check In
                              </button>
                            )}

                            {appointment.status ===
                              "Checked In" && (
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() =>
                                  updateStatus(
                                    appointment.id,
                                    "Completed"
                                  )
                                }
                              >
                                <i className="fas fa-check mr-1"></i>
                                Check Out
                              </button>
                            )}

                            {appointment.status ===
                              "Completed" && (
                              <span className="text-muted">
                                Finished
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="receptionist-empty-state">
                <i className="fas fa-user-clock"></i>

                <h4>No Clients Found</h4>

                <p>
                  No appointments match your search.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default CheckInOut;