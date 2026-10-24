import { useState } from "react";
import { Link } from "react-router-dom";

import guestAppointments from "../../data/guestAppointments";

function MyAppointments() {
  const [appointments, setAppointments] = useState(
    guestAppointments.filter(
      (appointment) =>
        appointment.status === "Confirmed" ||
        appointment.status === "Pending"
    )
  );

  const [rescheduleAppointment, setRescheduleAppointment] =
    useState(null);

  const [cancelAppointment, setCancelAppointment] =
    useState(null);

  const [rescheduleData, setRescheduleData] = useState({
    date: "",
    time: "",
  });

  const today = new Date().toISOString().split("T")[0];

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

    if (status === "Cancelled") {
      return "badge-danger";
    }

    return "badge-secondary";
  };

  const openRescheduleModal = (appointment) => {
    setRescheduleAppointment(appointment);

    setRescheduleData({
      date: appointment.date,
      time: appointment.timeValue || "",
    });
  };

  const closeRescheduleModal = () => {
    setRescheduleAppointment(null);

    setRescheduleData({
      date: "",
      time: "",
    });
  };

  const handleRescheduleChange = (event) => {
    const { name, value } = event.target;

    setRescheduleData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleRescheduleSubmit = (event) => {
    event.preventDefault();

    if (!rescheduleAppointment) {
      return;
    }

    const timeLabels = {
      "09:00": "9:00 AM",
      "10:00": "10:00 AM",
      "11:00": "11:00 AM",
      "13:00": "1:00 PM",
      "14:00": "2:00 PM",
      "15:00": "3:00 PM",
      "16:00": "4:00 PM",
      "17:00": "5:00 PM",
    };

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === rescheduleAppointment.id
          ? {
              ...appointment,
              date: rescheduleData.date,
              time:
                timeLabels[rescheduleData.time] ||
                appointment.time,
              timeValue: rescheduleData.time,
              status: "Pending",
            }
          : appointment
      )
    );

    closeRescheduleModal();
  };

  const openCancelModal = (appointment) => {
    setCancelAppointment(appointment);
  };

  const closeCancelModal = () => {
    setCancelAppointment(null);
  };

  const confirmCancellation = () => {
    if (!cancelAppointment) {
      return;
    }

    setAppointments((current) =>
      current.filter(
        (appointment) =>
          appointment.id !== cancelAppointment.id
      )
    );

    closeCancelModal();
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

          {/* Appointments */}
          {appointments.length > 0 ? (
            <div className="row">
              {appointments.map((appointment) => (
                <div
                  className="col-lg-6 mb-4"
                  key={appointment.id}
                >
                  <div className="guest-appointment-card bg-light h-100 p-4">
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
                        {appointment.status}
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
                          {formatDate(appointment.date)}
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
                      <div className="bg-white p-3 mb-4">
                        <p className="text-muted mb-1">
                          Special Request
                        </p>

                        <p className="mb-0">
                          {appointment.specialRequest}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="d-flex flex-wrap">
                      <button
                        type="button"
                        className="btn btn-outline-primary mr-2 mb-2"
                        onClick={() =>
                          openRescheduleModal(appointment)
                        }
                      >
                        <i className="far fa-calendar-alt mr-2"></i>
                        Reschedule
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-danger mb-2"
                        onClick={() =>
                          openCancelModal(appointment)
                        }
                      >
                        <i className="far fa-times-circle mr-2"></i>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-light text-center p-5">
              <i className="far fa-calendar-times fa-4x text-primary mb-4"></i>

              <h3>No Upcoming Appointments</h3>

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
              to="/guest/history"
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
            if (event.target === event.currentTarget) {
              closeRescheduleModal();
            }
          }}
        >
          <div className="guest-action-modal">
            <button
              type="button"
              className="guest-modal-close"
              onClick={closeRescheduleModal}
              aria-label="Close"
            >
              &times;
            </button>

            <h3 className="mb-2">
              Reschedule Appointment
            </h3>

            <p className="text-muted mb-4">
              {rescheduleAppointment.service} with{" "}
              {rescheduleAppointment.therapist}
            </p>

            <form onSubmit={handleRescheduleSubmit}>
              <div className="form-group">
                <label htmlFor="reschedule-date">
                  New Date
                </label>

                <input
                  id="reschedule-date"
                  type="date"
                  name="date"
                  min={today}
                  value={rescheduleData.date}
                  onChange={handleRescheduleChange}
                  className="form-control p-4"
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
                  value={rescheduleData.time}
                  onChange={handleRescheduleChange}
                  className="custom-select px-4"
                  style={{ height: "47px" }}
                  required
                >
                  <option value="">
                    Select A Time
                  </option>

                  <option value="09:00">
                    9:00 AM
                  </option>

                  <option value="10:00">
                    10:00 AM
                  </option>

                  <option value="11:00">
                    11:00 AM
                  </option>

                  <option value="13:00">
                    1:00 PM
                  </option>

                  <option value="14:00">
                    2:00 PM
                  </option>

                  <option value="15:00">
                    3:00 PM
                  </option>

                  <option value="16:00">
                    4:00 PM
                  </option>

                  <option value="17:00">
                    5:00 PM
                  </option>
                </select>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button
                  type="button"
                  className="btn btn-light mr-2"
                  onClick={closeRescheduleModal}
                >
                  Close
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Changes
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
            if (event.target === event.currentTarget) {
              closeCancelModal();
            }
          }}
        >
          <div className="guest-action-modal text-center">
            <button
              type="button"
              className="guest-modal-close"
              onClick={closeCancelModal}
              aria-label="Close"
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
                {cancelAppointment.service}
              </strong>{" "}
              appointment on{" "}
              <strong>
                {formatDate(cancelAppointment.date)}
              </strong>
              ?
            </p>

            <div className="d-flex justify-content-center mt-4">
              <button
                type="button"
                className="btn btn-light mr-2"
                onClick={closeCancelModal}
              >
                Keep Appointment
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmCancellation}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MyAppointments;