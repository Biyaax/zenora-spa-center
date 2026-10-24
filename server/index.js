require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./database/db");

const app = express();

const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
  })
);

app.use(express.json());

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
  const serviceCount = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM services
    `)
    .get();

  const roleCount = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM roles
    `)
    .get();

  res.json({
    success: true,
    message: "Zenora API is running.",
    database: "connected",
    services: serviceCount.count,
    roles: roleCount.count,
  });
});

/* =========================
   SERVER
========================= */

app.listen(PORT, () => {
  console.log(
    `Zenora server running on http://localhost:${PORT}`
  );
});