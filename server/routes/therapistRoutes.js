const express = require("express");

const db = require("../database/postgres");

const router = express.Router();

/* =========================
   HELPERS
========================= */

const validId = (value) =>
  /^[1-9]\d*$/.test(String(value)) &&
  Number.isSafeInteger(Number(value));

const isValidDate = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};

const fail = (res, error, message) => {
  console.error(message, error);

  return res.status(500).json({
    success: false,
    message,
  });
};

async function logActivity(
  queryable,
  userId,
  action,
  entityType,
  entityId,
  details
) {
  await queryable.query(
    `
    INSERT INTO activity_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      details
    )
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      userId ?? null,
      action,
      entityType ?? null,
      entityId ?? null,
      details == null
        ? null
        : JSON.stringify(details),
    ]
  );
}

/*
 * Authentication and Massage Therapist role checking
 * are already applied in server/index.js:
 *
 * app.use(
 *   "/api/therapist",
 *   requireAuth,
 *   requireRole("Massage Therapist"),
 *   therapistRoutes
 * );
 */

/* =========================
   FUNCTION 1:
   VIEW DAILY / WEEKLY SCHEDULE
========================= */

router.get("/schedule", async (req, res) => {
  try {
    const therapistId = req.user?.id;

    if (!therapistId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const {
      date,
      view = "daily",
    } = req.query;

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message:
          "A valid date (YYYY-MM-DD) is required.",
      });
    }

    if (
      ![
        "daily",
        "weekly",
      ].includes(view)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "View must be daily or weekly.",
      });
    }

    const parsedDate =
      new Date(
        `${date}T00:00:00Z`
      );

    let startDate = date;
    let endDate = date;

    if (view === "weekly") {
      const day =
        parsedDate.getUTCDay();

      const daysFromMonday =
        (day + 6) % 7;

      const monday =
        new Date(parsedDate);

      monday.setUTCDate(
        monday.getUTCDate() -
          daysFromMonday
      );

      const sunday =
        new Date(monday);

      sunday.setUTCDate(
        sunday.getUTCDate() + 6
      );

      startDate =
        monday
          .toISOString()
          .slice(0, 10);

      endDate =
        sunday
          .toISOString()
          .slice(0, 10);
    }

    const result =
      await db.query(
        `
        SELECT
          a.id,
          a.appointment_date,
          a.start_time,
          a.end_time,
          a.status,
          s.name AS service_name,
          s.duration_minutes,
          c.first_name AS client_first_name,
          c.last_name AS client_last_name,
          a.special_request
        FROM appointments a
        JOIN services s
          ON s.id = a.service_id
        JOIN clients c
          ON c.id = a.client_id
        WHERE a.therapist_id = $1
          AND a.appointment_date
            BETWEEN $2 AND $3
          AND a.status NOT IN (
            'cancelled'
          )
        ORDER BY
          a.appointment_date,
          a.start_time
        `,
        [
          therapistId,
          startDate,
          endDate,
        ]
      );

    return res.json({
      success: true,
      view,
      start_date: startDate,
      end_date: endDate,
      total: result.rows.length,
      appointments: result.rows,
    });
  } catch (error) {
    return fail(
      res,
      error,
      "Unable to retrieve therapist schedule."
    );
  }
});

/* =========================
   FUNCTION 2:
   VIEW ASSIGNED CLIENT DETAILS
========================= */

router.get(
  "/appointments/:id",
  async (req, res) => {
    try {
      const therapistId =
        req.user?.id;

      if (!therapistId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      const appointmentId =
        Number(req.params.id);

      if (
        !validId(
          appointmentId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid appointment ID.",
        });
      }

      const result =
        await db.query(
          `
          SELECT
            a.id,
            a.appointment_date,
            a.start_time,
            a.end_time,
            a.status,
            a.special_request,
            s.name AS service_name,
            s.duration_minutes,
            c.first_name
              AS client_first_name,
            c.last_name
              AS client_last_name,
            c.phone AS client_phone
          FROM appointments a
          JOIN services s
            ON s.id = a.service_id
          JOIN clients c
            ON c.id = a.client_id
          WHERE a.id = $1
            AND a.therapist_id = $2
          `,
          [
            appointmentId,
            therapistId,
          ]
        );

      const appointment =
        result.rows[0];

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message:
            "Assigned appointment not found.",
        });
      }

      return res.json({
        success: true,
        appointment,
      });
    } catch (error) {
      return fail(
        res,
        error,
        "Unable to retrieve appointment details."
      );
    }
  }
);

/* =========================
   FUNCTION 3:
   UPDATE APPOINTMENT STATUS
========================= */

router.patch(
  "/appointments/:id/status",
  async (req, res) => {
    const therapistId =
      req.user?.id;

    if (!therapistId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const appointmentId =
      Number(req.params.id);

    const { status } =
      req.body || {};

    if (
      !validId(
        appointmentId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid appointment ID.",
      });
    }

    if (
      ![
        "ongoing",
        "completed",
        "no-show",
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid appointment status.",
      });
    }

    const client =
      await db.connect();

    try {
      await client.query(
        "BEGIN"
      );

      const appointmentResult =
        await client.query(
          `
          SELECT
            id,
            status
          FROM appointments
          WHERE id = $1
            AND therapist_id = $2
          FOR UPDATE
          `,
          [
            appointmentId,
            therapistId,
          ]
        );

      const appointment =
        appointmentResult.rows[0];

      if (!appointment) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "Assigned appointment not found.",
        });
      }

      const allowedTransitions = {
        confirmed: [
          "ongoing",
          "no-show",
        ],

        ongoing: [
          "completed",
        ],
      };

      if (
        !allowedTransitions[
          appointment.status
        ]?.includes(status)
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(409).json({
          success: false,
          message:
            `Cannot change ${appointment.status} to ${status}.`,
        });
      }

      await client.query(
        `
        UPDATE appointments
        SET
          status = $1,
          updated_at = to_char(
            CURRENT_TIMESTAMP,
            'YYYY-MM-DD HH24:MI:SS'
          )
        WHERE id = $2
          AND therapist_id = $3
        `,
        [
          status,
          appointmentId,
          therapistId,
        ]
      );

      await logActivity(
        client,
        therapistId,
        "appointment_status_updated",
        "appointment",
        appointmentId,
        {
          previous_status:
            appointment.status,

          new_status:
            status,
        }
      );

      await client.query(
        "COMMIT"
      );

      return res.json({
        success: true,
        message:
          "Appointment status updated successfully.",
      });
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      return fail(
        res,
        error,
        "Unable to update appointment status."
      );
    } finally {
      client.release();
    }
  }
);

/* =========================
   FUNCTION 4:
   RECORD SERVICE NOTES
========================= */

router.post(
  "/appointments/:id/notes",
  async (req, res) => {
    const therapistId =
      req.user?.id;

    if (!therapistId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const appointmentId =
      Number(req.params.id);

    const { notes } =
      req.body || {};

    if (
      !validId(
        appointmentId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid appointment ID.",
      });
    }

    if (
      typeof notes !== "string" ||
      !notes.trim() ||
      notes.trim().length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Notes must contain 1 to 2000 characters.",
      });
    }

    const client =
      await db.connect();

    try {
      await client.query(
        "BEGIN"
      );

      const appointmentResult =
        await client.query(
          `
          SELECT
            id,
            status
          FROM appointments
          WHERE id = $1
            AND therapist_id = $2
          FOR UPDATE
          `,
          [
            appointmentId,
            therapistId,
          ]
        );

      const appointment =
        appointmentResult.rows[0];

      if (!appointment) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "Assigned appointment not found.",
        });
      }

      if (
        appointment.status !==
        "completed"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(409).json({
          success: false,
          message:
            "Service notes can only be recorded after a completed session.",
        });
      }

      await client.query(
        `
        INSERT INTO service_notes (
          appointment_id,
          therapist_id,
          notes
        )
        VALUES ($1, $2, $3)

        ON CONFLICT (
          appointment_id
        )
        DO UPDATE SET
          notes = EXCLUDED.notes,
          therapist_id =
            EXCLUDED.therapist_id,
          updated_at = to_char(
            CURRENT_TIMESTAMP,
            'YYYY-MM-DD HH24:MI:SS'
          )
        `,
        [
          appointmentId,
          therapistId,
          notes.trim(),
        ]
      );

      await logActivity(
        client,
        therapistId,
        "service_notes_saved",
        "appointment",
        appointmentId,
        {
          note_saved: true,
        }
      );

      await client.query(
        "COMMIT"
      );

      return res.json({
        success: true,
        message:
          "Service notes saved successfully.",
      });
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      return fail(
        res,
        error,
        "Unable to save service notes."
      );
    } finally {
      client.release();
    }
  }
);

/* =========================
   FUNCTION 5A:
   VIEW WEEKLY AVAILABILITY
========================= */

router.get(
  "/availability",
  async (req, res) => {
    try {
      const therapistId =
        req.user?.id;

      if (!therapistId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      const result =
        await db.query(
          `
          SELECT
            id,
            day_of_week,
            start_time,
            end_time,
            is_available
          FROM therapist_availability
          WHERE therapist_id = $1
          ORDER BY
            day_of_week,
            start_time
          `,
          [
            therapistId,
          ]
        );

      return res.json({
        success: true,
        total:
          result.rows.length,
        availability:
          result.rows,
      });
    } catch (error) {
      return fail(
        res,
        error,
        "Unable to retrieve availability."
      );
    }
  }
);

/* =========================
   FUNCTION 5B:
   VIEW TIME-OFF REQUESTS
========================= */

router.get(
  "/time-off",
  async (req, res) => {
    try {
      const therapistId =
        req.user?.id;

      if (!therapistId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      const result =
        await db.query(
          `
          SELECT
            id,
            start_date,
            end_date,
            reason,
            status,
            reviewed_at,
            created_at
          FROM time_off_requests
          WHERE therapist_id = $1
          ORDER BY
            created_at DESC,
            id DESC
          `,
          [
            therapistId,
          ]
        );

      /*
       * Database schema stores "declined".
       * Preserve compatibility with UI code that
       * may expect the previous "rejected" wording.
       */
      const requests =
        result.rows.map(
          (request) => ({
            ...request,
            status:
              request.status ===
              "declined"
                ? "rejected"
                : request.status,
          })
        );

      return res.json({
        success: true,
        total:
          requests.length,
        requests,
      });
    } catch (error) {
      return fail(
        res,
        error,
        "Unable to retrieve time-off requests."
      );
    }
  }
);

/* =========================
   FUNCTION 5C:
   SUBMIT TIME-OFF REQUEST
========================= */

router.post(
  "/time-off",
  async (req, res) => {
    const therapistId =
      req.user?.id;

    if (!therapistId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const {
      start_date,
      end_date,
      reason,
    } = req.body || {};

    if (
      !isValidDate(start_date) ||
      !isValidDate(end_date)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid start and end dates are required.",
      });
    }

    if (
      end_date < start_date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "End date cannot be earlier than start date.",
      });
    }

    if (
      reason != null &&
      (
        typeof reason !==
          "string" ||
        reason.length > 500
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reason must be a maximum of 500 characters.",
      });
    }

    const client =
      await db.connect();

    try {
      await client.query(
        "BEGIN"
      );

      /*
       * Lock this therapist's profile while checking/inserting
       * a request so two overlapping submissions from the same
       * therapist cannot race each other.
       */
      const therapistResult =
        await client.query(
          `
          SELECT user_id
          FROM therapist_profiles
          WHERE user_id = $1
          FOR UPDATE
          `,
          [
            therapistId,
          ]
        );

      if (
        therapistResult.rowCount === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "Therapist profile not found.",
        });
      }

      const existingResult =
        await client.query(
          `
          SELECT id
          FROM time_off_requests
          WHERE therapist_id = $1
            AND status IN (
              'pending',
              'approved'
            )
            AND start_date <= $2
            AND end_date >= $3
          LIMIT 1
          `,
          [
            therapistId,
            end_date,
            start_date,
          ]
        );

      if (
        existingResult.rows.length >
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(409).json({
          success: false,
          message:
            "An overlapping time-off request already exists.",
        });
      }

      const result =
        await client.query(
          `
          INSERT INTO time_off_requests (
            therapist_id,
            start_date,
            end_date,
            reason,
            status
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            'pending'
          )
          RETURNING id
          `,
          [
            therapistId,
            start_date,
            end_date,
            reason?.trim() ||
              null,
          ]
        );

      const requestId =
        result.rows[0].id;

      await logActivity(
        client,
        therapistId,
        "time_off_requested",
        "time_off",
        requestId,
        {
          start_date,
          end_date,
        }
      );

      await client.query(
        "COMMIT"
      );

      return res.status(201).json({
        success: true,
        message:
          "Time-off request submitted successfully.",
        request_id:
          String(requestId),
        status: "pending",
      });
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      return fail(
        res,
        error,
        "Unable to submit time-off request."
      );
    } finally {
      client.release();
    }
  }
);

module.exports = router;