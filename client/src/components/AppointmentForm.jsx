import { useMemo, useState } from "react";
import services from "../data/services";
import therapists from "../data/therapists";

function AppointmentForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    serviceId: "",
    therapistId: "",
    date: "",
    time: "",
    specialRequest: "",
  });

  const [message, setMessage] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const availableTherapists = useMemo(() => {
    if (!formData.serviceId) {
      return [];
    }

    const selectedService = services.find(
      (service) => service.id === Number(formData.serviceId)
    );

    if (!selectedService) {
      return [];
    }

    return therapists.filter((therapist) =>
      therapist.specialties.includes(selectedService.name)
    );
  }, [formData.serviceId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => {
      if (name === "serviceId") {
        return {
          ...current,
          serviceId: value,
          therapistId: "",
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });

    setMessage("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const selectedService = services.find(
      (service) => service.id === Number(formData.serviceId)
    );

    const selectedTherapist = therapists.find(
      (therapist) => therapist.id === Number(formData.therapistId)
    );

    console.log("Appointment submitted:", {
      ...formData,
      service: selectedService,
      therapist: selectedTherapist,
    });

    setMessage(
      "Appointment information is ready to be submitted."
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Name + Email */}
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

      {/* Service + Therapist */}
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
          <div className="form-group">
            <select
              name="therapistId"
              value={formData.therapistId}
              onChange={handleChange}
              className="custom-select bg-transparent px-4"
              style={{ height: "47px" }}
              disabled={!formData.serviceId}
              required
            >
              <option value="">
                {formData.serviceId
                  ? "Select A Therapist"
                  : "Select Service First"}
              </option>

              {availableTherapists.map((therapist) => (
                <option
                  key={therapist.id}
                  value={therapist.id}
                >
                  {therapist.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Date + Time */}
      <div className="form-row">
        <div className="col-sm-6">
          <div className="form-group">
            <input
              type="date"
              name="date"
              min={today}
              value={formData.date}
              onChange={handleChange}
              className="form-control bg-transparent p-4"
              required
            />
          </div>
        </div>

        <div className="col-sm-6">
          <div className="form-group">
            <select
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="custom-select bg-transparent px-4"
              style={{ height: "47px" }}
              required
            >
              <option value="">
                Select A Time
              </option>

              <option value="09:00">9:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="13:00">1:00 PM</option>
              <option value="14:00">2:00 PM</option>
              <option value="15:00">3:00 PM</option>
              <option value="16:00">4:00 PM</option>
              <option value="17:00">5:00 PM</option>
            </select>
          </div>
        </div>
      </div>

      {/* Special Request */}
      <div className="form-group">
        <textarea
          name="specialRequest"
          value={formData.specialRequest}
          onChange={handleChange}
          className="form-control bg-transparent py-3 px-4"
          rows="3"
          placeholder="Special Request (Optional)"
        ></textarea>
      </div>

      {/* Submit */}
      <button
        className="btn btn-primary btn-block"
        type="submit"
        style={{ height: "47px" }}
      >
        Make Appointment
      </button>

      {message && (
        <p className="text-white text-center mt-3 mb-0">
          {message}
        </p>
      )}
    </form>
  );
}

export default AppointmentForm;