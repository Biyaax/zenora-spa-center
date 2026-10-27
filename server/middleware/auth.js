const db = require("../database/postgres");
const token = require("../lib/token");
const {
  unauthorized,
  forbidden,
} = require("../lib/errors");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, value] = header.split(" ");

    const payload =
      scheme === "Bearer"
        ? token.verify(value)
        : null;

    if (!payload) {
      return next(
        unauthorized(
          "Your session has expired. Please log in again."
        )
      );
    }

    // Look the user up on every request so deactivated accounts
    // and role changes take effect immediately.
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
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = $1
      `,
      [payload.sub]
    );

    const user = result.rows[0];

    if (!user || !user.is_active) {
      return next(
        unauthorized("This account is not active.")
      );
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (
      !req.user ||
      !roles.includes(req.user.role)
    ) {
      return next(forbidden());
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};