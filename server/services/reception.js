const db = require("../database/postgres");
const config = require("../config");
const time = require("../lib/time");
const availability = require("./availability");
const appointments = require("./appointments");
const guest = require("./guest");
const { sendMail } = require("../lib/mailer");
const {
  badRequest,
  notFound,
  conflict,
} = require("../lib/errors");
const {
  notifyClient,
  logActivity,
} = require("../lib/notify");
const v = require("../lib/validate");

const describe = guest.describe;

const PAYMENT_METHODS = [
  "cash",
  "gcash",
  "card",
  "bank transfer",
  "other",
];

/* =========================
   CALENDAR
========================= */

async function calendar({
  from,
  to,
  therapistId,
  status,
}) {
  if (
    !time.isDate(from) ||
    !time.isDate(to)
  ) {
    throw badRequest(
      "Please provide a valid date range."
    );
  }

  const span =
    time.daysBetween(from, to);

  if (span < 0) {
    throw badRequest(
      "The end date is before the start date."
    );
  }

  if (span > 31) {
    throw badRequest(
      "Please choose a range of 31 days or fewer."
    );
  }

  const clauses = [
    "a.appointment_date BETWEEN $1 AND $2",
  ];

  const params = [from, to];

  if (therapistId) {
    params.push(
      v.id(
        therapistId,
        "Therapist"
      )
    );

    clauses.push(
      `a.therapist_id = $${params.length}`
    );
  }

  if (status) {
    params.push(status);

    clauses.push(
      `a.status = $${params.length}`
    );
  }

  return appointments.list(
    `WHERE ${clauses.join(" AND ")}`,
    params
  );
}

/** Pending online requests, oldest appointment first. */
async function pendingRequests() {
  return appointments.list(
    "WHERE a.status = 'pending'",
    [],
    "a.appointment_date, a.start_time"
  );
}

/* =========================
   CONFIRM / DECLINE
========================= */

async function clientOf(
  appointment,
  queryable = db
) {
  const result =
    await queryable.query(
      `
      SELECT *
      FROM clients
      WHERE id = $1
      `,
      [
        appointment.client_id,
      ]
    );

  return result.rows[0];
}

async function confirm(user, id) {
  const appointment =
    await appointments.mustGet(id);

  if (
    appointment.status !== "pending"
  ) {
    throw conflict(
      "Only pending booking requests can be confirmed."
    );
  }

  await db.query(
    `
    UPDATE appointments
    SET
      status = 'confirmed',
      updated_at = to_char(
        CURRENT_TIMESTAMP,
        'YYYY-MM-DD HH24:MI:SS'
      )
    WHERE id = $1
    `,
    [id]
  );

  await notifyClient(
    await clientOf(appointment),
    "booking_confirmed",
    "Your booking is confirmed",
    `Good news! Your booking for ${describe(appointment)} is confirmed. ` +
      `Please arrive a few minutes early. See you at ${config.spaName}.`
  );

  await logActivity(
    user.id,
    "booking.confirm",
    "appointment",
    id,
    describe(appointment)
  );

  return appointments.mustGet(id);
}

async function decline(
  user,
  id,
  body = {}
) {
  const appointment =
    await appointments.mustGet(id);

  if (
    appointment.status !== "pending"
  ) {
    throw conflict(
      "Only pending booking requests can be declined."
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
        ? `Declined: ${reason}`
        : "Declined by the spa",
      id,
    ]
  );

  await notifyClient(
    await clientOf(appointment),
    "booking_declined",
    "Booking request declined",
    `Sorry, we could not accommodate your request for ${describe(appointment)}.` +
      (reason
        ? ` Reason: ${reason}.`
        : "") +
      ` Please choose another time and book again.`
  );

  await logActivity(
    user.id,
    "booking.decline",
    "appointment",
    id,
    describe(appointment)
  );

  return appointments.mustGet(id);
}

/* =========================
   WALK-INS / BOOK ON BEHALF
========================= */

async function resolveClient(
  input = {},
  queryable = db
) {
  if (input.id) {
    const result =
      await queryable.query(
        `
        SELECT *
        FROM clients
        WHERE id = $1
        `,
        [
          v.id(
            input.id,
            "Client"
          ),
        ]
      );

    const client =
      result.rows[0];

    if (!client) {
      throw notFound(
        "Client not found."
      );
    }

    return client;
  }

  const firstName = v.text(
    input.firstName,
    "First name",
    { max: 80 }
  );

  const lastName = v.text(
    input.lastName,
    "Last name",
    { max: 80 }
  );

  const email = v.email(
    input.email,
    "Email",
    { required: false }
  );

  const phone = v.phone(
    input.phone,
    "Phone"
  );

  if (email) {
    const existingResult =
      await queryable.query(
        `
        SELECT id
        FROM clients
        WHERE lower(email) = lower($1)
        `,
        [email]
      );

    const existing =
      existingResult.rows[0];

    if (existing) {
      throw conflict(
        "A client with this email already exists. Search for them and select their record.",
        {
          clientId:
            existing.id,
        }
      );
    }
  }

  const notes = v.text(
    input.notes,
    "Notes",
    {
      required: false,
      max: 500,
    }
  );

  const inserted =
    await queryable.query(
      `
      INSERT INTO clients (
        first_name,
        last_name,
        email,
        phone,
        notes
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        firstName,
        lastName,
        email,
        phone,
        notes,
      ]
    );

  return inserted.rows[0];
}

/**
 * type "walk-in"     -> the client is here now (today only)
 * type "reservation" -> booked on behalf of a guest (phone call, etc.)
 * Staff bookings are confirmed immediately.
 */
async function createBooking(
  user,
  body
) {
  const type =
    body.type === "walk-in"
      ? "walk-in"
      : "reservation";

  const serviceId = v.id(
    body.serviceId,
    "Service"
  );

  const therapistId =
    v.optionalId(
      body.therapistId,
      "Therapist"
    );

  const specialRequest =
    v.text(
      body.specialRequest,
      "Special request",
      {
        required: false,
        max: 500,
      }
    );

  if (
    type === "walk-in" &&
    body.date !==
      time.nowInSpa().date
  ) {
    throw badRequest(
      "Walk-in clients must be booked for today."
    );
  }

  const result =
    await guest.atomically(
      async (transaction) => {
        const client =
          await resolveClient(
            body.client,
            transaction
          );

        const slot =
          await availability.resolveBooking({
            serviceId,
            therapistId,
            date: body.date,
            start: body.start,
            clientId:
              client.id,
            forStaff: true,
            queryable:
              transaction,
          });

        const checkIn =
          type === "walk-in" &&
          body.checkInNow;

        const insertResult =
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
              check_in_at,
              created_by
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              'confirmed',
              $7,
              $8,
              $9,
              CASE
                WHEN $10 = 1
                THEN to_char(
                  CURRENT_TIMESTAMP,
                  'YYYY-MM-DD HH24:MI:SS'
                )
                ELSE NULL
              END,
              $11
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
              type === "walk-in"
                ? "walk-in"
                : "receptionist",
              specialRequest,
              slot.service.price,
              checkIn ? 1 : 0,
              user.id,
            ]
          );

        return {
          id:
            insertResult.rows[0]
              .id,
          client,
        };
      }
    );

  const appointment =
    await appointments.mustGet(
      result.id
    );

  if (type === "reservation") {
    await notifyClient(
      result.client,
      "booking_confirmed",
      "Your booking is confirmed",
      `The front desk booked ${describe(appointment)} for you. See you at ${config.spaName}.`
    );
  }

  await logActivity(
    user.id,
    type === "walk-in"
      ? "booking.walk-in"
      : "booking.on-behalf",
    "appointment",
    result.id,
    describe(appointment)
  );

  return appointment;
}

/* =========================
   CHECK-IN / CHECK-OUT
========================= */

async function checkIn(user, id) {
  const appointment =
    await appointments.mustGet(id);

  if (
    appointment.status !==
    "confirmed"
  ) {
    throw conflict(
      appointment.status ===
        "pending"
        ? "Confirm this booking before checking the client in."
        : "Only confirmed bookings can be checked in."
    );
  }

  if (appointment.check_in_at) {
    throw conflict(
      "This client is already checked in."
    );
  }

  if (
    appointment.appointment_date !==
    time.nowInSpa().date
  ) {
    throw conflict(
      "Clients can only be checked in on the day of the appointment."
    );
  }

  await db.query(
    `
    UPDATE appointments
    SET
      check_in_at = to_char(
        CURRENT_TIMESTAMP,
        'YYYY-MM-DD HH24:MI:SS'
      ),
      updated_at = to_char(
        CURRENT_TIMESTAMP,
        'YYYY-MM-DD HH24:MI:SS'
      )
    WHERE id = $1
    `,
    [id]
  );

  await logActivity(
    user.id,
    "booking.check-in",
    "appointment",
    id,
    describe(appointment)
  );

  return appointments.mustGet(id);
}

async function checkOut(user, id) {
  const appointment =
    await appointments.mustGet(id);

  if (
    !appointment.check_in_at
  ) {
    throw conflict(
      "Check the client in first."
    );
  }

  if (
    appointment.check_out_at
  ) {
    throw conflict(
      "This client is already checked out."
    );
  }

  if (
    ![
      "confirmed",
      "ongoing",
      "completed",
    ].includes(
      appointment.status
    )
  ) {
    throw conflict(
      "This booking cannot be checked out."
    );
  }

  await db.query(
    `
    UPDATE appointments
    SET
      check_out_at = to_char(
        CURRENT_TIMESTAMP,
        'YYYY-MM-DD HH24:MI:SS'
      ),
      status = 'completed',
      updated_at = to_char(
        CURRENT_TIMESTAMP,
        'YYYY-MM-DD HH24:MI:SS'
      )
    WHERE id = $1
    `,
    [id]
  );

  await logActivity(
    user.id,
    "booking.check-out",
    "appointment",
    id,
    describe(appointment)
  );

  return appointments.mustGet(id);
}

/* =========================
   PAYMENTS & RECEIPTS
========================= */

const receiptNumber =
  (paymentId) =>
    `ZEN-${String(
      paymentId
    ).padStart(6, "0")}`;

async function buildReceipt(
  paymentId
) {
  const paymentResult =
    await db.query(
      `
      SELECT
        p.*,
        u.first_name || ' ' || u.last_name AS cashier_name
      FROM payments p
      JOIN users u
        ON u.id = p.recorded_by
      WHERE p.id = $1
      `,
      [paymentId]
    );

  const payment =
    paymentResult.rows[0];

  if (!payment) {
    throw notFound(
      "Payment not found."
    );
  }

  const appointment =
    await appointments.mustGet(
      payment.appointment_id
    );

  // Totals as of this payment, so reprinting an old receipt is accurate.
  const paidResult =
    await db.query(
      `
      SELECT
        COALESCE(
          SUM(amount),
          0
        ) AS total
      FROM payments
      WHERE appointment_id = $1
        AND id <= $2
      `,
      [
        payment.appointment_id,
        payment.id,
      ]
    );

  const paidSoFar =
    Number(
      paidResult.rows[0]
        .total || 0
    );

  const amountDue =
    Number(
      appointment.amount_due ||
        0
    );

  return {
    receipt_number:
      receiptNumber(payment.id),

    spa_name:
      config.spaName,

    payment: {
      id: payment.id,

      amount:
        Number(
          payment.amount ||
            0
        ),

      method:
        payment.payment_method,

      reference_number:
        payment.reference_number,

      paid_at:
        payment.paid_at,

      cashier_name:
        payment.cashier_name,
    },

    appointment: {
      id:
        appointment.id,

      service_name:
        appointment.service_name,

      therapist_name:
        appointment.therapist_name,

      appointment_date:
        appointment.appointment_date,

      start_time:
        appointment.start_time,

      end_time:
        appointment.end_time,
    },

    client: {
      name:
        appointment.client_name,

      email:
        appointment.client_email,
    },

    amount_due:
      amountDue,

    paid_to_date:
      Math.round(
        paidSoFar * 100
      ) / 100,

    balance:
      Math.max(
        Math.round(
          (
            amountDue -
            paidSoFar
          ) * 100
        ) / 100,
        0
      ),
  };
}

async function recordPayment(
  user,
  id,
  body
) {
  const appointment =
    await appointments.mustGet(id);

  if (
    ![
      "confirmed",
      "ongoing",
      "completed",
    ].includes(
      appointment.status
    )
  ) {
    throw conflict(
      appointment.status ===
        "pending"
        ? "Confirm this booking before recording a payment."
        : "Payments cannot be recorded for a cancelled or no-show booking."
    );
  }

  const amount =
    Math.round(
      Number(body.amount) *
        100
    ) / 100;

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw badRequest(
      "Enter a payment amount greater than zero."
    );
  }

  if (
    amount >
    appointment.balance
  ) {
    throw badRequest(
      `The amount is more than the remaining balance (₱${appointment.balance.toFixed(
        2
      )}).`
    );
  }

  const method =
    String(
      body.method ||
        "cash"
    ).toLowerCase();

  if (
    !PAYMENT_METHODS.includes(
      method
    )
  ) {
    throw badRequest(
      "Please choose a valid payment method."
    );
  }

  const reference = v.text(
    body.reference,
    "Reference number",
    {
      required: false,
      max: 60,
    }
  );

  const insertResult =
    await db.query(
      `
      INSERT INTO payments (
        appointment_id,
        amount,
        payment_method,
        reference_number,
        recorded_by
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [
        id,
        amount,
        method,
        reference,
        user.id,
      ]
    );

  const paymentId =
    insertResult.rows[0].id;

  await logActivity(
    user.id,
    "payment.record",
    "payment",
    paymentId,
    `₱${amount.toFixed(
      2
    )} (${method}) for appointment #${id}`
  );

  return {
    appointment:
      await appointments.mustGet(
        id
      ),

    receipt:
      await buildReceipt(
        paymentId
      ),
  };
}

async function listPayments(
  appointmentId
) {
  await appointments.mustGet(
    appointmentId
  );

  const result =
    await db.query(
      `
      SELECT id
      FROM payments
      WHERE appointment_id = $1
      ORDER BY id
      `,
      [appointmentId]
    );

  return Promise.all(
    result.rows.map(
      (row) =>
        buildReceipt(row.id)
    )
  );
}

function receiptText(receipt) {
  const peso =
    (n) =>
      `PHP ${Number(
        n
      ).toFixed(2)}`;

  return [
    receipt.spa_name,

    `Official Receipt ${receipt.receipt_number}`,

    "",

    `Client:    ${receipt.client.name}`,

    `Service:   ${receipt.appointment.service_name}`,

    `Therapist: ${receipt.appointment.therapist_name}`,

    `Date:      ${receipt.appointment.appointment_date} ${receipt.appointment.start_time}`,

    "",

    `Amount paid:  ${peso(
      receipt.payment.amount
    )} (${receipt.payment.method})`,

    receipt.payment
      .reference_number
      ? `Reference:    ${receipt.payment.reference_number}`
      : null,

    `Total due:     ${peso(
      receipt.amount_due
    )}`,

    `Paid to date: ${peso(
      receipt.paid_to_date
    )}`,

    `Balance:      ${peso(
      receipt.balance
    )}`,

    "",

    `Received by ${receipt.payment.cashier_name}. Thank you!`,
  ]
    .filter(
      (line) =>
        line !== null
    )
    .join("\n");
}

async function sendReceipt(
  user,
  paymentId
) {
  const receipt =
    await buildReceipt(
      paymentId
    );

  const appointment =
    await appointments.mustGet(
      receipt.appointment.id
    );

  const client =
    await clientOf(
      appointment
    );

  if (!client.email) {
    throw badRequest(
      "This client has no email address on file."
    );
  }

  const result =
    await sendMail({
      to:
        client.email,

      subject:
        `Your receipt ${receipt.receipt_number} - ${config.spaName}`,

      text:
        receiptText(receipt),
    });

  // Account holders can also see the receipt on screen.
  await notifyClient(
    {
      user_id:
        client.user_id,

      email:
        null,
    },
    "receipt",
    `Receipt ${receipt.receipt_number}`,
    receiptText(receipt)
  );

  await logActivity(
    user.id,
    "receipt.send",
    "payment",
    paymentId,
    client.email
  );

  return result;
}

/* =========================
   CLIENT RECORDS
========================= */

async function searchClients(q) {
  const term =
    `%${String(
      q || ""
    )
      .trim()
      .toLowerCase()}%`;

  const result =
    await db.query(
      `
      SELECT
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.notes,

        CASE
          WHEN c.user_id IS NOT NULL
          THEN 1
          ELSE 0
        END AS has_account,

        (
          SELECT COUNT(*)::INTEGER
          FROM appointments a
          WHERE a.client_id = c.id
        ) AS visits

      FROM clients c

      WHERE
        lower(
          c.first_name ||
          ' ' ||
          c.last_name
        ) LIKE $1

        OR lower(
          COALESCE(
            c.email,
            ''
          )
        ) LIKE $1

        OR lower(
          COALESCE(
            c.phone,
            ''
          )
        ) LIKE $1

      ORDER BY
        c.last_name,
        c.first_name

      LIMIT 30
      `,
      [term]
    );

  return result.rows;
}

async function getClient(id) {
  const result =
    await db.query(
      `
      SELECT
        c.*,

        CASE
          WHEN c.user_id IS NOT NULL
          THEN 1
          ELSE 0
        END AS has_account

      FROM clients c
      WHERE c.id = $1
      `,
      [id]
    );

  const client =
    result.rows[0];

  if (!client) {
    throw notFound(
      "Client not found."
    );
  }

  return {
    ...client,

    appointments:
      await appointments.list(
        "WHERE a.client_id = $1",
        [id],
        "a.appointment_date DESC, a.start_time DESC"
      ),
  };
}

async function updateClient(
  user,
  id,
  body
) {
  const result =
    await db.query(
      `
      SELECT *
      FROM clients
      WHERE id = $1
      `,
      [id]
    );

  const client =
    result.rows[0];

  if (!client) {
    throw notFound(
      "Client not found."
    );
  }

  const firstName = v.text(
    body.firstName ??
      client.first_name,
    "First name",
    { max: 80 }
  );

  const lastName = v.text(
    body.lastName ??
      client.last_name,
    "Last name",
    { max: 80 }
  );

  const phone = v.phone(
    body.phone ??
      client.phone,
    "Phone"
  );

  const notes = v.text(
    body.notes ??
      client.notes,
    "Notes",
    {
      required: false,
      max: 500,
    }
  );

  /*
   * A guest's login email belongs to their account,
   * so staff can only change the email of walk-in records.
   */
  let email =
    client.email;

  if (
    body.email !==
      undefined &&
    body.email !==
      client.email
  ) {
    if (client.user_id) {
      throw badRequest(
        "This client has an online account. Their email can only be changed by them."
      );
    }

    email = v.email(
      body.email,
      "Email",
      { required: false }
    );

    if (email) {
      const takenResult =
        await db.query(
          `
          SELECT id
          FROM clients
          WHERE lower(email) = lower($1)
            AND id != $2
          `,
          [
            email,
            id,
          ]
        );

      if (
        takenResult.rows[0]
      ) {
        throw conflict(
          "Another client already uses this email."
        );
      }
    }
  }

  const transaction =
    await db.connect();

  try {
    await transaction.query(
      "BEGIN"
    );

    await transaction.query(
      `
      UPDATE clients
      SET
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        notes = $5,
        updated_at = to_char(
          CURRENT_TIMESTAMP,
          'YYYY-MM-DD HH24:MI:SS'
        )
      WHERE id = $6
      `,
      [
        firstName,
        lastName,
        email,
        phone,
        notes,
        id,
      ]
    );

    if (client.user_id) {
      await transaction.query(
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
          client.user_id,
        ]
      );
    }

    await transaction.query(
      "COMMIT"
    );
  } catch (error) {
    await transaction.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    transaction.release();
  }

  await logActivity(
    user.id,
    "client.update",
    "client",
    id,
    `${firstName} ${lastName}`
  );

  return getClient(id);
}

module.exports = {
  PAYMENT_METHODS,
  calendar,
  pendingRequests,
  confirm,
  decline,
  createBooking,
  checkIn,
  checkOut,
  recordPayment,
  listPayments,
  buildReceipt,
  sendReceipt,
  searchClients,
  getClient,
  updateClient,
};