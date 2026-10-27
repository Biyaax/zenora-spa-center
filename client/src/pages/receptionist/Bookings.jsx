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

function todayInManila() {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Manila",

        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const values =
    Object.fromEntries(
      parts
        .filter(
          (part) =>
            part.type !==
            "literal"
        )
        .map(
          (part) => [
            part.type,
            part.value,
          ]
        )
    );

  return `${values.year}-${values.month}-${values.day}`;
}

function getWeekRange(
  dateString
) {
  const date =
    new Date(
      `${dateString}T00:00:00Z`
    );

  const day =
    date.getUTCDay();

  const mondayOffset =
    day === 0
      ? -6
      : 1 - day;

  const monday =
    new Date(date);

  monday.setUTCDate(
    date.getUTCDate() +
      mondayOffset
  );

  const sunday =
    new Date(monday);

  sunday.setUTCDate(
    monday.getUTCDate() + 6
  );

  return {
    from:
      monday
        .toISOString()
        .slice(0, 10),

    to:
      sunday
        .toISOString()
        .slice(0, 10),
  };
}

function formatDate(date) {
  if (!date) {
    return "—";
  }

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

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

    case "pending":
      return "badge-warning";

    case "checked in":
    case "ongoing":
      return "badge-primary";

    case "completed":
      return "badge-secondary";

    case "declined":
    case "cancelled":
    case "canceled":
    case "no-show":
      return "badge-danger";

    default:
      return "badge-secondary";
  }
}

function Bookings() {
  const navigate =
    useNavigate();

  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    view,
    setView,
  ] = useState("daily");

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    todayInManila()
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    pendingCount,
    setPendingCount,
  ] = useState(0);

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
          let primaryRequest;

          if (
            view ===
            "requests"
          ) {
            primaryRequest =
              staffRequest(
                "/api/reception/bookings/requests",
                token
              );
          } else if (
            view ===
            "weekly"
          ) {
            const {
              from,
              to,
            } =
              getWeekRange(
                selectedDate
              );

            primaryRequest =
              staffRequest(
                `/api/reception/bookings?from=${encodeURIComponent(
                  from
                )}&to=${encodeURIComponent(
                  to
                )}`,
                token
              );
          } else {
            primaryRequest =
              staffRequest(
                `/api/reception/bookings?from=${encodeURIComponent(
                  selectedDate
                )}&to=${encodeURIComponent(
                  selectedDate
                )}`,
                token
              );
          }

          const requestsPromise =
            view ===
            "requests"
              ? null
              : staffRequest(
                  "/api/reception/bookings/requests",
                  token
                );

          const [
            primaryData,
            requestData,
          ] =
            await Promise.all([
              primaryRequest,
              requestsPromise,
            ]);

          const nextAppointments =
            Array.isArray(
              primaryData
                ?.appointments
            )
              ? primaryData.appointments
              : [];

          setAppointments(
            nextAppointments
          );

          if (
            view ===
            "requests"
          ) {
            setPendingCount(
              nextAppointments
                .length
            );
          } else {
            setPendingCount(
              Number(
                requestData
                  ?.total || 0
              )
            );
          }
        } catch (err) {
          setAppointments([]);

          setError(
            err.message ||
              "Unable to load appointments."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        navigate,
        selectedDate,
        view,
      ]
    );

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const visibleAppointments =
    useMemo(() => {
      let values = [
        ...appointments,
      ];

      if (
        search.trim()
      ) {
        const searchValue =
          search
            .trim()
            .toLowerCase();

        values =
          values.filter(
            (
              appointment
            ) => {
              const fields = [
                appointment.bookingId,
                appointment.client,
                appointment.phone,
                appointment.service,
                appointment.therapist,
                appointment.bookingType,
                appointment.status,
              ];

              return fields.some(
                (field) =>
                  String(
                    field || ""
                  )
                    .toLowerCase()
                    .includes(
                      searchValue
                    )
              );
            }
          );
      }

      return values.sort(
        (a, b) => {
          const dateCompare =
            String(
              a.date || ""
            ).localeCompare(
              String(
                b.date || ""
              )
            );

          if (
            dateCompare !== 0
          ) {
            return dateCompare;
          }

          return String(
            a.startTime || ""
          ).localeCompare(
            String(
              b.startTime ||
                ""
            )
          );
        }
      );
    }, [
      appointments,
      search,
    ]);

  const confirmBooking =
    async (appointment) => {
      const accepted =
        window.confirm(
          `Confirm ${
            appointment.bookingId
          } for ${
            appointment.client
          }?`
        );

      if (!accepted) {
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
          `/api/reception/bookings/${appointment.id}/confirm`,
          token,
          {
            method: "POST",
          }
        );

        await loadAppointments();
      } catch (err) {
        setError(
          err.message ||
            "Unable to confirm booking."
        );
      } finally {
        setUpdatingId(null);
      }
    };

  const declineBooking =
    async (appointment) => {
      const reason =
        window.prompt(
          `Reason for declining ${appointment.bookingId}?\n\nYou may leave this blank.`
        );

      if (
        reason === null
      ) {
        return;
      }

      const accepted =
        window.confirm(
          `Decline ${
            appointment.bookingId
          } for ${
            appointment.client
          }?`
        );

      if (!accepted) {
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
          `/api/reception/bookings/${appointment.id}/decline`,
          token,
          {
            method: "POST",

            body:
              JSON.stringify({
                reason:
                  reason.trim(),
              }),
          }
        );

        await loadAppointments();
      } catch (err) {
        setError(
          err.message ||
            "Unable to decline booking."
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
          title="Appointments"
        />

        <div className="receptionist-content">
          <div className="mb-4">
            <h1 className="mb-2">
              Appointment
              Management
            </h1>

            <p className="text-muted mb-0">
              View scheduled
              appointments and
              manage online booking
              requests.
            </p>
          </div>

          <div className="receptionist-appointment-toolbar">
            <div className="receptionist-view-tabs">
              <button
                type="button"
                className={
                  view ===
                  "daily"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setView(
                    "daily"
                  )
                }
              >
                <i className="far fa-calendar mr-2"></i>
                Daily
              </button>

              <button
                type="button"
                className={
                  view ===
                  "weekly"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setView(
                    "weekly"
                  )
                }
              >
                <i className="far fa-calendar-alt mr-2"></i>
                Weekly
              </button>

              <button
                type="button"
                className={
                  view ===
                  "requests"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setView(
                    "requests"
                  )
                }
              >
                <i className="far fa-clock mr-2"></i>

                Booking Requests

                {pendingCount >
                  0 && (
                  <span className="receptionist-request-count">
                    {
                      pendingCount
                    }
                  </span>
                )}
              </button>
            </div>

            {view !==
              "requests" && (
              <div className="receptionist-date-filter">
                <label htmlFor="appointment-date">
                  {view ===
                  "daily"
                    ? "Date"
                    : "Week of"}
                </label>

                <input
                  id="appointment-date"
                  type="date"
                  className="form-control"
                  value={
                    selectedDate
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedDate(
                      event
                        .target
                        .value
                    )
                  }
                />
              </div>
            )}
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
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
              <div>
                <h4 className="mb-1">
                  {view ===
                    "daily" &&
                    "Daily Appointments"}

                  {view ===
                    "weekly" &&
                    "Weekly Appointments"}

                  {view ===
                    "requests" &&
                    "Online Booking Requests"}
                </h4>

                <p className="text-muted mb-0">
                  {loading
                    ? "Loading appointments..."
                    : `${
                        visibleAppointments.length
                      } appointment${
                        visibleAppointments.length ===
                        1
                          ? ""
                          : "s"
                      } found`}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="receptionist-empty-state">
                <i className="fas fa-spinner fa-spin"></i>

                <h4>
                  Loading
                  Appointments
                </h4>

                <p>
                  Retrieving
                  appointment data
                  from the system.
                </p>
              </div>
            ) : visibleAppointments.length >
              0 ? (
              <div className="table-responsive">
                <table className="table receptionist-table receptionist-appointments-table">
                  <thead>
                    <tr>
                      <th>
                        Booking ID
                      </th>

                      <th>
                        Date / Time
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
                        Type
                      </th>

                      <th>
                        Status
                      </th>

                      {view ===
                        "requests" && (
                        <th>
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {visibleAppointments.map(
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
                              {formatDate(
                                appointment.date
                              )}
                            </strong>

                            <small className="d-block text-muted">
                              {formatTime(
                                appointment.startTime
                              )}
                            </small>
                          </td>

                          <td>
                            <strong>
                              {appointment.client ||
                                "—"}
                            </strong>

                            <small className="d-block text-muted">
                              {appointment.phone ||
                                "No phone"}
                            </small>
                          </td>

                          <td>
                            {appointment.service ||
                              "—"}

                            <small className="d-block text-muted">
                              {
                                appointment.duration
                              }{" "}
                              mins · ₱
                              {Number(
                                appointment.price ||
                                  0
                              ).toLocaleString(
                                "en-PH"
                              )}
                            </small>
                          </td>

                          <td>
                            {appointment.therapist ||
                              "—"}
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
                                  disabled={
                                    updatingId ===
                                    appointment.id
                                  }
                                  onClick={() =>
                                    confirmBooking(
                                      appointment
                                    )
                                  }
                                >
                                  <i className="fas fa-check mr-1"></i>

                                  {updatingId ===
                                  appointment.id
                                    ? "Saving..."
                                    : "Confirm"}
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  disabled={
                                    updatingId ===
                                    appointment.id
                                  }
                                  onClick={() =>
                                    declineBooking(
                                      appointment
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
                  No Appointments
                  Found
                </h4>

                <p>
                  {view ===
                  "requests"
                    ? "There are currently no pending booking requests."
                    : "There are no appointments for the selected date or week."}
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