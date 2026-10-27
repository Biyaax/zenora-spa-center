
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = db.prepare(`
      SELECT u.id, u.first_name, u.last_name,
             u.email, u.password_hash, u.is_active,
             r.name AS role
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE LOWER(u.email) = LOWER(?)
    `).get(email.trim());

    // Use a generic error for incorrect credentials.
    if (
      !user ||
      user.is_active !== 1 ||
      !(await bcrypt.compare(password, user.password_hash))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured.",
      });
    }

    const token = jwt.sign(
      {},
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        subject: String(user.id),
        expiresIn: "2h",
      }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
    });
  }
});

// GET CURRENT LOGGED-IN USER
router.get("/me", authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

module.exports = router;
