import { useMemo, useState } from "react";

import ReceptionistSidebar from "../../components/ReceptionistSidebar";
import services from "../../data/services";
import therapists from "../../data/therapists";

const timeOptions = [
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

function WalkInBooking() {
  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    clientName: "",
    phone: "",
    email: "",
    serviceId: "",
    therapistId: "",
    date: today,
    time: "",
    specialRequest: "",
  });

  const [message, setMessage] = useState("");

  const selectedService = services.find(
    (service) =>
      service.id === Number(formData.serviceId)
  );

  const availableTherapists = useMemo(() => {
    if (!selectedService) {
      return [];
    }

    return therapists.filter((therapist) =>
      therapist.specialties.includes(
        selectedService.name
      )
    );
  }, [selectedService]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,

      ...(name === "serviceId"
        ? {
            therapistId: "",
          }
        : {}),
    }));

    setMessage("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !formData.clientName.trim() ||
      !formData.phone.trim() ||
      !formData.serviceId ||
      !formData.therapistId ||
      !formData.date ||
      !formData.time
    ) {
      setMessage(
        "Please complete all required fields."
      );

      return;
    }

    const therapist = therapists.find(
      (item) =>
        item.id === Number(formData.therapistId)
    );

    const walkInBooking = {
      bookingType: "Walk-In",

      clientName: formData.clientName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),

      serviceId: Number(formData.serviceId),
      service: selectedService?.name,

      therapistId: Number(formData.therapistId),
      therapist: therapist?.name,

      date: formData.date,
      time: formData.time,

      price: selectedService?.price,
      durationMinutes:
        selectedService?.durationMinutes,

      specialRequest:
        formData.specialRequest.trim(),

      status: "Confirmed",
    };

    console.log(
      "Walk-in booking:",
      walkInBooking
    );

    setMessage(
      "Walk-in appointment created successfully."
    );

    setFormData({
      clientName: "",
      phone: "",
      email: "",
      serviceId: "",
      therapistId: "",
      date: today,
      time: "",
      specialRequest: "",
    });
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
              Walk-In Booking
            </h3>
          </div>

          <div className="receptionist-topbar-user">
            <i className="far fa-bell mr-3"></i>

            <div className="receptionist-user-circle">
              R
            </div>

            <div className="ml-2">
              <strong>
                Receptionist
              </strong>

              <small className="d-block text-muted">
                Front Desk
              </small>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="receptionist-content">
          <div className="mb-4">
            <h1 className="mb-2">
              Create Walk-In Booking
            </h1>

            <p className="text-muted mb-0">
              Enter the client's information
              and create an appointment on their
              behalf.
            </p>
          </div>

          <div className="receptionist-walkin-grid">
            {/* Form */}
            <div className="receptionist-panel">
              <form onSubmit={handleSubmit}>
                <h4 className="mb-4">
                  Client Information
                </h4>

                <div className="form-group">
                  <label>
                    Client Name *
                  </label>

                  <input
                    type="text"
                    name="clientName"
                    className="form-control"
                    placeholder="Enter full name"
                    value={
                      formData.clientName
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>
                        Phone Number *
                      </label>

                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        placeholder="09XXXXXXXXX"
                        value={
                          formData.phone
                        }
                        onChange={
                          handleChange
                        }
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label>
                        Email
                      </label>

                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="Optional"
                        value={
                          formData.email
                        }
                        onChange={
                          handleChange
                        }
                      />
                    </div>
                  </div>
                </div>

                <hr className="my-4" />

                <h4 className="mb-4">
                  Appointment Details
                </h4>

                <div className="form-group">
                  <label>
                    Service *
                  </label>

                  <select
                    name="serviceId"
                    className="form-control"
                    value={
                      formData.serviceId
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="">
                      Select service
                    </option>

                    {services.map(
                      (service) => (
                        <option
                          key={
                            service.id
                          }
                          value={
                            service.id
                          }
                        >
                          {service.name} — ₱
                          {service.price.toLocaleString()}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Therapist *
                  </label>

                  <select
                    name="therapistId"
                    className="form-control"
                    value={
                      formData.therapistId
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      !formData.serviceId
                    }
                  >
                    <option value="">
                      {formData.serviceId
                        ? "Select therapist"
                        : "Select a service first"}
                    </option>

                    {availableTherapists.map(
                      (therapist) => (
                        <option
                          key={
                            therapist.id
                          }
                          value={
                            therapist.id
                          }
                        >
                          {
                            therapist.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>
                        Date *
                      </label>

                      <input
                        type="date"
                        name="date"
                        className="form-control"
                        min={today}
                        value={
                          formData.date
                        }
                        onChange={
                          handleChange
                        }
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label>
                        Time *
                      </label>

                      <select
                        name="time"
                        className="form-control"
                        value={
                          formData.time
                        }
                        onChange={
                          handleChange
                        }
                      >
                        <option value="">
                          Select time
                        </option>

                        {timeOptions.map(
                          (time) => (
                            <option
                              key={
                                time
                              }
                              value={
                                time
                              }
                            >
                              {time}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Special Request
                  </label>

                  <textarea
                    name="specialRequest"
                    className="form-control"
                    rows="4"
                    placeholder="Optional notes or special requests"
                    value={
                      formData.specialRequest
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                {message && (
                  <div
                    className={`alert ${
                      message.includes(
                        "successfully"
                      )
                        ? "alert-success"
                        : "alert-danger"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  <i className="fas fa-calendar-plus mr-2"></i>

                  Create Walk-In Booking
                </button>
              </form>
            </div>

            {/* Summary */}
            <div>
              <div className="receptionist-panel receptionist-booking-summary">
                <h4 className="mb-4">
                  Booking Summary
                </h4>

                {selectedService ? (
                  <>
                    <div className="receptionist-summary-row">
                      <span>
                        Service
                      </span>

                      <strong>
                        {
                          selectedService.name
                        }
                      </strong>
                    </div>

                    <div className="receptionist-summary-row">
                      <span>
                        Duration
                      </span>

                      <strong>
                        {
                          selectedService.durationMinutes
                        }{" "}
                        minutes
                      </strong>
                    </div>

                    <div className="receptionist-summary-row">
                      <span>
                        Price
                      </span>

                      <strong className="text-primary">
                        ₱
                        {selectedService.price.toLocaleString()}
                      </strong>
                    </div>

                    <div className="receptionist-summary-row">
                      <span>
                        Booking Type
                      </span>

                      <strong>
                        Walk-In
                      </strong>
                    </div>

                    <div className="receptionist-summary-row">
                      <span>
                        Status
                      </span>

                      <span className="badge badge-success px-3 py-2">
                        Confirmed
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-spa fa-3x text-primary mb-3"></i>

                    <p className="text-muted mb-0">
                      Select a service
                      to view the booking
                      summary.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default WalkInBooking;