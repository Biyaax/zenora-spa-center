import {
  useEffect,
  useState,
} from "react";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

function getServices(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return (
    data?.services ||
    data?.items ||
    []
  );
}

function getTherapists(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return (
    data?.therapists ||
    data?.items ||
    []
  );
}

function getSlots(data) {
  const rawSlots = Array.isArray(data)
    ? data
    : data?.slots ||
      data?.availability ||
      data?.items ||
      [];

  return rawSlots
    .map((slot) => {
      if (typeof slot === "string") {
        return {
          start: slot,
        };
      }

      return {
        ...slot,

        start:
          slot.start ||
          slot.start_time ||
          slot.time ||
          "",
      };
    })
    .filter((slot) => slot.start);
}

function getTherapistName(therapist) {
  if (therapist.name) {
    return therapist.name;
  }

  return [
    therapist.first_name,
    therapist.last_name,
  ]
    .filter(Boolean)
    .join(" ");
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

function AppointmentForm() {
  const {
    user,
    isLoggedIn,
  } = useAuth();

  const [services, setServices] =
    useState([]);

  const [
    therapists,
    setTherapists,
  ] = useState([]);

  const [slots, setSlots] =
    useState([]);

  const [
    loadingServices,
    setLoadingServices,
  ] = useState(true);

  const [
    loadingTherapists,
    setLoadingTherapists,
  ] = useState(false);

  const [
    loadingSlots,
    setLoadingSlots,
  ] = useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      serviceId: "",
      therapistId: "",
      date: "",
      time: "",
      specialRequest: "",
    });

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  /*
   * Prefill name and email when the
   * user is logged in.
   *
   * These are NOT read-only.
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData((current) => ({
      ...current,

      name:
        current.name ||
        [
          user.firstName,
          user.lastName,
        ]
          .filter(Boolean)
          .join(" "),

      email:
        current.email ||
        user.email ||
        "",
    }));
  }, [user]);

  /*
   * Load real services from backend.
   */
  useEffect(() => {
    let active = true;

    async function loadServices() {
      setLoadingServices(true);
      setError("");

      try {
        const data =
          await api("/services");

        if (active) {
          setServices(
            getServices(data)
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err?.message ||
              "Unable to load services."
          );
        }
      } finally {
        if (active) {
          setLoadingServices(false);
        }
      }
    }

    loadServices();

    return () => {
      active = false;
    };
  }, []);

  /*
   * Load therapists when a service
   * is selected.
   */
  useEffect(() => {
    let active = true;

    async function loadTherapists() {
      if (!formData.serviceId) {
        setTherapists([]);
        return;
      }

      setLoadingTherapists(true);
      setError("");

      try {
        const data =
          await api(
            "/therapists",
            {
              query: {
                serviceId:
                  formData.serviceId,
              },
            }
          );

        if (active) {
          setTherapists(
            getTherapists(data)
          );
        }
      } catch (err) {
        if (active) {
          setTherapists([]);

          setError(
            err?.message ||
              "Unable to load therapists."
          );
        }
      } finally {
        if (active) {
          setLoadingTherapists(false);
        }
      }
    }

    loadTherapists();

    return () => {
      active = false;
    };
  }, [formData.serviceId]);

  /*
   * Load real available times from
   * the backend.
   */
  useEffect(() => {
    let active = true;

    async function loadSlots() {
      if (
        !formData.serviceId ||
        !formData.therapistId ||
        !formData.date
      ) {
        setSlots([]);
        return;
      }

      setLoadingSlots(true);
      setError("");

      try {
        const data =
          await api(
            "/availability",
            {
              query: {
                serviceId:
                  formData.serviceId,

                therapistId:
                  formData.therapistId,

                date:
                  formData.date,
              },
            }
          );

        if (active) {
          setSlots(
            getSlots(data)
          );
        }
      } catch (err) {
        if (active) {
          setSlots([]);

          setError(
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
    formData.serviceId,
    formData.therapistId,
    formData.date,
  ]);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setMessage("");
    setError("");

    setFormData((current) => {
      if (name === "serviceId") {
        return {
          ...current,

          serviceId: value,
          therapistId: "",
          time: "",
        };
      }

      if (name === "therapistId") {
        return {
          ...current,

          therapistId: value,
          time: "",
        };
      }

      if (name === "date") {
        return {
          ...current,

          date: value,
          time: "",
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setMessage("");
    setError("");

    if (!isLoggedIn || !user) {
      setError(
        "Please log in or create an account before booking an appointment."
      );

      return;
    }

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.serviceId ||
      !formData.therapistId ||
      !formData.date ||
      !formData.time
    ) {
      setError(
        "Please complete all required appointment fields."
      );

      return;
    }

    setSubmitting(true);

    try {
      await api(
        "/me/appointments",
        {
          method: "POST",

          body: {
            serviceId:
              Number(
                formData.serviceId
              ),

            therapistId:
              Number(
                formData.therapistId
              ),

            date:
              formData.date,

            start:
              formData.time,

            specialRequest:
              formData.specialRequest.trim(),
          },
        }
      );

      setMessage(
        "Your appointment request was submitted successfully and is awaiting confirmation."
      );

      /*
       * Keep name/email so the Guest
       * does not need to type them again.
       */
      setFormData(
        (current) => ({
          name:
            current.name,

          email:
            current.email,

          serviceId: "",
          therapistId: "",
          date: "",
          time: "",
          specialRequest: "",
        })
      );

      setTherapists([]);
      setSlots([]);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to submit your appointment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
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
              value={
                formData.name
              }
              onChange={
                handleChange
              }
              className="form-control bg-transparent p-4"
              placeholder="Your Name"
              autoComplete="name"
              disabled={submitting}
              required
            />
          </div>
        </div>

        <div className="col-sm-6">
          <div className="form-group">
            <input
              type="email"
              name="email"
              value={
                formData.email
              }
              onChange={
                handleChange
              }
              className="form-control bg-transparent p-4"
              placeholder="Your Email"
              autoComplete="email"
              disabled={submitting}
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
              value={
                formData.serviceId
              }
              onChange={
                handleChange
              }
              className="custom-select bg-transparent px-4"
              style={{
                height: "47px",
              }}
              disabled={
                loadingServices ||
                submitting
              }
              required
            >
              <option value="">
                {loadingServices
                  ? "Loading Services..."
                  : "Select A Service"}
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
                    {service.name}
                    {" - ₱"}
                    {Number(
                      service.price ||
                        0
                    ).toLocaleString()}

                    {service.duration_minutes ||
                    service.durationMinutes
                      ? ` (${
                          service.duration_minutes ||
                          service.durationMinutes
                        } min)`
                      : ""}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div className="col-sm-6">
          <div className="form-group">
            <select
              name="therapistId"
              value={
                formData.therapistId
              }
              onChange={
                handleChange
              }
              className="custom-select bg-transparent px-4"
              style={{
                height: "47px",
              }}
              disabled={
                !formData.serviceId ||
                loadingTherapists ||
                submitting
              }
              required
            >
              <option value="">
                {!formData.serviceId
                  ? "Select Service First"
                  : loadingTherapists
                    ? "Loading Therapists..."
                    : "Select A Therapist"}
              </option>

              {therapists.map(
                (therapist) => (
                  <option
                    key={
                      therapist.id
                    }
                    value={
                      therapist.id
                    }
                  >
                    {getTherapistName(
                      therapist
                    )}
                  </option>
                )
              )}
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
              value={
                formData.date
              }
              onChange={
                handleChange
              }
              className="form-control bg-transparent p-4"
              disabled={
                submitting
              }
              required
            />
          </div>
        </div>

        <div className="col-sm-6">
          <div className="form-group">
            <select
              name="time"
              value={
                formData.time
              }
              onChange={
                handleChange
              }
              className="custom-select bg-transparent px-4"
              style={{
                height: "47px",
              }}
              disabled={
                !formData.serviceId ||
                !formData.therapistId ||
                !formData.date ||
                loadingSlots ||
                submitting
              }
              required
            >
              <option value="">
                {!formData.date
                  ? "Select Date First"
                  : loadingSlots
                    ? "Loading Available Times..."
                    : slots.length === 0
                      ? "No Available Times"
                      : "Select A Time"}
              </option>

              {slots.map(
                (slot) => (
                  <option
                    key={
                      `${slot.start}-${slot.therapistId || ""}`
                    }
                    value={
                      slot.start
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
        </div>
      </div>

      {/* Special Request */}
      <div className="form-group">
        <textarea
          name="specialRequest"
          value={
            formData.specialRequest
          }
          onChange={
            handleChange
          }
          className="form-control bg-transparent py-3 px-4"
          rows="3"
          maxLength="500"
          placeholder="Special Request (Optional)"
          disabled={submitting}
        ></textarea>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {message && (
        <div className="alert alert-success">
          {message}
        </div>
      )}

      {/* Submit */}
      <button
        className="btn btn-primary btn-block"
        type="submit"
        style={{
          height: "47px",
        }}
        disabled={submitting}
      >
        {submitting
          ? "Submitting Appointment..."
          : "Make Appointment"}
      </button>
    </form>
  );
}

export default AppointmentForm;