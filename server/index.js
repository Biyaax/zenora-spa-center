require("dotenv").config();

const express = require("express");
const cors = require("cors");

const config = require("./config");
const db = require("./database/postgres");
const { HttpError } = require("./lib/errors");
const { startReminderScheduler } = require("./services/reminders");

const app = express();

app.use(
  cors({
    origin: config.clientUrl,
  })
);

app.use(express.json({ limit: "100kb" }));

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
   ROUTES
========================= */

// Public: services, packages, therapists, hours, availability
app.use("/api", require("./routes/catalog"));

// Register / login / current user
app.use("/api/auth", require("./routes/auth"));

// Guest: bookings (+ notifications for every logged-in user)
app.use("/api/me", require("./routes/guest"));

// Receptionist tools
app.use("/api/reception", require("./routes/reception"));

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
    return res.status(error.status).json({
      success: false,
      message: error.message,
      details: error.details,
    });
  }

  // Malformed JSON body
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "The request body is not valid JSON.",
    });
  }

  console.error(error);

  res.status(500).json({
    success: false,
    message:
      "Something went wrong on our side. Please try again.",
  });
});

/* =========================
   LOCAL SERVER
========================= */

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(
      `Zenora server running on http://localhost:${config.port}`
    );

    // Keep the old reminder scheduler for local development only.
    startReminderScheduler();
  });
}

module.exports = app;