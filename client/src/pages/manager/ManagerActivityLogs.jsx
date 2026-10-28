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


/* =========================================================
   HELPERS
========================================================= */

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];


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
   * Prefer actor_name supplied by
   * the activity-log backend.
   */

  if (
    typeof log.actor_name ===
      "string" &&
    log.actor_name.trim()
  ) {
    return log.actor_name.trim();
  }

  /*
   * Other aliases returned by API.
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
   * Standard first_name / last_name.
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
   * Nested user object fallback.
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
   * NULL user_id can happen for an
   * old log whose user was deleted.
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

  /* Staff */

  if (
    entity === "staff" &&
    action.includes("schedule")
  ) {
    return "Spa Manager updated a therapist schedule";
  }

  if (
    entity === "staff" &&
    action.includes("create")
  ) {
    return "Spa Manager added a staff account";
  }

  if (
    entity === "staff" &&
    action.includes("update")
  ) {
    return "Spa Manager updated a staff account";
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
    (
      action.includes("check_in") ||
      action.includes("check-in")
    )
  ) {
    return "Receptionist checked in a client";
  }

  if (
    entity === "appointment" &&
    (
      action.includes("check_out") ||
      action.includes("check-out")
    )
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


/* =========================================================
   DETAIL FORMATTERS
========================================================= */

function readableKey(value) {
  return titleCase(
    String(value || "")
      .replaceAll("_", " ")
      .replaceAll(".", " ")
  );
}


function formatTime(value) {
  if (!value) {
    return "Not specified";
  }

  const [
    rawHour,
    rawMinute,
  ] = String(value).split(":");

  const hour =
    Number(rawHour);

  const minute =
    Number(rawMinute || 0);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return String(value);
  }

  const date = new Date();

  date.setHours(
    hour,
    minute,
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-PH",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  );
}


function readableStatus(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not specified";
  }

  return titleCase(
    String(value)
      .replaceAll("_", " ")
      .replaceAll("-", " ")
  );
}


function formatDetailValue(
  key,
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not specified";
  }

  /*
   * Boolean-like database fields
   */

  if (
    String(key).startsWith(
      "is_"
    )
  ) {
    return Number(value)
      ? "Yes"
      : "No";
  }

  if (
    typeof value === "boolean"
  ) {
    return value
      ? "Yes"
      : "No";
  }

  /*
   * Status
   */

  if (
    String(key)
      .toLowerCase()
      .includes("status")
  ) {
    return readableStatus(
      value
    );
  }

  /*
   * Times
   */

  if (
    key === "start_time" ||
    key === "end_time"
  ) {
    return formatTime(value);
  }

  /*
   * Arrays of primitive values
   */

  if (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item !== "object"
    )
  ) {
    return value
      .map(
        (item) =>
          readableStatus(item)
      )
      .join(", ");
  }

  return String(value);
}


/* =========================================================
   READABLE DETAILS COMPONENT
========================================================= */

function ActivityDetails({
  details,
}) {
  const parsed =
    parseDetails(details);

  if (!parsed) {
    return (
      <span className="zm-small">
        No additional details
      </span>
    );
  }

  /*
   * Plain string details
   */

  if (
    typeof parsed !== "object"
  ) {
    return (
      <div
        style={{
          maxWidth: "420px",
          padding: "12px 14px",
          borderRadius: "8px",
          background:
            "#fffaf8",
          border:
            "1px solid #f1e2dc",
          lineHeight: 1.6,
        }}
      >
        {String(parsed)}
      </div>
    );
  }

  /*
   * Therapist schedule
   *
   * Example:
   * {
   *   windows: [
   *     {
   *       day_of_week: 1,
   *       start_time: "09:00",
   *       end_time: "18:00"
   *     }
   *   ]
   * }
   */

  if (
    Array.isArray(
      parsed.windows
    )
  ) {
    if (
      parsed.windows.length ===
      0
    ) {
      return (
        <div
          style={{
            maxWidth:
              "420px",
            padding:
              "12px 14px",
            borderRadius:
              "8px",
            background:
              "#fffaf8",
            border:
              "1px solid #f1e2dc",
          }}
        >
          <strong>
            Weekly schedule cleared
          </strong>

          <div
            className="zm-small"
            style={{
              marginTop:
                "6px",
            }}
          >
            No working hours
            are assigned.
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          padding: "14px",
          borderRadius: "8px",
          background:
            "#fffaf8",
          border:
            "1px solid #f1e2dc",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom:
              "10px",
          }}
        >
          Weekly Schedule
        </div>

        <div
          style={{
            display: "grid",
            gap: "8px",
          }}
        >
          {parsed.windows.map(
            (
              window,
              index
            ) => {
              const day =
                WEEKDAYS[
                  Number(
                    window.day_of_week
                  )
                ] ||
                `Day ${
                  window.day_of_week
                }`;

              return (
                <div
                  key={`${window.day_of_week}-${window.start_time}-${index}`}
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "100px 1fr",
                    gap:
                      "14px",
                    alignItems:
                      "center",
                    paddingBottom:
                      "7px",
                    borderBottom:
                      index ===
                      parsed
                        .windows
                        .length -
                        1
                        ? "none"
                        : "1px solid #f1e5e0",
                  }}
                >
                  <span
                    style={{
                      color:
                        "#6f6f6f",
                    }}
                  >
                    {day}
                  </span>

                  <strong>
                    {formatTime(
                      window.start_time
                    )}
                    {" – "}
                    {formatTime(
                      window.end_time
                    )}
                  </strong>
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  }

  /*
   * Status-only log
   */

  if (
    Object.prototype.hasOwnProperty.call(
      parsed,
      "status"
    ) &&
    Object.keys(parsed)
      .length === 1
  ) {
    return (
      <div
        style={{
          maxWidth: "420px",
          padding: "12px 14px",
          borderRadius: "8px",
          background:
            "#fffaf8",
          border:
            "1px solid #f1e2dc",
        }}
      >
        <span
          style={{
            color: "#777",
          }}
        >
          Status:
        </span>{" "}

        <strong>
          {readableStatus(
            parsed.status
          )}
        </strong>
      </div>
    );
  }

  /*
   * Message-only log
   */

  if (
    parsed.message &&
    Object.keys(parsed)
      .length === 1
  ) {
    return (
      <div
        style={{
          maxWidth: "420px",
          padding: "12px 14px",
          borderRadius: "8px",
          background:
            "#fffaf8",
          border:
            "1px solid #f1e2dc",
          lineHeight: 1.6,
        }}
      >
        {parsed.message}
      </div>
    );
  }

  /*
   * Generic readable object
   */

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "430px",
        padding: "12px 14px",
        borderRadius: "8px",
        background:
          "#fffaf8",
        border:
          "1px solid #f1e2dc",
      }}
    >
      {Object.entries(
        parsed
      ).map(
        ([
          key,
          value,
        ]) => {
          /*
           * Nested object
           */

          if (
            value &&
            typeof value ===
              "object" &&
            !Array.isArray(
              value
            )
          ) {
            return (
              <div
                key={key}
                style={{
                  padding:
                    "8px 0",
                  borderBottom:
                    "1px solid #f1e5e0",
                }}
              >
                <div
                  style={{
                    fontWeight:
                      700,
                    marginBottom:
                      "6px",
                  }}
                >
                  {readableKey(
                    key
                  )}
                </div>

                {Object.entries(
                  value
                ).map(
                  ([
                    childKey,
                    childValue,
                  ]) => (
                    <div
                      key={
                        childKey
                      }
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "120px 1fr",
                        gap:
                          "12px",
                        marginTop:
                          "5px",
                      }}
                    >
                      <span
                        style={{
                          color:
                            "#777",
                        }}
                      >
                        {readableKey(
                          childKey
                        )}
                      </span>

                      <strong>
                        {formatDetailValue(
                          childKey,
                          childValue
                        )}
                      </strong>
                    </div>
                  )
                )}
              </div>
            );
          }

          /*
           * Array containing objects
           */

          if (
            Array.isArray(
              value
            ) &&
            value.some(
              (item) =>
                item &&
                typeof item ===
                  "object"
            )
          ) {
            return (
              <div
                key={key}
                style={{
                  padding:
                    "8px 0",
                }}
              >
                <div
                  style={{
                    fontWeight:
                      700,
                    marginBottom:
                      "6px",
                  }}
                >
                  {readableKey(
                    key
                  )}
                </div>

                {value.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      style={{
                        padding:
                          "8px 10px",
                        marginBottom:
                          "6px",
                        background:
                          "#fff",
                        border:
                          "1px solid #eee0db",
                        borderRadius:
                          "6px",
                      }}
                    >
                      {item &&
                      typeof item ===
                        "object"
                        ? Object.entries(
                            item
                          ).map(
                            ([
                              childKey,
                              childValue,
                            ]) => (
                              <div
                                key={
                                  childKey
                                }
                                style={{
                                  display:
                                    "grid",
                                  gridTemplateColumns:
                                    "120px 1fr",
                                  gap:
                                    "12px",
                                  margin:
                                    "4px 0",
                                }}
                              >
                                <span
                                  style={{
                                    color:
                                      "#777",
                                  }}
                                >
                                  {readableKey(
                                    childKey
                                  )}
                                </span>

                                <strong>
                                  {formatDetailValue(
                                    childKey,
                                    childValue
                                  )}
                                </strong>
                              </div>
                            )
                          )
                        : String(
                            item
                          )}
                    </div>
                  )
                )}
              </div>
            );
          }

          /*
           * Normal field
           */

          return (
            <div
              key={key}
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "130px 1fr",
                gap: "12px",
                padding:
                  "7px 0",
                borderBottom:
                  "1px solid #f1e5e0",
              }}
            >
              <span
                style={{
                  color:
                    "#777",
                }}
              >
                {readableKey(
                  key
                )}
              </span>

              <strong
                style={{
                  wordBreak:
                    "break-word",
                }}
              >
                {formatDetailValue(
                  key,
                  value
                )}
              </strong>
            </div>
          );
        }
      )}
    </div>
  );
}


/* =========================================================
   COMPONENT
========================================================= */

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


  /* =======================================================
     LOAD ACTIVITY LOGS
  ======================================================= */

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
          response.logs ||
          [],
      };
    },
    []
  );

  const rows =
    data?.logs || [];


  /* =======================================================
     FILTER OPTIONS
  ======================================================= */

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


  /* =======================================================
     FILTERING
  ======================================================= */

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


  /* =======================================================
     PAGINATION
  ======================================================= */

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


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <PageHeader
        title="Activity Logs"
        subtitle="A readable history of staff and operational changes."
      />

      <Card>

        {/* ===============================================
            FILTERS
        =============================================== */}

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
                    key={item}
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
                    key={item}
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


        {/* ===============================================
            ERROR
        =============================================== */}

        {error && (
          <ErrorState
            message={error}
            onRetry={retry}
          />
        )}


        {/* ===============================================
            TABLE
        =============================================== */}

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
                          ).length >
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

                        {/* WHO */}

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


                        {/* WHAT */}

                        <td>
                          {actionDescription(
                            row
                          )}
                        </td>


                        {/* DATE */}

                        <td>
                          {dateTimeText(
                            row.created_at
                          )}
                        </td>


                        {/* DETAILS */}

                        <td>
                          {hasDetails ? (
                            <details
                              style={{
                                maxWidth:
                                  "450px",
                              }}
                            >
                              <summary
                                style={{
                                  cursor:
                                    "pointer",
                                  fontWeight:
                                    600,
                                  color:
                                    "#a45f4c",
                                  userSelect:
                                    "none",
                                }}
                              >
                                View details
                              </summary>

                              <div
                                style={{
                                  marginTop:
                                    "10px",
                                }}
                              >
                                <ActivityDetails
                                  details={
                                    row.details
                                  }
                                />
                              </div>
                            </details>
                          ) : (
                            <span className="zm-small">
                              No additional
                              details
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </DataTable>


              {/* =========================================
                  PAGINATION
              ========================================= */}

              <div className="zm-pagination">

                <span>
                  Showing{" "}

                  {filtered.length
                    ? (currentPage -
                        1) *
                        10 +
                      1
                    : 0}

                  {" – "}

                  {Math.min(
                    currentPage *
                      10,
                    filtered.length
                  )}

                  {" of "}

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