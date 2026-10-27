const db = require("../database/postgres");
const token = require("../lib/token");
const {
  unauthorized,
  forbidden,
} = require("../lib/errors");

async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";

    const match =
      /^Bearer\s+(\S+)$/i.exec(
        authorization.trim()
      );

    const payload = match
      ? token.verify(match[1])
      : null;

    /*
     * The shared auth route signs a numeric subject.
     * Accept the numeric-string equivalent as well.
     */
    const subject = payload?.sub;

    const userId =
      (
        typeof subject === "number" ||
        typeof subject === "string"
      ) &&
      /^[1-9]\d*$/.test(
        String(subject)
      )
        ? Number(subject)
        : NaN;

    if (
      !Number.isSafeInteger(userId)
    ) {
      return next(
        unauthorized(
          "Your session has expired. Please log in again."
        )
      );
    }

    /*
     * Recheck the account and role on every request so
     * deactivation or role reassignment takes effect immediately.
     */
    const result = await db.query(
      `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.is_active,
        r.name AS role
      FROM users u
      JOIN roles r
        ON r.id = u.role_id
      WHERE u.id = $1
      `,
      [userId]
    );

    const user = result.rows[0];

    if (
      !user ||
      !user.is_active
    ) {
      return next(
        unauthorized(
          "This account is not active."
        )
      );
    }

    req.user = user;

    return next();
  } catch (error) {
    return next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        unauthorized(
          "Authentication required."
        )
      );
    }

    if (
      !roles.includes(
        req.user.role
      )
    ) {
      return next(
        forbidden()
      );
    }

    return next();
  };
}

/*
 * Some Manager/Therapist routes import `authenticate`.
 * Keep it as an alias so we use one shared authentication system.
 */
module.exports = {
  requireAuth,
  authenticate: requireAuth,
  requireRole,
};