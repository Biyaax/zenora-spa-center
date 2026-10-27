const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../database/postgres");
const token = require("../lib/token");
const v = require("../lib/validate");
const { requireAuth } = require("../middleware/auth");
const {
  HttpError,
  badRequest,
  unauthorized,
  conflict,
} = require("../lib/errors");
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
    failures.set(key, {
      count: 1,
      first: Date.now(),
    });
  } else {
    entry.count++;
  }
}

/* ---------- Register (always creates a Guest) ---------- */

router.post("/register", async (req, res) => {
  const firstName = v.text(
    req.body.firstName,
    "First name",
    { max: 80 }
  );

  const lastName = v.text(
    req.body.lastName,
    "Last name",
    { max: 80 }
  );

  const email = v.email(req.body.email);

  const phone = v.phone(
    req.body.phone,
    "Phone",
    { required: true }
  );

  const password = req.body.password;

  if (
    typeof password !== "string" ||
    password.length < 8
  ) {
    throw badRequest(
      "Password must be at least 8 characters."
    );
  }

  if (password.length > 72) {
    throw badRequest(
      "Password must be 72 characters or fewer."
    );
  }

  const existingResult = await db.query(
    `
    SELECT 1
    FROM users
    WHERE email = $1
    `,
    [email]
  );

  if (existingResult.rows.length > 0) {
    throw conflict(
      "An account with this email already exists."
    );
  }

  const guestRoleResult = await db.query(
    `
    SELECT id
    FROM roles
    WHERE name = 'Guest'
    `
  );

  const guestRole = guestRoleResult.rows[0];

  if (!guestRole) {
    throw new Error("Guest role is missing from the database.");
  }

  const passwordHash = bcrypt.hashSync(
    password,
    10
  );

  const client = await db.connect();

  let userId;

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `
      INSERT INTO users (
        role_id,
        first_name,
        last_name,
        email,
        password_hash,
        phone
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [
        guestRole.id,
        firstName,
        lastName,
        email,
        passwordHash,
        phone,
      ]
    );

    userId = userResult.rows[0].id;

    await client.query(
      `
      INSERT INTO clients (
        user_id,
        first_name,
        last_name,
        email,
        phone
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        userId,
        firstName,
        lastName,
        email,
        phone,
      ]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      throw conflict(
        "An account with this email already exists."
      );
    }

    throw error;
  } finally {
    client.release();
  }

  await logActivity(
    userId,
    "auth.register",
    "user",
    userId,
    email
  );

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

router.post("/login", async (req, res) => {
  const email = v.email(req.body.email);
  const password = req.body.password;

  if (
    typeof password !== "string" ||
    !password
  ) {
    throw badRequest("Password is required.");
  }

  const key = `${email}|${req.ip}`;

  if (isLocked(key)) {
    throw new HttpError(
      429,
      "Too many failed attempts. Please try again in a few minutes."
    );
  }

  const result = await db.query(
    `
    SELECT
      u.*,
      r.name AS role
    FROM users u
    JOIN roles r
      ON r.id = u.role_id
    WHERE u.email = $1
    `,
    [email]
  );

  const row = result.rows[0];

  // Compare even when the user is missing, so timing does not reveal
  // which emails exist.
  const valid = bcrypt.compareSync(
    password,
    row?.password_hash || DUMMY_HASH
  );

  if (
    !row ||
    !valid ||
    !row.is_active
  ) {
    recordFailure(key);
    throw unauthorized(
      "Incorrect email or password."
    );
  }

  failures.delete(key);

  await logActivity(
    row.id,
    "auth.login",
    "user",
    row.id,
    null
  );

  res.json({
    success: true,
    token: token.sign({ sub: row.id }),
    user: publicUser(row),
  });
});

/* ---------- Current user ---------- */

router.get("/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    user: publicUser(req.user),
  });
});

router.patch(
  "/me",
  requireAuth,
  async (req, res) => {
    const firstName = v.text(
      req.body.firstName ??
        req.user.first_name,
      "First name",
      { max: 80 }
    );

    const lastName = v.text(
      req.body.lastName ??
        req.user.last_name,
      "Last name",
      { max: 80 }
    );

    const phone = v.phone(
      req.body.phone ?? req.user.phone,
      "Phone"
    );

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `
        UPDATE users
        SET
          first_name = $1,
          last_name = $2,
          phone = $3,
          updated_at = to_char(
            CURRENT_TIMESTAMP,
            'YYYY-MM-DD HH24:MI:SS'
          )
        WHERE id = $4
        `,
        [
          firstName,
          lastName,
          phone,
          req.user.id,
        ]
      );

      await client.query(
        `
        UPDATE clients
        SET
          first_name = $1,
          last_name = $2,
          phone = $3,
          updated_at = to_char(
            CURRENT_TIMESTAMP,
            'YYYY-MM-DD HH24:MI:SS'
          )
        WHERE user_id = $4
        `,
        [
          firstName,
          lastName,
          phone,
          req.user.id,
        ]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    res.json({
      success: true,
      user: publicUser({
        ...req.user,
        first_name: firstName,
        last_name: lastName,
        phone,
      }),
    });
  }
);

module.exports = router;