const express = require("express");

const db = require("../database/postgres");

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

/*
 * index.js already protects this router with:
 *
 * requireAuth
 * requireRole("Spa Manager")
 *
 * so req.user is already an authenticated, active Spa Manager.
 */

async function logActivity(
  queryable,
  userId,
  action,
  type,
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
      type ?? null,
      entityId ?? null,
      details == null
        ? null
        : JSON.stringify(details),
    ]
  );
}

/* =========================
   1. MANAGER DASHBOARD
========================= */

router.get("/dashboard", async (req, res) => {
  try {
    const [
      appointmentsResult,
      servicesResult,
      therapistsResult,
      revenueResult,
      timeOffResult,
    ] = await Promise.all([
      db.query(`
        SELECT COUNT(*)::INTEGER AS total
        FROM appointments
      `),

      db.query(`
        SELECT COUNT(*)::INTEGER AS total
        FROM services
        WHERE is_active = 1
      `),

      db.query(`
        SELECT COUNT(*)::INTEGER AS total
        FROM users u
        JOIN roles r
          ON r.id = u.role_id
        WHERE LOWER(r.name) = 'massage therapist'
          AND u.is_active = 1
      `),

      db.query(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM payments
      `),

      db.query(`
        SELECT COUNT(*)::INTEGER AS total
        FROM time_off_requests
        WHERE status = 'pending'
      `),
    ]);

    return res.json({
      success: true,
      dashboard: {
        appointments:
          appointmentsResult.rows[0].total,

        activeServices:
          servicesResult.rows[0].total,

        therapists:
          therapistsResult.rows[0].total,

        revenue: Number(
          revenueResult.rows[0].total || 0
        ),

        pendingTimeOff:
          timeOffResult.rows[0].total,
      },
    });
  } catch (error) {
    return fail(res, error);
  }
});

/* =========================
   2. SERVICES MANAGEMENT
========================= */

router.get("/services", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT *
      FROM services
      ORDER BY name
    `);

    return res.json({
      success: true,
      services: result.rows,
    });
  } catch (error) {
    return fail(res, error);
  }
});

router.post("/services", async (req, res) => {
  const client = await db.connect();

  try {
    const {
      name,
      description,
      price,
      duration_minutes,
    } = req.body || {};

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
        message:
          "Valid name, price and duration are required.",
      });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `
      INSERT INTO services (
        name,
        description,
        price,
        duration_minutes
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [
        name.trim(),
        description || null,
        price,
        duration_minutes,
      ]
    );

    const id = result.rows[0].id;

    await logActivity(
      client,
      req.user.id,
      "create",
      "service",
      id,
      {
        name: name.trim(),
      }
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Service created.",
      id,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return fail(res, error);
  } finally {
    client.release();
  }
});

router.patch("/services/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID.",
    });
  }

  const allowed = [
    "name",
    "description",
    "price",
    "duration_minutes",
    "is_active",
  ];

  const changes = Object.entries(
    req.body || {}
  ).filter(([key]) =>
    allowed.includes(key)
  );

  if (!changes.length) {
    return res.status(400).json({
      success: false,
      message: "No valid fields supplied.",
    });
  }

  const data =
    Object.fromEntries(changes);

  if (
    (
      "name" in data &&
      (
        typeof data.name !== "string" ||
        !data.name.trim()
      )
    ) ||
    (
      "description" in data &&
      data.description !== null &&
      typeof data.description !== "string"
    ) ||
    (
      "price" in data &&
      (
        typeof data.price !== "number" ||
        !Number.isFinite(data.price) ||
        data.price < 0
      )
    ) ||
    (
      "duration_minutes" in data &&
      (
        !Number.isInteger(
          data.duration_minutes
        ) ||
        data.duration_minutes <= 0
      )
    ) ||
    (
      "is_active" in data &&
      ![
        0,
        1,
        true,
        false,
      ].includes(data.is_active)
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid service values.",
    });
  }

  if ("name" in data) {
    data.name = data.name.trim();
  }

  if ("is_active" in data) {
    data.is_active =
      Number(data.is_active);
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const keys =
      Object.keys(data);

    const values =
      Object.values(data);

    const sets = keys
      .map(
        (key, index) =>
          `${key} = $${index + 1}`
      )
      .join(", ");

    const idPlaceholder =
      values.length + 1;

    const result =
      await client.query(
        `
        UPDATE services
        SET
          ${sets},
          updated_at = to_char(
            CURRENT_TIMESTAMP,
            'YYYY-MM-DD HH24:MI:SS'
          )
        WHERE id = $${idPlaceholder}
        RETURNING id
        `,
        [
          ...values,
          Number(req.params.id),
        ]
      );

    if (result.rowCount === 0) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    await logActivity(
      client,
      req.user.id,
      "update",
      "service",
      Number(req.params.id),
      data
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Service updated.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return fail(res, error);
  } finally {
    client.release();
  }
});

/* =========================
   3. THERAPIST STAFF
========================= */

router.get("/therapists", async (req, res) => {
  try {
    const result =
      await db.query(`
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          u.is_active,
          p.bio,
          p.specialties,
          p.is_available
        FROM users u
        JOIN roles r
          ON r.id = u.role_id
        LEFT JOIN therapist_profiles p
          ON p.user_id = u.id
        WHERE LOWER(r.name) =
          'massage therapist'
        ORDER BY
          u.last_name,
          u.first_name
      `);

    return res.json({
      success: true,
      therapists: result.rows,
    });
  } catch (error) {
    return fail(res, error);
  }
});

router.patch(
  "/therapists/:id/status",
  async (req, res) => {
    if (
      !validId(req.params.id) ||
      ![
        true,
        false,
        0,
        1,
      ].includes(req.body?.is_active)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid therapist ID and status required.",
      });
    }

    const client =
      await db.connect();

    try {
      await client.query("BEGIN");

      const isActive =
        Number(
          req.body.is_active
        );

      const result =
        await client.query(
          `
          UPDATE users
          SET
            is_active = $1,
            updated_at = to_char(
              CURRENT_TIMESTAMP,
              'YYYY-MM-DD HH24:MI:SS'
            )
          WHERE id = $2
            AND role_id IN (
              SELECT id
              FROM roles
              WHERE LOWER(name) =
                'massage therapist'
            )
          RETURNING id
          `,
          [
            isActive,
            Number(req.params.id),
          ]
        );

      if (result.rowCount === 0) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "Therapist not found.",
        });
      }

      await logActivity(
        client,
        req.user.id,
        "update_status",
        "therapist",
        Number(req.params.id),
        {
          is_active:
            isActive,
        }
      );

      await client.query("COMMIT");

      return res.json({
        success: true,
        message:
          "Therapist status updated.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      return fail(res, error);
    } finally {
      client.release();
    }
  }
);

/* =========================
   4. THERAPIST AVAILABILITY
========================= */

router.get(
  "/therapists/:id/availability",
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID.",
        });
      }

      const result =
        await db.query(
          `
          SELECT *
          FROM therapist_availability
          WHERE therapist_id = $1
          ORDER BY
            day_of_week,
            start_time
          `,
          [
            Number(req.params.id),
          ]
        );

      return res.json({
        success: true,
        availability:
          result.rows,
      });
    } catch (error) {
      return fail(res, error);
    }
  }
);

/* =========================
   5. TIME-OFF APPROVALS
========================= */

router.get("/time-off", async (req, res) => {
  try {
    const result =
      await db.query(`
        SELECT
          t.*,
          u.first_name,
          u.last_name
        FROM time_off_requests t
        JOIN users u
          ON u.id = t.therapist_id
        ORDER BY
          t.created_at DESC,
          t.id DESC
      `);

    /*
     * The database schema uses "declined".
     * The Manager UI/backend originally used "rejected".
     * Return "rejected" to preserve that frontend contract.
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
      requests,
    });
  } catch (error) {
    return fail(res, error);
  }
});

router.patch(
  "/time-off/:id",
  async (req, res) => {
    if (
      !validId(req.params.id) ||
      ![
        "approved",
        "rejected",
        "declined",
      ].includes(req.body?.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid ID and approval status required.",
      });
    }

    /*
     * PostgreSQL schema stores:
     * pending / approved / declined
     *
     * Preserve compatibility with a frontend
     * that submits "rejected".
     */
    const status =
      req.body.status ===
      "rejected"
        ? "declined"
        : req.body.status;

    const client =
      await db.connect();

    try {
      await client.query("BEGIN");

      const result =
        await client.query(
          `
          UPDATE time_off_requests
          SET
            status = $1,
            reviewed_by = $2,
            reviewed_at = to_char(
              CURRENT_TIMESTAMP,
              'YYYY-MM-DD HH24:MI:SS'
            )
          WHERE id = $3
            AND status = 'pending'
          RETURNING id
          `,
          [
            status,
            req.user.id,
            Number(req.params.id),
          ]
        );

      if (result.rowCount === 0) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(409).json({
          success: false,
          message:
            "Request not found or already reviewed.",
        });
      }

      await logActivity(
        client,
        req.user.id,
        "review",
        "time_off",
        Number(req.params.id),
        {
          status,
        }
      );

      await client.query("COMMIT");

      return res.json({
        success: true,
        message:
          "Time-off request reviewed.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      return fail(res, error);
    } finally {
      client.release();
    }
  }
);

/* =========================
   6. REPORTS
========================= */

router.get(
  "/reports/payments",
  async (req, res) => {
    try {
      const result =
        await db.query(`
          SELECT
            p.id,
            p.appointment_id,
            p.amount,
            p.payment_method,
            p.reference_number,
            p.paid_at
          FROM payments p
          ORDER BY
            p.paid_at DESC,
            p.id DESC
          LIMIT 200
        `);

      const payments =
        result.rows.map(
          (payment) => ({
            ...payment,
            amount:
              Number(
                payment.amount ||
                  0
              ),
          })
        );

      return res.json({
        success: true,
        payments,
      });
    } catch (error) {
      return fail(res, error);
    }
  }
);

/* =========================
   7. ACTIVITY LOGS
========================= */

router.get(
  "/activity-logs",
  async (req, res) => {
    try {
      const result =
        await db.query(`
          SELECT
            l.id,
            l.user_id,
            l.action,
            l.entity_type,
            l.entity_id,
            l.details,
            l.created_at
          FROM activity_logs l
          ORDER BY
            l.created_at DESC,
            l.id DESC
          LIMIT 200
        `);

      return res.json({
        success: true,
        logs: result.rows,
      });
    } catch (error) {
      return fail(res, error);
    }
  }
);

module.exports = router;