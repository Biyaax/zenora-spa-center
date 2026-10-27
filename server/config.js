require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

// The placeholder from .env.example does not count as a real secret.
const hasRealSecret =
  Boolean(process.env.JWT_SECRET) && process.env.JWT_SECRET !== "change-me";

if (isProduction && !hasRealSecret) {
  throw new Error("Set a real JWT_SECRET when NODE_ENV=production.");
}

if (!hasRealSecret) {
  console.warn(
    "[config] JWT_SECRET is missing or still \"change-me\". Using an insecure development secret."
  );
}

/**
 * Opening hours by day of week (0 = Sunday ... 6 = Saturday).
 * Mirrors the "Open Hours" shown on the website:
 *   Mon-Fri 9:00 AM - 7:00 PM, Saturday 9:00 AM - 6:00 PM, Sunday closed.
 * `null` means the spa is closed that day.
 */
const hours = {
  0: null,
  1: ["09:00", "19:00"],
  2: ["09:00", "19:00"],
  3: ["09:00", "19:00"],
  4: ["09:00", "19:00"],
  5: ["09:00", "19:00"],
  6: ["09:00", "18:00"],
};

module.exports = {
  isProduction,
  port: process.env.PORT || 4000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  jwtSecret: process.env.JWT_SECRET || "zenora-dev-secret-change-me",
  jwtExpiresHours: Number(process.env.JWT_EXPIRES_HOURS) || 12,

  spaName:
    process.env.SPA_NAME || "Zenora Spa & Massage Wellness Center",
  timezone: process.env.SPA_TIMEZONE || "Asia/Manila",

  hours,

  // Bookable start times are on this grid (minutes).
  slotStepMinutes: 30,

  // Online guests must book at least this far ahead (minutes).
  onlineLeadMinutes: 60,

  // Reminder notification is sent when an appointment starts within this window.
  reminderHoursBefore: 24,
  reminderCheckMinutes: 15,

  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from:
      process.env.MAIL_FROM ||
      "Zenora Spa <no-reply@zenora.example>",
  },
};
