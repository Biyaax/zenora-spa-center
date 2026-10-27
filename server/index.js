require("dotenv").config();

const express = require("express");
const cors = require("cors");

const config = require("./config");
const db = require("./database/db");
const { HttpError } = require("./lib/errors");
const { startReminderScheduler } = require("./services/reminders");
const { requireAuth, requireRole } = require("./middleware/auth");
const therapistRoutes = require("./routes/therapistRoutes");
const managerRoutes = require("./routes/managerRoutes");

const app = express();

app.use(cors({ origin: config.clientUrl }));
app.use(express.json({ limit: "100kb" }));

/* Health check */
app.get("/api/health", (req, res) => {
  const serviceCount = db.prepare("SELECT COUNT(*) AS count FROM services").get();
  const roleCount = db.prepare("SELECT COUNT(*) AS count FROM roles").get();

  res.json({
    success: true,
    message: "Zenora API is running.",
    database: "connected",
    services: serviceCount.count,
    roles: roleCount.count,
  });
});

/* Existing shared API routes: keep these during the integration. */
app.use("/api", require("./routes/catalog"));

// One login/current-user endpoint for every role. Do NOT mount authRoutes
// here as well: it also declares /login and /me and uses a separate JWT flow.
app.use("/api/auth", require("./routes/auth"));

app.use("/api/me", require("./routes/guest"));
app.use("/api/reception", require("./routes/reception"));

/* Teammate's Therapist and Manager API routes. */
app.use(
  "/api/therapist",
  requireAuth,
  requireRole("Massage Therapist"),
  therapistRoutes
);

app.use(
  "/api/manager",
  requireAuth,
  requireRole("Spa Manager"),
  managerRoutes
);

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Not found." });
});

/* Shared API error handler */
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
      details: error.details,
    });
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "The request body is not valid JSON.",
    });
  }

  console.error(error);
  return res.status(500).json({
    success: false,
    message: "Something went wrong on our side. Please try again.",
  });
});

app.listen(config.port, () => {
  console.log(`Zenora server running on http://localhost:${config.port}`);
  startReminderScheduler();
});
