const db = require("../database/postgres");
const config = require("../config");
const time = require("../lib/time");

const {
  badRequest,
  notFound,
  conflict,
} = require("../lib/errors");

/**
 * Get one active service.
 * queryable may be the PostgreSQL pool
 * or a PostgreSQL transaction client.
 */
async function getService(
  serviceId,
  queryable = db
) {
  const result = await queryable.query(
    `
    SELECT
      id,
      name,
      description,
      price,
      duration_minutes,
      image_url,
      is_active
    FROM services
    WHERE id = $1
      AND is_active = 1
    LIMIT 1
    `,
    [serviceId]
  );

  return result.rows[0] || null;
}

/**
 * Therapists who are allowed to perform
 * a particular service.
 */
async function eligibleTherapists(
  serviceId,
  therapistId = null,
  queryable = db
) {
  const params = [serviceId];

  let extra = "";

  if (therapistId) {
    params.push(therapistId);

    extra =
      `AND tp.user_id = $${params.length}`;
  }

  const result = await queryable.query(
    `
    SELECT
      u.id,
      u.first_name,
      u.last_name
    FROM therapist_profiles tp
    JOIN users u
      ON u.id = tp.user_id
    JOIN therapist_services ts
      ON ts.therapist_id = tp.user_id
    WHERE ts.service_id = $1
      AND tp.is_available = 1
      AND u.is_active = 1
      ${extra}
    ORDER BY
      u.first_name,
      u.last_name
    `,
    params
  );

  return result.rows;
}

/**
 * Everything that decides whether
 * a therapist is free on a date.
 */
async function loadTherapistDay(
  therapistId,
  date,
  excludeAppointmentId,
  queryable = db
) {
  const windowsResult =
    await queryable.query(
      `
      SELECT
        start_time,
        end_time
      FROM therapist_availability
      WHERE therapist_id = $1
        AND day_of_week = $2
        AND is_available = 1
      ORDER BY start_time
      `,
      [
        therapistId,
        time.dayOfWeek(date),
      ]
    );

  const timeOffResult =
    await queryable.query(
      `
      SELECT 1
      FROM time_off_requests
      WHERE therapist_id = $1
        AND status = 'approved'
        AND start_date <= $2
        AND end_date >= $2
      LIMIT 1
      `,
      [
        therapistId,
        date,
      ]
    );

  const busyResult =
    await queryable.query(
      `
      SELECT
        start_time,
        end_time
      FROM appointments
      WHERE therapist_id = $1
        AND appointment_date = $2
        AND status NOT IN (
          'cancelled',
          'no-show'
        )
        AND id != $3
      `,
      [
        therapistId,
        date,
        excludeAppointmentId ?? 0,
      ]
    );

  return {
    windows: windowsResult.rows,

    onTimeOff:
      timeOffResult.rows.length > 0,

    busy: busyResult.rows,
  };
}

/**
 * Is [start, start + duration)
 * free for this therapist on this day?
 */
function therapistIsFree(
  day,
  hours,
  start,
  duration
) {
  if (day.onTimeOff) {
    return false;
  }

  const end = start + duration;

  const open =
    time.toMinutes(hours[0]);

  const close =
    time.toMinutes(hours[1]);

  if (
    start < open ||
    end > close
  ) {
    return false;
  }

  const insideWindow =
    day.windows.some(
      (window) =>
        start >=
          time.toMinutes(
            window.start_time
          ) &&
        end <=
          time.toMinutes(
            window.end_time
          )
    );

  if (!insideWindow) {
    return false;
  }

  return !day.busy.some(
    (busy) =>
      start <
        time.toMinutes(
          busy.end_time
        ) &&
      end >
        time.toMinutes(
          busy.start_time
        )
  );
}

/**
 * Earliest start, in minutes,
 * allowed on `date`.
 *
 * Online guests need a lead time.
 * Staff may book anything not yet over.
 */
function earliestStart(
  date,
  forStaff
) {
  const now = time.nowInSpa();

  if (date < now.date) {
    return Infinity;
  }

  if (date > now.date) {
    return 0;
  }

  if (forStaff) {
    // Allow the current slot.
    const step =
      config.slotStepMinutes;

    return (
      Math.floor(
        now.minutes / step
      ) * step
    );
  }

  return (
    now.minutes +
    config.onlineLeadMinutes
  );
}

function requireValidDate(date) {
  if (!time.isDate(date)) {
    throw badRequest(
      "Please choose a valid date."
    );
  }
}

/**
 * Open start times for a service
 * on a date.
 *
 * Returns:
 * [
 *   {
 *     start,
 *     end,
 *     therapistIds
 *   }
 * ]
 */
async function getSlots({
  serviceId,
  date,
  therapistId,
  forStaff = false,
  excludeAppointmentId,
  queryable = db,
}) {
  requireValidDate(date);

  const service =
    await getService(
      serviceId,
      queryable
    );

  if (!service) {
    throw notFound(
      "That service is not available."
    );
  }

  const hours =
    config.hours[
      time.dayOfWeek(date)
    ];

  if (!hours) {
    return {
      service,
      closed: true,
      slots: [],
    };
  }

  const from =
    earliestStart(
      date,
      forStaff
    );

  const step =
    config.slotStepMinutes;

  const bySlot =
    new Map();

  const therapists =
    await eligibleTherapists(
      serviceId,
      therapistId,
      queryable
    );

  for (
    const therapist
    of therapists
  ) {
    const day =
      await loadTherapistDay(
        therapist.id,
        date,
        excludeAppointmentId,
        queryable
      );

    for (
      const window
      of day.windows
    ) {
      const windowStart =
        time.toMinutes(
          window.start_time
        );

      const windowEnd =
        time.toMinutes(
          window.end_time
        );

      for (
        let start =
          Math.ceil(
            windowStart / step
          ) * step;

        start +
          service.duration_minutes <=
        windowEnd;

        start += step
      ) {
        if (start < from) {
          continue;
        }

        if (
          !therapistIsFree(
            day,
            hours,
            start,
            service.duration_minutes
          )
        ) {
          continue;
        }

        const key =
          time.fromMinutes(start);

        if (!bySlot.has(key)) {
          bySlot.set(
            key,
            {
              start: key,

              end:
                time.fromMinutes(
                  start +
                    service.duration_minutes
                ),

              therapistIds: [],
            }
          );
        }

        bySlot
          .get(key)
          .therapistIds
          .push(therapist.id);
      }
    }
  }

  const slots = [
    ...bySlot.values(),
  ].sort(
    (a, b) =>
      a.start.localeCompare(
        b.start
      )
  );

  return {
    service,
    closed: false,
    slots,
  };
}

/**
 * Authoritative check used
 * when actually saving a booking.
 *
 * Picks a therapist when none
 * is given.
 *
 * Throws if the time cannot
 * be booked.
 *
 * preferTherapistIds lets a
 * reschedule try the current
 * therapist first.
 *
 * queryable may be either the
 * PostgreSQL pool or a
 * transaction client.
 */
async function resolveBooking({
  serviceId,
  date,
  start,
  therapistId,
  clientId,
  forStaff = false,
  excludeAppointmentId,
  preferTherapistIds = [],
  queryable = db,
}) {
  requireValidDate(date);

  if (!time.isTime(start)) {
    throw badRequest(
      "Please choose a valid start time."
    );
  }

  const service =
    await getService(
      serviceId,
      queryable
    );

  if (!service) {
    throw notFound(
      "That service is not available."
    );
  }

  const hours =
    config.hours[
      time.dayOfWeek(date)
    ];

  if (!hours) {
    throw conflict(
      "The spa is closed on that day."
    );
  }

  const startMinutes =
    time.toMinutes(start);

  const endMinutes =
    startMinutes +
    service.duration_minutes;

  if (startMinutes % config.slotStepMinutes !== 0) {
    throw badRequest("Please choose a time from the available 30-minute slots.", {
      fields: { time: "Please choose a time from the available slots." },
    });
  }

  if (
    startMinutes <
    earliestStart(
      date,
      forStaff
    )
  ) {
    throw conflict(
      forStaff
        ? "That time has already passed."
        : `Online bookings must be made at least ${config.onlineLeadMinutes} minutes ahead.`
    );
  }

  /*
   * A guest cannot be
   * in two places at once.
   */
  if (clientId) {
    const clashResult =
      await queryable.query(
        `
        SELECT 1
        FROM appointments
        WHERE client_id = $1
          AND appointment_date = $2
          AND status NOT IN (
            'cancelled',
            'no-show'
          )
          AND id != $3
          AND $4 < end_time
          AND $5 > start_time
        LIMIT 1
        `,
        [
          clientId,
          date,
          excludeAppointmentId ?? 0,
          start,
          time.fromMinutes(
            endMinutes
          ),
        ]
      );

    if (
      clashResult.rows.length > 0
    ) {
      throw conflict(
        "This client already has an appointment at that time."
      );
    }
  }

  const candidates =
    await eligibleTherapists(
      serviceId,
      therapistId,
      queryable
    );

  if (
    therapistId &&
    candidates.length === 0
  ) {
    throw badRequest(
      "That therapist is not available for this service."
    );
  }

  const free = [];

  for (
    const therapist
    of candidates
  ) {
    const day =
      await loadTherapistDay(
        therapist.id,
        date,
        excludeAppointmentId,
        queryable
      );

    if (
      therapistIsFree(
        day,
        hours,
        startMinutes,
        service.duration_minutes
      )
    ) {
      free.push(therapist);
    }
  }

  if (free.length === 0) {
    throw conflict(
      "That time is no longer available. Please pick another time."
    );
  }

  /*
   * Preferred therapists first,
   * then whoever has the
   * lightest day.
   */

  const therapistIds =
    free.map(
      (therapist) =>
        therapist.id
    );

  const loadResult =
    await queryable.query(
      `
      SELECT
        therapist_id,
        COUNT(*)::INTEGER AS n
      FROM appointments
      WHERE therapist_id =
        ANY($1::INTEGER[])
        AND appointment_date = $2
        AND status NOT IN (
          'cancelled',
          'no-show'
        )
      GROUP BY therapist_id
      `,
      [
        therapistIds,
        date,
      ]
    );

  const loadByTherapist =
    new Map(
      loadResult.rows.map(
        (row) => [
          row.therapist_id,
          row.n,
        ]
      )
    );

  free.sort(
    (a, b) => {
      const pa =
        preferTherapistIds.includes(
          a.id
        )
          ? 0
          : 1;

      const pb =
        preferTherapistIds.includes(
          b.id
        )
          ? 0
          : 1;

      if (pa !== pb) {
        return pa - pb;
      }

      const aLoad =
        loadByTherapist.get(
          a.id
        ) ?? 0;

      const bLoad =
        loadByTherapist.get(
          b.id
        ) ?? 0;

      const diff =
        aLoad - bLoad;

      return diff !== 0
        ? diff
        : a.id - b.id;
    }
  );

  return {
    service,

    therapistId:
      free[0].id,

    start,

    end:
      time.fromMinutes(
        endMinutes
      ),
  };
}

module.exports = {
  getSlots,
  resolveBooking,
  eligibleTherapists,
};