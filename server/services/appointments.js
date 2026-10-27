const db = require("../database/db");
const time = require("../lib/time");
const { notFound } = require("../lib/errors");

const SELECT = `
  SELECT
    a.id,
    a.client_id,
    a.service_id,
    a.therapist_id,
    a.appointment_date,
    a.start_time,
    a.end_time,
    a.status,
    a.booking_source,
    a.special_request,
    a.check_in_at,
    a.check_out_at,
    a.amount_due,
    a.cancel_reason,
    a.created_at,
    s.name AS service_name,
    s.duration_minutes,
    tu.first_name || ' ' || tu.last_name AS therapist_name,
    c.first_name || ' ' || c.last_name AS client_name,
    c.email AS client_email,
    c.phone AS client_phone,
    c.user_id AS client_user_id,
    COALESCE(
      (SELECT SUM(p.amount) FROM payments p WHERE p.appointment_id = a.id),
      0
    ) AS amount_paid
  FROM appointments a
  JOIN services s ON s.id = a.service_id
  JOIN users tu ON tu.id = a.therapist_id
  JOIN clients c ON c.id = a.client_id
`;

const round = (n) => Math.round(n * 100) / 100;

/** Adds the computed fields the UI needs. */
function present(row) {
  if (!row) return row;

  const now = time.nowInSpa();
  const startsAt = `${row.appointment_date} ${row.start_time}`;
  const nowStamp = `${now.date} ${now.time}`;

  const open = row.status === "pending" || row.status === "confirmed";

  const balance = round(row.amount_due - row.amount_paid);

  return {
    ...row,
    amount_due: round(row.amount_due),
    amount_paid: round(row.amount_paid),
    balance: Math.max(balance, 0),
    is_upcoming: open && startsAt >= nowStamp,
    // Guests may change or cancel only bookings that have not started.
    can_modify: open && !row.check_in_at && startsAt > nowStamp,
  };
}

function getById(id) {
  return present(
    db.prepare(`${SELECT} WHERE a.id = ?`).get(id)
  );
}

function mustGet(id) {
  const appointment = getById(id);
  if (!appointment) throw notFound("Appointment not found.");
  return appointment;
}

function list(where = "", params = [], orderBy = "a.appointment_date, a.start_time") {
  return db
    .prepare(`${SELECT} ${where} ORDER BY ${orderBy}`)
    .all(...params)
    .map(present);
}

module.exports = { getById, mustGet, list };
