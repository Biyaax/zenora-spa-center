import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";
import { api } from "../../api/client";

function Notifications() {
  const [notifications, setNotifications] =
    useState([]);

  const [filter, setFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [markingId, setMarkingId] =
    useState(null);

  const [markingAll, setMarkingAll] =
    useState(false);

  /* =======================================================
     LOAD REAL NOTIFICATIONS
  ======================================================= */

  const loadNotifications =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const data = await api(
          "/me/notifications"
        );

        setNotifications(
          Array.isArray(data?.items)
            ? data.items
            : []
        );
      } catch (err) {
        console.error(
          "Unable to load notifications:",
          err
        );

        setError(
          err?.message ||
            "Unable to load your notifications."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  /* =======================================================
     COUNTS / FILTER
  ======================================================= */

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          Number(
            notification.is_read
          ) !== 1
      ).length,
    [notifications]
  );

  const visibleNotifications =
    useMemo(() => {
      if (filter === "unread") {
        return notifications.filter(
          (notification) =>
            Number(
              notification.is_read
            ) !== 1
        );
      }

      return notifications;
    }, [
      filter,
      notifications,
    ]);

  /* =======================================================
     DATE / TIME
  ======================================================= */

  const formatDateTime = (
    value
  ) => {
    if (!value) {
      return {
        date: "Date unavailable",
        time: "",
      };
    }

    /*
     * PostgreSQL text timestamps in this project may look like:
     * 2026-10-28 14:30:00
     *
     * Replace the space so browsers can parse it reliably.
     */
    const normalized =
      String(value).includes("T")
        ? String(value)
        : String(value).replace(
            " ",
            "T"
          );

    const parsed =
      new Date(normalized);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return {
        date: String(value),
        time: "",
      };
    }

    return {
      date:
        parsed.toLocaleDateString(
          "en-PH",
          {
            month: "long",
            day: "numeric",
            year: "numeric",
          }
        ),

      time:
        parsed.toLocaleTimeString(
          "en-PH",
          {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }
        ),
    };
  };

  /* =======================================================
     ICON
  ======================================================= */

  const getNotificationIcon = (
    type
  ) => {
    const value = String(
      type || ""
    ).toLowerCase();

    if (
      value.includes(
        "confirm"
      )
    ) {
      return "far fa-check-circle";
    }

    if (
      value.includes(
        "reminder"
      )
    ) {
      return "far fa-bell";
    }

    if (
      value.includes(
        "reschedul"
      )
    ) {
      return "far fa-calendar-alt";
    }

    if (
      value.includes(
        "cancel"
      ) ||
      value.includes(
        "declin"
      )
    ) {
      return "far fa-times-circle";
    }

    if (
      value.includes(
        "complete"
      )
    ) {
      return "fas fa-spa";
    }

    if (
      value.includes(
        "booking"
      )
    ) {
      return "far fa-calendar-check";
    }

    return "far fa-bell";
  };

  /* =======================================================
     MARK ONE AS READ
  ======================================================= */

  const markAsRead =
    async (id) => {
      if (
        markingId !== null ||
        markingAll
      ) {
        return;
      }

      setMarkingId(id);
      setError("");

      try {
        await api(
          `/me/notifications/${id}/read`,
          {
            method: "PATCH",
          }
        );

        /*
         * Only update the UI after the backend
         * confirms that Supabase was updated.
         */
        setNotifications(
          (current) =>
            current.map(
              (
                notification
              ) =>
                notification.id ===
                id
                  ? {
                      ...notification,
                      is_read: 1,
                    }
                  : notification
            )
        );
      } catch (err) {
        console.error(
          "Unable to mark notification as read:",
          err
        );

        setError(
          err?.message ||
            "Unable to mark the notification as read."
        );
      } finally {
        setMarkingId(null);
      }
    };

  /* =======================================================
     MARK ALL AS READ
  ======================================================= */

  const markAllAsRead =
    async () => {
      if (
        markingAll ||
        markingId !== null ||
        unreadCount === 0
      ) {
        return;
      }

      setMarkingAll(true);
      setError("");

      try {
        await api(
          "/me/notifications/read-all",
          {
            method: "PATCH",
          }
        );

        setNotifications(
          (current) =>
            current.map(
              (
                notification
              ) => ({
                ...notification,
                is_read: 1,
              })
            )
        );
      } catch (err) {
        console.error(
          "Unable to mark all notifications as read:",
          err
        );

        setError(
          err?.message ||
            "Unable to mark all notifications as read."
        );
      } finally {
        setMarkingAll(false);
      }
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <div className="container-fluid py-5 mt-4">
        <div className="container">

          {/* =============================================
              HEADING
          ============================================= */}

          <div className="d-flex flex-wrap justify-content-between align-items-center mb-5">
            <div>
              <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
                Guest Account
              </h6>

              <h1 className="mb-2">
                Notifications
              </h1>

              <p className="text-muted mb-0">
                View booking updates,
                confirmations, and
                appointment reminders.
              </p>
            </div>

            <Link
              to="/guest/dashboard"
              className="btn btn-outline-primary mt-3 mt-md-0"
            >
              <i className="fa fa-home mr-2"></i>
              Back to Dashboard
            </Link>
          </div>

          {/* =============================================
              ERROR
          ============================================= */}

          {error && (
            <div
              className="alert alert-danger mb-4"
              role="alert"
            >
              <div className="d-flex flex-wrap align-items-center justify-content-between">
                <span>
                  {error}
                </span>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger ml-2"
                  onClick={
                    loadNotifications
                  }
                  disabled={
                    loading
                  }
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* =============================================
              CONTROLS
          ============================================= */}

          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">

            <div className="btn-group mb-2">
              <button
                type="button"
                className={`btn ${
                  filter ===
                  "all"
                    ? "btn-primary"
                    : "btn-outline-primary"
                }`}
                onClick={() =>
                  setFilter(
                    "all"
                  )
                }
              >
                All
              </button>

              <button
                type="button"
                className={`btn ${
                  filter ===
                  "unread"
                    ? "btn-primary"
                    : "btn-outline-primary"
                }`}
                onClick={() =>
                  setFilter(
                    "unread"
                  )
                }
              >
                Unread (
                {loading
                  ? "—"
                  : unreadCount}
                )
              </button>
            </div>

            {!loading &&
              unreadCount >
                0 && (
                <button
                  type="button"
                  className="btn btn-light mb-2"
                  onClick={
                    markAllAsRead
                  }
                  disabled={
                    markingAll ||
                    markingId !==
                      null
                  }
                >
                  <i className="far fa-check-circle mr-2"></i>

                  {markingAll
                    ? "Marking..."
                    : "Mark All as Read"}
                </button>
              )}
          </div>

          {/* =============================================
              LOADING
          ============================================= */}

          {loading ? (
            <div className="bg-light text-center p-5">
              <i className="fas fa-spinner fa-spin fa-3x text-primary mb-4"></i>

              <h4>
                Loading Notifications
              </h4>

              <p className="text-muted mb-0">
                Retrieving your
                latest booking
                updates...
              </p>
            </div>
          ) : visibleNotifications.length >
            0 ? (

            /* ===========================================
               REAL NOTIFICATIONS
            =========================================== */

            <div className="guest-notification-list">

              {visibleNotifications.map(
                (
                  notification
                ) => {
                  const isRead =
                    Number(
                      notification.is_read
                    ) === 1;

                  const {
                    date,
                    time,
                  } =
                    formatDateTime(
                      notification.created_at
                    );

                  const isThisMarking =
                    markingId ===
                    notification.id;

                  return (
                    <div
                      key={
                        notification.id
                      }
                      className={`guest-notification-item p-4 mb-3 ${
                        isRead
                          ? "bg-light"
                          : "guest-notification-unread"
                      }`}
                    >
                      <div className="d-flex align-items-start">

                        {/* ICON */}

                        <div className="guest-notification-icon mr-3">
                          <i
                            className={`${getNotificationIcon(
                              notification.type
                            )} fa-lg`}
                          ></i>
                        </div>

                        {/* CONTENT */}

                        <div className="flex-grow-1">

                          <div className="d-flex flex-wrap justify-content-between align-items-start">
                            <div>

                              <h5 className="mb-1">
                                {notification.title ||
                                  "Notification"}

                                {!isRead && (
                                  <span className="badge badge-primary ml-2">
                                    New
                                  </span>
                                )}
                              </h5>

                              <p className="text-muted small mb-3">
                                {date}

                                {time && (
                                  <>
                                    {" "}
                                    at{" "}
                                    {time}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          <p className="mb-3">
                            {notification.message ||
                              "No additional details were provided."}
                          </p>

                          {!isRead && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                markAsRead(
                                  notification.id
                                )
                              }
                              disabled={
                                markingAll ||
                                markingId !==
                                  null
                              }
                            >
                              {isThisMarking
                                ? "Marking..."
                                : "Mark as Read"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          ) : (

            /* ===========================================
               EMPTY
            =========================================== */

            <div className="bg-light text-center p-5">
              <i className="far fa-bell-slash fa-4x text-primary mb-4"></i>

              <h3>
                {filter ===
                "unread"
                  ? "No Unread Notifications"
                  : "No Notifications"}
              </h3>

              <p className="text-muted mb-0">
                {filter ===
                "unread"
                  ? "You're all caught up. You don't have any unread notifications."
                  : "You don't have any notifications to display."}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Notifications;