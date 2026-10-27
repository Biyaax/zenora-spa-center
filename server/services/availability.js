const db = require("../database/db");
const config = require("../config");
const time = require("../lib/time");
const { badRequest, notFound, conflict } = require("../lib/errors");

const getService = db.prepare(
  "SELECT * FROM services WHERE id = ? AND is_active = 1"
);

function eligibleTherapists(serviceId, therapistId = null) {
  const params = [serviceId];
  let extra = "";

  if (therapistId) {
    extra = "AND tp.user_id = ?";
    params.push(therapistId);
  }

  return db
    .prepare(
      `SELECT u.id, u.first_name, u.last_name
       FROM therapist_profiles tp
       JOIN users u ON u.id = tp.user_id
       JOIN therapist_services ts ON ts.therapist_id = tp.user_id
       WHERE ts.service_id = ?
         AND tp.is_available = 1
         AND u.is_active = 1
         ${extra}
       ORDER BY u.first_name, u.last_name`
    )
    .all(...params);
}

/** Everything that decides whether a therapist is free on a date. */
function loadTherapistDay(therapistId, date, excludeAppointmentId) {
  const windows = db
    .prepare(
      `SELECT start_time, end_time
       FROM therapist_availability
       WHERE therapist_id = ? AND day_of_week = ? AND is_available = 1
       ORDER BY start_time`
    )
    .all(therapistId, time.dayOfWeek(date));

  const timeOff = db
    .prepare(
      `SELECT 1 FROM time_off_requests
       WHERE therapist_id = ? AND status = 'approved'
         AND start_date <= ? AND end_date >= ?`
    )
    .get(therapistId, date, date);

  const busy = db
    .prepare(
      `SELECT start_time, end_time
       FROM appointments
       WHERE therapist_id = ?
         AND appointment_date = ?
         AND status NOT IN ('cancelled', 'no-show')
         AND id != ?`
    )
    .all(therapistId, date, excludeAppointmentId ?? 0);

  return { windows, onTimeOff: Boolean(timeOff), busy };
}

/** Is [start, start + duration) free for this therapist on this day? */
function therapistIsFree(day, hours, start, duration) {
  if (day.onTimeOff) return false;

  const end = start + duration;
  const open = time.toMinutes(hours[0]);
  const close = time.toMinutes(hours[1]);

  if (start < open || end > close) return false;

  const insideWindow = day.windows.some(
    (w) =>
      start >= time.toMinutes(w.start_time) &&
      end <= time.toMinutes(w.end_time)
  );

  if (!insideWindow) return false;

  return !day.busy.some(
    (b) =>
      start < time.toMinutes(b.end_time) &&
      end > time.toMinutes(b.start_time)
  );
}

/**
 * Earliest start (in minutes) allowed on `date`.
 * Online guests need a lead time; staff may book anything not yet over.
 */
function earliestStart(date, forStaff) {
  const now = time.nowInSpa();

  if (date < now.date) return Infinity;
  if (date > now.date) return 0;

  if (forStaff) {
    // Allow the current slot (walk-ins arrive mid-slot).
    const step = config.slotStepMinutes;
    return Math.floor(now.minutes / step) * step;
  }

  return now.minutes + config.onlineLeadMinutes;
}

function requireValidDate(date) {
  if (!time.isDate(date)) {
    throw badRequest("Please choose a valid date.");
  }
}

/**
 * Open start times for a service on a date.
 * Returns [{ start, end, therapistIds }] on the 30-minute grid.
 */
function getSlots({ serviceId, date, therapistId, forStaff = false, excludeAppointmentId }) {
  requireValidDate(date);

  const service = getService.get(serviceId);
  if (!service) throw notFound("That service is not available.");

  const hours = config.hours[time.dayOfWeek(date)];

  if (!hours) {
    return { service, closed: true, slots: [] };
  }

  const from = earliestStart(date, forStaff);
  const step = config.slotStepMinutes;
  const bySlot = new Map();

  for (const therapist of eligibleTherapists(serviceId, therapistId)) {
    const day = loadTherapistDay(therapist.id, date, excludeAppointmentId);

    for (const window of day.windows) {
      const windowStart = time.toMinutes(window.start_time);
      const windowEnd = time.toMinutes(window.end_time);

      for (
        let start = Math.ceil(windowStart / step) * step;
        start + service.duration_minutes <= windowEnd;
        start += step
      ) {
        if (start < from) continue;
        if (!therapistIsFree(day, hours, start, service.duration_minutes)) continue;

        const key = time.fromMinutes(start);

        if (!bySlot.has(key)) {
          bySlot.set(key, {
            start: key,
            end: time.fromMinutes(start + service.duration_minutes),
            therapistIds: [],
          });
        }

        bySlot.get(key).therapistIds.push(therapist.id);
      }
    }
  }

  const slots = [...bySlot.values()].sort((a, b) =>
    a.start.localeCompare(b.start)
  );

  return { service, closed: false, slots };
}

/**
 * Authoritative check used when actually saving a booking.
 * Picks a therapist when none is given. Throws if the time cannot be booked.
 * Call this inside the same transaction as the INSERT/UPDATE.
 *
 * `preferTherapistIds` lets a reschedule try the current therapist first.
 */
function resolveBooking({
  serviceId,
  date,
  start,
  therapistId,
  clientId,
  forStaff = false,
  excludeAppointmentId,
  preferTherapistIds = [],
}) {
  requireValidDate(date);

  if (!time.isTime(start)) {
    throw badRequest("Please choose a valid start time.");
  }

  const service = getService.get(serviceId);
  if (!service) throw notFound("That service is not available.");

  const hours = config.hours[time.dayOfWeek(date)];
  if (!hours) throw conflict("The spa is closed on that day.");

  const startMinutes = time.toMinutes(start);
  const endMinutes = startMinutes + service.duration_minutes;

  if (startMinutes < earliestStart(date, forStaff)) {
    throw conflict(
      forStaff
        ? "That time has already passed."
        : `Online bookings must be made at least ${config.onlineLeadMinutes} minutes ahead.`
    );
  }

  // A guest cannot be in two places at once.
  if (clientId) {
    const clash = db
      .prepare(
        `SELECT 1 FROM appointments
         WHERE client_id = ?
           AND appointment_date = ?
           AND status NOT IN ('cancelled', 'no-show')
           AND id != ?
           AND ? < end_time AND ? > start_time`
      )
      .get(clientId, date, excludeAppointmentId ?? 0, start, time.fromMinutes(endMinutes));

    if (clash) {
      throw conflict("This client already has an appointment at that time.");
    }
  }

  const candidates = eligibleTherapists(serviceId, therapistId);

  if (therapistId && candidates.length === 0) {
    throw badRequest("That therapist is not available for this service.");
  }

  const free = candidates.filter((therapist) =>
    therapistIsFree(
      loadTherapistDay(therapist.id, date, excludeAppointmentId),
      hours,
      startMinutes,
      service.duration_minutes
    )
  );

  if (free.length === 0) {
    throw conflict(
      "That time is no longer available. Please pick another time."
    );
  }

  // Preferred therapists first, then whoever has the lightest day.
  const load = db.prepare(
    `SELECT COUNT(*) AS n FROM appointments
     WHERE therapist_id = ? AND appointment_date = ?
       AND status NOT IN ('cancelled', 'no-show')`
  );

  free.sort((a, b) => {
    const pa = preferTherapistIds.includes(a.id) ? 0 : 1;
    const pb = preferTherapistIds.includes(b.id) ? 0 : 1;
    if (pa !== pb) return pa - pb;

    const diff = load.get(a.id, date).n - load.get(b.id, date).n;
    return diff !== 0 ? diff : a.id - b.id;
  });

  return {
    service,
    therapistId: free[0].id,
    start,
    end: time.fromMinutes(endMinutes),
  };
}

module.exports = { getSlots, resolveBooking, eligibleTherapists };
