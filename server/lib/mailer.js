const config = require("../config");

let transporter;

function getTransporter() {
  if (transporter !== undefined) return transporter;

  transporter = null;

  if (!config.smtp.host) return transporter;

  try {
    // nodemailer is loaded lazily so the server still runs without it
    // when SMTP is not configured.
    const nodemailer = require("nodemailer");

    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user
        ? { user: config.smtp.user, pass: config.smtp.pass }
        : undefined,
    });
  } catch (error) {
    console.warn(
      "[mailer] SMTP_HOST is set but nodemailer could not be loaded:",
      error.message
    );
  }

  return transporter;
}

/**
 * Sends an email. Never throws: returns { sent, reason }.
 * Without SMTP settings, delivery is skipped without logging verification links.
 */
async function sendMail({ to, subject, text }) {
  if (!to) return { sent: false, reason: "No email address on file." };

  const active = getTransporter();

  if (!active) {
    console.warn("[email] SMTP is not configured; delivery was skipped.");
    return { sent: false, reason: "Email is not configured on the server." };
  }

  try {
    await active.sendMail({ from: config.smtp.from, to, subject, text });
    return { sent: true };
  } catch (error) {
    console.error("[mailer] Failed to send email:", error.message);
    return { sent: false, reason: "The email could not be sent." };
  }
}

module.exports = { sendMail };
