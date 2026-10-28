import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { dateError, spaNow, validateAppointment } from "../utils/validation";
import "./AppointmentForm.css";

const EMPTY_BOOKING = { serviceId: "", therapistId: "", date: "", time: "", specialRequest: "" };
const LABELS = {
  serviceId: "Service", therapistId: "Therapist", date: "Appointment date", time: "Time", specialRequest: "Special request (optional)",
};

function formatTime(value) {
  const [hour, minute] = value.split(":");
  return `${Number(hour) % 12 || 12}:${minute} ${Number(hour) >= 12 ? "PM" : "AM"}`;
}

function AppointmentForm() {
  const { user, isLoggedIn, authLoading } = useAuth();
  const [services, setServices] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [slots, setSlots] = useState([]);
  const [rules, setRules] = useState(null);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingTherapists, setLoadingTherapists] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [formData, setFormData] = useState(EMPTY_BOOKING);
  const [refreshSlots, setRefreshSlots] = useState(0);
  const submittingRef = useRef(false);
  const formRef = useRef(null);
  const today = spaNow(rules?.timezone).date;
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const email = user?.email || "";
  const fieldErrors = {
    ...validateAppointment(formData, { services, therapists, slots, rules }),
    ...serverErrors,
  };

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [catalog, hours] = await Promise.all([api("/services"), api("/hours")]);
        if (active) {
          setServices(catalog.services || []);
          setRules(hours);
        }
      } catch (err) {
        if (active) setError(err.message || "Unable to load booking options. Please refresh the page.");
      } finally {
        if (active) setLoadingServices(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!formData.serviceId) {
        setLoadingTherapists(false);
        return;
      }
      setLoadingTherapists(true);
      try {
        const data = await api("/therapists", { query: { serviceId: formData.serviceId } });
        if (active) setTherapists(data.therapists || []);
      } catch (err) {
        if (active) setError(err.message || "Unable to load therapists.");
      } finally {
        if (active) setLoadingTherapists(false);
      }
    }
    load();
    return () => { active = false; };
  }, [formData.serviceId]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!formData.serviceId || !formData.therapistId || dateError(formData.date, rules)) {
        setLoadingSlots(false);
        return;
      }
      setLoadingSlots(true);
      try {
        const data = await api("/availability", {
          query: { serviceId: formData.serviceId, therapistId: formData.therapistId, date: formData.date },
        });
        if (active) setSlots(data.slots || []);
      } catch (err) {
        if (active) setError(err.message || "Unable to load available times.");
      } finally {
        if (active) setLoadingSlots(false);
      }
    }
    load();
    return () => { active = false; };
  }, [formData.serviceId, formData.therapistId, formData.date, rules, refreshSlots]);

  function handleChange(event) {
    const { name: field, value } = event.target;
    setMessage("");
    setError("");
    setServerErrors({});
    const reset = field === "serviceId" ? { therapistId: "", time: "" }
      : ["therapistId", "date"].includes(field) ? { time: "" } : {};
    if (field === "serviceId") {
      setTherapists([]);
      setLoadingTherapists(Boolean(value));
    }
    if (["serviceId", "therapistId", "date"].includes(field)) {
      setSlots([]);
      const next = { ...formData, [field]: value, ...reset };
      setLoadingSlots(Boolean(next.serviceId && next.therapistId && next.date && !dateError(next.date, rules)));
    }
    setTouched((current) => {
      const next = { ...current, [field]: true };
      for (const dependent of Object.keys(reset)) delete next[dependent];
      return next;
    });
    setFormData((current) => ({ ...current, [field]: value, ...reset }));
  }

  function fieldProps(field) {
    const invalid = Boolean(touched[field] && fieldErrors[field]);
    return {
      id: `appointment-${field}`, name: field, value: formData[field], onChange: handleChange,
      onBlur: () => setTouched((current) => ({ ...current, [field]: true })),
      "aria-invalid": invalid, "aria-describedby": invalid ? `appointment-${field}-error` : undefined,
    };
  }

  function fieldError(field) {
    return touched[field] && fieldErrors[field] ? (
      <div id={`appointment-${field}-error`} className="mt-1 small" style={{ color: "#fff", background: "#8a2630", padding: "4px 8px", borderRadius: 3 }}>
        {fieldErrors[field]}
      </div>
    ) : null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submittingRef.current) return;
    setMessage("");
    setError("");
    setServerErrors({});
    if (!isLoggedIn || !user) {
      setError("Please log in or create an account before booking an appointment.");
      return;
    }
    if (user.role !== "Guest") {
      setError("Please use a guest account to book online. Staff can use the reception portal.");
      return;
    }
    const errors = validateAppointment(formData, { services, therapists, slots, rules });
    setTouched(Object.fromEntries(Object.keys(LABELS).map((field) => [field, true])));
    if (Object.keys(errors).length) {
      setError("Please correct the highlighted fields.");
      formRef.current.elements.namedItem(Object.keys(errors)[0])?.focus();
      return;
    }
    if (loadingServices || loadingTherapists || loadingSlots || !rules) {
      setError("Please wait for the booking options to load.");
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await api("/me/appointments", { method: "POST", body: {
        serviceId: Number(formData.serviceId), therapistId: Number(formData.therapistId),
        date: formData.date, start: formData.time, specialRequest: formData.specialRequest.trim(),
      } });
      setMessage("Your appointment request was submitted successfully and is awaiting confirmation.");
      setFormData(EMPTY_BOOKING);
      setTouched({});
      setTherapists([]);
      setSlots([]);
    } catch (err) {
      setError(err.message || "Unable to submit your appointment. Please try again.");
      setServerErrors(err.details?.fields || {});
      if (err.status === 409) {
        setFormData((current) => ({ ...current, time: "" }));
        setSlots([]);
        setRefreshSlots((value) => value + 1);
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form className="appointment-validation-form" ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={submitting}>
      <p className="text-white small" id="appointment-account-help">
        {isLoggedIn ? "Your appointment uses the name and email from your account." : "Please log in or create an account to book an appointment."}
      </p>
      <div className="form-row">
        <div className="col-sm-6"><div className="form-group">
          <label className="sr-only" htmlFor="appointment-name">Your name (from your account)</label>
          <input id="appointment-name" type="text" value={name} readOnly className="form-control bg-transparent p-4" placeholder="Your Name" autoComplete="name" aria-describedby="appointment-account-help" />
        </div></div>
        <div className="col-sm-6"><div className="form-group">
          <label className="sr-only" htmlFor="appointment-email">Your email (from your account)</label>
          <input id="appointment-email" type="email" value={email} readOnly className="form-control bg-transparent p-4" placeholder="Your Email" autoComplete="email" aria-describedby="appointment-account-help" />
        </div></div>
      </div>
      <div className="form-row">
        <div className="col-sm-6"><div className="form-group">
          <label className="sr-only" htmlFor="appointment-serviceId">Service</label>
          <select {...fieldProps("serviceId")} className="custom-select bg-transparent px-4" style={{ height: 47 }} disabled={loadingServices || submitting} required>
            <option value="">{loadingServices ? "Loading Services..." : services.length ? "Select A Service" : "No Services Available"}</option>
            {services.map((service) => <option key={service.id} value={service.id}>
              {service.name} - ₱{Number(service.price || 0).toLocaleString()} ({service.duration_minutes} min)
            </option>)}
          </select>
          {fieldError("serviceId")}
        </div></div>
        <div className="col-sm-6"><div className="form-group">
          <label className="sr-only" htmlFor="appointment-therapistId">Therapist</label>
          <select {...fieldProps("therapistId")} className="custom-select bg-transparent px-4" style={{ height: 47 }} disabled={!formData.serviceId || loadingTherapists || submitting} required>
            <option value="">{!formData.serviceId ? "Select Service First" : loadingTherapists ? "Loading Therapists..." : therapists.length ? "Select A Therapist" : "No Therapists Available"}</option>
            {therapists.map((therapist) => <option key={therapist.id} value={therapist.id}>
              {therapist.name || [therapist.first_name, therapist.last_name].filter(Boolean).join(" ")}
            </option>)}
          </select>
          {fieldError("therapistId")}
        </div></div>
      </div>
      <div className="form-row">
        <div className="col-sm-6"><div className="form-group">
          <label className="sr-only" htmlFor="appointment-date">Appointment date</label>
          <input {...fieldProps("date")} type="date" min={today} max="9999-12-31" className="form-control bg-transparent p-4" disabled={submitting} required />
          {fieldError("date")}
        </div></div>
        <div className="col-sm-6"><div className="form-group">
          <label className="sr-only" htmlFor="appointment-time">Time</label>
          <select {...fieldProps("time")} className="custom-select bg-transparent px-4" style={{ height: 47 }} disabled={!formData.serviceId || !formData.therapistId || Boolean(dateError(formData.date, rules)) || loadingSlots || submitting} required>
            <option value="">{!formData.serviceId ? "Select Service First" : !formData.therapistId ? "Select Therapist First" : !formData.date ? "Select Date First" : dateError(formData.date, rules) ? "Choose A Valid Date" : loadingSlots ? "Loading Available Times..." : slots.length ? "Select A Time" : "No Available Times"}</option>
            {slots.map((slot) => <option key={slot.start} value={slot.start}>{formatTime(slot.start)}</option>)}
          </select>
          {fieldError("time")}
          {formData.serviceId && formData.therapistId && formData.date && !dateError(formData.date, rules) && !loadingSlots && slots.length === 0 && (
            <small className="text-white d-block mt-1" role="status">No available times. Please choose another date or therapist.</small>
          )}
        </div></div>
      </div>
      <div className="form-group">
        <label className="sr-only" htmlFor="appointment-specialRequest">Special request (optional)</label>
        <textarea {...fieldProps("specialRequest")} className="form-control bg-transparent py-3 px-4" rows="3" maxLength={500} placeholder="Special Request (Optional)" disabled={submitting} />
        <small className="text-white">{formData.specialRequest.length}/500 characters</small>
        {fieldError("specialRequest")}
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {message && <div className="alert alert-success" role="status">{message}</div>}
      <button className="btn btn-primary btn-block" type="submit" style={{ height: 47 }} disabled={submitting || authLoading || loadingServices || loadingTherapists || loadingSlots}>
        {submitting ? "Submitting Appointment..." : "Make Appointment"}
      </button>
    </form>
  );
}

export default AppointmentForm;
