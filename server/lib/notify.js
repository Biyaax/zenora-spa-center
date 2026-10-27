const db = require("../database/postgres");
const { sendMail } = require("./mailer");

/** On-screen notification for one user. */
async function notifyUser(userId, type, title, message) {
  if (!userId) return;

  await db.query(
    `
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message
    )
    VALUES ($1, $2, $3, $4)
    `,
    [userId, type, title, message]
  );
}

/** On-screen notification for every active user with a role. */
async function notifyRole(roleName, type, title, message) {
  const result = await db.query(
    `
    SELECT u.id
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE r.name = $1
      AND u.is_active = 1
    `,
    [roleName]
  );

  for (const user of result.rows) {
    await notifyUser(user.id, type, title, message);
  }
}

/** On-screen notification (if the client has an account) plus email. */
async function notifyClient(client, type, title, message) {
  if (client.user_id) {
    await notifyUser(
      client.user_id,
      type,
      title,
      message
    );
  }

  if (client.email) {
    // Fire and forget: a failed email must never break the booking flow.
    sendMail({
      to: client.email,
      subject: title,
      text: message,
    }).catch((error) => {
      console.error("Failed to send notification email:", error);
    });
  }
}

async function logActivity(
  userId,
  action,
  entityType,
  entityId,
  details
) {
  await db.query(
    `
    INSERT INTO activity_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      details
    )
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      userId ?? null,
      action,
      entityType ?? null,
      entityId ?? null,
      details ?? null,
    ]
  );
}

module.exports = {
  notifyUser,
  notifyRole,
  notifyClient,
  logActivity,
};