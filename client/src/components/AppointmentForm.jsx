import { useState } from "react";
import services from "../data/services";

function AppointmentForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    date: "",
    time: "",
    serviceId: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const selectedService = services.find(
      (service) =>
        service.id === Number(formData.serviceId)
    );

    console.log("Appointment submitted:", {
      ...formData,
      service: selectedService,
    });

    setMessage(
      "Appointment information is ready to be submitted."
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="col-sm-6">
          <div className="form-group">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-control bg-transparent p-4"
              placeholder="Your Name"
              required
            />
          </div>
        </div>

        <div className="col-sm-6">
          <div className="form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control bg-transparent p-4"
              placeholder="Your Email"
              required
            />
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="col-sm-6">
          <div className="form-group">
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="form-control bg-transparent p-4"
              required
            />
          </div>
        </div>

        <div className="col-sm-6">
          <div className="form-group">
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="form-control bg-transparent p-4"
              required
            />
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="col-sm-6">
          <div className="form-group">
            <select
              name="serviceId"
              value={formData.serviceId}
              onChange={handleChange}
              className="custom-select bg-transparent px-4"
              style={{ height: "47px" }}
              required
            >
              <option value="">
                Select A Service
              </option>

              {services.map((service) => (
                <option
                  key={service.id}
                  value={service.id}
                >
                  {service.name} - ₱
                  {service.price.toLocaleString()} (
                  {service.durationMinutes} min)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-sm-6">
          <button
            className="btn btn-primary btn-block"
            type="submit"
            style={{ height: "47px" }}
          >
            Make Appointment
          </button>
        </div>
      </div>

      {message && (
        <p className="text-white text-center mt-3 mb-0">
          {message}
        </p>
      )}
    </form>
  );
}

export default AppointmentForm;