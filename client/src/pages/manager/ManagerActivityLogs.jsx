import {
  useMemo,
  useState,
} from "react";

import {
  getManager,
  dateTimeText,
  titleCase,
} from "../../components/manager/api";

import {
  Button,
  Card,
  DataTable,
  ErrorState,
  Loading,
  PageHeader,
  useLoad,
} from "../../components/manager/UI";

/* =========================
   HELPERS
========================= */

function parseDetails(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value === "object"
  ) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function logPersonName(log) {
  /*
    Prefer the actor_name supplied by the
    new activity-log backend.
  */
  if (
    typeof log.actor_name ===
      "string" &&
    log.actor_name.trim()
  ) {
    return log.actor_name.trim();
  }

  /*
    Other aliases returned by the API.
  */
  if (
    typeof log.user_name ===
      "string" &&
    log.user_name.trim()
  ) {
    return log.user_name.trim();
  }

  if (
    typeof log.staff_name ===
      "string" &&
    log.staff_name.trim()
  ) {
    return log.staff_name.trim();
  }

  /*
    Standard first_name / last_name fields.
  */
  const directName = [
    log.first_name,
    log.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (directName) {
    return directName;
  }

  /*
    Nested user object fallback.
  */
  const nestedName = [
    log.user?.first_name,
    log.user?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (nestedName) {
    return nestedName;
  }

  if (
    typeof log.user?.name ===
      "string" &&
    log.user.name.trim()
  ) {
    return log.user.name.trim();
  }

  /*
    A NULL user_id can happen for an old log
    whose user was deleted.
  */
  if (
    log.user_id === null ||
    log.user_id === undefined
  ) {
    return "System / Former user";
  }

  return "Staff member (name unavailable)";
}

function logPersonRole(log) {
  return (
    log.role ||
    log.actor_role ||
    log.user_role ||
    log.staff_role ||
    log.user?.role ||
    "Role unavailable"
  );
}

function actionDescription(log) {
  const entity = String(
    log.entity_type || ""
  )
    .replaceAll("_", " ")
    .toLowerCase();

  const action = String(
    log.action || ""
  ).toLowerCase();

  const details =
    parseDetails(log.details) || {};

  /* Authentication */

  if (
    action === "auth.login" ||
    action === "login"
  ) {
    return "User logged in";
  }

  if (
    action === "auth.register" ||
    action === "register"
  ) {
    return "Guest account registered";
  }

  /* Time-off */

  if (
    entity === "time off" &&
    action === "review"
  ) {
    if (
      details.status ===
      "approved"
    ) {
      return "Spa Manager approved a time-off request";
    }

    if (
      details.status ===
        "rejected" ||
      details.status ===
        "declined"
    ) {
      return "Spa Manager declined a time-off request";
    }

    return "Spa Manager reviewed a time-off request";
  }

  /* Services */

  if (
    entity === "service" &&
    action === "create"
  ) {
    return "Spa Manager added a service";
  }

  if (
    entity === "service" &&
    action === "update"
  ) {
    return "Spa Manager updated a service";
  }

  /* Therapist status */

  if (
    entity === "therapist" &&
    action.includes("status")
  ) {
    return Number(
      details.is_active
    )
      ? "Spa Manager activated a therapist account"
      : "Spa Manager deactivated a therapist account";
  }

  /* Receptionist operations */

  if (
    entity === "appointment" &&
    action.includes("confirm")
  ) {
    return "Receptionist confirmed an appointment";
  }

  if (
    entity === "appointment" &&
    (
      action.includes("decline") ||
      action.includes("cancel")
    )
  ) {
    return "Receptionist declined an appointment";
  }

  if (
    entity === "appointment" &&
    action.includes("check_in")
  ) {
    return "Receptionist checked in a client";
  }

  if (
    entity === "appointment" &&
    action.includes("check_out")
  ) {
    return "Receptionist checked out a client";
  }

  if (
    entity === "payment" &&
    (
      action.includes("record") ||
      action.includes("create")
    )
  ) {
    return "Receptionist recorded a payment";
  }

  if (
    entity === "client" &&
    action.includes("update")
  ) {
    return "Receptionist updated a client record";
  }

  /* Generic fallback */

  const readableAction =
    titleCase(
      action
        .replaceAll(".", " ")
        .replaceAll("_", " ")
    ) || "Staff action";

  const readableEntity =
    titleCase(entity);

  return `${readableAction}${
    readableEntity
      ? ` · ${readableEntity}`
      : ""
  }`;
}

/* =========================
   COMPONENT
========================= */

export default function ManagerActivityLogs() {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    action,
    setAction,
  ] = useState("All");

  const [
    user,
    setUser,
  ] = useState("All");

  const [
    from,
    setFrom,
  ] = useState("");

  const [
    to,
    setTo,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  /*
    IMPORTANT:

    We ONLY load activity logs now.

    We do NOT load /therapists because
    every activity log already contains
    the actor's name and role.
  */
  const {
    data,
    loading,
    error,
    retry,
  } = useLoad(
    async () => {
      const response =
        await getManager(
          "/activity-logs"
        );

      return {
        logs:
          response.logs || [],
      };
    },
    []
  );

  const rows =
    data?.logs || [];

  /* =========================
     FILTER OPTIONS
  ========================= */

  const actions =
    useMemo(
      () => [
        "All",

        ...new Set(
          rows.map((row) =>
            titleCase(
              String(
                row.action ||
                  "Unknown"
              )
                .replaceAll(
                  ".",
                  " "
                )
                .replaceAll(
                  "_",
                  " "
                )
            )
          )
        ),
      ],
      [rows]
    );

  const users =
    useMemo(
      () => [
        "All",

        ...new Set(
          rows.map(
            logPersonName
          )
        ),
      ],
      [rows]
    );

  /* =========================
     FILTERING
  ========================= */

  const filtered =
    useMemo(
      () =>
        rows.filter(
          (row) => {
            const name =
              logPersonName(
                row
              );

            const role =
              logPersonRole(
                row
              );

            const actionName =
              titleCase(
                String(
                  row.action ||
                    "Unknown"
                )
                  .replaceAll(
                    ".",
                    " "
                  )
                  .replaceAll(
                    "_",
                    " "
                  )
              );

            const day =
              String(
                row.created_at ||
                  ""
              ).slice(
                0,
                10
              );

            const matchesAction =
              action ===
                "All" ||
              actionName ===
                action;

            const matchesUser =
              user === "All" ||
              name === user;

            const matchesFrom =
              !from ||
              day >= from;

            const matchesTo =
              !to ||
              day <= to;

            const haystack =
              `
                ${name}
                ${role}
                ${actionDescription(
                  row
                )}
                ${
                  row.entity_type ||
                  ""
                }
                ${
                  row.action ||
                  ""
                }
              `.toLowerCase();

            const matchesSearch =
              haystack.includes(
                search
                  .trim()
                  .toLowerCase()
              );

            return (
              matchesAction &&
              matchesUser &&
              matchesFrom &&
              matchesTo &&
              matchesSearch
            );
          }
        ),
      [
        rows,
        search,
        action,
        user,
        from,
        to,
      ]
    );

  /* =========================
     PAGINATION
  ========================= */

  const pages =
    Math.max(
      1,
      Math.ceil(
        filtered.length /
          10
      )
    );

  const currentPage =
    Math.min(
      page,
      pages
    );

  const view =
    filtered.slice(
      (currentPage - 1) *
        10,

      currentPage * 10
    );

  const change =
    (setter) =>
    (event) => {
      setter(
        event.target.value
      );

      setPage(1);
    };

  /* =========================
     RENDER
  ========================= */

  return (
    <>
      <PageHeader
        title="Activity Logs"
        subtitle="A readable history of staff and operational changes."
      />

      <Card>
        <div className="zm-toolbar zm-log-filters">
          <label>
            Search

            <input
              value={search}
              onChange={change(
                setSearch
              )}
              placeholder="Search staff or activity"
            />
          </label>

          <label>
            Action

            <select
              value={action}
              onChange={change(
                setAction
              )}
            >
              {actions.map(
                (item) => (
                  <option
                    key={
                      item
                    }
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Staff member

            <select
              value={user}
              onChange={change(
                setUser
              )}
            >
              {users.map(
                (item) => (
                  <option
                    key={
                      item
                    }
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            From

            <input
              type="date"
              value={from}
              onChange={change(
                setFrom
              )}
            />
          </label>

          <label>
            To

            <input
              type="date"
              value={to}
              onChange={change(
                setTo
              )}
            />
          </label>
        </div>

        {error && (
          <ErrorState
            message={error}
            onRetry={retry}
          />
        )}

        {loading ? (
          <Loading />
        ) : (
          !error && (
            <>
              <DataTable
                headers={[
                  "Who",
                  "What",
                  "Date and time",
                  "Details",
                ]}
                empty="No matching activities"
              >
                {view.map(
                  (row) => {
                    const details =
                      parseDetails(
                        row.details
                      );

                    const hasDetails =
                      details &&
                      typeof details ===
                        "object"
                        ? Object.keys(
                            details
                          )
                            .length >
                          0
                        : Boolean(
                            details
                          );

                    return (
                      <tr
                        key={
                          row.id
                        }
                      >
                        <td>
                          <strong>
                            {logPersonName(
                              row
                            )}
                          </strong>

                          <div className="zm-small">
                            {logPersonRole(
                              row
                            )}
                          </div>
                        </td>

                        <td>
                          {actionDescription(
                            row
                          )}
                        </td>

                        <td>
                          {dateTimeText(
                            row.created_at
                          )}
                        </td>

                        <td>
                          {hasDetails ? (
                            <details>
                              <summary>
                                View
                                details
                              </summary>

                              <pre className="zm-details">
                                {typeof details ===
                                "object"
                                  ? JSON.stringify(
                                      details,
                                      null,
                                      2
                                    )
                                  : String(
                                      details
                                    )}
                              </pre>
                            </details>
                          ) : (
                            <span className="zm-small">
                              No
                              additional
                              details
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </DataTable>

              <div className="zm-pagination">
                <span>
                  Showing{" "}
                  {filtered.length
                    ? (currentPage -
                        1) *
                        10 +
                      1
                    : 0}
                  –
                  {Math.min(
                    currentPage *
                      10,
                    filtered.length
                  )}{" "}
                  of{" "}
                  {
                    filtered.length
                  }
                </span>

                <Button
                  kind="outline"
                  disabled={
                    currentPage <=
                    1
                  }
                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        current -
                        1
                    )
                  }
                >
                  Previous
                </Button>

                <span>
                  Page{" "}
                  {
                    currentPage
                  }{" "}
                  of {pages}
                </span>

                <Button
                  kind="outline"
                  disabled={
                    currentPage >=
                    pages
                  }
                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        current +
                        1
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </>
          )
        )}
      </Card>
    </>
  );
}