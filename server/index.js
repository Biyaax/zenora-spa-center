require("dotenv").config();

const express = require("express");
const cors = require("cors");

const config = require("./config");
const db = require("./database/postgres");
const { HttpError } = require("./lib/errors");
const { startReminderScheduler } = require("./services/reminders");
const {
  requireAuth,
  requireRole,
} = require("./middleware/auth");

const therapistRoutes = require("./routes/therapistRoutes");
const managerRoutes = require("./routes/managerRoutes");
const managerStaffRoutes = require("./routes/managerStaff");

const app = express();

/* =========================
   CORS
========================= */

const allowedOrigins = new Set([
  "https://zenora-spa-center.vercel.app",
]);

// Keep supporting CLIENT_URL from environment variables.
if (config.clientUrl) {
  allowedOrigins.add(
    String(config.clientUrl).replace(/\/$/, "")
  );
}

function isAllowedOrigin(origin) {
  // Server-to-server requests may not have an Origin header.
  if (!origin) {
    return true;
  }

  // Explicitly allowed production/environment URLs.
  if (allowedOrigins.has(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);

    /*
      Allow local Vite development.

      This covers:
      http://localhost:5173
      http://localhost:5174
      http://localhost:5175
      etc.
    */
    const isLocalhost =
      url.protocol === "http:" &&
      (
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1"
      );

    if (isLocalhost) {
      return true;
    }

    /*
      Allow Zenora Vercel Preview deployments such as:

      https://zenora-spa-center-abc123-biyaaxs-projects.vercel.app

      This prevents us from changing CLIENT_URL every time
      Vercel creates a new Preview deployment.
    */
    const isZenoraPreview =
      url.protocol === "https:" &&
      url.hostname.startsWith(
        "zenora-spa-center-"
      ) &&
      url.hostname.endsWith(
        "-biyaaxs-projects.vercel.app"
      );

    if (isZenoraPreview) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.warn(
        `Blocked CORS origin: ${origin}`
      );

      return callback(
        new Error("Not allowed by CORS")
      );
    },
  })
);

app.use(
  express.json({
    limit: "100kb",
  })
);

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", async (req, res) => {
  const serviceResult = await db.query(`
    SELECT COUNT(*)::INTEGER AS count
    FROM services
  `);

  const roleResult = await db.query(`
    SELECT COUNT(*)::INTEGER AS count
    FROM roles
  `);

  res.json({
    success: true,
    message: "Zenora API is running.",
    database: "connected",
    services: serviceResult.rows[0].count,
    roles: roleResult.rows[0].count,
  });
});

/* =========================
   SHARED ROUTES
========================= */

// Public:
// services, packages, therapists, hours, availability
app.use(
  "/api",
  require("./routes/catalog")
);

// Register / login / current user for all roles
app.use(
  "/api/auth",
  require("./routes/auth")
);

// Guest
app.use(
  "/api/me",
  require("./routes/guest")
);

// Receptionist
app.use(
  "/api/reception",
  require("./routes/reception")
);

/* =========================
   THERAPIST
========================= */

app.use(
  "/api/therapist",
  requireAuth,
  requireRole("Massage Therapist"),
  therapistRoutes
);

/* =========================
   MANAGER
========================= */

/*
  Staff accounts, password resets,
  therapist services and schedules.
*/
app.use(
  "/api/manager",
  requireAuth,
  requireRole("Spa Manager"),
  managerStaffRoutes
);

/*
  Dashboard, services, time-off,
  reports and activity logs.
*/
app.use(
  "/api/manager",
  requireAuth,
  requireRole("Spa Manager"),
  managerRoutes
);

/* =========================
   404
========================= */

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Not found.",
  });
});

/* =========================
   ERRORS
========================= */

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (error instanceof HttpError) {
    return res
      .status(error.status)
      .json({
        success: false,
        message: error.message,
        details: error.details,
      });
  }

  if (
    error.type ===
    "entity.parse.failed"
  ) {
    return res
      .status(400)
      .json({
        success: false,
        message:
          "The request body is not valid JSON.",
      });
  }

  if (
    error.message ===
    "Not allowed by CORS"
  ) {
    return res
      .status(403)
      .json({
        success: false,
        message:
          "This website is not allowed to access the Zenora API.",
      });
  }

  console.error(error);

  return res
    .status(500)
    .json({
      success: false,
      message:
        "Something went wrong on our side. Please try again.",
    });
});

/* =========================
   LOCAL SERVER
========================= */

if (require.main === module) {
  app.listen(
    config.port,
    () => {
      console.log(
        `Zenora server running on http://localhost:${config.port}`
      );

      // Local development only.
      // Vercel should not rely on a persistent
      // setInterval scheduler.
      startReminderScheduler();
    }
  );
}

module.exports = app;