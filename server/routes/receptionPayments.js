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

function money(value) {
  const number = Number(value || 0);

  return Math.round(number * 100) / 100;
}

function shapePaymentRecord(row) {
  const amountDue = money(row.amount_due);
  const paidToDate = money(row.paid_to_date);
  const balance = money(
    Math.max(
      amountDue - paidToDate,
      0
    )
  );

  return {
    appointmentId: row.id,

    bookingId:
      `APT-${String(row.id).padStart(
        4,
        "0"
      )}`,

    client: [
      row.client_first_name,
      row.client_last_name,
    ]
      .filter(Boolean)
      .join(" "),

    email:
      row.client_email || "",

    service:
      row.service_name || "",

    therapist: [
      row.therapist_first_name,
      row.therapist_last_name,
    ]
      .filter(Boolean)
      .join(" "),

    date:
      row.appointment_date,

    startTime:
      row.start_time,

    appointmentStatus:
      row.status,

    amountDue,

    paidToDate,

    balance,

    paymentStatus:
      balance <= 0
        ? "Paid"
        : "Unpaid",

    latestPaymentId:
      row.latest_payment_id
        ? Number(
            row.latest_payment_id
          )
        : null,

    latestPaymentMethod:
      row.latest_payment_method ||
      "",

    latestPaymentDate:
      row.latest_payment_date ||
      "",
  };
}

/* =========================
   PAYMENT LIST
========================= */

router.get("/", async (req, res) => {
  try {
    const result =
      await db.query(`
        SELECT
          a.id,
          a.appointment_date,
          a.start_time,
          a.status,
          a.amount_due,

          c.first_name
            AS client_first_name,

          c.last_name
            AS client_last_name,

          c.email
            AS client_email,

          s.name
            AS service_name,

          u.first_name
            AS therapist_first_name,

          u.last_name
            AS therapist_last_name,

          COALESCE(
            totals.paid_to_date,
            0
          ) AS paid_to_date,

          latest.id
            AS latest_payment_id,

          latest.payment_method
            AS latest_payment_method,

          latest.paid_at
            AS latest_payment_date

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

        LEFT JOIN (
          SELECT
            appointment_id,
            SUM(amount)
              AS paid_to_date

          FROM payments

          GROUP BY
            appointment_id
        ) totals
          ON totals.appointment_id =
            a.id

        LEFT JOIN LATERAL (
          SELECT
            p.id,
            p.payment_method,
            p.paid_at

          FROM payments p

          WHERE
            p.appointment_id =
              a.id

          ORDER BY
            p.id DESC

          LIMIT 1
        ) latest
          ON TRUE

        WHERE
          LOWER(a.status)
            IN (
              'confirmed',
              'ongoing',
              'completed'
            )

        ORDER BY
          a.appointment_date DESC,
          a.start_time DESC,
          a.id DESC
      `);

    const records =
      result.rows.map(
        shapePaymentRecord
      );

    const totalsResult =
      await db.query(`
        SELECT
          COALESCE(
            SUM(amount),
            0
          ) AS total
        FROM payments
      `);

    const awaitingPayment =
      records.filter(
        (record) =>
          record.balance > 0
      ).length;

    return res.json({
      success: true,

      summary: {
        awaitingPayment,

        recordedPayments:
          money(
            totalsResult
              .rows[0].total
          ),
      },

      paymentMethods:
        reception.PAYMENT_METHODS,

      records,
    });
  } catch (error) {
    console.error(
      "Receptionist payment list error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          "Unable to load payment records.",
      });
  }
});

/* =========================
   RECORD PAYMENT
========================= */

router.post(
  "/:appointmentId",
  async (req, res, next) => {
    try {
      if (
        !validId(
          req.params.appointmentId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid appointment ID.",
          });
      }

      const result =
        await reception.recordPayment(
          req.user,
          Number(
            req.params.appointmentId
          ),
          req.body || {}
        );

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Payment recorded successfully.",

          appointment:
            result.appointment,

          receipt:
            result.receipt,
        });
    } catch (error) {
      return next(error);
    }
  }
);

/* =========================
   GET RECEIPT
========================= */

router.get(
  "/receipt/:paymentId",
  async (req, res, next) => {
    try {
      if (
        !validId(
          req.params.paymentId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid payment ID.",
          });
      }

      const receipt =
        await reception.buildReceipt(
          Number(
            req.params.paymentId
          )
        );

      return res.json({
        success: true,
        receipt,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/* =========================
   SEND RECEIPT
========================= */

router.post(
  "/receipt/:paymentId/send",
  async (req, res, next) => {
    try {
      if (
        !validId(
          req.params.paymentId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid payment ID.",
          });
      }

      await reception.sendReceipt(
        req.user,
        Number(
          req.params.paymentId
        )
      );

      return res.json({
        success: true,
        message:
          "Receipt sent successfully.",
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;