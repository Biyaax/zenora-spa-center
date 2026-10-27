const express = require("express");

const db = require("../database/postgres");
const config = require("../config");
const { getSlots } = require("../services/availability");
const { badRequest } = require("../lib/errors");

const router = express.Router();

/* =========================
   SERVICES
========================= */

router.get("/services", async (req, res) => {
  const result = await db.query(`
    SELECT
      id,
      name,
      description,
      price,
      duration_minutes,
      image_url
    FROM services
    WHERE is_active = 1
    ORDER BY name
  `);

  res.json({
    success: true,
    services: result.rows,
  });
});

/* =========================
   PACKAGES
========================= */

router.get("/packages", async (req, res) => {
  const result = await db.query(`
    SELECT
      p.id,
      p.name,
      p.description,
      p.price,

      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', s.id,
              'name', s.name,
              'quantity', ps.quantity
            )
            ORDER BY s.name
          )
          FROM package_services ps
          JOIN services s
            ON s.id = ps.service_id
          WHERE ps.package_id = p.id
        ),
        '[]'::json
      ) AS services

    FROM packages p
    WHERE p.is_active = 1
    ORDER BY p.name
  `);

  res.json({
    success: true,
    packages: result.rows,
  });
});

/* =========================
   THERAPISTS
========================= */

router.get("/therapists", async (req, res) => {
  const serviceId = req.query.serviceId
    ? Number(req.query.serviceId)
    : null;

  if (
    req.query.serviceId &&
    (!Number.isInteger(serviceId) || serviceId <= 0)
  ) {
    throw badRequest("Invalid service.");
  }

  const params = [];
  let serviceFilter = "";

  if (serviceId) {
    params.push(serviceId);

    serviceFilter = `
      AND EXISTS (
        SELECT 1
        FROM therapist_services ts
        WHERE ts.therapist_id = tp.user_id
          AND ts.service_id = $1
      )
    `;
  }

  const result = await db.query(
    `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      tp.bio,
      tp.specialties
    FROM therapist_profiles tp
    JOIN users u
      ON u.id = tp.user_id
    WHERE tp.is_available = 1
      AND u.is_active = 1
      ${serviceFilter}
    ORDER BY
      u.first_name,
      u.last_name
    `,
    params
  );

  res.json({
    success: true,
    therapists: result.rows,
  });
});

/* =========================
   SPA HOURS
========================= */

router.get("/hours", (req, res) => {
  res.json({
    success: true,
    hours: config.hours,
    slotStepMinutes: config.slotStepMinutes,
    onlineLeadMinutes: config.onlineLeadMinutes,
  });
});

/* =========================
   AVAILABILITY
========================= */

router.get("/availability", async (req, res) => {
  const serviceId = Number(req.query.serviceId);
  const date = req.query.date;

  const therapistId = req.query.therapistId
    ? Number(req.query.therapistId)
    : null;

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    throw badRequest("Please choose a valid service.");
  }

  if (
    therapistId !== null &&
    (!Number.isInteger(therapistId) || therapistId <= 0)
  ) {
    throw badRequest("Please choose a valid therapist.");
  }

  const result = await getSlots({
    serviceId,
    date,
    therapistId,
    forStaff: false,
  });

  res.json({
    success: true,
    ...result,
  });
});

module.exports = router;