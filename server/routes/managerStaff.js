// Zenora Manager staff and weekly schedule management for PostgreSQL.
// Mount under /api/manager with requireAuth + requireRole("Spa Manager").

const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../database/postgres");
const emailVerification = require("../services/emailVerification");

const router = express.Router();

const roles = new Set([
  "Massage Therapist",
  "Receptionist",
]);

const idOk = (value) =>
  /^[1-9]\d*$/.test(String(value)) &&
  Number.isSafeInteger(Number(value));

const requiredText = (value, max = 80) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.trim().length <= max;

const emailOf = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const emailOk = (value) =>
  value.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const timeOk = (value) =>
  typeof value === "string" &&
  /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const stamp =
  "to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS')";

const answer = (res, status, message) =>
  res.status(status).json({
    success: false,
    message,
  });

function fail(res, error) {
  if (error?.code === "23505") {
    return answer(
      res,
      409,
      "Email or record already exists."
    );
  }

  if (
    error?.code === "23503" ||
    error?.code === "23514"
  ) {
    return answer(
      res,
      409,
      "This update conflicts with related records."
    );
  }

  console.error(
    "Manager staff API error:",
    error
  );

  return answer(
    res,
    500,
    "An internal server error occurred."
  );
}

async function transaction(action) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const result =
      await action(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}

async function audit(
  client,
  managerId,
  action,
  staffId,
  details
) {
  await client.query(
    `
      INSERT INTO activity_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
      )
      VALUES (
        $1,
        $2,
        'staff',
        $3,
        $4
      )
    `,
    [
      managerId,
      action,
      staffId,
      JSON.stringify(details),
    ]
  );
}

async function staffById(
  queryable,
  id
) {
  const result =
    await queryable.query(
      `
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          u.is_active,
          u.email_verified,
          u.email_verified_at,

          r.name AS role,

          p.specialties,
          p.is_available

        FROM users u

        JOIN roles r
          ON r.id = u.role_id

        LEFT JOIN therapist_profiles p
          ON p.user_id = u.id

        WHERE
          u.id = $1
          AND r.name IN (
            'Massage Therapist',
            'Receptionist'
          )
      `,
      [id]
    );

  return result.rows[0];
}

async function shaped(
  queryable,
  row
) {
  if (!row) {
    return null;
  }

  const ids =
    row.role ===
    "Massage Therapist"
      ? (
          await queryable.query(
            `
              SELECT service_id
              FROM therapist_services
              WHERE therapist_id = $1
              ORDER BY service_id
            `,
            [row.id]
          )
        ).rows.map(
          (item) =>
            item.service_id
        )
      : [];

  return {
    ...row,

    specialties:
      row.specialties || "",

    service_ids: ids,

    email_verified:
      Number(
        row.email_verified
      ) === 1,
  };
}

async function validateServices(
  queryable,
  ids
) {
  if (
    !Array.isArray(ids) ||
    ids.length > 50 ||
    ids.some(
      (id) =>
        !Number.isSafeInteger(id) ||
        id <= 0
    ) ||
    new Set(ids).size !==
      ids.length
  ) {
    return false;
  }

  if (!ids.length) {
    return true;
  }

  const result =
    await queryable.query(
      `
        SELECT
          COUNT(*)::INTEGER AS count

        FROM services

        WHERE
          id = ANY($1::INTEGER[])
          AND is_active = 1
      `,
      [ids]
    );

  return (
    result.rows[0].count ===
    ids.length
  );
}

async function setServices(
  client,
  userId,
  ids
) {
  await client.query(
    `
      DELETE FROM therapist_services
      WHERE therapist_id = $1
    `,
    [userId]
  );

  for (const id of ids) {
    await client.query(
      `
        INSERT INTO therapist_services (
          therapist_id,
          service_id
        )
        VALUES ($1, $2)
      `,
      [
        userId,
        id,
      ]
    );
  }
}

/* =========================================================
   MANAGER ACCESS
========================================================= */

router.use(
  (req, res, next) => {
    if (!req.user) {
      return answer(
        res,
        401,
        "Authentication required."
      );
    }

    if (
      req.user.role !==
        "Spa Manager" ||
      !req.user.is_active
    ) {
      return answer(
        res,
        403,
        "Manager access required."
      );
    }

    next();
  }
);

/* =========================================================
   LIST STAFF
========================================================= */

router.get(
  "/staff",
  async (req, res) => {
    try {
      const result =
        await db.query(
          `
            SELECT
              u.id,
              u.first_name,
              u.last_name,
              u.email,
              u.phone,
              u.is_active,
              u.email_verified,
              u.email_verified_at,

              r.name AS role,

              p.specialties,
              p.is_available

            FROM users u

            JOIN roles r
              ON r.id =
                u.role_id

            LEFT JOIN therapist_profiles p
              ON p.user_id =
                u.id

            WHERE
              r.name IN (
                'Massage Therapist',
                'Receptionist'
              )

            ORDER BY
              r.name,
              u.last_name,
              u.first_name
          `
        );

      const staff =
        await Promise.all(
          result.rows.map(
            (row) =>
              shaped(
                db,
                row
              )
          )
        );

      return res.json({
        success: true,
        staff,
      });
    } catch (error) {
      return fail(
        res,
        error
      );
    }
  }
);

/* =========================================================
   CREATE STAFF

   Newly created staff:
   - email_verified = 0
   - cannot log in yet
   - verification email is sent
========================================================= */

router.post(
  "/staff",
  async (req, res) => {
    const body =
      req.body || {};

    const email =
      emailOf(
        body.email
      );

    if (
      !requiredText(
        body.first_name
      ) ||
      !requiredText(
        body.last_name
      ) ||
      !emailOk(email) ||
      !roles.has(
        body.role
      ) ||
      typeof body.temporary_password !==
        "string" ||
      body.temporary_password
        .length < 12 ||
      body.temporary_password
        .length > 72 ||
      (
        body.phone != null &&
        (
          typeof body.phone !==
            "string" ||
          body.phone.length > 80
        )
      ) ||
      (
        body.specialties != null &&
        (
          typeof body.specialties !==
            "string" ||
          body.specialties.length >
            1000
        )
      ) ||
      (
        body.role ===
          "Massage Therapist" &&
        (
          !Array.isArray(
            body.service_ids
          ) ||
          !body.service_ids.length
        )
      )
    ) {
      return answer(
        res,
        400,
        "Provide valid staff details and a 12–72 character temporary password."
      );
    }

    try {
      const row =
        await transaction(
          async (client) => {
            const role =
              await client.query(
                `
                  SELECT id
                  FROM roles
                  WHERE name = $1
                `,
                [
                  body.role,
                ]
              );

            if (
              !role.rowCount
            ) {
              return {
                error:
                  "Required role is missing.",
              };
            }

            if (
              body.role ===
                "Massage Therapist" &&
              !(
                await validateServices(
                  client,
                  body.service_ids
                )
              )
            ) {
              return {
                error:
                  "Choose valid active services.",
              };
            }

            const hash =
              await bcrypt.hash(
                body.temporary_password,
                12
              );

            /*
             * Every newly created staff account
             * starts UNVERIFIED.
             */
            const created =
              await client.query(
                `
                  INSERT INTO users (
                    role_id,
                    first_name,
                    last_name,
                    email,
                    password_hash,
                    phone,
                    email_verified,
                    email_verified_at
                  )
                  VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    0,
                    NULL
                  )
                  RETURNING id
                `,
                [
                  role.rows[0].id,

                  body.first_name
                    .trim(),

                  body.last_name
                    .trim(),

                  email,

                  hash,

                  body.phone
                    ?.trim() ||
                    null,
                ]
              );

            const id =
              created.rows[0].id;

            if (
              body.role ===
              "Massage Therapist"
            ) {
              await client.query(
                `
                  INSERT INTO therapist_profiles (
                    user_id,
                    specialties,
                    is_available
                  )
                  VALUES (
                    $1,
                    $2,
                    1
                  )
                `,
                [
                  id,

                  body.specialties
                    ?.trim() ||
                    null,
                ]
              );

              await setServices(
                client,
                id,
                body.service_ids
              );
            }

            await audit(
              client,
              req.user.id,
              "staff.create",
              id,
              {
                role:
                  body.role,

                email,
              }
            );

            return shaped(
              client,
              await staffById(
                client,
                id
              )
            );
          }
        );

      if (row.error) {
        return answer(
          res,
          400,
          row.error
        );
      }

      /*
       * Account is committed first.
       * Then create token and send email.
       *
       * If email delivery fails, we DO NOT
       * delete the staff account. It remains
       * unverified and can request another link.
       */
      let mailResult;

      try {
        mailResult =
          await emailVerification.sendForUser(
            {
              userId:
                row.id,

              email:
                row.email,

              firstName:
                row.first_name,

              accountType:
                body.role,
            }
          );
      } catch (error) {
        console.error(
          "[staff-verification] Verification email failed:",
          error
        );

        mailResult = {
          sent: false,
          reason:
            "The verification email could not be sent.",
        };
      }

      return res
        .status(201)
        .json({
          success: true,

          message:
            mailResult?.sent
              ? "Staff account created. A verification email has been sent to the staff member."
              : "Staff account created, but the verification email could not be sent. The account will remain unavailable until the email is verified.",

          verificationEmailSent:
            Boolean(
              mailResult?.sent
            ),

          verificationEmailReason:
            mailResult?.sent
              ? null
              : mailResult?.reason ||
                "Email could not be sent.",

          staff: row,
        });
    } catch (error) {
      return fail(
        res,
        error
      );
    }
  }
);

/* =========================================================
   UPDATE STAFF

   If the email address changes:
   - reset verification
   - send a new verification email
========================================================= */

router.patch(
  "/staff/:id",
  async (req, res) => {
    if (
      !idOk(
        req.params.id
      )
    ) {
      return answer(
        res,
        400,
        "Invalid staff ID."
      );
    }

    const id =
      Number(
        req.params.id
      );

    const body =
      req.body || {};

    const fields =
      Object.keys(body);

    const allowed = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "specialties",
      "service_ids",
      "is_active",
    ];

    if (
      !fields.length ||
      fields.some(
        (field) =>
          !allowed.includes(
            field
          )
      )
    ) {
      return answer(
        res,
        400,
        "Invalid update fields; role changes are not supported."
      );
    }

    if (
      (
        body.first_name !==
          undefined &&
        !requiredText(
          body.first_name
        )
      ) ||
      (
        body.last_name !==
          undefined &&
        !requiredText(
          body.last_name
        )
      ) ||
      (
        body.email !==
          undefined &&
        !emailOk(
          emailOf(
            body.email
          )
        )
      ) ||
      (
        body.phone != null &&
        (
          typeof body.phone !==
            "string" ||
          body.phone.length > 80
        )
      ) ||
      (
        body.specialties != null &&
        (
          typeof body.specialties !==
            "string" ||
          body.specialties.length >
            1000
        )
      ) ||
      (
        body.is_active !==
          undefined &&
        ![
          0,
          1,
          true,
          false,
        ].includes(
          body.is_active
        )
      )
    ) {
      return answer(
        res,
        400,
        "Invalid update values."
      );
    }

    try {
      const result =
        await transaction(
          async (client) => {
            const previous =
              await staffById(
                client,
                id
              );

            if (!previous) {
              return {
                notFound: true,
              };
            }

            if (
              (
                body.specialties !==
                  undefined ||
                body.service_ids !==
                  undefined
              ) &&
              previous.role !==
                "Massage Therapist"
            ) {
              return {
                error:
                  "Specialties and services apply only to therapists.",
              };
            }

            if (
              body.service_ids !==
                undefined &&
              (
                !Array.isArray(
                  body.service_ids
                ) ||
                !body
                  .service_ids
                  .length ||
                !(
                  await validateServices(
                    client,
                    body.service_ids
                  )
                )
              )
            ) {
              return {
                error:
                  "Choose valid active services.",
              };
            }

            const nextEmail =
              emailOf(
                body.email ??
                  previous.email
              );

            const emailChanged =
              nextEmail !==
              emailOf(
                previous.email
              );

            /*
             * If email changes, verification
             * for the previous address must
             * not carry over to the new one.
             */
            const updated =
              await client.query(
                `
                  UPDATE users

                  SET
                    first_name = $1,
                    last_name = $2,
                    email = $3,
                    phone = $4,
                    is_active = $5,

                    email_verified =
                      CASE
                        WHEN $6
                          THEN 0
                        ELSE email_verified
                      END,

                    email_verified_at =
                      CASE
                        WHEN $6
                          THEN NULL
                        ELSE email_verified_at
                      END,

                    updated_at =
                      ${stamp}

                  WHERE id = $7

                  RETURNING id
                `,
                [
                  (
                    body.first_name ??
                    previous.first_name
                  ).trim(),

                  (
                    body.last_name ??
                    previous.last_name
                  ).trim(),

                  nextEmail,

                  body.phone ===
                    undefined
                    ? previous.phone
                    : body.phone
                        ?.trim() ||
                      null,

                  body.is_active ===
                    undefined
                    ? previous.is_active
                    : Number(
                        body.is_active
                      ),

                  emailChanged,

                  id,
                ]
              );

            if (
              !updated.rowCount
            ) {
              return {
                notFound: true,
              };
            }

            if (
              body.specialties !==
              undefined
            ) {
              await client.query(
                `
                  UPDATE therapist_profiles

                  SET specialties = $1

                  WHERE user_id = $2
                `,
                [
                  body.specialties
                    ?.trim() ||
                    null,

                  id,
                ]
              );
            }

            if (
              body.service_ids !==
              undefined
            ) {
              await setServices(
                client,
                id,
                body.service_ids
              );
            }

            await audit(
              client,
              req.user.id,
              "staff.update",
              id,
              {
                fields,
                emailChanged,
              }
            );

            return {
              staff:
                await shaped(
                  client,
                  await staffById(
                    client,
                    id
                  )
                ),

              emailChanged,
            };
          }
        );

      if (
        result.notFound
      ) {
        return answer(
          res,
          404,
          "Staff account not found."
        );
      }

      if (
        result.error
      ) {
        return answer(
          res,
          400,
          result.error
        );
      }

      let verificationEmailSent =
        null;

      /*
       * Email changed:
       * send verification to the NEW address.
       */
      if (
        result.emailChanged
      ) {
        try {
          const mailResult =
            await emailVerification.sendForUser(
              {
                userId:
                  result.staff.id,

                email:
                  result.staff.email,

                firstName:
                  result.staff
                    .first_name,

                accountType:
                  result.staff.role,
              }
            );

          verificationEmailSent =
            Boolean(
              mailResult?.sent
            );
        } catch (error) {
          console.error(
            "[staff-verification] Verification email after email change failed:",
            error
          );

          verificationEmailSent =
            false;
        }
      }

      return res.json({
        success: true,

        message:
          result.emailChanged
            ? verificationEmailSent
              ? "Staff account updated. The new email address must be verified before the staff member can sign in."
              : "Staff account updated, but the verification email could not be sent to the new address."
            : "Staff account updated.",

        verificationEmailSent,

        staff:
          result.staff,
      });
    } catch (error) {
      return fail(
        res,
        error
      );
    }
  }
);

/* =========================================================
   RESET PASSWORD
========================================================= */

router.post(
  "/staff/:id/reset-password",
  async (req, res) => {
    if (
      !idOk(
        req.params.id
      )
    ) {
      return answer(
        res,
        400,
        "Invalid staff ID."
      );
    }

    const id =
      Number(
        req.params.id
      );

    const password =
      req.body
        ?.temporary_password;

    if (
      typeof password !==
        "string" ||
      password.length < 12 ||
      password.length > 72
    ) {
      return answer(
        res,
        400,
        "Temporary password must be 12–72 characters."
      );
    }

    try {
      const found =
        await transaction(
          async (client) => {
            const staff =
              await staffById(
                client,
                id
              );

            if (!staff) {
              return false;
            }

            await client.query(
              `
                UPDATE users

                SET
                  password_hash = $1,
                  updated_at = ${stamp}

                WHERE id = $2
              `,
              [
                await bcrypt.hash(
                  password,
                  12
                ),

                id,
              ]
            );

            await audit(
              client,
              req.user.id,
              "staff.password_reset",
              id,
              {
                role:
                  staff.role,
              }
            );

            return true;
          }
        );

      if (!found) {
        return answer(
          res,
          404,
          "Staff account not found."
        );
      }

      return res.json({
        success: true,

        message:
          "Temporary password set. Share it privately.",
      });
    } catch (error) {
      return fail(
        res,
        error
      );
    }
  }
);

/* =========================================================
   THERAPIST APPOINTMENTS
========================================================= */

router.get(
  "/staff/:id/appointments",
  async (req, res) => {
    if (
      !idOk(
        req.params.id
      )
    ) {
      return answer(
        res,
        400,
        "Invalid staff ID."
      );
    }

    const id =
      Number(
        req.params.id
      );

    try {
      const staff =
        await staffById(
          db,
          id
        );

      if (
        !staff ||
        staff.role !==
          "Massage Therapist"
      ) {
        return answer(
          res,
          404,
          "Therapist not found."
        );
      }

      const result =
        await db.query(
          `
            SELECT
              a.id,
              a.appointment_date,
              a.start_time,
              a.end_time,
              a.status,

              s.name
                AS service_name,

              c.first_name
                AS client_first_name,

              c.last_name
                AS client_last_name

            FROM appointments a

            JOIN services s
              ON s.id =
                a.service_id

            JOIN clients c
              ON c.id =
                a.client_id

            WHERE
              a.therapist_id = $1

              AND
              a.appointment_date >=
                to_char(
                  CURRENT_DATE
                    - INTERVAL '30 days',
                  'YYYY-MM-DD'
                )

            ORDER BY
              a.appointment_date DESC,
              a.start_time DESC

            LIMIT 100
          `,
          [id]
        );

      return res.json({
        success: true,

        appointments:
          result.rows,
      });
    } catch (error) {
      return fail(
        res,
        error
      );
    }
  }
);

/* =========================================================
   THERAPIST SCHEDULE
========================================================= */

router.get(
  "/staff/:id/schedule",
  async (req, res) => {
    if (
      !idOk(
        req.params.id
      )
    ) {
      return answer(
        res,
        400,
        "Invalid staff ID."
      );
    }

    const id =
      Number(
        req.params.id
      );

    try {
      const staff =
        await staffById(
          db,
          id
        );

      if (
        !staff ||
        staff.role !==
          "Massage Therapist"
      ) {
        return answer(
          res,
          404,
          "Therapist not found."
        );
      }

      const result =
        await db.query(
          `
            SELECT
              day_of_week,
              start_time,
              end_time,
              is_available

            FROM therapist_availability

            WHERE
              therapist_id = $1

            ORDER BY
              day_of_week,
              start_time
          `,
          [id]
        );

      return res.json({
        success: true,
        windows:
          result.rows,
      });
    } catch (error) {
      return fail(
        res,
        error
      );
    }
  }
);

/* =========================================================
   UPDATE THERAPIST SCHEDULE
========================================================= */

router.put(
  "/staff/:id/schedule",
  async (req, res) => {
    if (
      !idOk(
        req.params.id
      )
    ) {
      return answer(
        res,
        400,
        "Invalid staff ID."
      );
    }

    const id =
      Number(
        req.params.id
      );

    const windows =
      req.body?.windows;

    if (
      !Array.isArray(
        windows
      ) ||
      windows.length > 14
    ) {
      return answer(
        res,
        400,
        "Provide at most 14 weekly windows."
      );
    }

    const byDay =
      new Map();

    for (
      const window
      of windows
    ) {
      if (
        !Number.isInteger(
          window
            ?.day_of_week
        ) ||
        window.day_of_week <
          0 ||
        window.day_of_week >
          6 ||
        !timeOk(
          window.start_time
        ) ||
        !timeOk(
          window.end_time
        ) ||
        window.start_time >=
          window.end_time
      ) {
        return answer(
          res,
          400,
          "Invalid weekday or working hours."
        );
      }

      if (
        !byDay.has(
          window
            .day_of_week
        )
      ) {
        byDay.set(
          window
            .day_of_week,
          []
        );
      }

      byDay
        .get(
          window
            .day_of_week
        )
        .push(window);
    }

    for (
      const day
      of byDay.values()
    ) {
      day.sort(
        (a, b) =>
          a.start_time.localeCompare(
            b.start_time
          )
      );

      for (
        let index = 1;
        index <
        day.length;
        index += 1
      ) {
        if (
          day[index]
            .start_time <
          day[index - 1]
            .end_time
        ) {
          return answer(
            res,
            400,
            "Overlapping shifts are not allowed."
          );
        }
      }
    }

    try {
      const result =
        await transaction(
          async (client) => {
            /*
             * Serialize schedule updates
             * for this therapist.
             */
            const locked =
              await client.query(
                `
                  SELECT u.id

                  FROM users u

                  JOIN roles r
                    ON r.id =
                      u.role_id

                  WHERE
                    u.id = $1
                    AND
                    r.name =
                      'Massage Therapist'

                  FOR UPDATE OF u
                `,
                [id]
              );

            if (
              !locked.rowCount
            ) {
              return {
                notFound: true,
              };
            }

            const appointments =
              await client.query(
                `
                  SELECT
                    appointment_date,
                    start_time,
                    end_time

                  FROM appointments

                  WHERE
                    therapist_id = $1

                    AND
                    appointment_date >=
                      to_char(
                        CURRENT_DATE,
                        'YYYY-MM-DD'
                      )

                    AND
                    status NOT IN (
                      'cancelled',
                      'no-show'
                    )
                `,
                [id]
              );

            for (
              const appointment
              of appointments.rows
            ) {
              const date =
                String(
                  appointment
                    .appointment_date
                ).slice(
                  0,
                  10
                );

              const day =
                new Date(
                  `${date}T12:00:00Z`
                ).getUTCDay();

              const fits =
                (
                  byDay.get(
                    day
                  ) || []
                ).some(
                  (window) =>
                    String(
                      appointment
                        .start_time
                    ).slice(
                      0,
                      5
                    ) >=
                      window
                        .start_time &&
                    String(
                      appointment
                        .end_time
                    ).slice(
                      0,
                      5
                    ) <=
                      window
                        .end_time
                );

              if (!fits) {
                return {
                  conflict:
                    date,
                };
              }
            }

            await client.query(
              `
                DELETE FROM therapist_availability
                WHERE therapist_id = $1
              `,
              [id]
            );

            for (
              const window
              of windows
            ) {
              await client.query(
                `
                  INSERT INTO therapist_availability (
                    therapist_id,
                    day_of_week,
                    start_time,
                    end_time,
                    is_available
                  )
                  VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    1
                  )
                `,
                [
                  id,
                  window
                    .day_of_week,
                  window
                    .start_time,
                  window
                    .end_time,
                ]
              );
            }

            await audit(
              client,
              req.user.id,
              "therapist.schedule_assign",
              id,
              {
                windows,
              }
            );

            return {
              ok: true,
            };
          }
        );

      if (
        result.notFound
      ) {
        return answer(
          res,
          404,
          "Therapist not found."
        );
      }

      if (
        result.conflict
      ) {
        return answer(
          res,
          409,
          `Existing appointment on ${result.conflict} falls outside the new hours.`
        );
      }

      return res.json({
        success: true,

        message:
          "Weekly working hours saved.",

        windows,
      });
    } catch (error) {
      return fail(
        res,
        error
      );
    }
  }
);

module.exports = router;