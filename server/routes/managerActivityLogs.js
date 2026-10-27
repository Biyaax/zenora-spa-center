const express = require("express");

const db = require("../database/postgres");

const router = express.Router();

function parseDetails(value) {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function makeName(firstName, lastName) {
  return [firstName, lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

/*
  GET /api/manager/activity-logs

  The Manager authentication / role check
  is handled in server/index.js.
*/

router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        l.id,
        l.user_id,
        l.action,
        l.entity_type,
        l.entity_id,
        l.details,
        l.created_at,

        u.first_name,
        u.last_name,
        u.email,

        r.name AS role

      FROM activity_logs l

      LEFT JOIN users u
        ON u.id = l.user_id

      LEFT JOIN roles r
        ON r.id = u.role_id

      ORDER BY
        l.created_at DESC,
        l.id DESC

      LIMIT 500
    `);

    const logs = result.rows.map((row) => {
      const actorName = makeName(
        row.first_name,
        row.last_name
      );

      const actorRole =
        row.role || null;

      return {
        id: row.id,
        user_id: row.user_id,
        action: row.action,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        details: parseDetails(row.details),
        created_at: row.created_at,

        /*
          Standard actor information.
        */
        first_name:
          row.first_name || null,

        last_name:
          row.last_name || null,

        email:
          row.email || null,

        role:
          actorRole,

        /*
          Additional aliases so the existing
          Activity Logs frontend can consume
          the user information regardless of
          which naming convention it currently uses.
        */
        actor_name:
          actorName || null,

        actor_role:
          actorRole,

        user_name:
          actorName || null,

        user_role:
          actorRole,

        staff_name:
          actorName || null,

        staff_role:
          actorRole,

        /*
          Nested form as well.
        */
        user:
          row.user_id
            ? {
                id: row.user_id,
                first_name:
                  row.first_name || null,

                last_name:
                  row.last_name || null,

                email:
                  row.email || null,

                role:
                  actorRole,

                name:
                  actorName || null,
              }
            : null,
      };
    });

    return res.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error(
      "Manager activity logs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load activity logs.",
    });
  }
});

module.exports = router;