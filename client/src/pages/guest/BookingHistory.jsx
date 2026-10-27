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
  ).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  const time = String(value).slice(0, 5);

  const [
    hourText,
    minuteText,
  ] = time.split(":");

  let hour = Number(hourText);

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

  if (normalized === "completed") {
    return "badge-success";
  }

  if (normalized === "cancelled") {
    return "badge-danger";
  }

  if (normalized === "no-show") {
    return "badge-dark";
  }

  if (normalized === "confirmed") {
    return "badge-success";
  }

  if (normalized === "pending") {
    return "badge-warning";
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

    status:
      appointment.status ??
      "",

    specialRequest:
      appointment.special_request ??
      appointment.specialRequest ??
      "",

    cancelReason:
      appointment.cancel_reason ??
      appointment.cancelReason ??
      "",
  };
}

function BookingHistory() {
  const [
    bookingHistory,
    setBookingHistory,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadHistory =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const data =
          await api(
            "/me/appointments"
          );

        const history =
          data?.history ??
          data?.appointments?.history ??
          [];

        setBookingHistory(
          history.map(
            normalizeAppointment
          )
        );
      } catch (err) {
        setBookingHistory([]);

        setError(
          err?.message ||
            "Unable to load your booking history."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <>
      <div className="container-fluid py-5 mt-4">
        <div className="container">
          {/* Heading */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-5">
            <div>
              <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
                Guest Account
              </h6>

              <h1 className="mb-2">
                Booking History
              </h1>

              <p className="text-muted mb-0">
                Review your previous spa appointments.
              </p>
            </div>

            <Link
              to="/guest/my-appointments"
              className="btn btn-outline-primary mt-3 mt-md-0"
            >
              <i className="far fa-calendar-alt mr-2"></i>
              My Appointments
            </Link>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-danger">
              {error}

              <button
                type="button"
                className="btn btn-sm btn-outline-danger ml-3"
                onClick={loadHistory}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="bg-light text-center p-5">
              <i className="fa fa-spinner fa-spin fa-3x text-primary mb-4"></i>

              <h3>
                Loading Booking History
              </h3>

              <p className="text-muted mb-0">
                Retrieving your previous appointments.
              </p>
            </div>
          ) : bookingHistory.length > 0 ? (
            /* History */
            <div className="row">
              {bookingHistory.map(
                (appointment) => (
                  <div
                    className="col-lg-6 mb-4"
                    key={appointment.id}
                  >
                    <div className="guest-history-card bg-light h-100 p-4">
                      {/* Header */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h4 className="mb-1">
                            {appointment.service}
                          </h4>

                          <p className="text-muted mb-0">
                            #{appointment.id}
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
                            {appointment.therapist}
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
                            {appointment.time}
                          </strong>
                        </div>

                        <div className="col-sm-6 mb-3">
                          <p className="text-muted mb-1">
                            Duration
                          </p>

                          <strong>
                            {appointment.duration} minutes
                          </strong>
                        </div>
                      </div>

                      {/* Special Request */}
                      {appointment.specialRequest && (
                        <div className="bg-white p-3 mb-3">
                          <p className="text-muted mb-1">
                            Special Request
                          </p>

                          <p className="mb-0">
                            {appointment.specialRequest}
                          </p>
                        </div>
                      )}

                      {/* Cancellation reason */}
                      {appointment.cancelReason && (
                        <div className="bg-white p-3 mb-3">
                          <p className="text-muted mb-1">
                            Cancellation Details
                          </p>

                          <p className="mb-0">
                            {appointment.cancelReason}
                          </p>
                        </div>
                      )}

                      {/* Rebook */}
                      {String(
                        appointment.status
                      ).toLowerCase() ===
                        "completed" && (
                        <Link
                          to="/appointment"
                          className="btn btn-primary mt-2"
                        >
                          <i className="far fa-calendar-plus mr-2"></i>
                          Book Again
                        </Link>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-light text-center p-5">
              <i className="fa fa-history fa-4x text-primary mb-4"></i>

              <h3>
                No Booking History
              </h3>

              <p className="text-muted">
                Your completed, cancelled, and previous
                appointments will appear here.
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
    </>
  );
}

export default BookingHistory;