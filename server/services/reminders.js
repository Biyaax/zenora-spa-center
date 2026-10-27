const db = require("../database/postgres");
const config = require("../config");
const time = require("../lib/time");
const appointments = require("./appointments");
const {
  notifyClient,
} = require("../lib/notify");
const {
  describe,
} = require("./guest");

/**
 * Sends one reminder for each confirmed appointment
 * that starts within the next reminderHoursBefore hours.
 * Safe to call repeatedly.
 */
async function sendDueReminders() {
  const now =
    time.nowInSpa();

  const nowMinutes =
    time.toMinutes(
      now.time
    );

  const result =
    await db.query(
      `
      SELECT id
      FROM appointments
      WHERE status = 'confirmed'
        AND reminder_sent_at IS NULL
        AND check_in_at IS NULL
        AND appointment_date BETWEEN $1 AND $2
      `,
      [
        now.date,
        time.addDays(
          now.date,
          2
        ),
      ]
    );

  let sent = 0;

  for (
    const { id }
    of result.rows
  ) {
    const appointment =
      await appointments.getById(
        id
      );

    if (!appointment) {
      continue;
    }

    const minutesAway =
      time.daysBetween(
        now.date,
        appointment.appointment_date
      ) *
        1440 +
      time.toMinutes(
        appointment.start_time
      ) -
      nowMinutes;

    if (
      minutesAway < 0 ||
      minutesAway >
        config.reminderHoursBefore *
          60
    ) {
      continue;
    }

    const clientResult =
      await db.query(
        `
        SELECT *
        FROM clients
        WHERE id = $1
        `,
        [
          appointment.client_id,
        ]
      );

    const client =
      clientResult.rows[0];

    if (!client) {
      continue;
    }

    await notifyClient(
      client,
      "reminder",
      "Appointment reminder",
      `Reminder: you have ${describe(appointment)} at ${config.spaName}. ` +
        `Need to change it? Log in and reschedule from My Account.`
    );

    await db.query(
      `
      UPDATE appointments
      SET reminder_sent_at = to_char(
        CURRENT_TIMESTAMP,
        'YYYY-MM-DD HH24:MI:SS'
      )
      WHERE id = $1
      `,
      [id]
    );

    sent++;
  }

  return sent;
}

function startReminderScheduler() {
  const run = async () => {
    try {
      const sent =
        await sendDueReminders();

      if (sent) {
        console.log(
          `[reminders] sent ${sent} reminder(s)`
        );
      }
    } catch (error) {
      console.error(
        "[reminders] failed:",
        error.message
      );
    }
  };

  // Run once immediately.
  void run();

  // Then run at the configured interval.
  return setInterval(
    () => {
      void run();
    },
    config.reminderCheckMinutes *
      60 *
      1000
  );
}

module.exports = {
  sendDueReminders,
  startReminderScheduler,
};