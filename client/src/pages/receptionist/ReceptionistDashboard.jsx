import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import ReceptionistSidebar from "../../components/ReceptionistSidebar";
import ReceptionistTopbar from "../../components/ReceptionistTopbar";

import {
  staffRequest,
} from "../../api/staffAuth";

const emptyDashboard = {
  date: "",
  summary: {
    todayAppointments: 0,
    pendingRequests: 0,
    checkedIn: 0,
    paymentsToday: 0,
  },
  appointments: [],
};

function formatMoney(value) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }
  ).format(
    Number(value || 0)
  );
}

function formatTime(value) {
  if (!value) {
    return "—";
  }

  const text =
    String(value).slice(0, 5);

  const [hourText, minute] =
    text.split(":");

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

function prettyStatus(
  appointment
) {
  if (
    appointment
      .display_status ===
    "Checked In"
  ) {
    return "Checked In";
  }

  const status =
    appointment
      .display_status ||
    appointment.status ||
    "";

  return status
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
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

    case "pending":
      return "badge-warning";

    case "checked in":
    case "ongoing":
      return "badge-primary";

    case "completed":
      return "badge-secondary";

    case "no-show":
      return "badge-danger";

    default:
      return "badge-secondary";
  }
}

function ReceptionistDashboard() {
  const navigate =
    useNavigate();

  const [
    dashboard,
    setDashboard,
  ] = useState(
    emptyDashboard
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadDashboard =
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
              "/api/reception/dashboard",
              token
            );

          setDashboard({
            date:
              data.date || "",

            summary: {
              todayAppointments:
                Number(
                  data.summary
                    ?.todayAppointments ||
                    0
                ),

              pendingRequests:
                Number(
                  data.summary
                    ?.pendingRequests ||
                    0
                ),

              checkedIn:
                Number(
                  data.summary
                    ?.checkedIn ||
                    0
                ),

              paymentsToday:
                Number(
                  data.summary
                    ?.paymentsToday ||
                    0
                ),
            },

            appointments:
              Array.isArray(
                data.appointments
              )
                ? data.appointments
                : [],
          });
        } catch (err) {
          setDashboard(
            emptyDashboard
          );

          setError(
            err.message ||
              "Unable to load dashboard."
          );
        } finally {
          setLoading(false);
        }
      },
      [navigate]
    );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const {
    summary,
    appointments,
  } = dashboard;

  return (
    <div className="receptionist-layout">
      <ReceptionistSidebar />

      <main className="receptionist-main">
        <ReceptionistTopbar
          title="Dashboard"
        />

        <div className="receptionist-content">
          <div className="mb-5">
            <h1 className="mb-2">
              Good day!
            </h1>

            <p className="text-muted mb-0">
              Here's today's spa
              activity and appointment
              overview.
            </p>
          </div>

          {error && (
            <div
              className="alert alert-danger d-flex justify-content-between align-items-center"
              role="alert"
            >
              <span>{error}</span>

              <button
                type="button"
                className="btn btn-sm btn-outline-danger ml-3"
                onClick={
                  loadDashboard
                }
              >
                Retry
              </button>
            </div>
          )}

          <div className="row">
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="receptionist-stat-card">
                <div>
                  <p className="text-muted mb-1">
                    Today's
                    Appointments
                  </p>

                  <h2 className="mb-0">
                    {loading
                      ? "—"
                      : summary.todayAppointments}
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
                    {loading
                      ? "—"
                      : summary.pendingRequests}
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
                    {loading
                      ? "—"
                      : summary.checkedIn}
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
                    {loading
                      ? "—"
                      : formatMoney(
                          summary.paymentsToday
                        )}
                  </h2>
                </div>

                <div className="receptionist-stat-icon">
                  <i className="fas fa-wallet"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="receptionist-panel mt-3">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
              <div>
                <h4 className="mb-1">
                  Today's
                  Appointments
                </h4>

                <p className="text-muted mb-0">
                  Monitor today's
                  scheduled clients.
                </p>
              </div>

              <Link
                to="/receptionist/bookings"
                className="btn btn-primary mt-3 mt-md-0"
              >
                View All
                Appointments
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-5 text-muted">
                Loading today's
                appointments...
              </div>
            ) : appointments.length ===
              0 ? (
              <div className="text-center py-5">
                <i
                  className="far fa-calendar-check text-muted mb-3"
                  style={{
                    fontSize:
                      "34px",
                  }}
                ></i>

                <h5>
                  No appointments
                  today
                </h5>

                <p className="text-muted mb-0">
                  Today's
                  appointment list
                  is currently
                  empty.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table receptionist-table">
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
                    </tr>
                  </thead>

                  <tbody>
                    {appointments.map(
                      (
                        appointment
                      ) => {
                        const status =
                          prettyStatus(
                            appointment
                          );

                        const client =
                          [
                            appointment.client_first_name,
                            appointment.client_last_name,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " "
                            ) ||
                          "—";

                        const therapist =
                          [
                            appointment.therapist_first_name,
                            appointment.therapist_last_name,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " "
                            ) ||
                          "—";

                        return (
                          <tr
                            key={
                              appointment.id
                            }
                          >
                            <td>
                              {`APT-${String(
                                appointment.id
                              ).padStart(
                                4,
                                "0"
                              )}`}
                            </td>

                            <td>
                              <strong>
                                {
                                  client
                                }
                              </strong>
                            </td>

                            <td>
                              {appointment.service_name ||
                                "—"}
                            </td>

                            <td>
                              {
                                therapist
                              }
                            </td>

                            <td>
                              {formatTime(
                                appointment.start_time
                              )}
                            </td>

                            <td>
                              <span
                                className={`badge ${getStatusClass(
                                  status
                                )} px-3 py-2`}
                              >
                                {
                                  status
                                }
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="row mt-4">
            <div className="col-lg-4 mb-4">
              <Link
                to="/receptionist/walk-in"
                className="receptionist-action-card"
              >
                <i className="fas fa-user-plus"></i>

                <div>
                  <h5>
                    New Walk-In
                  </h5>

                  <p>
                    Create a booking
                    for a walk-in
                    client.
                  </p>
                </div>
              </Link>
            </div>

            <div className="col-lg-4 mb-4">
              <Link
                to="/receptionist/check-in-out"
                className="receptionist-action-card"
              >
                <i className="fas fa-door-open"></i>

                <div>
                  <h5>
                    Check-In / Out
                  </h5>

                  <p>
                    Process arriving
                    and completed
                    clients.
                  </p>
                </div>
              </Link>
            </div>

            <div className="col-lg-4 mb-4">
              <Link
                to="/receptionist/payments"
                className="receptionist-action-card"
              >
                <i className="fas fa-money-bill-wave"></i>

                <div>
                  <h5>
                    Record Payment
                  </h5>

                  <p>
                    Record client
                    payments and
                    receipts.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ReceptionistDashboard;