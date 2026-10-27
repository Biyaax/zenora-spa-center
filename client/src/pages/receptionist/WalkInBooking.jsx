import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ReceptionistSidebar from "../../components/ReceptionistSidebar";

const FALLBACK_API_BASE =
  "https://zenora-spa-api-git-bea-supabase-migration-biyaaxs-projects.vercel.app";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  FALLBACK_API_BASE
).replace(/\/$/, "");

function getSpaToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    values[part.type] = part.value;
  }

  return `${values.year}-${values.month}-${values.day}`;
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  const [hourText, minuteText] = value
    .slice(0, 5)
    .split(":");

  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    return value;
  }

  const suffix = hour >= 12 ? "PM" : "AM";

  const displayHour =
    hour % 12 === 0
      ? 12
      : hour % 12;

  return `${displayHour}:${String(minute).padStart(
    2,
    "0"
  )} ${suffix}`;
}

async function receptionistRequest(
  path,
  {
    method = "GET",
    body,
    query,
  } = {}
) {
  const token =
    sessionStorage.getItem("zenoraStaffToken");

  if (!token) {
    const error = new Error(
      "Your receptionist session has expired. Please log in again."
    );

    error.status = 401;

    throw error;
  }

  const url = new URL(
    `${API_BASE}${path}`
  );

  if (query) {
    Object.entries(query).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          url.searchParams.set(
            key,
            String(value)
          );
        }
      }
    );
  }

  const response = await fetch(
    url.toString(),
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),
      },
      ...(body
        ? {
            body: JSON.stringify(body),
          }
        : {}),
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message ||
        data.error ||
        "Something went wrong."
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

async function loadServices() {
  const response = await fetch(
    `${API_BASE}/api/services`
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        "Unable to load services."
    );
  }

  return data.services || [];
}

async function loadWalkInAvailability(
  serviceId,
  date
) {
  /*
   * The receptionist availability route should
   * use forStaff=true on the backend.
   *
   * We also retain a public availability fallback
   * so the page does not die if the receptionist
   * route uses the older route set.
   */

  try {
    const data =
      await receptionistRequest(
        "/api/reception/availability",
        {
          query: {
            serviceId,
            date,
          },
        }
      );

    return data.availability || data;
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }

    const url = new URL(
      `${API_BASE}/api/availability`
    );

    url.searchParams.set(
      "serviceId",
      String(serviceId)
    );

    url.searchParams.set(
      "date",
      date
    );

    const response = await fetch(
      url.toString()
    );

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message ||
          data.error ||
          "Unable to load available times."
      );
    }

    return data;
  }
}

async function createWalkInBooking(body) {
  /*
   * Your receptionist API has used both
   * /appointments and /bookings naming during
   * the recent integration work.
   *
   * Try the current appointments contract first,
   * then the newer bookings alias only when the
   * first path does not exist.
   */

  try {
    return await receptionistRequest(
      "/api/reception/appointments",
      {
        method: "POST",
        body,
      }
    );
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }

    return receptionistRequest(
      "/api/reception/bookings",
      {
        method: "POST",
        body,
      }
    );
  }
}

function WalkInBooking() {
  const today = getSpaToday();

  const [services, setServices] =
    useState([]);

  const [servicesLoading, setServicesLoading] =
    useState(true);

  const [servicesError, setServicesError] =
    useState("");

  const [slots, setSlots] =
    useState([]);

  const [slotsLoading, setSlotsLoading] =
    useState(false);

  const [slotsError, setSlotsError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("");

  const [formData, setFormData] =
    useState({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      serviceId: "",
      time: "",
      specialRequest: "",
      checkInNow: false,
    });

  useEffect(() => {
    let cancelled = false;

    async function fetchServices() {
      setServicesLoading(true);
      setServicesError("");

      try {
        const rows =
          await loadServices();

        if (!cancelled) {
          setServices(
            rows.filter(
              (service) =>
                service.is_active ===
                  undefined ||
                Number(
                  service.is_active
                ) === 1
            )
          );
        }
      } catch (error) {
        if (!cancelled) {
          setServicesError(
            error.message ||
              "Unable to load services."
          );
        }
      } finally {
        if (!cancelled) {
          setServicesLoading(false);
        }
      }
    }

    fetchServices();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchSlots() {
      if (!formData.serviceId) {
        setSlots([]);
        setSlotsError("");

        return;
      }

      setSlotsLoading(true);
      setSlotsError("");
      setSlots([]);

      setFormData((current) => ({
        ...current,
        time: "",
      }));

      try {
        const data =
          await loadWalkInAvailability(
            Number(formData.serviceId),
            today
          );

        if (cancelled) {
          return;
        }

        const availableSlots =
          Array.isArray(data?.slots)
            ? data.slots
            : [];

        setSlots(availableSlots);

        if (
          data?.closed ||
          availableSlots.length === 0
        ) {
          setSlotsError(
            data?.closed
              ? "The spa is closed today."
              : "There are no available times remaining for this service today."
          );
        }
      } catch (error) {
        if (!cancelled) {
          setSlotsError(
            error.message ||
              "Unable to load available times."
          );
        }
      } finally {
        if (!cancelled) {
          setSlotsLoading(false);
        }
      }
    }

    fetchSlots();

    return () => {
      cancelled = true;
    };
  }, [
    formData.serviceId,
    today,
  ]);

  const selectedService =
    useMemo(
      () =>
        services.find(
          (service) =>
            String(service.id) ===
            String(formData.serviceId)
        ) || null,
      [
        services,
        formData.serviceId,
      ]
    );

  const selectedSlot =
    useMemo(
      () =>
        slots.find(
          (slot) =>
            slot.start === formData.time
        ) || null,
      [
        slots,
        formData.time,
      ]
    );

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((current) => ({
      ...current,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setMessage("");
    setMessageType("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.phone.trim() ||
      !formData.serviceId ||
      !formData.time
    ) {
      setMessage(
        "Please complete all required fields."
      );

      setMessageType("error");

      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        type: "walk-in",

        client: {
          firstName:
            formData.firstName.trim(),

          lastName:
            formData.lastName.trim(),

          phone:
            formData.phone.trim(),

          email:
            formData.email.trim(),

          notes: "",
        },

        serviceId:
          Number(formData.serviceId),

        /*
         * No therapistId is sent.
         * The backend chooses an eligible,
         * available therapist for this
         * service and time.
         */

        date: today,

        start:
          formData.time,

        specialRequest:
          formData.specialRequest.trim(),

        checkInNow:
          formData.checkInNow,
      };

      const result =
        await createWalkInBooking(
          payload
        );

      const appointment =
        result.appointment ||
        result.booking ||
        result;

      const bookingId =
        appointment?.id
          ? `APT-${String(
              appointment.id
            ).padStart(4, "0")}`
          : "";

      setMessage(
        bookingId
          ? `Walk-in appointment ${bookingId} created successfully and saved to the database.`
          : "Walk-in appointment created successfully and saved to the database."
      );

      setMessageType("success");

      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        serviceId: "",
        time: "",
        specialRequest: "",
        checkInNow: false,
      });

      setSlots([]);
      setSlotsError("");
    } catch (error) {
      if (error.status === 401) {
        setMessage(
          "Your receptionist session has expired. Please log in again."
        );
      } else {
        setMessage(
          error.message ||
            "Unable to create the walk-in appointment."
        );
      }

      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

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

        <div className="receptionist-content">
          <div className="mb-4">
            <h1 className="mb-2">
              Create Walk-In Booking
            </h1>

            <p className="text-muted mb-0">
              Create a booking for a client
              who is visiting the spa today.
            </p>
          </div>

          <div className="receptionist-walkin-grid">
            {/* Form */}
            <div className="receptionist-panel">
              <form onSubmit={handleSubmit}>
                <h4 className="mb-4">
                  Client Information
                </h4>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="firstName">
                        First Name *
                      </label>

                      <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        className="form-control"
                        placeholder="Enter first name"
                        value={
                          formData.firstName
                        }
                        onChange={
                          handleChange
                        }
                        maxLength="80"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="lastName">
                        Last Name *
                      </label>

                      <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        className="form-control"
                        placeholder="Enter last name"
                        value={
                          formData.lastName
                        }
                        onChange={
                          handleChange
                        }
                        maxLength="80"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="phone">
                        Phone Number *
                      </label>

                      <input
                        id="phone"
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
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="email">
                        Email
                      </label>

                      <input
                        id="email"
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
                  <label htmlFor="serviceId">
                    Service *
                  </label>

                  <select
                    id="serviceId"
                    name="serviceId"
                    className="form-control"
                    value={
                      formData.serviceId
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      servicesLoading ||
                      Boolean(
                        servicesError
                      )
                    }
                    required
                  >
                    <option value="">
                      {servicesLoading
                        ? "Loading services..."
                        : "Select service"}
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
                          {
                            service.name
                          }{" "}
                          — ₱
                          {Number(
                            service.price ||
                              0
                          ).toLocaleString()}
                        </option>
                      )
                    )}
                  </select>

                  {servicesError && (
                    <small className="text-danger d-block mt-2">
                      {
                        servicesError
                      }
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Therapist
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value="Automatically assigned based on availability"
                    readOnly
                  />

                  <small className="form-text text-muted">
                    Zenora will assign an
                    eligible therapist who
                    is available for the
                    selected service and
                    time.
                  </small>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>
                        Date
                      </label>

                      <input
                        type="date"
                        className="form-control"
                        value={today}
                        readOnly
                      />

                      <small className="form-text text-muted">
                        Walk-in bookings
                        are for today only.
                      </small>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="time">
                        Available Time *
                      </label>

                      <select
                        id="time"
                        name="time"
                        className="form-control"
                        value={
                          formData.time
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          !formData.serviceId ||
                          slotsLoading ||
                          slots.length === 0
                        }
                        required
                      >
                        <option value="">
                          {!formData.serviceId
                            ? "Select a service first"
                            : slotsLoading
                            ? "Checking availability..."
                            : slots.length ===
                              0
                            ? "No available times"
                            : "Select time"}
                        </option>

                        {slots.map(
                          (slot) => (
                            <option
                              key={
                                slot.start
                              }
                              value={
                                slot.start
                              }
                            >
                              {formatTime(
                                slot.start
                              )}
                              {slot.end
                                ? ` – ${formatTime(
                                    slot.end
                                  )}`
                                : ""}
                            </option>
                          )
                        )}
                      </select>

                      {slotsError && (
                        <small className="text-danger d-block mt-2">
                          {
                            slotsError
                          }
                        </small>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="specialRequest">
                    Special Request
                  </label>

                  <textarea
                    id="specialRequest"
                    name="specialRequest"
                    className="form-control"
                    rows="4"
                    maxLength="500"
                    placeholder="Optional notes or special requests"
                    value={
                      formData.specialRequest
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                <div className="form-group">
                  <div className="custom-control custom-checkbox">
                    <input
                      id="checkInNow"
                      type="checkbox"
                      name="checkInNow"
                      className="custom-control-input"
                      checked={
                        formData.checkInNow
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <label
                      className="custom-control-label"
                      htmlFor="checkInNow"
                    >
                      Check this client in
                      immediately
                    </label>
                  </div>
                </div>

                {message && (
                  <div
                    className={`alert ${
                      messageType ===
                      "success"
                        ? "alert-success"
                        : "alert-danger"
                    }`}
                    role="alert"
                  >
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    submitting ||
                    servicesLoading ||
                    slotsLoading
                  }
                >
                  <i className="fas fa-calendar-plus mr-2"></i>

                  {submitting
                    ? "Creating Booking..."
                    : "Create Walk-In Booking"}
                </button>
              </form>
            </div>

            {/* Booking Summary */}
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
                        {Number(
                          selectedService.duration_minutes ||
                            0
                        )}{" "}
                        minutes
                      </strong>
                    </div>

                    <div className="receptionist-summary-row">
                      <span>
                        Price
                      </span>

                      <strong className="text-primary">
                        ₱
                        {Number(
                          selectedService.price ||
                            0
                        ).toLocaleString()}
                      </strong>
                    </div>

                    <div className="receptionist-summary-row">
                      <span>
                        Date
                      </span>

                      <strong>
                        {today}
                      </strong>
                    </div>

                    <div className="receptionist-summary-row">
                      <span>
                        Time
                      </span>

                      <strong>
                        {selectedSlot
                          ? `${formatTime(
                              selectedSlot.start
                            )}${
                              selectedSlot.end
                                ? ` – ${formatTime(
                                    selectedSlot.end
                                  )}`
                                : ""
                            }`
                          : "Not selected"}
                      </strong>
                    </div>

                    <div className="receptionist-summary-row">
                      <span>
                        Therapist
                      </span>

                      <strong>
                        Auto-assigned
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

                    <div className="receptionist-summary-row">
                      <span>
                        Check-In
                      </span>

                      <strong>
                        {formData.checkInNow
                          ? "Immediately"
                          : "Not yet"}
                      </strong>
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