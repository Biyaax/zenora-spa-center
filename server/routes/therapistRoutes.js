
const express = require("express");
const db = require("../database/db");

const router = express.Router();

/*
  Function 1: View Personal Daily and Weekly Schedule

  Authentication will supply req.user.id.
  This route must only be mounted after secure
  authentication and Massage Therapist role checking.
*/

router.get("/schedule", (req, res) => {
  try {
    const therapistId = req.user?.id;

    if (!therapistId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { date, view = "daily" } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "A valid date (YYYY-MM-DD) is required.",
      });
    }

    if (!["daily", "weekly"].includes(view)) {
      return res.status(400).json({
        success: false,
        message: "View must be daily or weekly.",
      });
    }

    const parsedDate = new Date(`${date}T00:00:00Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar date.",
      });
    }

    let startDate = date;
    let endDate = date;

    if (view === "weekly") {
      const day = parsedDate.getUTCDay();
      const daysFromMonday = (day + 6) % 7;

      const monday = new Date(parsedDate);
      monday.setUTCDate(monday.getUTCDate() - daysFromMonday);

      const sunday = new Date(monday);
      sunday.setUTCDate(sunday.getUTCDate() + 6);

      startDate = monday.toISOString().slice(0, 10);
      endDate = sunday.toISOString().slice(0, 10);
    }

    const appointments = db.prepare(`
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
      JOIN services s ON s.id = a.service_id
      JOIN clients c ON c.id = a.client_id
      WHERE a.therapist_id = ?
        AND a.appointment_date BETWEEN ? AND ?
        AND a.status NOT IN ('cancelled')
      ORDER BY a.appointment_date, a.start_time
    `).all(therapistId, startDate, endDate);

    return res.json({
      success: true,
      view,
      start_date: startDate,
      end_date: endDate,
      total: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Therapist schedule error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve therapist schedule.",
    });
  }
});

/* =========================
   FUNCTION 2:
   VIEW ASSIGNED CLIENT DETAILS
========================= */

router.get("/appointments/:id", (req, res) => {
  try {
    const therapistId = req.user?.id;

    if (!therapistId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const appointmentId = Number(req.params.id);

    if (!Number.isSafeInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    const appointment = db.prepare(`
      SELECT
        a.id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.special_request,
        s.name AS service_name,
        s.duration_minutes,
        c.first_name AS client_first_name,
        c.last_name AS client_last_name,
        c.phone AS client_phone
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      JOIN clients c ON c.id = a.client_id
      WHERE a.id = ?
        AND a.therapist_id = ?
    `).get(appointmentId, therapistId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Assigned appointment not found.",
      });
    }

    return res.json({
      success: true,
      appointment,
    });

  } catch (error) {
    console.error("Assigned appointment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve appointment details.",
    });
  }
});

/* =========================
   FUNCTION 3:
   UPDATE APPOINTMENT STATUS
========================= */

router.patch("/appointments/:id/status", (req, res) => {
  try {
    const therapistId = req.user?.id;

    if (!therapistId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const appointmentId = Number(req.params.id);
    const { status } = req.body || {};

    if (!Number.isSafeInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    if (!["ongoing", "completed", "no-show"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment status.",
      });
    }

    const updateAppointment = db.transaction(() => {
      const appointment = db.prepare(`
        SELECT id, status
        FROM appointments
        WHERE id = ?
          AND therapist_id = ?
      `).get(appointmentId, therapistId);

      if (!appointment) {
        return {
          code: 404,
          message: "Assigned appointment not found.",
        };
      }

      const allowedTransitions = {
        confirmed: ["ongoing", "no-show"],
        ongoing: ["completed"],
      };

      if (
        !allowedTransitions[appointment.status]?.includes(status)
      ) {
        return {
          code: 409,
          message: `Cannot change ${appointment.status} to ${status}.`,
        };
      }

      db.prepare(`
        UPDATE appointments
        SET status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND therapist_id = ?
      `).run(status, appointmentId, therapistId);

      db.prepare(`
        INSERT INTO activity_logs (
          user_id,
          action,
          entity_type,
          entity_id,
          details
        )
        VALUES (?, ?, ?, ?, ?)
      `).run(
        therapistId,
        "appointment_status_updated",
        "appointment",
        appointmentId,
        JSON.stringify({
          previous_status: appointment.status,
          new_status: status,
        })
      );

      return {
        code: 200,
        message: "Appointment status updated successfully.",
      };
    });

    const result = updateAppointment();

    return res.status(result.code).json({
      success: result.code === 200,
      message: result.message,
    });

  } catch (error) {
    console.error("Update appointment status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update appointment status.",
    });
  }
});

/* =========================
   FUNCTION 4:
   RECORD SERVICE NOTES
========================= */

router.post("/appointments/:id/notes", (req, res) => {
  try {
    const therapistId = req.user?.id;

    if (!therapistId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const appointmentId = Number(req.params.id);
    const { notes } = req.body || {};

    if (!Number.isSafeInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    if (
      typeof notes !== "string" ||
      !notes.trim() ||
      notes.trim().length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Notes must contain 1 to 2000 characters.",
      });
    }

    const saveNotes = db.transaction(() => {
      const appointment = db.prepare(`
        SELECT id, status
        FROM appointments
        WHERE id = ?
          AND therapist_id = ?
      `).get(appointmentId, therapistId);

      if (!appointment) {
        return {
          code: 404,
          message: "Assigned appointment not found.",
        };
      }

      if (appointment.status !== "completed") {
        return {
          code: 409,
          message: "Service notes can only be recorded after a completed session.",
        };
      }

      db.prepare(`
        INSERT INTO service_notes (
          appointment_id,
          therapist_id,
          notes
        )
        VALUES (?, ?, ?)
        ON CONFLICT(appointment_id)
        DO UPDATE SET
          notes = excluded.notes,
          updated_at = CURRENT_TIMESTAMP
      `).run(appointmentId, therapistId, notes.trim());

      db.prepare(`
        INSERT INTO activity_logs (
          user_id,
          action,
          entity_type,
          entity_id,
          details
        )
        VALUES (?, ?, ?, ?, ?)
      `).run(
        therapistId,
        "service_notes_saved",
        "appointment",
        appointmentId,
        JSON.stringify({ note_saved: true })
      );

      return {
        code: 200,
        message: "Service notes saved successfully.",
      };
    });

    const result = saveNotes();

    return res.status(result.code).json({
      success: result.code === 200,
      message: result.message,
    });

  } catch (error) {
    console.error("Service notes error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save service notes.",
    });
  }
});

/* =========================
   FUNCTION 5A:
   VIEW WEEKLY AVAILABILITY
========================= */

router.get("/availability", (req, res) => {
  try {
    const therapistId = req.user?.id;

    if (!therapistId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const availability = db.prepare(`
      SELECT
        id,
        day_of_week,
        start_time,
        end_time,
        is_available
      FROM therapist_availability
      WHERE therapist_id = ?
      ORDER BY day_of_week, start_time
    `).all(therapistId);

    return res.json({
      success: true,
      total: availability.length,
      availability,
    });

  } catch (error) {
    console.error("Availability error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve availability.",
    });
  }
});

/* =========================
   FUNCTION 5B:
   VIEW TIME-OFF REQUESTS
========================= */

router.get("/time-off", (req, res) => {
  try {
    const therapistId = req.user?.id;

    if (!therapistId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const requests = db.prepare(`
      SELECT
        id,
        start_date,
        end_date,
        reason,
        status,
        reviewed_at,
        created_at
      FROM time_off_requests
      WHERE therapist_id = ?
      ORDER BY created_at DESC, id DESC
    `).all(therapistId);

    return res.json({
      success: true,
      total: requests.length,
      requests,
    });

  } catch (error) {
    console.error("Time-off list error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve time-off requests.",
    });
  }
});

/* =========================
   FUNCTION 5C:
   SUBMIT TIME-OFF REQUEST
========================= */

router.post("/time-off", (req, res) => {
  try {
    const therapistId = req.user?.id;

    if (!therapistId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { start_date, end_date, reason } = req.body || {};

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

    if (!isValidDate(start_date) || !isValidDate(end_date)) {
      return res.status(400).json({
        success: false,
        message: "Valid start and end dates are required.",
      });
    }

    if (end_date < start_date) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be earlier than start date.",
      });
    }

    if (
      reason != null &&
      (typeof reason !== "string" || reason.length > 500)
    ) {
      return res.status(400).json({
        success: false,
        message: "Reason must be a maximum of 500 characters.",
      });
    }

    const existing = db.prepare(`
      SELECT id
      FROM time_off_requests
      WHERE therapist_id = ?
        AND status IN ('pending', 'approved')
        AND start_date <= ?
        AND end_date >= ?
      LIMIT 1
    `).get(therapistId, end_date, start_date);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An overlapping time-off request already exists.",
      });
    }

    const result = db.prepare(`
      INSERT INTO time_off_requests (
        therapist_id,
        start_date,
        end_date,
        reason,
        status
      )
      VALUES (?, ?, ?, ?, 'pending')
    `).run(
      therapistId,
      start_date,
      end_date,
      reason?.trim() || null
    );

    return res.status(201).json({
      success: true,
      message: "Time-off request submitted successfully.",
      request_id: result.lastInsertRowid.toString(),
      status: "pending",
    });

  } catch (error) {
    console.error("Submit time-off error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit time-off request.",
    });
  }
});

module.exports = router;
