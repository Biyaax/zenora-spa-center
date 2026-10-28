const db = require("../database/postgres");
const availability = require("./availability");
const appointments = require("./appointments");
const { notFound, conflict } = require("../lib/errors");
const {
  notifyRole,
  notifyClient,
  logActivity,
} = require("../lib/notify");
const v = require("../lib/validate");

/**
 * The client record that belongs to a logged-in guest.
 * Creates one on demand if it does not exist yet.
 */
async function clientForUser(user, queryable = db) {
  let result = await queryable.query(
    `
    SELECT *
    FROM clients
    WHERE user_id = $1
    `,
    [user.id]
  );

  if (result.rows[0]) {
    return result.rows[0];
  }

  const inserted = await queryable.query(
    `
    INSERT INTO clients (
      user_id,
      first_name,
      last_name,
      email,
      phone
    )
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING *
    `,
    [
      user.id,
      user.first_name,
      user.last_name,
      user.email,
      user.phone ?? null,
    ]
  );

  if (inserted.rows[0]) {
    return inserted.rows[0];
  }

  // Another request may have created it at the same time.
  result = await queryable.query(
    `
    SELECT *
    FROM clients
    WHERE user_id = $1
    `,
    [user.id]
  );

  return result.rows[0];
}

/**
 * Runs fn inside a PostgreSQL transaction.
 * Converts a slot unique-constraint violation into a friendly 409.
 *
 * fn receives the PostgreSQL transaction client.
 */
async function atomically(fn) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    // Serialize booking/reschedule checks and writes across API instances.
    // This also covers reception bookings, which share this transaction helper.
    // The lock releases automatically on COMMIT or ROLLBACK.
    await client.query("SELECT pg_advisory_xact_lock(724016, 1)");

    const result = await fn(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");

    // PostgreSQL unique_violation
    if (error.code === "23505") {
      throw conflict(
        "That time was just taken by someone else. Please pick another time."
      );
    }

    throw error;
  } finally {
    client.release();
  }
}

function describe(a) {
  return `${a.service_name} with ${a.therapist_name} on ${a.appointment_date} at ${a.start_time}`;
}

/* ---------- Book ---------- */

async function book(user, body) {
  v.object(body);
  const serviceId = v.id(
    body.serviceId,
    "Service"
  );

  const therapistId = v.optionalId(
    body.therapistId,
    "Therapist"
  );

  const specialRequest = v.text(
    body.specialRequest,
    "Special request",
    {
      required: false,
      max: 500,
    }
  );

  const client = await clientForUser(user);

  const id = await atomically(
    async (transaction) => {
      const slot =
        await availability.resolveBooking({
          serviceId,
          therapistId,
          date: body.date,
          start: body.start,
          clientId: client.id,
          queryable: transaction,
        });

      const result =
        await transaction.query(
          `
          INSERT INTO appointments (
            client_id,
            service_id,
            therapist_id,
            appointment_date,
            start_time,
            end_time,
            status,
            booking_source,
            special_request,
            amount_due,
            created_by
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            'pending',
            'online',
            $7,
            $8,
            $9
          )
          RETURNING id
          `,
          [
            client.id,
            serviceId,
            slot.therapistId,
            body.date,
            slot.start,
            slot.end,
            specialRequest,
            slot.service.price,
            user.id,
          ]
        );

      return result.rows[0].id;
    }
  );

  const appointment =
    await appointments.mustGet(id);

  await notifyClient(
    client,
    "booking_received",
    "Booking request received",
    `We received your request for ${describe(appointment)}. ` +
      `The front desk will confirm it shortly.`
  );

  await notifyRole(
    "Receptionist",
    "booking_request",
    "New online booking request",
    `${appointment.client_name} requested ${describe(appointment)}.`
  );

  await logActivity(
    user.id,
    "booking.create",
    "appointment",
    id,
    describe(appointment)
  );

  return appointment;
}

/* ---------- View ---------- */

async function listMine(user) {
  const client =
    await clientForUser(user);

  const all =
    await appointments.list(
      "WHERE a.client_id = $1",
      [client.id],
      "a.appointment_date DESC, a.start_time DESC"
    );

  return {
    upcoming: all
      .filter(
        (appointment) =>
          appointment.is_upcoming
      )
      .sort((a, b) =>
        `${a.appointment_date} ${a.start_time}`.localeCompare(
          `${b.appointment_date} ${b.start_time}`
        )
      ),

    history: all.filter(
      (appointment) =>
        !appointment.is_upcoming
    ),
  };
}

async function ownedAppointment(
  user,
  id
) {
  const client =
    await clientForUser(user);

  const appointment =
    await appointments.mustGet(id);

  // Same message for "not yours" and "does not exist".
  if (
    appointment.client_id !==
    client.id
  ) {
    throw notFound(
      "Appointment not found."
    );
  }

  return appointment;
}

/* ---------- Reschedule ---------- */

async function reschedule(
  user,
  id,
  body
) {
  const current =
    await ownedAppointment(
      user,
      id
    );

  if (!current.can_modify) {
    throw conflict(
      "This appointment can no longer be rescheduled."
    );
  }

  const therapistId =
    v.optionalId(
      body.therapistId,
      "Therapist"
    );

  await atomically(
    async (transaction) => {
      const slot =
        await availability.resolveBooking({
          serviceId:
            current.service_id,

          therapistId,

          date:
            body.date,

          start:
            body.start,

          clientId:
            current.client_id,

          excludeAppointmentId:
            current.id,

          // Keep the same therapist whenever they are free.
          preferTherapistIds: [
            current.therapist_id,
          ],

          queryable:
            transaction,
        });

      await transaction.query(
        `
        UPDATE appointments
        SET
          appointment_date = $1,
          start_time = $2,
          end_time = $3,
          therapist_id = $4,
          status = 'pending',
          updated_at = to_char(
            CURRENT_TIMESTAMP,
            'YYYY-MM-DD HH24:MI:SS'
          )
        WHERE id = $5
        `,
        [
          body.date,
          slot.start,
          slot.end,
          slot.therapistId,
          current.id,
        ]
      );
    }
  );

  const updated =
    await appointments.mustGet(
      current.id
    );

  const client =
    await clientForUser(user);

  await notifyClient(
    client,
    "booking_rescheduled",
    "Reschedule request received",
    `Your booking was moved to ${describe(updated)}. ` +
      `It is awaiting confirmation from the front desk.`
  );

  await notifyRole(
    "Receptionist",
    "booking_request",
    "Booking rescheduled by guest",
    `${updated.client_name} moved a booking to ${describe(updated)}. Please re-confirm it.`
  );

  await logActivity(
    user.id,
    "booking.reschedule",
    "appointment",
    current.id,
    describe(updated)
  );

  return updated;
}

/**
 * Open times for moving one of my bookings
 * (ignores the booking itself).
 */
async function slotsForReschedule(
  user,
  id,
  date,
  therapistId
) {
  const current =
    await ownedAppointment(
      user,
      id
    );

  return availability.getSlots({
    serviceId:
      current.service_id,

    therapistId,

    date,

    excludeAppointmentId:
      current.id,
  });
}

/* ---------- Cancel ---------- */

async function cancel(
  user,
  id,
  body = {}
) {
  const current =
    await ownedAppointment(
      user,
      id
    );

  if (!current.can_modify) {
    throw conflict(
      "This appointment can no longer be cancelled."
    );
  }

  const reason = v.text(
    body.reason,
    "Reason",
    {
      required: false,
      max: 200,
    }
  );

  await db.query(
    `
    UPDATE appointments
    SET
      status = 'cancelled',
      cancel_reason = $1,
      updated_at = to_char(
        CURRENT_TIMESTAMP,
        'YYYY-MM-DD HH24:MI:SS'
      )
    WHERE id = $2
    `,
    [
      reason
        ? `Cancelled by guest: ${reason}`
        : "Cancelled by guest",

      current.id,
    ]
  );

  const updated =
    await appointments.mustGet(
      current.id
    );

  await notifyClient(
    await clientForUser(user),
    "booking_cancelled",
    "Booking cancelled",
    `Your booking for ${describe(updated)} has been cancelled.`
  );

  await notifyRole(
    "Receptionist",
    "booking_cancelled",
    "Booking cancelled by guest",
    `${updated.client_name} cancelled ${describe(updated)}.`
  );

  await logActivity(
    user.id,
    "booking.cancel",
    "appointment",
    current.id,
    describe(updated)
  );

  return updated;
}

/* ---------- Notifications ---------- */

async function listNotifications(
  user
) {
  const itemsResult =
    await db.query(
      `
      SELECT
        id,
        type,
        title,
        message,
        is_read,
        created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY id DESC
      LIMIT 50
      `,
      [user.id]
    );

  const unreadResult =
    await db.query(
      `
      SELECT COUNT(*)::INTEGER AS n
      FROM notifications
      WHERE user_id = $1
        AND is_read = 0
      `,
      [user.id]
    );

  return {
    items: itemsResult.rows,
    unread:
      unreadResult.rows[0].n,
  };
}

async function markRead(
  user,
  id
) {
  const result =
    await db.query(
      `
      UPDATE notifications
      SET is_read = 1
      WHERE id = $1
        AND user_id = $2
      `,
      [
        id,
        user.id,
      ]
    );

  if (result.rowCount === 0) {
    throw notFound(
      "Notification not found."
    );
  }
}

async function markAllRead(user) {
  await db.query(
    `
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = $1
      AND is_read = 0
    `,
    [user.id]
  );
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