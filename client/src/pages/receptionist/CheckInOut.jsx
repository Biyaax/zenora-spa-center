import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import ReceptionistSidebar from "../../components/ReceptionistSidebar";
import ReceptionistTopbar from "../../components/ReceptionistTopbar";

import {
  staffRequest,
} from "../../api/staffAuth";

function formatTime(value) {
  if (!value) {
    return "—";
  }

  const [
    hourText,
    minute,
  ] = String(value)
    .slice(0, 5)
    .split(":");

  const hour =
    Number(hourText);

  if (
    Number.isNaN(hour)
  ) {
    return value;
  }

  const period =
    hour >= 12
      ? "PM"
      : "AM";

  const displayHour =
    hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function getStatusClass(
  status
) {
  switch (
    String(status)
      .toLowerCase()
  ) {
    case "confirmed":
      return "badge-success";

    case "checked in":
    case "ongoing":
      return "badge-primary";

    case "completed":
      return "badge-secondary";

    default:
      return "badge-light";
  }
}

function CheckInOut() {
  const navigate =
    useNavigate();

  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);

  const loadAppointments =
    useCallback(
      async () => {
        const token =
          sessionStorage.getItem(
            "zenoraStaffToken"
          );

        if (!token) {
          navigate(
            "/staff/login",
            {
              replace: true,
            }
          );

          return;
        }

        setLoading(true);
        setError("");

        try {
          const data =
            await staffRequest(
              "/api/reception/check-in-out",
              token
            );

          setAppointments(
            Array.isArray(
              data.appointments
            )
              ? data.appointments
              : []
          );
        } catch (err) {
          setAppointments([]);

          setError(
            err.message ||
              "Unable to load today's clients."
          );
        } finally {
          setLoading(false);
        }
      },
      [navigate]
    );

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const filteredAppointments =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return appointments;
      }

      return appointments.filter(
        (appointment) => {
          const fields = [
            appointment.bookingId,
            appointment.client,
            appointment.phone,
            appointment.service,
            appointment.therapist,
            appointment.status,
          ];

          return fields.some(
            (field) =>
              String(
                field || ""
              )
                .toLowerCase()
                .includes(
                  keyword
                )
          );
        }
      );
    }, [
      appointments,
      search,
    ]);

  const checkIn =
    async (appointment) => {
      const confirmed =
        window.confirm(
          `Check in ${appointment.client} for ${appointment.service}?`
        );

      if (!confirmed) {
        return;
      }

      const token =
        sessionStorage.getItem(
          "zenoraStaffToken"
        );

      if (!token) {
        navigate(
          "/staff/login",
          {
            replace: true,
          }
        );

        return;
      }

      try {
        setUpdatingId(
          appointment.id
        );

        setError("");

        await staffRequest(
          `/api/reception/check-in-out/${appointment.id}/check-in`,
          token,
          {
            method: "POST",
          }
        );

        await loadAppointments();
      } catch (err) {
        setError(
          err.message ||
            "Unable to check the client in."
        );
      } finally {
        setUpdatingId(null);
      }
    };

  const checkOut =
    async (appointment) => {
      const confirmed =
        window.confirm(
          `Check out ${appointment.client}? This will mark the appointment as completed.`
        );

      if (!confirmed) {
        return;
      }

      const token =
        sessionStorage.getItem(
          "zenoraStaffToken"
        );

      if (!token) {
        navigate(
          "/staff/login",
          {
            replace: true,
          }
        );

        return;
      }

      try {
        setUpdatingId(
          appointment.id
        );

        setError("");

        await staffRequest(
          `/api/reception/check-in-out/${appointment.id}/check-out`,
          token,
          {
            method: "POST",
          }
        );

        await loadAppointments();
      } catch (err) {
        setError(
          err.message ||
            "Unable to check the client out."
        );
      } finally {
        setUpdatingId(null);
      }
    };

  return (
    <div className="receptionist-layout">
      <ReceptionistSidebar />

      <main className="receptionist-main">
        <ReceptionistTopbar
          title="Check-In / Check-Out"
        />

        <div className="receptionist-content">
          <div className="mb-4">
            <h1 className="mb-2">
              Client Check-In /
              Check-Out
            </h1>

            <p className="text-muted mb-0">
              Process arriving
              clients and complete
              finished appointments.
            </p>
          </div>

          <div className="receptionist-panel mb-4">
            <div className="receptionist-search-box">
              <i className="fas fa-search"></i>

              <input
                type="text"
                placeholder="Search booking ID, client, service, or therapist..."
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
              />
            </div>
          </div>

          {error && (
            <div
              className="alert alert-danger d-flex justify-content-between align-items-center"
              role="alert"
            >
              <span>
                {error}
              </span>

              <button
                type="button"
                className="btn btn-sm btn-outline-danger ml-3"
                onClick={
                  loadAppointments
                }
              >
                Retry
              </button>
            </div>
          )}

          <div className="receptionist-panel">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 className="mb-1">
                  Today's Clients
                </h4>

                <p className="text-muted mb-0">
                  {loading
                    ? "Loading..."
                    : `${
                        filteredAppointments.length
                      } appointment${
                        filteredAppointments.length ===
                        1
                          ? ""
                          : "s"
                      }`}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="receptionist-empty-state">
                <i className="fas fa-spinner fa-spin"></i>

                <h4>
                  Loading Clients
                </h4>

                <p>
                  Retrieving today's
                  appointments.
                </p>
              </div>
            ) : filteredAppointments.length >
              0 ? (
              <div className="table-responsive">
                <table className="table receptionist-table receptionist-check-table">
                  <thead>
                    <tr>
                      <th>
                        Booking ID
                      </th>

                      <th>
                        Client
                      </th>

                      <th>
                        Service
                      </th>

                      <th>
                        Therapist
                      </th>

                      <th>
                        Time
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAppointments.map(
                      (
                        appointment
                      ) => (
                        <tr
                          key={
                            appointment.id
                          }
                        >
                          <td>
                            <strong>
                              {
                                appointment.bookingId
                              }
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {appointment.client ||
                                "—"}
                            </strong>

                            {appointment.phone && (
                              <small className="d-block text-muted">
                                {
                                  appointment.phone
                                }
                              </small>
                            )}
                          </td>

                          <td>
                            {appointment.service ||
                              "—"}
                          </td>

                          <td>
                            {appointment.therapist ||
                              "—"}
                          </td>

                          <td>
                            {formatTime(
                              appointment.startTime
                            )}
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

                          <td>
                            {appointment.status ===
                              "Confirmed" && (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                disabled={
                                  updatingId ===
                                  appointment.id
                                }
                                onClick={() =>
                                  checkIn(
                                    appointment
                                  )
                                }
                              >
                                <i className="fas fa-sign-in-alt mr-1"></i>

                                {updatingId ===
                                appointment.id
                                  ? "Checking In..."
                                  : "Check In"}
                              </button>
                            )}

                            {appointment.status ===
                              "Checked In" && (
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                disabled={
                                  updatingId ===
                                  appointment.id
                                }
                                onClick={() =>
                                  checkOut(
                                    appointment
                                  )
                                }
                              >
                                <i className="fas fa-check mr-1"></i>

                                {updatingId ===
                                appointment.id
                                  ? "Checking Out..."
                                  : "Check Out"}
                              </button>
                            )}

                            {appointment.status ===
                              "Completed" && (
                              <span className="text-muted">
                                <i className="fas fa-check-circle mr-1"></i>
                                Finished
                              </span>
                            )}

                            {appointment.status ===
                              "Ongoing" && (
                              <span className="text-muted">
                                In progress
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

                <h4>
                  No Clients Found
                </h4>

                <p>
                  {search.trim()
                    ? "No appointments match your search."
                    : "There are no confirmed or checked-in clients scheduled for today."}
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