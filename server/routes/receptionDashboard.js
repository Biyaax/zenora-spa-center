const express = require("express");

const db = require("../database/postgres");

const router = express.Router();

/*
  GET /api/reception/dashboard

  Authentication and Receptionist role checking
  are handled in server/index.js.
*/

router.get("/", async (req, res) => {
  try {
    const dateResult = await db.query(`
      SELECT to_char(
        CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila',
        'YYYY-MM-DD'
      ) AS today
    `);

    const today = dateResult.rows[0].today;

    const [
      appointmentsResult,
      pendingResult,
      checkedInResult,
      paymentsResult,
    ] = await Promise.all([
      db.query(
        `
          SELECT
            a.id,
            a.appointment_date,
            a.start_time,
            a.end_time,
            a.status,
            a.check_in_at,
            a.check_out_at,
            a.booking_source,

            c.first_name AS client_first_name,
            c.last_name AS client_last_name,

            s.name AS service_name,

            u.first_name AS therapist_first_name,
            u.last_name AS therapist_last_name

          FROM appointments a

          JOIN clients c
            ON c.id = a.client_id

          JOIN services s
            ON s.id = a.service_id

          JOIN users u
            ON u.id = a.therapist_id

          WHERE a.appointment_date = $1
            AND a.status <> 'cancelled'

          ORDER BY
            a.start_time,
            a.id
        `,
        [today]
      ),

      db.query(`
        SELECT COUNT(*)::INTEGER AS total

        FROM appointments

        WHERE status = 'pending'
      `),

      db.query(
        `
          SELECT COUNT(*)::INTEGER AS total

          FROM appointments

          WHERE appointment_date = $1
            AND check_in_at IS NOT NULL
            AND check_out_at IS NULL
        `,
        [today]
      ),

      db.query(
        `
          SELECT
            COALESCE(SUM(amount), 0) AS total

          FROM payments

          WHERE LEFT(
            COALESCE(paid_at, ''),
            10
          ) = $1
        `,
        [today]
      ),
    ]);

    const appointments =
      appointmentsResult.rows.map(
        (appointment) => ({
          ...appointment,

          display_status:
            appointment.check_in_at &&
            !appointment.check_out_at
              ? "Checked In"
              : appointment.status,
        })
      );

    return res.json({
      success: true,
      date: today,

      summary: {
        todayAppointments:
          appointments.length,

        pendingRequests:
          pendingResult.rows[0].total,

        checkedIn:
          checkedInResult.rows[0].total,

        paymentsToday:
          Number(
            paymentsResult.rows[0].total || 0
          ),
      },

      appointments,
    });
  } catch (error) {
    console.error(
      "Receptionist dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load the Receptionist dashboard.",
    });
  }
});

module.exports = router;