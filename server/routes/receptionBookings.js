const express = require("express");

const db = require("../database/postgres");
const reception = require("../services/reception");

const router = express.Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validId(value) {
  const id = Number(value);

  return (
    Number.isSafeInteger(id) &&
    id > 0
  );
}

function validDate(value) {
  if (
    typeof value !== "string" ||
    !DATE_RE.test(value)
  ) {
    return false;
  }

  const date = new Date(
    `${value}T00:00:00Z`
  );

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function daysBetween(from, to) {
  const start = new Date(
    `${from}T00:00:00Z`
  );

  const end = new Date(
    `${to}T00:00:00Z`
  );

  return Math.round(
    (end - start) /
      (24 * 60 * 60 * 1000)
  );
}

function bookingType(source) {
  switch (
    String(source || "").toLowerCase()
  ) {
    case "walk-in":
      return "Walk-In";

    case "receptionist":
      return "Receptionist";

    default:
      return "Online";
  }
}

function statusLabel(row) {
  if (
    row.check_in_at &&
    !row.check_out_at
  ) {
    return "Checked In";
  }

  switch (
    String(row.status || "").toLowerCase()
  ) {
    case "pending":
      return "Pending";

    case "confirmed":
      return "Confirmed";

    case "ongoing":
      return "Ongoing";

    case "completed":
      return "Completed";

    case "no-show":
      return "No-Show";

    case "cancelled":
    case "canceled":
      return "Cancelled";

    default:
      return row.status || "Unknown";
  }
}

function shapeAppointment(row) {
  return {
    id: row.id,

    bookingId:
      `APT-${String(row.id).padStart(
        4,
        "0"
      )}`,

    date: row.appointment_date,

    startTime: row.start_time,

    endTime: row.end_time,

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

    duration:
      Number(
        row.duration_minutes || 0
      ),

    price:
      Number(
        row.amount_due ??
          row.service_price ??
          0
      ),

    status:
      statusLabel(row),

    rawStatus:
      row.status,

    bookingType:
      bookingType(
        row.booking_source
      ),

    checkInAt:
      row.check_in_at,

    checkOutAt:
      row.check_out_at,
  };
}

async function listAppointments(
  whereSql,
  params = [],
  orderSql =
    "a.appointment_date, a.start_time, a.id"
) {
  const result = await db.query(
    `
      SELECT
        a.id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.booking_source,
        a.amount_due,
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

        s.duration_minutes,

        s.price
          AS service_price,

        u.first_name
          AS therapist_first_name,

        u.last_name
          AS therapist_last_name

      FROM appointments a

      JOIN clients c
        ON c.id = a.client_id

      JOIN services s
        ON s.id = a.service_id

      JOIN users u
        ON u.id = a.therapist_id

      ${whereSql}

      ORDER BY ${orderSql}
    `,
    params
  );

  return result.rows.map(
    shapeAppointment
  );
}

/* =========================
   DAILY / WEEKLY CALENDAR
========================= */

router.get("/", async (req, res) => {
  try {
    const {
      from,
      to,
    } = req.query;

    if (
      !validDate(from) ||
      !validDate(to)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Valid from and to dates are required.",
        });
    }

    const span =
      daysBetween(from, to);

    if (span < 0) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "The end date cannot be before the start date.",
        });
    }

    if (span > 31) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "The appointment range cannot exceed 31 days.",
        });
    }

    const appointments =
      await listAppointments(
        `
          WHERE
            a.appointment_date
              BETWEEN $1 AND $2
        `,
        [from, to]
      );

    return res.json({
      success: true,
      from,
      to,
      total:
        appointments.length,
      appointments,
    });
  } catch (error) {
    console.error(
      "Receptionist appointment calendar error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          "Unable to load appointments.",
      });
  }
});

/* =========================
   PENDING BOOKING REQUESTS
========================= */

router.get(
  "/requests",
  async (req, res) => {
    try {
      /*
        Receptionist-created and walk-in
        bookings are confirmed immediately,
        so pending rows represent booking
        requests waiting for review.
      */

      const appointments =
        await listAppointments(
          `
            WHERE
              LOWER(a.status) =
                'pending'
          `
        );

      return res.json({
        success: true,
        total:
          appointments.length,
        appointments,
      });
    } catch (error) {
      console.error(
        "Receptionist pending requests error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load pending booking requests.",
        });
    }
  }
);

/* =========================
   CONFIRM REQUEST
========================= */

router.post(
  "/:id/confirm",
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

      /*
        Use the existing Receptionist
        service so confirmation also
        performs its existing notification
        and activity logging logic.
      */

      const appointment =
        await reception.confirm(
          req.user,
          Number(req.params.id)
        );

      return res.json({
        success: true,
        message:
          "Booking request confirmed.",
        appointment,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/* =========================
   DECLINE REQUEST
========================= */

router.post(
  "/:id/decline",
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

      const reason =
        typeof req.body?.reason ===
        "string"
          ? req.body.reason.trim()
          : "";

      const appointment =
        await reception.decline(
          req.user,
          Number(req.params.id),
          {
            reason,
          }
        );

      return res.json({
        success: true,
        message:
          "Booking request declined.",
        appointment,
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;