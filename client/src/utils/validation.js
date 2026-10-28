export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailError(value) {
  const email = value.trim();
  if (!email) return "Email is required.";
  if (email.length > 254 || !EMAIL_RE.test(email)) return "Enter a valid email address.";
  return "";
}

export function validateStaffLogin(email, password) {
  const errors = {};
  if (emailError(email)) errors.email = emailError(email);
  if (!password.trim()) errors.password = "Password is required.";
  else if (password.length > 4096) errors.password = "Password is too long.";
  // Login accepts existing passwords; complexity rules belong at account creation.
  return errors;
}

export function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function spaNow(timeZone = "Asia/Manila", instant = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(instant);
  const get = (type) => parts.find((part) => part.type === type).value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function dateError(date, rules, now = spaNow(rules?.timezone)) {
  if (!date) return "Please choose a date.";
  if (!isDate(date)) return "Please choose a valid date.";
  if (date < now.date) return "Appointment date cannot be in the past.";
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (rules && !rules.hours[weekday]) return "The spa is closed on that day. Please choose another date.";
  return "";
}

export function validateAppointment(form, { services, therapists, slots, rules, now = spaNow(rules?.timezone) }) {
  const errors = {};
  if (!form.serviceId || !services.some((s) => String(s.id) === form.serviceId)) {
    errors.serviceId = "Please choose an available service.";
  }
  if (!form.therapistId || !therapists.some((t) => String(t.id) === form.therapistId)) {
    errors.therapistId = "Please choose a therapist for this service.";
  }
  const invalidDate = dateError(form.date, rules, now);
  if (invalidDate) errors.date = invalidDate;
  if (!form.time || !slots.some((slot) => slot.start === form.time)) {
    errors.time = "Please choose an available time.";
  } else if (form.date === now.date) {
    const [hour, minute] = form.time.split(":").map(Number);
    if (hour * 60 + minute < now.minutes + (rules?.onlineLeadMinutes ?? 60)) {
      errors.time = "That time is too soon. Please choose a later available time.";
    }
  }
  if (form.specialRequest.trim().length > 500) {
    errors.specialRequest = "Special request must be 500 characters or fewer.";
  } else if (form.specialRequest.includes("\0")) {
    errors.specialRequest = "Special request contains an invalid character.";
  }
  return errors;
}
