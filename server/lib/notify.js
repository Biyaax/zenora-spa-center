const db = require("../database/db");
const { sendMail } = require("./mailer");

/** On-screen notification for one user. */
function notifyUser(userId, type, title, message) {
  if (!userId) return;

  db.prepare(
    `INSERT INTO notifications (user_id, type, title, message)
     VALUES (?, ?, ?, ?)`
  ).run(userId, type, title, message);
}

/** On-screen notification for every active user with a role. */
function notifyRole(roleName, type, title, message) {
  const users = db
    .prepare(
      `SELECT u.id
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE r.name = ? AND u.is_active = 1`
    )
    .all(roleName);

  for (const user of users) {
    notifyUser(user.id, type, title, message);
  }
}

/** On-screen notification (if the client has an account) plus email. */
function notifyClient(client, type, title, message) {
  if (client.user_id) {
    notifyUser(client.user_id, type, title, message);
  }

  if (client.email) {
    // Fire and forget: a failed email must never break the booking flow.
    void sendMail({ to: client.email, subject: title, text: message });
  }
}

function logActivity(userId, action, entityType, entityId, details) {
  db.prepare(
    `INSERT INTO activity_logs
       (user_id, action, entity_type, entity_id, details)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    userId ?? null,
    action,
    entityType ?? null,
    entityId ?? null,
    details ?? null
  );
}

module.exports = { notifyUser, notifyRole, notifyClient, logActivity };
