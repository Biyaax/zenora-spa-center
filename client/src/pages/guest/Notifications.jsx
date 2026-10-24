import { useState } from "react";
import { Link } from "react-router-dom";

import initialNotifications from "../../data/guestNotifications";

function Notifications() {
  const [notifications, setNotifications] = useState(
    initialNotifications
  );

  const [filter, setFilter] = useState("all");

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const visibleNotifications =
    filter === "unread"
      ? notifications.filter(
          (notification) => !notification.isRead
        )
      : notifications;

  const formatDate = (date) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "confirmation":
        return "far fa-check-circle";

      case "reminder":
        return "far fa-bell";

      case "reschedule":
        return "far fa-calendar-alt";

      case "cancelled":
        return "far fa-times-circle";

      case "completed":
        return "fas fa-spa";

      default:
        return "far fa-bell";
    }
  };

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              isRead: true,
            }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        isRead: true,
      }))
    );
  };

  return (
    <>
      <div className="container-fluid py-5 mt-4">
        <div className="container">
          {/* Heading */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-5">
            <div>
              <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
                Guest Account
              </h6>

              <h1 className="mb-2">
                Notifications
              </h1>

              <p className="text-muted mb-0">
                View booking updates, confirmations,
                and appointment reminders.
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

          {/* Controls */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <div className="btn-group mb-2">
              <button
                type="button"
                className={`btn ${
                  filter === "all"
                    ? "btn-primary"
                    : "btn-outline-primary"
                }`}
                onClick={() => setFilter("all")}
              >
                All
              </button>

              <button
                type="button"
                className={`btn ${
                  filter === "unread"
                    ? "btn-primary"
                    : "btn-outline-primary"
                }`}
                onClick={() => setFilter("unread")}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-light mb-2"
                onClick={markAllAsRead}
              >
                <i className="far fa-check-circle mr-2"></i>
                Mark All as Read
              </button>
            )}
          </div>

          {/* Notifications */}
          {visibleNotifications.length > 0 ? (
            <div className="guest-notification-list">
              {visibleNotifications.map(
                (notification) => (
                  <div
                    key={notification.id}
                    className={`guest-notification-item p-4 mb-3 ${
                      notification.isRead
                        ? "bg-light"
                        : "guest-notification-unread"
                    }`}
                  >
                    <div className="d-flex align-items-start">
                      {/* Icon */}
                      <div className="guest-notification-icon mr-3">
                        <i
                          className={`${getNotificationIcon(
                            notification.type
                          )} fa-lg`}
                        ></i>
                      </div>

                      {/* Content */}
                      <div className="flex-grow-1">
                        <div className="d-flex flex-wrap justify-content-between align-items-start">
                          <div>
                            <h5 className="mb-1">
                              {notification.title}

                              {!notification.isRead && (
                                <span className="badge badge-primary ml-2">
                                  New
                                </span>
                              )}
                            </h5>

                            <p className="text-muted small mb-3">
                              {formatDate(
                                notification.date
                              )}{" "}
                              at {notification.time}
                            </p>
                          </div>
                        </div>

                        <p className="mb-3">
                          {notification.message}
                        </p>

                        {!notification.isRead && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              markAsRead(
                                notification.id
                              )
                            }
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="bg-light text-center p-5">
              <i className="far fa-bell-slash fa-4x text-primary mb-4"></i>

              <h3>No Notifications</h3>

              <p className="text-muted mb-0">
                You don't have any notifications to
                display.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Notifications;