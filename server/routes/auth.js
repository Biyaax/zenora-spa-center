const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../database/postgres");
const token = require("../lib/token");
const v = require("../lib/validate");
const { registrationFields } = require("../lib/registration");
const { requireMailDomain } = require("../services/emailDomain");

const emailVerification = require(
  "../services/emailVerification"
);

const {
  requireAuth,
} = require("../middleware/auth");

const {
  HttpError,
  badRequest,
  unauthorized,
  conflict,
} = require("../lib/errors");

const {
  logActivity,
} = require("../lib/notify");

const router = express.Router();

const DUMMY_HASH = bcrypt.hashSync(
  "not-a-real-password",
  10
);

const publicUser = (user) => ({
  id: user.id,
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
  phone: user.phone,
  role: user.role,

  emailVerified:
    Number(
      user.email_verified ?? 1
    ) === 1,
});

/* =========================================================
   LOGIN FAILURE BRAKE
   8 failures / 15 minutes / email + IP
========================================================= */

const failures = new Map();

const WINDOW_MS =
  15 * 60 * 1000;

const MAX_FAILURES = 8;

function isLocked(key) {
  const entry =
    failures.get(key);

  if (!entry) {
    return false;
  }

  if (
    Date.now() -
      entry.first >
    WINDOW_MS
  ) {
    failures.delete(key);

    return false;
  }

  return (
    entry.count >=
    MAX_FAILURES
  );
}

function recordFailure(key) {
  const entry =
    failures.get(key);

  if (
    !entry ||
    Date.now() -
      entry.first >
      WINDOW_MS
  ) {
    failures.set(key, {
      count: 1,
      first: Date.now(),
    });

    return;
  }

  entry.count += 1;
}

/* =========================================================
   REGISTER
   Public registration always creates a Guest account.

   IMPORTANT:
   New account starts with email_verified = 0.
   No JWT is issued until email has been verified.
========================================================= */

router.post(
  "/register",
  async (req, res) => {
    const { firstName, lastName, email, phone, password } = registrationFields(req.body);

    /*
     * Check whether the email already exists.
     */
    const existingResult =
      await db.query(
        `
          SELECT
            id,
            email_verified
          FROM users
          WHERE email = $1
          LIMIT 1
        `,
        [email]
      );

    if (
      existingResult.rows
        .length > 0
    ) {
      const existing =
        existingResult.rows[0];

      if (
        Number(
          existing.email_verified
        ) !== 1
      ) {
        throw conflict(
          "This email is already registered but has not been verified. Please resend the verification email.",
          { fields: { email: "This email is already registered. Please resend its verification email." } }
        );
      }

      throw conflict(
        "An account with this email already exists.",
        { fields: { email: "An account with this email already exists." } }
      );
    }

    // DNS checks reject invalid mail domains; clicking the emailed link
    // is still required to prove access to this particular mailbox.
    await requireMailDomain(email);

    /*
     * Public registration creates Guest only.
     */
    const guestRoleResult =
      await db.query(
        `
          SELECT id
          FROM roles
          WHERE name = 'Guest'
          LIMIT 1
        `
      );

    const guestRole =
      guestRoleResult.rows[0];

    if (!guestRole) {
      throw new Error(
        "Guest role is missing from the database."
      );
    }

    const passwordHash =
      bcrypt.hashSync(
        password,
        10
      );

    const client =
      await db.connect();

    let userId;

    try {
      await client.query(
        "BEGIN"
      );

      /*
       * Explicitly set email_verified = 0.
       */
      const userResult =
        await client.query(
          `
            INSERT INTO users (
              role_id,
              first_name,
              last_name,
              email,
              password_hash,
              phone,
              email_verified,
              email_verified_at
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              0,
              NULL
            )
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

      userId =
        userResult.rows[0].id;

      await client.query(
        `
          INSERT INTO clients (
            user_id,
            first_name,
            last_name,
            email,
            phone
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
          )
        `,
        [
          userId,
          firstName,
          lastName,
          email,
          phone,
        ]
      );

      await client.query(
        "COMMIT"
      );
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      if (
        error.code === "23505"
      ) {
        throw conflict(
          "An account with this email already exists.",
          { fields: { email: "An account with this email already exists." } }
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

    /*
     * Create verification token and send email.
     *
     * If SMTP fails, the account remains saved and
     * unverified. The user can use Resend Verification.
     */
    let mailResult;

    try {
      mailResult =
        await emailVerification.sendForUser({
          userId,
          email,
          firstName,
          accountType:
            "Guest",
        });
    } catch (error) {
      console.error(
        "[email-verification] Could not create/send verification:",
        error
      );

      mailResult = {
        sent: false,
        reason:
          "The verification email could not be sent.",
      };
    }

    return res
      .status(201)
      .json({
        success: true,

        requiresEmailVerification:
          true,

        verificationEmailSent:
          Boolean(
            mailResult?.sent
          ),

        email,

        message:
          mailResult?.sent
            ? "Account created. Please check your email and click the verification link before signing in."
            : "Account created, but the verification email could not be sent. Please use Resend Verification Email.",
      });
  }
);

/* =========================================================
   VERIFY EMAIL

   Frontend verification page will call:

   GET /api/auth/verify-email?token=...
========================================================= */

router.get(
  "/verify-email",
  async (req, res) => {
    const rawToken =
      String(
        req.query.token || ""
      ).trim();

    if (!rawToken) {
      throw badRequest(
        "Verification token is required."
      );
    }

    const result =
      await emailVerification.verify(
        rawToken
      );

    if (!result.success) {
      if (
        result.reason ===
        "expired"
      ) {
        throw badRequest(
          "This verification link has expired. Please request a new verification email."
        );
      }

      throw badRequest(
        "This verification link is invalid or has already been used."
      );
    }

    await logActivity(
      result.userId,
      "auth.email_verified",
      "user",
      result.userId,
      null
    );

    return res.json({
      success: true,

      message:
        "Email verified successfully. You may now sign in to Zenora.",
    });
  }
);

/* =========================================================
   RESEND VERIFICATION EMAIL

   POST /api/auth/resend-verification

   Body:
   {
     "email": "example@gmail.com"
   }
========================================================= */

router.post(
  "/resend-verification",
  async (req, res) => {
    v.object(req.body);
    const email =
      v.email(
        req.body.email
      );

    const result =
      await emailVerification.resend(
        email
      );

    if (
      result.rateLimited
    ) {
      throw new HttpError(
        429,
        "Please wait one minute before requesting another verification email."
      );
    }

    /*
     * Unknown email OR already verified:
     * return the same generic response.
     *
     * This avoids revealing whether a particular
     * email address has a Zenora account.
     */
    if (
      result.alreadyVerified ||
      (
        result.success &&
        !result.sent
      )
    ) {
      return res.json({
        success: true,

        message:
          "If this email belongs to an unverified Zenora account, a verification link will be sent.",
      });
    }

    if (!result.sent) {
      throw new HttpError(
        503,
        result.reason ||
          "The verification email could not be sent."
      );
    }

    return res.json({
      success: true,

      message:
        "A new verification link has been sent. Please check your email.",
    });
  }
);

/* =========================================================
   LOGIN
   Shared by ALL roles.

   Guest
   Receptionist
   Massage Therapist
   Spa Manager

   Every role must have email_verified = 1.
========================================================= */

async function login(req, res) {
    const { email, password } = v.loginFields(req.body);

    const key =
      `${email}|${req.ip}`;

    if (
      isLocked(key)
    ) {
      throw new HttpError(
        429,
        "Too many failed attempts. Please try again in a few minutes."
      );
    }

    const result =
      await db.query(
        `
          SELECT
            u.*,
            r.name AS role
          FROM users u

          JOIN roles r
            ON r.id = u.role_id

          WHERE u.email = $1
          LIMIT 1
        `,
        [email]
      );

    const row =
      result.rows[0];

    /*
     * Compare even when the user is missing
     * so timing does not reveal which emails exist.
     */
    const valid =
      bcrypt.compareSync(
        password,
        row?.password_hash ||
          DUMMY_HASH
      );

    if (
      !row ||
      !valid ||
      !row.is_active ||
      (req.path === "/staff/login" && !["Spa Manager", "Receptionist", "Massage Therapist"].includes(row.role))
    ) {
      recordFailure(key);

      throw unauthorized(
        "Incorrect email or password."
      );
    }

    /*
     * Correct password but unverified email:
     * do NOT issue a JWT.
     */
    if (
      Number(
        row.email_verified
      ) !== 1
    ) {
      throw new HttpError(
        403,
        "Please verify your email address before signing in."
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

    return res.json({
      success: true,

      token:
        token.sign({
          sub: row.id,
        }),

      user:
        publicUser(row),
    });
}

router.post("/login", login);
router.post("/staff/login", login);

/* =========================================================
   CURRENT USER
========================================================= */

router.get(
  "/me",
  requireAuth,
  (req, res) => {
    return res.json({
      success: true,

      user:
        publicUser(
          req.user
        ),
    });
  }
);

/* =========================================================
   UPDATE CURRENT USER
========================================================= */

router.patch(
  "/me",
  requireAuth,
  async (req, res) => {
    const firstName =
      v.text(
        req.body.firstName ??
          req.user.first_name,

        "First name",
        {
          max: 80,
        }
      );

    const lastName =
      v.text(
        req.body.lastName ??
          req.user.last_name,

        "Last name",
        {
          max: 80,
        }
      );

    const phone =
      v.phone(
        req.body.phone ??
          req.user.phone,

        "Phone"
      );

    const client =
      await db.connect();

    try {
      await client.query(
        "BEGIN"
      );

      await client.query(
        `
          UPDATE users
          SET
            first_name = $1,
            last_name = $2,
            phone = $3,

            updated_at =
              to_char(
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

            updated_at =
              to_char(
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

      await client.query(
        "COMMIT"
      );
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      throw error;
    } finally {
      client.release();
    }

    return res.json({
      success: true,

      user:
        publicUser({
          ...req.user,

          first_name:
            firstName,

          last_name:
            lastName,

          phone,
        }),
    });
  }
);

module.exports = router;