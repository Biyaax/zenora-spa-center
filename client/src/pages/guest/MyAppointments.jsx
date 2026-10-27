import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";
import { api } from "../../api/client";

function formatDate(date) {
  if (!date) {
    return "";
  }

  return new Date(
    `${String(date).slice(0, 10)}T00:00:00`
  ).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  const time =
    String(value).slice(0, 5);

  const [
    hourText,
    minuteText,
  ] = time.split(":");

  let hour =
    Number(hourText);

  const suffix =
    hour >= 12
      ? "PM"
      : "AM";

  hour %= 12;

  if (hour === 0) {
    hour = 12;
  }

  return `${hour}:${minuteText} ${suffix}`;
}

function displayStatus(status) {
  if (!status) {
    return "";
  }

  return String(status)
    .split("-")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

function getStatusClass(status) {
  const normalized =
    String(status || "").toLowerCase();

  if (normalized === "confirmed") {
    return "badge-success";
  }

  if (normalized === "pending") {
    return "badge-warning";
  }

  if (normalized === "cancelled") {
    return "badge-danger";
  }

  if (normalized === "completed") {
    return "badge-info";
  }

  if (normalized === "no-show") {
    return "badge-dark";
  }

  return "badge-secondary";
}

function normalizeAppointment(appointment) {
  return {
    ...appointment,

    id:
      appointment.id,

    service:
      appointment.service_name ??
      appointment.service ??
      "Service",

    therapist:
      appointment.therapist_name ??
      appointment.therapist ??
      "Assigned Therapist",

    therapistId:
      appointment.therapist_id ??
      appointment.therapistId ??
      null,

    date:
      appointment.appointment_date ??
      appointment.date ??
      "",

    time:
      formatTime(
        appointment.start_time ??
          appointment.time ??
          ""
      ),

    timeValue:
      String(
        appointment.start_time ??
          appointment.timeValue ??
          appointment.time ??
          ""
      ).slice(0, 5),

    duration:
      appointment.duration_minutes ??
      appointment.durationMinutes ??
      appointment.duration ??
      0,

    price:
      Number(
        appointment.amount_due ??
          appointment.price ??
          0
      ),

    specialRequest:
      appointment.special_request ??
      appointment.specialRequest ??
      "",

    status:
      appointment.status ??
      "",

    canModify:
      appointment.can_modify ??
      appointment.canModify ??
      true,
  };
}

function normalizeSlots(data) {
  const rawSlots =
    Array.isArray(data)
      ? data
      : data?.slots ??
        data?.availability ??
        data?.items ??
        [];

  return rawSlots
    .map((slot) => {
      if (
        typeof slot === "string"
      ) {
        return {
          start: slot,
        };
      }

      return {
        ...slot,

        start:
          slot.start ??
          slot.start_time ??
          slot.time ??
          "",
      };
    })
    .filter(
      (slot) => slot.start
    );
}

function MyAppointments() {
  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    pageError,
    setPageError,
  ] = useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    actionMessage,
    setActionMessage,
  ] = useState("");

  const [
    rescheduleAppointment,
    setRescheduleAppointment,
  ] = useState(null);

  const [
    cancelAppointment,
    setCancelAppointment,
  ] = useState(null);

  const [
    rescheduleData,
    setRescheduleData,
  ] = useState({
    date: "",
    time: "",
  });

  const [
    rescheduleSlots,
    setRescheduleSlots,
  ] = useState([]);

  const [
    loadingSlots,
    setLoadingSlots,
  ] = useState(false);

  const [
    savingReschedule,
    setSavingReschedule,
  ] = useState(false);

  const [
    cancelling,
    setCancelling,
  ] = useState(false);

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const loadAppointments =
    useCallback(
      async () => {
        setLoading(true);
        setPageError("");

        try {
          const data =
            await api(
              "/me/appointments"
            );

          const upcoming =
            data?.upcoming ??
            data?.appointments?.upcoming ??
            [];

          setAppointments(
            upcoming.map(
              normalizeAppointment
            )
          );
        } catch (err) {
          setAppointments([]);

          setPageError(
            err?.message ||
              "Unable to load your appointments."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const openRescheduleModal = (
    appointment
  ) => {
    setActionError("");
    setActionMessage("");

    setRescheduleAppointment(
      appointment
    );

    setRescheduleData({
      date:
        appointment.date ||
        "",
      time: "",
    });

    setRescheduleSlots([]);
  };

  const closeRescheduleModal = () => {
    if (savingReschedule) {
      return;
    }

    setRescheduleAppointment(null);

    setRescheduleData({
      date: "",
      time: "",
    });

    setRescheduleSlots([]);
    setActionError("");
  };

  const handleRescheduleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setActionError("");

    setRescheduleData(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  };

  useEffect(() => {
    let active = true;

    async function loadSlots() {
      if (
        !rescheduleAppointment ||
        !rescheduleData.date
      ) {
        setRescheduleSlots([]);
        return;
      }

      setLoadingSlots(true);
      setActionError("");

      try {
        const data =
          await api(
            `/me/appointments/${rescheduleAppointment.id}/availability`,
            {
              query: {
                date:
                  rescheduleData.date,

                therapistId:
                  rescheduleAppointment.therapistId ||
                  undefined,
              },
            }
          );

        if (active) {
          setRescheduleSlots(
            normalizeSlots(data)
          );

          setRescheduleData(
            (current) => ({
              ...current,
              time: "",
            })
          );
        }
      } catch (err) {
        if (active) {
          setRescheduleSlots([]);

          setActionError(
            err?.message ||
              "Unable to load available times."
          );
        }
      } finally {
        if (active) {
          setLoadingSlots(false);
        }
      }
    }

    loadSlots();

    return () => {
      active = false;
    };
  }, [
    rescheduleAppointment,
    rescheduleData.date,
  ]);

  const handleRescheduleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !rescheduleAppointment ||
        savingReschedule
      ) {
        return;
      }

      if (
        !rescheduleData.date ||
        !rescheduleData.time
      ) {
        setActionError(
          "Please select a new date and time."
        );

        return;
      }

      setSavingReschedule(true);
      setActionError("");
      setActionMessage("");

      try {
        await api(
          `/me/appointments/${rescheduleAppointment.id}/reschedule`,
          {
            method: "PATCH",

            body: {
              date:
                rescheduleData.date,

              start:
                rescheduleData.time,
            },
          }
        );

        closeRescheduleModal();

        setActionMessage(
          "Your appointment was rescheduled and is awaiting confirmation."
        );

        await loadAppointments();
      } catch (err) {
        setActionError(
          err?.message ||
            "Unable to reschedule the appointment."
        );
      } finally {
        setSavingReschedule(false);
      }
    };

  const openCancelModal = (
    appointment
  ) => {
    setActionError("");
    setActionMessage("");

    setCancelAppointment(
      appointment
    );
  };

  const closeCancelModal = () => {
    if (cancelling) {
      return;
    }

    setCancelAppointment(null);
    setActionError("");
  };

  const confirmCancellation =
    async () => {
      if (
        !cancelAppointment ||
        cancelling
      ) {
        return;
      }

      setCancelling(true);
      setActionError("");
      setActionMessage("");

      try {
        await api(
          `/me/appointments/${cancelAppointment.id}/cancel`,
          {
            method: "POST",
            body: {},
          }
        );

        closeCancelModal();

        setActionMessage(
          "Your appointment was cancelled successfully."
        );

        await loadAppointments();
      } catch (err) {
        setActionError(
          err?.message ||
            "Unable to cancel the appointment."
        );
      } finally {
        setCancelling(false);
      }
    };

  return (
    <>
      <div className="container-fluid py-5 mt-4">
        <div className="container">
          {/* Page Heading */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-5">
            <div>
              <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
                Guest Account
              </h6>

              <h1 className="mb-2">
                My Appointments
              </h1>

              <p className="text-muted mb-0">
                View and manage your upcoming spa
                appointments.
              </p>
            </div>

            <Link
              to="/appointment"
              className="btn btn-primary mt-3 mt-md-0"
            >
              <i className="far fa-calendar-plus mr-2"></i>
              Book New Appointment
            </Link>
          </div>

          {actionMessage && (
            <div className="alert alert-success">
              {actionMessage}
            </div>
          )}

          {pageError && (
            <div className="alert alert-danger">
              {pageError}

              <button
                type="button"
                className="btn btn-sm btn-outline-danger ml-3"
                onClick={
                  loadAppointments
                }
              >
                Try Again
              </button>
            </div>
          )}

          {loading ? (
            <div className="bg-light text-center p-5">
              <i className="fa fa-spinner fa-spin fa-3x text-primary mb-4"></i>

              <h3>
                Loading Appointments
              </h3>

              <p className="text-muted mb-0">
                Retrieving your appointment records.
              </p>
            </div>
          ) : appointments.length > 0 ? (
            <div className="row">
              {appointments.map(
                (appointment) => (
                  <div
                    className="col-lg-6 mb-4"
                    key={
                      appointment.id
                    }
                  >
                    <div className="guest-appointment-card bg-light h-100 p-4">
                      {/* Header */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h4 className="mb-1">
                            {
                              appointment.service
                            }
                          </h4>

                          <p className="text-muted mb-0">
                            #
                            {
                              appointment.id
                            }
                          </p>
                        </div>

                        <span
                          className={`badge ${getStatusClass(
                            appointment.status
                          )} px-3 py-2`}
                        >
                          {displayStatus(
                            appointment.status
                          )}
                        </span>
                      </div>

                      <hr />

                      {/* Details */}
                      <div className="row">
                        <div className="col-sm-6 mb-3">
                          <p className="text-muted mb-1">
                            Therapist
                          </p>

                          <strong>
                            {
                              appointment.therapist
                            }
                          </strong>
                        </div>

                        <div className="col-sm-6 mb-3">
                          <p className="text-muted mb-1">
                            Service Price
                          </p>

                          <strong className="text-primary">
                            ₱
                            {appointment.price.toLocaleString()}
                          </strong>
                        </div>

                        <div className="col-sm-6 mb-3">
                          <p className="text-muted mb-1">
                            Date
                          </p>

                          <strong>
                            {formatDate(
                              appointment.date
                            )}
                          </strong>
                        </div>

                        <div className="col-sm-6 mb-3">
                          <p className="text-muted mb-1">
                            Time
                          </p>

                          <strong>
                            {
                              appointment.time
                            }
                          </strong>
                        </div>

                        <div className="col-sm-6 mb-3">
                          <p className="text-muted mb-1">
                            Duration
                          </p>

                          <strong>
                            {
                              appointment.duration
                            }{" "}
                            minutes
                          </strong>
                        </div>
                      </div>

                      {/* Special Request */}
                      {appointment.specialRequest && (
                        <div className="bg-white p-3 mb-4">
                          <p className="text-muted mb-1">
                            Special Request
                          </p>

                          <p className="mb-0">
                            {
                              appointment.specialRequest
                            }
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      {appointment.canModify && (
                        <div className="d-flex flex-wrap">
                          <button
                            type="button"
                            className="btn btn-outline-primary mr-2 mb-2"
                            onClick={() =>
                              openRescheduleModal(
                                appointment
                              )
                            }
                          >
                            <i className="far fa-calendar-alt mr-2"></i>
                            Reschedule
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-danger mb-2"
                            onClick={() =>
                              openCancelModal(
                                appointment
                              )
                            }
                          >
                            <i className="far fa-times-circle mr-2"></i>
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-light text-center p-5">
              <i className="far fa-calendar-times fa-4x text-primary mb-4"></i>

              <h3>
                No Upcoming Appointments
              </h3>

              <p className="text-muted">
                You currently have no scheduled spa
                appointments.
              </p>

              <Link
                to="/appointment"
                className="btn btn-primary"
              >
                Book Appointment
              </Link>
            </div>
          )}

          {/* History Link */}
          <div className="text-center mt-4">
            <Link
              to="/guest/booking-history"
              className="btn btn-outline-dark"
            >
              <i className="fa fa-history mr-2"></i>
              View Booking History
            </Link>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleAppointment && (
        <div
          className="guest-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeRescheduleModal();
            }
          }}
        >
          <div className="guest-action-modal">
            <button
              type="button"
              className="guest-modal-close"
              onClick={
                closeRescheduleModal
              }
              aria-label="Close"
              disabled={
                savingReschedule
              }
            >
              &times;
            </button>

            <h3 className="mb-2">
              Reschedule Appointment
            </h3>

            <p className="text-muted mb-4">
              {
                rescheduleAppointment.service
              }{" "}
              with{" "}
              {
                rescheduleAppointment.therapist
              }
            </p>

            <form
              onSubmit={
                handleRescheduleSubmit
              }
            >
              <div className="form-group">
                <label htmlFor="reschedule-date">
                  New Date
                </label>

                <input
                  id="reschedule-date"
                  type="date"
                  name="date"
                  min={today}
                  value={
                    rescheduleData.date
                  }
                  onChange={
                    handleRescheduleChange
                  }
                  className="form-control p-4"
                  disabled={
                    savingReschedule
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reschedule-time">
                  New Time
                </label>

                <select
                  id="reschedule-time"
                  name="time"
                  value={
                    rescheduleData.time
                  }
                  onChange={
                    handleRescheduleChange
                  }
                  className="custom-select px-4"
                  style={{
                    height:
                      "47px",
                  }}
                  disabled={
                    !rescheduleData.date ||
                    loadingSlots ||
                    savingReschedule
                  }
                  required
                >
                  <option value="">
                    {loadingSlots
                      ? "Loading Available Times..."
                      : rescheduleSlots.length === 0
                        ? "No Available Times"
                        : "Select A Time"}
                  </option>

                  {rescheduleSlots.map(
                    (slot) => (
                      <option
                        key={
                          slot.start
                        }
                        value={
                          String(
                            slot.start
                          ).slice(
                            0,
                            5
                          )
                        }
                      >
                        {formatTime(
                          slot.start
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>

              {actionError && (
                <div className="alert alert-danger">
                  {actionError}
                </div>
              )}

              <div className="d-flex justify-content-end mt-4">
                <button
                  type="button"
                  className="btn btn-light mr-2"
                  onClick={
                    closeRescheduleModal
                  }
                  disabled={
                    savingReschedule
                  }
                >
                  Close
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    savingReschedule ||
                    loadingSlots ||
                    !rescheduleData.time
                  }
                >
                  {savingReschedule
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelAppointment && (
        <div
          className="guest-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeCancelModal();
            }
          }}
        >
          <div className="guest-action-modal text-center">
            <button
              type="button"
              className="guest-modal-close"
              onClick={
                closeCancelModal
              }
              aria-label="Close"
              disabled={cancelling}
            >
              &times;
            </button>

            <i className="far fa-times-circle fa-4x text-danger mb-4"></i>

            <h3>
              Cancel Appointment?
            </h3>

            <p className="text-muted">
              Are you sure you want to cancel your{" "}
              <strong>
                {
                  cancelAppointment.service
                }
              </strong>{" "}
              appointment on{" "}
              <strong>
                {formatDate(
                  cancelAppointment.date
                )}
              </strong>
              ?
            </p>

            {actionError && (
              <div className="alert alert-danger text-left">
                {actionError}
              </div>
            )}

            <div className="d-flex justify-content-center mt-4">
              <button
                type="button"
                className="btn btn-light mr-2"
                onClick={
                  closeCancelModal
                }
                disabled={cancelling}
              >
                Keep Appointment
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={
                  confirmCancellation
                }
                disabled={cancelling}
              >
                {cancelling
                  ? "Cancelling..."
                  : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MyAppointments;