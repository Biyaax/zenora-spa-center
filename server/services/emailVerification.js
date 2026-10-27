const crypto = require("crypto");

const db = require("../database/postgres");
const config = require("../config");
const { sendMail } = require("../lib/mailer");

const VERIFY_MINUTES = 30;

/* =========================================
   TOKEN HELPERS
========================================= */

function generateToken() {
  return crypto
    .randomBytes(32)
    .toString("hex");
}

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(String(token))
    .digest("hex");
}

function getFrontendUrl() {
  return String(
    process.env.FRONTEND_URL ||
    config.clientUrl ||
    "http://localhost:5173"
  ).replace(/\/$/, "");
}

/* =========================================
   CREATE VERIFICATION TOKEN
========================================= */

async function createToken(
  queryable,
  userId
) {
  const rawToken =
    generateToken();

  const tokenHash =
    hashToken(rawToken);

  /*
   * Only one current verification link
   * should exist for a user.
   */
  await queryable.query(
    `
      DELETE FROM email_verification_tokens
      WHERE user_id = $1
    `,
    [userId]
  );

  await queryable.query(
    `
      INSERT INTO email_verification_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES (
        $1,
        $2,
        CURRENT_TIMESTAMP
          + INTERVAL '${VERIFY_MINUTES} minutes'
      )
    `,
    [
      userId,
      tokenHash,
    ]
  );

  return rawToken;
}

/* =========================================
   SEND VERIFICATION EMAIL
========================================= */

async function sendForUser({
  userId,
  email,
  firstName,
  accountType = "Zenora",
}) {
  const client =
    await db.connect();

  let rawToken;

  try {
    await client.query("BEGIN");

    rawToken =
      await createToken(
        client,
        userId
      );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }

  const verifyUrl =
    `${getFrontendUrl()}/verify-email` +
    `?token=${encodeURIComponent(
      rawToken
    )}`;

  const result =
    await sendMail({
      to: email,

      subject:
        "Verify your Zenora email address",

      text:
        `Hello ${firstName || "there"},\n\n` +
        `Your ${accountType} account has been created.\n\n` +
        `Before you can sign in, please verify your email address by opening this link:\n\n` +
        `${verifyUrl}\n\n` +
        `This verification link expires in ${VERIFY_MINUTES} minutes.\n\n` +
        `If you did not expect this account, you may ignore this email.\n\n` +
        `Zenora Spa & Massage Wellness Center`,
    });

  return {
    ...result,
    userId,
  };
}

/* =========================================
   VERIFY TOKEN
========================================= */

async function verify(rawToken) {
  if (
    typeof rawToken !== "string" ||
    rawToken.trim().length < 32
  ) {
    return {
      success: false,
      reason: "invalid",
    };
  }

  const tokenHash =
    hashToken(
      rawToken.trim()
    );

  const client =
    await db.connect();

  try {
    await client.query("BEGIN");

    const result =
      await client.query(
        `
          SELECT
            t.id,
            t.user_id,
            t.expires_at,
            u.email_verified
          FROM email_verification_tokens t

          JOIN users u
            ON u.id = t.user_id

          WHERE
            t.token_hash = $1

          LIMIT 1

          FOR UPDATE
        `,
        [tokenHash]
      );

    const row =
      result.rows[0];

    if (!row) {
      await client.query(
        "ROLLBACK"
      );

      return {
        success: false,
        reason: "invalid",
      };
    }

    if (
      new Date(
        row.expires_at
      ).getTime() <
      Date.now()
    ) {
      await client.query(
        `
          DELETE FROM email_verification_tokens
          WHERE user_id = $1
        `,
        [row.user_id]
      );

      await client.query(
        "COMMIT"
      );

      return {
        success: false,
        reason: "expired",
      };
    }

    /*
     * Mark the account as verified.
     */
    await client.query(
      `
        UPDATE users
        SET
          email_verified = 1,

          email_verified_at =
            to_char(
              CURRENT_TIMESTAMP,
              'YYYY-MM-DD HH24:MI:SS'
            ),

          updated_at =
            to_char(
              CURRENT_TIMESTAMP,
              'YYYY-MM-DD HH24:MI:SS'
            )

        WHERE id = $1
      `,
      [row.user_id]
    );

    /*
     * Verification links are one-time use.
     */
    await client.query(
      `
        DELETE FROM email_verification_tokens
        WHERE user_id = $1
      `,
      [row.user_id]
    );

    await client.query(
      "COMMIT"
    );

    return {
      success: true,
      userId:
        row.user_id,
    };
  } catch (error) {
    try {
      await client.query(
        "ROLLBACK"
      );
    } catch {
      // Ignore secondary rollback errors.
    }

    throw error;
  } finally {
    client.release();
  }
}

/* =========================================
   RESEND VERIFICATION
========================================= */

async function resend(email) {
  const normalizedEmail =
    String(email || "")
      .trim()
      .toLowerCase();

  const result =
    await db.query(
      `
        SELECT
          id,
          first_name,
          email,
          email_verified
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [normalizedEmail]
    );

  const user =
    result.rows[0];

  /*
   * Do not expose whether an email
   * actually has an account.
   */
  if (!user) {
    return {
      success: true,
      sent: false,
    };
  }

  if (
    Number(
      user.email_verified
    ) === 1
  ) {
    return {
      success: true,
      sent: false,
      alreadyVerified: true,
    };
  }

  /*
   * Prevent repeated resend spam.
   */
  const recentResult =
    await db.query(
      `
        SELECT created_at
        FROM email_verification_tokens
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [user.id]
    );

  const recent =
    recentResult.rows[0];

  if (
    recent &&
    Date.now() -
      new Date(
        recent.created_at
      ).getTime() <
      60 * 1000
  ) {
    return {
      success: false,
      rateLimited: true,
    };
  }

  const mailResult =
    await sendForUser({
      userId: user.id,

      email:
        user.email,

      firstName:
        user.first_name,

      accountType:
        "Zenora",
    });

  return {
    success: true,
    sent:
      mailResult.sent,
    reason:
      mailResult.reason,
  };
}

module.exports = {
  createToken,
  sendForUser,
  verify,
  resend,
};