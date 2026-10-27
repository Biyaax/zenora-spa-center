const express = require("express");

const db = require("../database/postgres");
const reception = require("../services/reception");

const router = express.Router();

function validId(value) {
  const id = Number(value);

  return (
    Number.isSafeInteger(id) &&
    id > 0
  );
}

function statusLabel(row) {
  if (
    row.check_out_at ||
    String(row.status).toLowerCase() ===
      "completed"
  ) {
    return "Completed";
  }

  if (
    row.check_in_at &&
    !row.check_out_at
  ) {
    return "Checked In";
  }

  if (
    String(row.status).toLowerCase() ===
    "confirmed"
  ) {
    return "Confirmed";
  }

  if (
    String(row.status).toLowerCase() ===
    "ongoing"
  ) {
    return "Ongoing";
  }

  return row.status || "Unknown";
}

function shapeAppointment(row) {
  return {
    id: row.id,

    bookingId:
      `APT-${String(row.id).padStart(
        4,
        "0"
      )}`,

    date:
      row.appointment_date,

    startTime:
      row.start_time,

    endTime:
      row.end_time,

    client: [
      row.client_first_name,
      row.client_last_name,
    ]
      .filter(Boolean)
      .join(" "),

    phone:
      row.client_phone || "",

    service:
      row.service_name || "",

    therapist: [
      row.therapist_first_name,
      row.therapist_last_name,
    ]
      .filter(Boolean)
      .join(" "),

    status:
      statusLabel(row),

    rawStatus:
      row.status,

    checkInAt:
      row.check_in_at,

    checkOutAt:
      row.check_out_at,
  };
}

/* =========================
   TODAY'S CHECK-IN CLIENTS
========================= */

router.get("/", async (req, res) => {
  try {
    const dateResult =
      await db.query(`
        SELECT to_char(
          CURRENT_TIMESTAMP
            AT TIME ZONE 'Asia/Manila',
          'YYYY-MM-DD'
        ) AS today
      `);

    const today =
      dateResult.rows[0].today;

    const result =
      await db.query(
        `
          SELECT
            a.id,
            a.appointment_date,
            a.start_time,
            a.end_time,
            a.status,
            a.check_in_at,
            a.check_out_at,

            c.first_name
              AS client_first_name,

            c.last_name
              AS client_last_name,

            c.phone
              AS client_phone,

            s.name
              AS service_name,

            u.first_name
              AS therapist_first_name,

            u.last_name
              AS therapist_last_name

          FROM appointments a

          JOIN clients c
            ON c.id =
              a.client_id

          JOIN services s
            ON s.id =
              a.service_id

          JOIN users u
            ON u.id =
              a.therapist_id

          WHERE
            a.appointment_date = $1

            AND LOWER(a.status)
              IN (
                'confirmed',
                'ongoing',
                'completed'
              )

          ORDER BY
            a.start_time,
            a.id
        `,
        [today]
      );

    const appointments =
      result.rows.map(
        shapeAppointment
      );

    return res.json({
      success: true,
      date: today,
      total:
        appointments.length,
      appointments,
    });
  } catch (error) {
    console.error(
      "Receptionist check-in list error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          "Unable to load today's clients.",
      });
  }
});

/* =========================
   CHECK IN
========================= */

router.post(
  "/:id/check-in",
  async (req, res, next) => {
    try {
      if (
        !validId(req.params.id)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid appointment ID.",
          });
      }

      const appointment =
        await reception.checkIn(
          req.user,
          Number(req.params.id)
        );

      return res.json({
        success: true,
        message:
          "Client checked in successfully.",
        appointment,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/* =========================
   CHECK OUT
========================= */

router.post(
  "/:id/check-out",
  async (req, res, next) => {
    try {
      if (
        !validId(req.params.id)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid appointment ID.",
          });
      }

      const appointment =
        await reception.checkOut(
          req.user,
          Number(req.params.id)
        );

      return res.json({
        success: true,
        message:
          "Client checked out successfully.",
        appointment,
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;