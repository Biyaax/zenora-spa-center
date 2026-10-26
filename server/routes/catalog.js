const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../database/db");
const token = require("../lib/token");
const v = require("../lib/validate");
const { requireAuth } = require("../middleware/auth");
const { HttpError, badRequest, unauthorized, conflict } = require("../lib/errors");
const { logActivity } = require("../lib/notify");

const router = express.Router();

const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const publicUser = (user) => ({
  id: user.id,
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

/* Simple in-memory brake on password guessing: 8 failures / 15 min / email+IP. */
const failures = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

function isLocked(key) {
  const entry = failures.get(key);
  if (!entry) return false;

  if (Date.now() - entry.first > WINDOW_MS) {
    failures.delete(key);
    return false;
  }

  return entry.count >= MAX_FAILURES;
}

function recordFailure(key) {
  const entry = failures.get(key);

  if (!entry || Date.now() - entry.first > WINDOW_MS) {
    failures.set(key, { count: 1, first: Date.now() });
  } else {
    entry.count++;
  }
}

/* ---------- Register (always creates a Guest) ---------- */

router.post("/register", (req, res) => {
  const firstName = v.text(req.body.firstName, "First name", { max: 80 });
  const lastName = v.text(req.body.lastName, "Last name", { max: 80 });
  const email = v.email(req.body.email);
  const phone = v.phone(req.body.phone, "Phone", { required: true });
  const password = req.body.password;

  if (typeof password !== "string" || password.length < 8) {
    throw badRequest("Password must be at least 8 characters.");
  }

  if (password.length > 72) {
    throw badRequest("Password must be 72 characters or fewer.");
  }

  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) {
    throw conflict("An account with this email already exists.");
  }

  const guestRole = db
    .prepare("SELECT id FROM roles WHERE name = 'Guest'")
    .get();

  const passwordHash = bcrypt.hashSync(password, 10);

  const userId = db.transaction(() => {
    const id = db
      .prepare(
        `INSERT INTO users
           (role_id, first_name, last_name, email, password_hash, phone)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(guestRole.id, firstName, lastName, email, passwordHash, phone)
      .lastInsertRowid;

    db.prepare(
      `INSERT INTO clients (user_id, first_name, last_name, email, phone)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, firstName, lastName, email, phone);

    return Number(id);
  })();

  logActivity(userId, "auth.register", "user", userId, email);

  const user = {
    id: userId,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    role: "Guest",
  };

  res.status(201).json({
    success: true,
    token: token.sign({ sub: userId }),
    user: publicUser(user),
  });
});

/* ---------- Login (all roles) ---------- */

router.post("/login", (req, res) => {
  const email = v.email(req.body.email);
  const password = req.body.password;

  if (typeof password !== "string" || !password) {
    throw badRequest("Password is required.");
  }

  const key = `${email}|${req.ip}`;

  if (isLocked(key)) {
    throw new HttpError(
      429,
      "Too many failed attempts. Please try again in a few minutes."
    );
  }

  const row = db
    .prepare(
      `SELECT u.*, r.name AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = ?`
    )
    .get(email);

  // Compare even when the user is missing, so timing does not reveal
  // which emails exist.
  const valid = bcrypt.compareSync(
    password,
    row?.password_hash || DUMMY_HASH
  );

  if (!row || !valid || !row.is_active) {
    recordFailure(key);
    throw unauthorized("Incorrect email or password.");
  }

  failures.delete(key);

  logActivity(row.id, "auth.login", "user", row.id, null);

  res.json({
    success: true,
    token: token.sign({ sub: row.id }),
    user: publicUser(row),
  });
});

/* ---------- Current user ---------- */

router.get("/me", requireAuth, (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

router.patch("/me", requireAuth, (req, res) => {
  const firstName = v.text(req.body.firstName ?? req.user.first_name, "First name", { max: 80 });
  const lastName = v.text(req.body.lastName ?? req.user.last_name, "Last name", { max: 80 });
  const phone = v.phone(req.body.phone ?? req.user.phone, "Phone");

  db.transaction(() => {
    db.prepare(
      `UPDATE users
       SET first_name = ?, last_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(firstName, lastName, phone, req.user.id);

    db.prepare(
      `UPDATE clients
       SET first_name = ?, last_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`
    ).run(firstName, lastName, phone, req.user.id);
  })();

  res.json({
    success: true,
    user: publicUser({
      ...req.user,
      first_name: firstName,
      last_name: lastName,
      phone,
    }),
  });
});

module.exports = router;
