
const jwt = require("jsonwebtoken");
const db = require("../database/db");

function authenticate(req, res, next) {
  const authorization = req.headers.authorization || "";

  const match = /^Bearer (.+)$/i.exec(authorization);

  if (!match) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Authentication is not configured.",
    });
  }

  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (!payload || typeof payload.sub !== "string" ||
        !/^[1-9]\d*$/.test(payload.sub)) {
      throw new Error("Invalid token subject");
    }

    const user = db.prepare(`
      SELECT u.id, u.first_name, u.last_name,
             u.email, u.is_active, r.name AS role
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
    `).get(Number(payload.sub));

    if (!user || user.is_active !== 1) {
      return res.status(401).json({
        success: false,
        message: "Account unavailable.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (req.user.role.toLowerCase() !== role.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    next();
  };
}

module.exports = { authenticate, requireRole };
