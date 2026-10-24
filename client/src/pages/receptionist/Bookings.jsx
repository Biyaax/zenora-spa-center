import { useState } from "react";
import ReceptionistSidebar from "../../components/ReceptionistSidebar";

const initialAppointments = [
  {
    id: "APT-1001",
    client: "Bea Mendoza",
    phone: "09171234567",
    service: "Body Massage",
    therapist: "Maria Santos",
    date: "2026-10-24",
    time: "9:00 AM",
    duration: 60,
    price: 650,
    status: "Confirmed",
    bookingType: "Online",
  },
  {
    id: "APT-1002",
    client: "Angela Cruz",
    phone: "09181234567",
    service: "Facial Therapy",
    therapist: "Angela Reyes",
    date: "2026-10-24",
    time: "11:00 AM",
    duration: 45,
    price: 550,
    status: "Pending",
    bookingType: "Online",
  },
  {
    id: "APT-1003",
    client: "Carla Gomez",
    phone: "09191234567",
    service: "Stone Therapy",
    therapist: "Maria Santos",
    date: "2026-10-24",
    time: "2:00 PM",
    duration: 75,
    price: 850,
    status: "Checked In",
    bookingType: "Walk-In",
  },
  {
    id: "APT-1004",
    client: "Daniel Reyes",
    phone: "09201234567",
    service: "Skin Care",
    therapist: "Angela Reyes",
    date: "2026-10-25",
    time: "10:00 AM",
    duration: 60,
    price: 600,
    status: "Pending",
    bookingType: "Online",
  },
  {
    id: "APT-1005",
    client: "Ella Santos",
    phone: "09211234567",
    service: "Steam Bath",
    therapist: "Carla Mendoza",
    date: "2026-10-26",
    time: "1:00 PM",
    duration: 30,
    price: 400,
    status: "Confirmed",
    bookingType: "Online",
  },
  {
    id: "APT-1006",
    client: "Francis Lim",
    phone: "09221234567",
    service: "Face Masking",
    therapist: "Carla Mendoza",
    date: "2026-10-27",
    time: "3:00 PM",
    duration: 30,
    price: 350,
    status: "Pending",
    bookingType: "Online",
  },
];

function Bookings() {
  const [appointments, setAppointments] =
    useState(initialAppointments);

  const [view, setView] = useState("daily");

  const [selectedDate, setSelectedDate] =
    useState("2026-10-24");

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

  const formatDate = (date) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Confirmed":
        return "badge-success";

      case "Pending":
        return "badge-warning";

      case "Checked In":
        return "badge-primary";

      case "Completed":
        return "badge-secondary";

      case "Declined":
        return "badge-danger";

      default:
        return "badge-secondary";
    }
  };

  const getWeekDates = (dateString) => {
    const date = new Date(`${dateString}T00:00:00`);

    const day = date.getDay();

    const mondayOffset =
      day === 0 ? -6 : 1 - day;

    const monday = new Date(date);

    monday.setDate(date.getDate() + mondayOffset);

    const dates = [];

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);

      current.setDate(monday.getDate() + i);

      dates.push(
        current.toISOString().split("T")[0]
      );
    }

    return dates;
  };

  const weekDates = getWeekDates(selectedDate);

  let visibleAppointments = appointments;

  if (view === "daily") {
    visibleAppointments = appointments.filter(
      (appointment) =>
        appointment.date === selectedDate
    );
  }

  if (view === "weekly") {
    visibleAppointments = appointments.filter(
      (appointment) =>
        weekDates.includes(appointment.date)
    );
  }

  if (view === "requests") {
    visibleAppointments = appointments.filter(
      (appointment) =>
        appointment.status === "Pending" &&
        appointment.bookingType === "Online"
    );
  }

  if (search.trim()) {
    const searchValue = search.toLowerCase();

    visibleAppointments =
      visibleAppointments.filter(
        (appointment) =>
          appointment.client
            .toLowerCase()
            .includes(searchValue) ||
          appointment.id
            .toLowerCase()
            .includes(searchValue) ||
          appointment.service
            .toLowerCase()
            .includes(searchValue) ||
          appointment.therapist
            .toLowerCase()
            .includes(searchValue)
      );
  }

  visibleAppointments = [
    ...visibleAppointments,
  ].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }

    return a.time.localeCompare(b.time);
  });

  const pendingCount = appointments.filter(
    (appointment) =>
      appointment.status === "Pending" &&
      appointment.bookingType === "Online"
  ).length;

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
              Appointments
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
          {/* Heading */}
          <div className="mb-4">
            <h1 className="mb-2">
              Appointment Management
            </h1>

            <p className="text-muted mb-0">
              View scheduled appointments and manage
              online booking requests.
            </p>
          </div>

          {/* View Tabs */}
          <div className="receptionist-appointment-toolbar">
            <div className="receptionist-view-tabs">
              <button
                type="button"
                className={
                  view === "daily"
                    ? "active"
                    : ""
                }
                onClick={() => setView("daily")}
              >
                <i className="far fa-calendar mr-2"></i>
                Daily
              </button>

              <button
                type="button"
                className={
                  view === "weekly"
                    ? "active"
                    : ""
                }
                onClick={() => setView("weekly")}
              >
                <i className="far fa-calendar-alt mr-2"></i>
                Weekly
              </button>

              <button
                type="button"
                className={
                  view === "requests"
                    ? "active"
                    : ""
                }
                onClick={() => setView("requests")}
              >
                <i className="far fa-clock mr-2"></i>
                Booking Requests

                {pendingCount > 0 && (
                  <span className="receptionist-request-count">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>

            {view !== "requests" && (
              <div className="receptionist-date-filter">
                <label htmlFor="appointment-date">
                  {view === "daily"
                    ? "Date"
                    : "Week of"}
                </label>

                <input
                  id="appointment-date"
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(e) =>
                    setSelectedDate(
                      e.target.value
                    )
                  }
                />
              </div>
            )}
          </div>

          {/* Search */}
          <div className="receptionist-panel mb-4">
            <div className="receptionist-search-box">
              <i className="fas fa-search"></i>

              <input
                type="text"
                placeholder="Search booking ID, client, service, or therapist..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          </div>

          {/* Appointment Table */}
          <div className="receptionist-panel">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
              <div>
                <h4 className="mb-1">
                  {view === "daily" &&
                    "Daily Appointments"}

                  {view === "weekly" &&
                    "Weekly Appointments"}

                  {view === "requests" &&
                    "Online Booking Requests"}
                </h4>

                <p className="text-muted mb-0">
                  {visibleAppointments.length}{" "}
                  appointment
                  {visibleAppointments.length !== 1
                    ? "s"
                    : ""}{" "}
                  found
                </p>
              </div>
            </div>

            {visibleAppointments.length > 0 ? (
              <div className="table-responsive">
                <table className="table receptionist-table receptionist-appointments-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Date / Time</th>
                      <th>Client</th>
                      <th>Service</th>
                      <th>Therapist</th>
                      <th>Type</th>
                      <th>Status</th>

                      {view === "requests" && (
                        <th>Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {visibleAppointments.map(
                      (appointment) => (
                        <tr key={appointment.id}>
                          <td>
                            <strong>
                              {appointment.id}
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {formatDate(
                                appointment.date
                              )}
                            </strong>

                            <small className="d-block text-muted">
                              {appointment.time}
                            </small>
                          </td>

                          <td>
                            <strong>
                              {appointment.client}
                            </strong>

                            <small className="d-block text-muted">
                              {appointment.phone}
                            </small>
                          </td>

                          <td>
                            {appointment.service}

                            <small className="d-block text-muted">
                              {
                                appointment.duration
                              }{" "}
                              mins · ₱
                              {appointment.price.toLocaleString()}
                            </small>
                          </td>

                          <td>
                            {
                              appointment.therapist
                            }
                          </td>

                          <td>
                            <span className="receptionist-booking-type">
                              {
                                appointment.bookingType
                              }
                            </span>
                          </td>

                          <td>
                            <span
                              className={`badge ${getStatusClass(
                                appointment.status
                              )} px-3 py-2`}
                            >
                              {
                                appointment.status
                              }
                            </span>
                          </td>

                          {view ===
                            "requests" && (
                            <td>
                              <div className="receptionist-request-actions">
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  onClick={() =>
                                    updateStatus(
                                      appointment.id,
                                      "Confirmed"
                                    )
                                  }
                                >
                                  <i className="fas fa-check mr-1"></i>
                                  Confirm
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() =>
                                    updateStatus(
                                      appointment.id,
                                      "Declined"
                                    )
                                  }
                                >
                                  <i className="fas fa-times mr-1"></i>
                                  Decline
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="receptionist-empty-state">
                <i className="far fa-calendar-times"></i>

                <h4>
                  No Appointments Found
                </h4>

                <p>
                  There are no appointments matching
                  the selected view.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Bookings;