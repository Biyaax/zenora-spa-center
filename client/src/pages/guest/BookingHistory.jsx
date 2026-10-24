import { Link } from "react-router-dom";

const bookingHistory = [
  {
    id: "APT-0998",
    service: "Stone Therapy",
    therapist: "Maria Santos",
    date: "2026-09-20",
    time: "1:00 PM",
    duration: 75,
    price: 850,
    status: "Completed",
  },
  {
    id: "APT-0985",
    service: "Face Masking",
    therapist: "Carla Mendoza",
    date: "2026-08-14",
    time: "3:00 PM",
    duration: 30,
    price: 350,
    status: "Completed",
  },
  {
    id: "APT-0974",
    service: "Skin Care",
    therapist: "Angela Reyes",
    date: "2026-07-30",
    time: "11:00 AM",
    duration: 60,
    price: 600,
    status: "Cancelled",
  },
];

function BookingHistory() {
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
    if (status === "Completed") {
      return "badge-success";
    }

    if (status === "Cancelled") {
      return "badge-danger";
    }

    return "badge-secondary";
  };

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
              to="/guest/appointments"
              className="btn btn-outline-primary mt-3 mt-md-0"
            >
              <i className="far fa-calendar-alt mr-2"></i>
              My Appointments
            </Link>
          </div>

          {/* History */}
          {bookingHistory.length > 0 ? (
            <div className="row">
              {bookingHistory.map((appointment) => (
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

                    {/* Rebook */}
                    {appointment.status === "Completed" && (
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
              ))}
            </div>
          ) : (
            <div className="bg-light text-center p-5">
              <i className="fa fa-history fa-4x text-primary mb-4"></i>

              <h3>No Booking History</h3>

              <p className="text-muted">
                Your completed and cancelled appointments
                will appear here.
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