const db = require("../database/db");
const config = require("../config");
const time = require("../lib/time");
const appointments = require("./appointments");
const { notifyClient } = require("../lib/notify");
const { describe } = require("./guest");

/**
 * Sends one reminder for each confirmed appointment that starts within the
 * next `reminderHoursBefore` hours. Safe to call repeatedly.
 */
function sendDueReminders() {
  const now = time.nowInSpa();
  const nowMinutes = time.toMinutes(now.time);

  const candidates = db
    .prepare(
      `SELECT id FROM appointments
       WHERE status = 'confirmed'
         AND reminder_sent_at IS NULL
         AND check_in_at IS NULL
         AND appointment_date BETWEEN ? AND ?`
    )
    .all(now.date, time.addDays(now.date, 2));

  let sent = 0;

  for (const { id } of candidates) {
    const appointment = appointments.getById(id);

    const minutesAway =
      time.daysBetween(now.date, appointment.appointment_date) * 1440 +
      time.toMinutes(appointment.start_time) -
      nowMinutes;

    if (minutesAway < 0 || minutesAway > config.reminderHoursBefore * 60) {
      continue;
    }

    const client = db
      .prepare("SELECT * FROM clients WHERE id = ?")
      .get(appointment.client_id);

    notifyClient(
      client,
      "reminder",
      "Appointment reminder",
      `Reminder: you have ${describe(appointment)} at ${config.spaName}. ` +
        `Need to change it? Log in and reschedule from My Account.`
    );

    db.prepare(
      "UPDATE appointments SET reminder_sent_at = datetime('now') WHERE id = ?"
    ).run(id);

    sent++;
  }

  return sent;
}

function startReminderScheduler() {
  const run = () => {
    try {
      const sent = sendDueReminders();
      if (sent) console.log(`[reminders] sent ${sent} reminder(s)`);
    } catch (error) {
      console.error("[reminders] failed:", error.message);
    }
  };

  run();

  return setInterval(run, config.reminderCheckMinutes * 60 * 1000);
}

module.exports = { sendDueReminders, startReminderScheduler };
