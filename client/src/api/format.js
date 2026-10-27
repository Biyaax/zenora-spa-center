export const peso = (n) =>
  `₱${Number(n || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// "09:30" -> "9:30 AM"
export function time12(value) {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

// "2026-10-27" -> "Tue, Oct 27, 2026"  (no timezone shifting)
export function dateLabel(value, options = {}) {
  if (!value) return "";
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  });
}

// Server timestamps are UTC "YYYY-MM-DD HH:MM:SS".
export function stamp(value) {
  if (!value) return "";
  return new Date(value.replace(" ", "T") + "Z").toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Local-calendar date helpers (YYYY-MM-DD)
export const toISO = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

export const parseISO = (value) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (value, n) => {
  const date = parseISO(value);
  date.setDate(date.getDate() + n);
  return toISO(date);
};

export const mondayOf = (value) => {
  const date = parseISO(value);
  const shift = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - shift);
  return toISO(date);
};

export const STATUS_STYLE = {
  pending: "warning",
  confirmed: "info",
  ongoing: "primary",
  completed: "success",
  cancelled: "secondary",
  "no-show": "danger",
};
