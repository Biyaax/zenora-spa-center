import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffLogin } from "../api/staffAuth";

const STAFF_ROUTES = {
  "Spa Manager": "/manager/dashboard",
  "Massage Therapist": "/therapist/dashboard",
  Receptionist: "/receptionist/dashboard",
};

function StaffLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] =
    useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await staffLogin(
        email,
        password
      );

      const role = data.user?.role;

      const destination =
        Object.prototype.hasOwnProperty.call(
          STAFF_ROUTES,
          role
        )
          ? STAFF_ROUTES[role]
          : null;

      if (!destination) {
        throw new Error(
          "This staff role is not supported yet."
        );
      }

      if (!data.token) {
        throw new Error(
          "Login failed: authentication token missing."
        );
      }

      sessionStorage.setItem(
        "zenoraStaffToken",
        data.token
      );

      sessionStorage.setItem(
        "zenoraStaffUser",
        JSON.stringify(data.user)
      );

      navigate(destination, {
        replace: true,
      });
    } catch (err) {
      setError(
        err.message ||
          "Unable to log in."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container py-5"
      style={{
        maxWidth: 520,
      }}
    >
      <div className="bg-light p-4 rounded">
        <h2 className="text-center mb-3">
          Zenora Staff Login
        </h2>

        <p className="text-center">
          Spa Manager, Receptionist, and
          Massage Therapist
        </p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="staff-email">
              Email
            </label>

            <input
              id="staff-email"
              type="email"
              className="form-control"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="staff-password">
              Password
            </label>

            <div
              style={{
                position: "relative",
              }}
            >
              <input
                id="staff-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                className="form-control"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                autoComplete="current-password"
                disabled={loading}
                style={{
                  paddingRight: "48px",
                }}
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                title={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                disabled={loading}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  border: "none",
                  background:
                    "transparent",
                  padding: "4px",
                  margin: 0,
                  cursor: "pointer",
                  color: "#777",
                  fontSize: "18px",
                  lineHeight: 1,
                  zIndex: 2,
                }}
              >
                <i
                  className={
                    showPassword
                      ? "fas fa-eye-slash"
                      : "fas fa-eye"
                  }
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="text-danger mt-3"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block mt-3"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Staff Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StaffLogin;