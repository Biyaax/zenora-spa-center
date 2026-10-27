const db = require("../database/db");
const token = require("../lib/token");
const { unauthorized, forbidden } = require("../lib/errors");

const findUser = db.prepare(`
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
  WHERE u.id = ?
`);

function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  const payload = match ? token.verify(match[1]) : null;

  // The shared auth route signs a numeric subject; accept its numeric-string
  // equivalent as well to remain compatible with valid staff JWTs.
  const subject = payload?.sub;
  const userId =
    (typeof subject === "number" || typeof subject === "string") &&
    /^[1-9]\d*$/.test(String(subject))
      ? Number(subject)
      : NaN;

  if (!Number.isSafeInteger(userId)) {
    return next(unauthorized("Your session has expired. Please log in again."));
  }

  // Recheck the account/role on every request so deactivation or reassignment
  // takes effect without waiting for the token to expire.
  const user = findUser.get(userId);
  if (!user || !user.is_active) {
    return next(unauthorized("This account is not active."));
  }

  req.user = user;
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(unauthorized("Authentication required."));
    }
    if (!roles.includes(req.user.role)) {
      return next(forbidden());
    }
    return next();
  };
}

// Some backend-branch routes import `authenticate`; alias it to the shared
// verifier so there are not two independent authentication implementations.
module.exports = { requireAuth, authenticate: requireAuth, requireRole };
