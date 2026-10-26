const db = require("../database/db");
const availability = require("./availability");
const appointments = require("./appointments");
const { notFound, conflict } = require("../lib/errors");
const { notifyRole, notifyClient, logActivity } = require("../lib/notify");
const v = require("../lib/validate");

/** The client record that belongs to a logged-in guest (created on demand). */
function clientForUser(user) {
  let client = db
    .prepare("SELECT * FROM clients WHERE user_id = ?")
    .get(user.id);

  if (!client) {
    const info = db
      .prepare(
        `INSERT INTO clients (user_id, first_name, last_name, email, phone)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(user.id, user.first_name, user.last_name, user.email, user.phone ?? null);

    client = db
      .prepare("SELECT * FROM clients WHERE id = ?")
      .get(info.lastInsertRowid);
  }

  return client;
}

/** Runs `fn` atomically; turns a slot-index violation into a friendly 409. */
function atomically(fn) {
  try {
    return db.transaction(fn)();
  } catch (error) {
    if (String(error.code || "").startsWith("SQLITE_CONSTRAINT")) {
      throw conflict(
        "That time was just taken by someone else. Please pick another time."
      );
    }
    throw error;
  }
}

function describe(a) {
  return `${a.service_name} with ${a.therapist_name} on ${a.appointment_date} at ${a.start_time}`;
}

/* ---------- Book ---------- */

function book(user, body) {
  const serviceId = v.id(body.serviceId, "Service");
  const therapistId = v.optionalId(body.therapistId, "Therapist");
  const specialRequest = v.text(body.specialRequest, "Special request", {
    required: false,
    max: 500,
  });

  const client = clientForUser(user);

  const id = atomically(() => {
    const slot = availability.resolveBooking({
      serviceId,
      therapistId,
      date: body.date,
      start: body.start,
      clientId: client.id,
    });

    return db
      .prepare(
        `INSERT INTO appointments
           (client_id, service_id, therapist_id, appointment_date,
            start_time, end_time, status, booking_source,
            special_request, amount_due, created_by)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', 'online', ?, ?, ?)`
      )
      .run(
        client.id,
        serviceId,
        slot.therapistId,
        body.date,
        slot.start,
        slot.end,
        specialRequest,
        slot.service.price,
        user.id
      ).lastInsertRowid;
  });

  const appointment = appointments.mustGet(id);

  notifyClient(
    client,
    "booking_received",
    "Booking request received",
    `We received your request for ${describe(appointment)}. ` +
      `The front desk will confirm it shortly.`
  );

  notifyRole(
    "Receptionist",
    "booking_request",
    "New online booking request",
    `${appointment.client_name} requested ${describe(appointment)}.`
  );

  logActivity(user.id, "booking.create", "appointment", id, describe(appointment));

  return appointment;
}

/* ---------- View ---------- */

function listMine(user) {
  const client = clientForUser(user);

  const all = appointments.list(
    "WHERE a.client_id = ?",
    [client.id],
    "a.appointment_date DESC, a.start_time DESC"
  );

  return {
    upcoming: all
      .filter((a) => a.is_upcoming)
      .sort((a, b) =>
        `${a.appointment_date} ${a.start_time}`.localeCompare(
          `${b.appointment_date} ${b.start_time}`
        )
      ),
    history: all.filter((a) => !a.is_upcoming),
  };
}

function ownedAppointment(user, id) {
  const client = clientForUser(user);
  const appointment = appointments.mustGet(id);

  // Same message for "not yours" and "does not exist".
  if (appointment.client_id !== client.id) {
    throw notFound("Appointment not found.");
  }

  return appointment;
}

/* ---------- Reschedule ---------- */

function reschedule(user, id, body) {
  const current = ownedAppointment(user, id);

  if (!current.can_modify) {
    throw conflict("This appointment can no longer be rescheduled.");
  }

  const therapistId = v.optionalId(body.therapistId, "Therapist");

  atomically(() => {
    const slot = availability.resolveBooking({
      serviceId: current.service_id,
      therapistId,
      date: body.date,
      start: body.start,
      clientId: current.client_id,
      excludeAppointmentId: current.id,
      // Keep the same therapist whenever they are free.
      preferTherapistIds: [current.therapist_id],
    });

    db.prepare(
      `UPDATE appointments
       SET appointment_date = ?, start_time = ?, end_time = ?,
           therapist_id = ?,
           status = 'pending',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(body.date, slot.start, slot.end, slot.therapistId, current.id);
  });

  const updated = appointments.mustGet(current.id);
  const client = clientForUser(user);

  notifyClient(
    client,
    "booking_rescheduled",
    "Reschedule request received",
    `Your booking was moved to ${describe(updated)}. ` +
      `It is awaiting confirmation from the front desk.`
  );

  notifyRole(
    "Receptionist",
    "booking_request",
    "Booking rescheduled by guest",
    `${updated.client_name} moved a booking to ${describe(updated)}. Please re-confirm it.`
  );

  logActivity(user.id, "booking.reschedule", "appointment", current.id, describe(updated));

  return updated;
}

/** Open times for moving one of my bookings (ignores the booking itself). */
function slotsForReschedule(user, id, date, therapistId) {
  const current = ownedAppointment(user, id);

  const result = availability.getSlots({
    serviceId: current.service_id,
    therapistId,
    date,
    excludeAppointmentId: current.id,
  });

  return result;
}

/* ---------- Cancel ---------- */

function cancel(user, id, body = {}) {
  const current = ownedAppointment(user, id);

  if (!current.can_modify) {
    throw conflict("This appointment can no longer be cancelled.");
  }

  const reason = v.text(body.reason, "Reason", { required: false, max: 200 });

  db.prepare(
    `UPDATE appointments
     SET status = 'cancelled', cancel_reason = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(reason ? `Cancelled by guest: ${reason}` : "Cancelled by guest", current.id);

  const updated = appointments.mustGet(current.id);

  notifyClient(
    clientForUser(user),
    "booking_cancelled",
    "Booking cancelled",
    `Your booking for ${describe(updated)} has been cancelled.`
  );

  notifyRole(
    "Receptionist",
    "booking_cancelled",
    "Booking cancelled by guest",
    `${updated.client_name} cancelled ${describe(updated)}.`
  );

  logActivity(user.id, "booking.cancel", "appointment", current.id, describe(updated));

  return updated;
}

/* ---------- Notifications ---------- */

function listNotifications(user) {
  const items = db
    .prepare(
      `SELECT id, type, title, message, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 50`
    )
    .all(user.id);

  const unread = db
    .prepare(
      "SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0"
    )
    .get(user.id).n;

  return { items, unread };
}

function markRead(user, id) {
  const result = db
    .prepare(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?"
    )
    .run(id, user.id);

  if (result.changes === 0) throw notFound("Notification not found.");
}

function markAllRead(user) {
  db.prepare(
    "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0"
  ).run(user.id);
}

module.exports = {
  clientForUser,
  atomically,
  describe,
  book,
  listMine,
  reschedule,
  slotsForReschedule,
  cancel,
  listNotifications,
  markRead,
  markAllRead,
};
