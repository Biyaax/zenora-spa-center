const db = require("../database/db");
const config = require("../config");
const time = require("../lib/time");
const availability = require("./availability");
const appointments = require("./appointments");
const guest = require("./guest");
const { sendMail } = require("../lib/mailer");
const { badRequest, notFound, conflict } = require("../lib/errors");
const { notifyClient, logActivity } = require("../lib/notify");
const v = require("../lib/validate");

const describe = guest.describe;

const PAYMENT_METHODS = ["cash", "gcash", "card", "bank transfer", "other"];

/* =========================
   CALENDAR
========================= */

function calendar({ from, to, therapistId, status }) {
  if (!time.isDate(from) || !time.isDate(to)) {
    throw badRequest("Please provide a valid date range.");
  }

  const span = time.daysBetween(from, to);

  if (span < 0) throw badRequest("The end date is before the start date.");
  if (span > 31) throw badRequest("Please choose a range of 31 days or fewer.");

  const clauses = ["a.appointment_date BETWEEN ? AND ?"];
  const params = [from, to];

  if (therapistId) {
    clauses.push("a.therapist_id = ?");
    params.push(v.id(therapistId, "Therapist"));
  }

  if (status) {
    clauses.push("a.status = ?");
    params.push(status);
  }

  return appointments.list(`WHERE ${clauses.join(" AND ")}`, params);
}

/** Pending online requests, oldest appointment first. */
function pendingRequests() {
  return appointments.list(
    "WHERE a.status = 'pending'",
    [],
    "a.appointment_date, a.start_time"
  );
}

/* =========================
   CONFIRM / DECLINE
========================= */

function clientOf(appointment) {
  return db
    .prepare("SELECT * FROM clients WHERE id = ?")
    .get(appointment.client_id);
}

function confirm(user, id) {
  const appointment = appointments.mustGet(id);

  if (appointment.status !== "pending") {
    throw conflict("Only pending booking requests can be confirmed.");
  }

  db.prepare(
    `UPDATE appointments
     SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(id);

  notifyClient(
    clientOf(appointment),
    "booking_confirmed",
    "Your booking is confirmed",
    `Good news! Your booking for ${describe(appointment)} is confirmed. ` +
      `Please arrive a few minutes early. See you at ${config.spaName}.`
  );

  logActivity(user.id, "booking.confirm", "appointment", id, describe(appointment));

  return appointments.mustGet(id);
}

function decline(user, id, body = {}) {
  const appointment = appointments.mustGet(id);

  if (appointment.status !== "pending") {
    throw conflict("Only pending booking requests can be declined.");
  }

  const reason = v.text(body.reason, "Reason", { required: false, max: 200 });

  db.prepare(
    `UPDATE appointments
     SET status = 'cancelled', cancel_reason = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(reason ? `Declined: ${reason}` : "Declined by the spa", id);

  notifyClient(
    clientOf(appointment),
    "booking_declined",
    "Booking request declined",
    `Sorry, we could not accommodate your request for ${describe(appointment)}.` +
      (reason ? ` Reason: ${reason}.` : "") +
      ` Please choose another time and book again.`
  );

  logActivity(user.id, "booking.decline", "appointment", id, describe(appointment));

  return appointments.mustGet(id);
}

/* =========================
   WALK-INS / BOOK ON BEHALF
========================= */

function resolveClient(input = {}) {
  if (input.id) {
    const client = db
      .prepare("SELECT * FROM clients WHERE id = ?")
      .get(v.id(input.id, "Client"));

    if (!client) throw notFound("Client not found.");
    return client;
  }

  const firstName = v.text(input.firstName, "First name", { max: 80 });
  const lastName = v.text(input.lastName, "Last name", { max: 80 });
  const email = v.email(input.email, "Email", { required: false });
  const phone = v.phone(input.phone, "Phone");

  if (email) {
    const existing = db
      .prepare("SELECT id FROM clients WHERE lower(email) = ?")
      .get(email);

    if (existing) {
      throw conflict(
        "A client with this email already exists. Search for them and select their record.",
        { clientId: existing.id }
      );
    }
  }

  const info = db
    .prepare(
      `INSERT INTO clients (first_name, last_name, email, phone, notes)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      firstName,
      lastName,
      email,
      phone,
      v.text(input.notes, "Notes", { required: false, max: 500 })
    );

  return db
    .prepare("SELECT * FROM clients WHERE id = ?")
    .get(info.lastInsertRowid);
}

/**
 * type "walk-in"      -> the client is here now (today only)
 * type "reservation"  -> booked on behalf of a guest (phone call, etc.)
 * Staff bookings are confirmed immediately.
 */
function createBooking(user, body) {
  const type = body.type === "walk-in" ? "walk-in" : "reservation";

  const serviceId = v.id(body.serviceId, "Service");
  const therapistId = v.optionalId(body.therapistId, "Therapist");
  const specialRequest = v.text(body.specialRequest, "Special request", {
    required: false,
    max: 500,
  });

  if (type === "walk-in" && body.date !== time.nowInSpa().date) {
    throw badRequest("Walk-in clients must be booked for today.");
  }

  const result = guest.atomically(() => {
    const client = resolveClient(body.client);

    const slot = availability.resolveBooking({
      serviceId,
      therapistId,
      date: body.date,
      start: body.start,
      clientId: client.id,
      forStaff: true,
    });

    const checkIn = type === "walk-in" && body.checkInNow;

    const id = db
      .prepare(
        `INSERT INTO appointments
           (client_id, service_id, therapist_id, appointment_date,
            start_time, end_time, status, booking_source,
            special_request, amount_due, check_in_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?,
                 CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END, ?)`
      )
      .run(
        client.id,
        serviceId,
        slot.therapistId,
        body.date,
        slot.start,
        slot.end,
        type === "walk-in" ? "walk-in" : "receptionist",
        specialRequest,
        slot.service.price,
        checkIn ? 1 : 0,
        user.id
      ).lastInsertRowid;

    return { id, client };
  });

  const appointment = appointments.mustGet(result.id);

  if (type === "reservation") {
    notifyClient(
      result.client,
      "booking_confirmed",
      "Your booking is confirmed",
      `The front desk booked ${describe(appointment)} for you. See you at ${config.spaName}.`
    );
  }

  logActivity(
    user.id,
    type === "walk-in" ? "booking.walk-in" : "booking.on-behalf",
    "appointment",
    result.id,
    describe(appointment)
  );

  return appointment;
}

/* =========================
   CHECK-IN / CHECK-OUT
========================= */

function checkIn(user, id) {
  const appointment = appointments.mustGet(id);

  if (appointment.status !== "confirmed") {
    throw conflict(
      appointment.status === "pending"
        ? "Confirm this booking before checking the client in."
        : "Only confirmed bookings can be checked in."
    );
  }

  if (appointment.check_in_at) {
    throw conflict("This client is already checked in.");
  }

  if (appointment.appointment_date !== time.nowInSpa().date) {
    throw conflict("Clients can only be checked in on the day of the appointment.");
  }

  db.prepare(
    `UPDATE appointments
     SET check_in_at = datetime('now'), updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(id);

  logActivity(user.id, "booking.check-in", "appointment", id, describe(appointment));

  return appointments.mustGet(id);
}

function checkOut(user, id) {
  const appointment = appointments.mustGet(id);

  if (!appointment.check_in_at) {
    throw conflict("Check the client in first.");
  }

  if (appointment.check_out_at) {
    throw conflict("This client is already checked out.");
  }

  if (!["confirmed", "ongoing", "completed"].includes(appointment.status)) {
    throw conflict("This booking cannot be checked out.");
  }

  db.prepare(
    `UPDATE appointments
     SET check_out_at = datetime('now'),
         status = 'completed',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(id);

  logActivity(user.id, "booking.check-out", "appointment", id, describe(appointment));

  return appointments.mustGet(id);
}

/* =========================
   PAYMENTS & RECEIPTS
========================= */

const receiptNumber = (paymentId) =>
  `ZEN-${String(paymentId).padStart(6, "0")}`;

function buildReceipt(paymentId) {
  const payment = db
    .prepare(
      `SELECT p.*, u.first_name || ' ' || u.last_name AS cashier_name
       FROM payments p
       JOIN users u ON u.id = p.recorded_by
       WHERE p.id = ?`
    )
    .get(paymentId);

  if (!payment) throw notFound("Payment not found.");

  const appointment = appointments.mustGet(payment.appointment_id);

  // Totals as of this payment, so reprinting an old receipt is accurate.
  const paidSoFar = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM payments
       WHERE appointment_id = ? AND id <= ?`
    )
    .get(payment.appointment_id, payment.id).total;

  return {
    receipt_number: receiptNumber(payment.id),
    spa_name: config.spaName,
    payment: {
      id: payment.id,
      amount: payment.amount,
      method: payment.payment_method,
      reference_number: payment.reference_number,
      paid_at: payment.paid_at,
      cashier_name: payment.cashier_name,
    },
    appointment: {
      id: appointment.id,
      service_name: appointment.service_name,
      therapist_name: appointment.therapist_name,
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
    },
    client: {
      name: appointment.client_name,
      email: appointment.client_email,
    },
    amount_due: appointment.amount_due,
    paid_to_date: Math.round(paidSoFar * 100) / 100,
    balance: Math.max(
      Math.round((appointment.amount_due - paidSoFar) * 100) / 100,
      0
    ),
  };
}

function recordPayment(user, id, body) {
  const appointment = appointments.mustGet(id);

  if (!["confirmed", "ongoing", "completed"].includes(appointment.status)) {
    throw conflict(
      appointment.status === "pending"
        ? "Confirm this booking before recording a payment."
        : "Payments cannot be recorded for a cancelled or no-show booking."
    );
  }

  const amount = Math.round(Number(body.amount) * 100) / 100;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw badRequest("Enter a payment amount greater than zero.");
  }

  if (amount > appointment.balance) {
    throw badRequest(
      `The amount is more than the remaining balance (₱${appointment.balance.toFixed(2)}).`
    );
  }

  const method = String(body.method || "cash").toLowerCase();

  if (!PAYMENT_METHODS.includes(method)) {
    throw badRequest("Please choose a valid payment method.");
  }

  const reference = v.text(body.reference, "Reference number", {
    required: false,
    max: 60,
  });

  const paymentId = db
    .prepare(
      `INSERT INTO payments
         (appointment_id, amount, payment_method, reference_number, recorded_by)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(id, amount, method, reference, user.id).lastInsertRowid;

  logActivity(
    user.id,
    "payment.record",
    "payment",
    paymentId,
    `₱${amount.toFixed(2)} (${method}) for appointment #${id}`
  );

  return {
    appointment: appointments.mustGet(id),
    receipt: buildReceipt(paymentId),
  };
}

function listPayments(appointmentId) {
  appointments.mustGet(appointmentId);

  return db
    .prepare(
      `SELECT id FROM payments WHERE appointment_id = ? ORDER BY id`
    )
    .all(appointmentId)
    .map((row) => buildReceipt(row.id));
}

function receiptText(receipt) {
  const peso = (n) => `PHP ${Number(n).toFixed(2)}`;

  return [
    receipt.spa_name,
    `Official Receipt ${receipt.receipt_number}`,
    "",
    `Client:    ${receipt.client.name}`,
    `Service:   ${receipt.appointment.service_name}`,
    `Therapist: ${receipt.appointment.therapist_name}`,
    `Date:      ${receipt.appointment.appointment_date} ${receipt.appointment.start_time}`,
    "",
    `Amount paid:  ${peso(receipt.payment.amount)} (${receipt.payment.method})`,
    receipt.payment.reference_number
      ? `Reference:    ${receipt.payment.reference_number}`
      : null,
    `Total due:    ${peso(receipt.amount_due)}`,
    `Paid to date: ${peso(receipt.paid_to_date)}`,
    `Balance:      ${peso(receipt.balance)}`,
    "",
    `Received by ${receipt.payment.cashier_name}. Thank you!`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

async function sendReceipt(user, paymentId) {
  const receipt = buildReceipt(paymentId);
  const appointment = appointments.mustGet(receipt.appointment.id);
  const client = clientOf(appointment);

  if (!client.email) {
    throw badRequest("This client has no email address on file.");
  }

  const result = await sendMail({
    to: client.email,
    subject: `Your receipt ${receipt.receipt_number} - ${config.spaName}`,
    text: receiptText(receipt),
  });

  // Account holders can also see the receipt on screen.
  notifyClient(
    { user_id: client.user_id, email: null },
    "receipt",
    `Receipt ${receipt.receipt_number}`,
    receiptText(receipt)
  );

  logActivity(user.id, "receipt.send", "payment", paymentId, client.email);

  return result;
}

/* =========================
   CLIENT RECORDS
========================= */

function searchClients(q) {
  const term = `%${String(q || "").trim().toLowerCase()}%`;

  return db
    .prepare(
      `SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.notes,
              c.user_id IS NOT NULL AS has_account,
              (SELECT COUNT(*) FROM appointments a WHERE a.client_id = c.id) AS visits
       FROM clients c
       WHERE lower(c.first_name || ' ' || c.last_name) LIKE ?
          OR lower(COALESCE(c.email, '')) LIKE ?
          OR lower(COALESCE(c.phone, '')) LIKE ?
       ORDER BY c.last_name, c.first_name
       LIMIT 30`
    )
    .all(term, term, term);
}

function getClient(id) {
  const client = db
    .prepare(
      `SELECT c.*, c.user_id IS NOT NULL AS has_account
       FROM clients c WHERE c.id = ?`
    )
    .get(id);

  if (!client) throw notFound("Client not found.");

  return {
    ...client,
    appointments: appointments.list(
      "WHERE a.client_id = ?",
      [id],
      "a.appointment_date DESC, a.start_time DESC"
    ),
  };
}

function updateClient(user, id, body) {
  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
  if (!client) throw notFound("Client not found.");

  const firstName = v.text(body.firstName ?? client.first_name, "First name", { max: 80 });
  const lastName = v.text(body.lastName ?? client.last_name, "Last name", { max: 80 });
  const phone = v.phone(body.phone ?? client.phone, "Phone");
  const notes = v.text(body.notes ?? client.notes, "Notes", { required: false, max: 500 });

  // A guest's login email belongs to their account, so staff can only
  // change the email of walk-in records (no account).
  let email = client.email;

  if (body.email !== undefined && body.email !== client.email) {
    if (client.user_id) {
      throw badRequest(
        "This client has an online account. Their email can only be changed by them."
      );
    }

    email = v.email(body.email, "Email", { required: false });

    if (email) {
      const taken = db
        .prepare("SELECT id FROM clients WHERE lower(email) = ? AND id != ?")
        .get(email, id);

      if (taken) throw conflict("Another client already uses this email.");
    }
  }

  db.transaction(() => {
    db.prepare(
      `UPDATE clients
       SET first_name = ?, last_name = ?, email = ?, phone = ?, notes = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(firstName, lastName, email, phone, notes, id);

    if (client.user_id) {
      db.prepare(
        `UPDATE users
         SET first_name = ?, last_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(firstName, lastName, phone, client.user_id);
    }
  })();

  logActivity(user.id, "client.update", "client", id, `${firstName} ${lastName}`);

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
