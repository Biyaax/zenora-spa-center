const db = require("../database/postgres");
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
      (
        SELECT SUM(p.amount)
        FROM payments p
        WHERE p.appointment_id = a.id
      ),
      0
    ) AS amount_paid
  FROM appointments a
  JOIN services s
    ON s.id = a.service_id
  JOIN users tu
    ON tu.id = a.therapist_id
  JOIN clients c
    ON c.id = a.client_id
`;

const round = (n) =>
  Math.round(Number(n || 0) * 100) / 100;

/**
 * Converts old SQLite-style ? parameters into
 * PostgreSQL $1, $2, $3... placeholders.
 *
 * This lets the files that call list() keep their current
 * WHERE clauses until we convert them too.
 */
function postgresPlaceholders(sql = "") {
  let index = 0;

  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

/** Adds the computed fields the UI needs. */
function present(row) {
  if (!row) return row;

  const now = time.nowInSpa();

  const startsAt =
    `${row.appointment_date} ${row.start_time}`;

  const nowStamp =
    `${now.date} ${now.time}`;

  const open =
    row.status === "pending" ||
    row.status === "confirmed";

  const amountDue =
    Number(row.amount_due || 0);

  const amountPaid =
    Number(row.amount_paid || 0);

  const balance =
    round(amountDue - amountPaid);

  return {
    ...row,

    amount_due:
      round(amountDue),

    amount_paid:
      round(amountPaid),

    balance:
      Math.max(balance, 0),

    is_upcoming:
      open &&
      startsAt >= nowStamp,

    // Guests may change or cancel only bookings
    // that have not started.
    can_modify:
      open &&
      !row.check_in_at &&
      startsAt > nowStamp,
  };
}

async function getById(
  id,
  queryable = db
) {
  const result =
    await queryable.query(
      `
      ${SELECT}
      WHERE a.id = $1
      `,
      [id]
    );

  return present(
    result.rows[0]
  );
}

async function mustGet(
  id,
  queryable = db
) {
  const appointment =
    await getById(
      id,
      queryable
    );

  if (!appointment) {
    throw notFound(
      "Appointment not found."
    );
  }

  return appointment;
}

async function list(
  where = "",
  params = [],
  orderBy =
    "a.appointment_date, a.start_time",
  queryable = db
) {
  /*
   * For now, callers may still pass SQLite-style
   * WHERE clauses such as:
   *
   *   "WHERE a.client_id = ?"
   *
   * Convert those placeholders here so we do not
   * have to change every caller at the same time.
   */
  const convertedWhere =
    postgresPlaceholders(where);

  const result =
    await queryable.query(
      `
      ${SELECT}
      ${convertedWhere}
      ORDER BY ${orderBy}
      `,
      params
    );

  return result.rows.map(
    present
  );
}

module.exports = {
  getById,
  mustGet,
  list,
};