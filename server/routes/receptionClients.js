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

function shapeClient(row) {
  return {
    id: Number(row.id),

    clientId:
      `CLI-${String(row.id).padStart(
        4,
        "0"
      )}`,

    firstName:
      row.first_name || "",

    lastName:
      row.last_name || "",

    email:
      row.email || "",

    phone:
      row.phone || "",

    notes:
      row.notes || "",

    hasAccount:
      Boolean(
        Number(row.has_account)
      ),

    totalBookings:
      Number(
        row.total_bookings || 0
      ),

    lastVisit:
      row.last_visit || null,
  };
}

async function getClientRow(id) {
  const result = await db.query(
    `
      SELECT
        c.id,
        c.user_id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.notes,

        CASE
          WHEN c.user_id IS NOT NULL
          THEN 1
          ELSE 0
        END AS has_account,

        COUNT(a.id)::INTEGER
          AS total_bookings,

        MAX(
          CASE
            WHEN
              a.check_in_at IS NOT NULL
              OR LOWER(a.status) = 'completed'
            THEN a.appointment_date
            ELSE NULL
          END
        ) AS last_visit

      FROM clients c

      LEFT JOIN appointments a
        ON a.client_id = c.id

      WHERE c.id = $1

      GROUP BY
        c.id,
        c.user_id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.notes
    `,
    [id]
  );

  return result.rows[0] || null;
}

/* =========================
   LIST CLIENT RECORDS
========================= */

router.get("/", async (req, res) => {
  try {
    const [
      summaryResult,
      clientsResult,
    ] = await Promise.all([
      db.query(`
        SELECT
          (
            SELECT
              COUNT(*)::INTEGER
            FROM clients
          ) AS total_clients,

          (
            SELECT
              COUNT(*)::INTEGER
            FROM appointments
          ) AS total_bookings
      `),

      db.query(`
        SELECT
          c.id,
          c.user_id,
          c.first_name,
          c.last_name,
          c.email,
          c.phone,
          c.notes,

          CASE
            WHEN c.user_id IS NOT NULL
            THEN 1
            ELSE 0
          END AS has_account,

          COUNT(a.id)::INTEGER
            AS total_bookings,

          MAX(
            CASE
              WHEN
                a.check_in_at IS NOT NULL
                OR LOWER(a.status) = 'completed'
              THEN a.appointment_date
              ELSE NULL
            END
          ) AS last_visit

        FROM clients c

        LEFT JOIN appointments a
          ON a.client_id = c.id

        GROUP BY
          c.id,
          c.user_id,
          c.first_name,
          c.last_name,
          c.email,
          c.phone,
          c.notes

        ORDER BY
          c.last_name,
          c.first_name,
          c.id
      `),
    ]);

    return res.json({
      success: true,

      summary: {
        totalClients:
          Number(
            summaryResult
              .rows[0]
              .total_clients || 0
          ),

        totalBookings:
          Number(
            summaryResult
              .rows[0]
              .total_bookings || 0
          ),
      },

      clients:
        clientsResult.rows.map(
          shapeClient
        ),
    });
  } catch (error) {
    console.error(
      "Receptionist client list error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          "Unable to load client records.",
      });
  }
});

/* =========================
   UPDATE CLIENT
========================= */

router.patch(
  "/:id",
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
              "Invalid client ID.",
          });
      }

      const id =
        Number(req.params.id);

      await reception.updateClient(
        req.user,
        id,
        req.body || {}
      );

      const row =
        await getClientRow(id);

      if (!row) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Client not found.",
          });
      }

      return res.json({
        success: true,
        message:
          "Client record updated successfully.",
        client:
          shapeClient(row),
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;