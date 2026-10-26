
const express = require("express");
const db = require("../database/db");

const router = express.Router();

const validId = (value) =>
  /^[1-9]\d*$/.test(String(value)) &&
  Number.isSafeInteger(Number(value));

const fail = (res, error) => {
  console.error("Manager API error:", error);
  return res.status(500).json({
    success: false,
    message: "An internal server error occurred.",
  });
};

// Require authenticated, active Spa Manager.
// This expects trusted authentication middleware to set req.user.
router.use((req, res, next) => {
  const user = req.user;

  if (!user || !validId(user.id)) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const manager = db.prepare(`
    SELECT u.id
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = ?
      AND u.is_active = 1
      AND LOWER(r.name) IN ('manager', 'spa manager')
  `).get(Number(user.id));

  if (!manager) {
    return res.status(403).json({
      success: false,
      message: "Spa Manager access required.",
    });
  }

  next();
});

const logActivity = (userId, action, type, entityId, details) => {
  db.prepare(`
    INSERT INTO activity_logs
      (user_id, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, action, type, entityId, JSON.stringify(details));
};

/* 1. MANAGER DASHBOARD */

router.get("/dashboard", (req, res) => {
  try {
    const appointments = db.prepare(`
      SELECT COUNT(*) AS total FROM appointments
    `).get().total;

    const activeServices = db.prepare(`
      SELECT COUNT(*) AS total
      FROM services WHERE is_active = 1
    `).get().total;

    const therapists = db.prepare(`
      SELECT COUNT(*) AS total
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE LOWER(r.name) = 'massage therapist'
        AND u.is_active = 1
    `).get().total;

    const revenue = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM payments
    `).get().total;

    const pendingTimeOff = db.prepare(`
      SELECT COUNT(*) AS total
      FROM time_off_requests
      WHERE status = 'pending'
    `).get().total;

    return res.json({
      success: true,
      dashboard: {
        appointments,
        activeServices,
        therapists,
        revenue,
        pendingTimeOff,
      },
    });
  } catch (error) {
    return fail(res, error);
  }
});

/* 2. SERVICES MANAGEMENT */

router.get("/services", (req, res) => {
  try {
    const services = db.prepare(`
      SELECT * FROM services ORDER BY name
    `).all();

    return res.json({ success: true, services });
  } catch (error) {
    return fail(res, error);
  }
});

router.post("/services", (req, res) => {
  try {
    const { name, description, price, duration_minutes } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(duration_minutes) ||
      duration_minutes <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid name, price and duration are required.",
      });
    }

    const create = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO services
          (name, description, price, duration_minutes)
        VALUES (?, ?, ?, ?)
      `).run(name.trim(), description || null, price, duration_minutes);

      logActivity(req.user.id, "create", "service", Number(result.lastInsertRowid), {
        name: name.trim(),
      });

      return Number(result.lastInsertRowid);
    });

    const id = create();

    return res.status(201).json({
      success: true,
      message: "Service created.",
      id,
    });
  } catch (error) {
    return fail(res, error);
  }
});

router.patch("/services/:id", (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const allowed = ["name", "description", "price", "duration_minutes", "is_active"];
    const changes = Object.entries(req.body || {}).filter(
      ([key]) => allowed.includes(key)
    );

    if (!changes.length) {
      return res.status(400).json({
        success: false,
        message: "No valid fields supplied.",
      });
    }

    const data = Object.fromEntries(changes);

    if (
      ("name" in data && (typeof data.name !== "string" || !data.name.trim())) ||
      ("description" in data && data.description !== null && typeof data.description !== "string") ||
      ("price" in data && (typeof data.price !== "number" || !Number.isFinite(data.price) || data.price < 0)) ||
      ("duration_minutes" in data && (!Number.isInteger(data.duration_minutes) || data.duration_minutes <= 0)) ||
      ("is_active" in data && ![0, 1, true, false].includes(data.is_active))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid service values.",
      });
    }

    if ("name" in data) data.name = data.name.trim();
    if ("is_active" in data) data.is_active = Number(data.is_active);

    const update = db.transaction(() => {
      const sets = Object.keys(data).map(k => `${k} = ?`).join(", ");

      const result = db.prepare(`
        UPDATE services
        SET ${sets}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(...Object.values(data), Number(req.params.id));

      if (result.changes) {
        logActivity(req.user.id, "update", "service", Number(req.params.id), data);
      }

      return result.changes;
    });

    const changed = update();

    if (!changed) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    return res.json({ success: true, message: "Service updated." });
  } catch (error) {
    return fail(res, error);
  }
});

/* 3. THERAPIST STAFF */

router.get("/therapists", (req, res) => {
  try {
    const therapists = db.prepare(`
      SELECT
        u.id, u.first_name, u.last_name,
        u.email, u.phone, u.is_active,
        p.bio, p.specialties, p.is_available
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN therapist_profiles p ON p.user_id = u.id
      WHERE LOWER(r.name) = 'massage therapist'
      ORDER BY u.last_name, u.first_name
    `).all();

    return res.json({ success: true, therapists });
  } catch (error) {
    return fail(res, error);
  }
});

router.patch("/therapists/:id/status", (req, res) => {
  try {
    if (!validId(req.params.id) || ![true, false, 0, 1].includes(req.body?.is_active)) {
      return res.status(400).json({
        success: false,
        message: "Valid therapist ID and status required.",
      });
    }

    const update = db.transaction(() => {
      const result = db.prepare(`
        UPDATE users
        SET is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND role_id IN (
            SELECT id FROM roles WHERE LOWER(name) = 'massage therapist'
          )
      `).run(Number(req.body.is_active), Number(req.params.id));

      if (result.changes) {
        logActivity(req.user.id, "update_status", "therapist",
          Number(req.params.id), { is_active: Number(req.body.is_active) });
      }

      return result.changes;
    });

    if (!update()) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found.",
      });
    }

    return res.json({ success: true, message: "Therapist status updated." });
  } catch (error) {
    return fail(res, error);
  }
});

/* 4. THERAPIST AVAILABILITY */

router.get("/therapists/:id/availability", (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const availability = db.prepare(`
      SELECT * FROM therapist_availability
      WHERE therapist_id = ?
      ORDER BY day_of_week, start_time
    `).all(Number(req.params.id));

    return res.json({ success: true, availability });
  } catch (error) {
    return fail(res, error);
  }
});

/* 5. TIME-OFF APPROVALS */

router.get("/time-off", (req, res) => {
  try {
    const requests = db.prepare(`
      SELECT
        t.*, u.first_name, u.last_name
      FROM time_off_requests t
      JOIN users u ON u.id = t.therapist_id
      ORDER BY t.created_at DESC, t.id DESC
    `).all();

    return res.json({ success: true, requests });
  } catch (error) {
    return fail(res, error);
  }
});

router.patch("/time-off/:id", (req, res) => {
  try {
    if (
      !validId(req.params.id) ||
      !["approved", "rejected"].includes(req.body?.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid ID and approval status required.",
      });
    }

    const review = db.transaction(() => {
      const result = db.prepare(`
        UPDATE time_off_requests
        SET status = ?,
            reviewed_by = ?,
            reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'pending'
      `).run(req.body.status, req.user.id, Number(req.params.id));

      if (result.changes) {
        logActivity(req.user.id, "review", "time_off",
          Number(req.params.id), { status: req.body.status });
      }

      return result.changes;
    });

    if (!review()) {
      return res.status(409).json({
        success: false,
        message: "Request not found or already reviewed.",
      });
    }

    return res.json({
      success: true,
      message: "Time-off request reviewed.",
    });
  } catch (error) {
    return fail(res, error);
  }
});

/* 6. REPORTS AND ACTIVITY LOGS */

router.get("/reports/payments", (req, res) => {
  try {
    const payments = db.prepare(`
      SELECT
        p.id, p.appointment_id, p.amount,
        p.payment_method, p.reference_number,
        p.paid_at
      FROM payments p
      ORDER BY p.paid_at DESC, p.id DESC
      LIMIT 200
    `).all();

    return res.json({ success: true, payments });
  } catch (error) {
    return fail(res, error);
  }
});

router.get("/activity-logs", (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT
        l.id, l.user_id, l.action,
        l.entity_type, l.entity_id,
        l.details, l.created_at
      FROM activity_logs l
      ORDER BY l.created_at DESC, l.id DESC
      LIMIT 200
    `).all();

    return res.json({ success: true, logs });
  } catch (error) {
    return fail(res, error);
  }
});

module.exports = router;
