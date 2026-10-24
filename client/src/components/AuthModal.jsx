import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login");

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setMessage("");
      setError("");
    }
  }, [mode, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleLoginChange = (event) => {
    const { name, value } = event.target;

    setLoginData((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;

    setRegisterData((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleLoginSubmit = (event) => {
    event.preventDefault();

    if (!loginData.email.trim() || !loginData.password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    login(loginData.email);

    setError("");
    setMessage("Login successful.");

    setLoginData({
      email: "",
      password: "",
    });

    onClose();
  };

  const handleRegisterSubmit = (event) => {
    event.preventDefault();

    if (
      !registerData.firstName.trim() ||
      !registerData.lastName.trim() ||
      !registerData.email.trim() ||
      !registerData.phone.trim() ||
      !registerData.password.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (
      registerData.password !==
      registerData.confirmPassword
    ) {
      setMessage("");
      setError("Passwords do not match.");
      return;
    }

    register(registerData);

    setError("");
    setMessage("Account created successfully.");

    setRegisterData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });

    onClose();
  };

  const showLogin = () => {
    setMode("login");
    setMessage("");
    setError("");
  };

  const showRegister = () => {
    setMode("register");
    setMessage("");
    setError("");
  };

  return (
    <div
      className="auth-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Close Button */}
        <button
          type="button"
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

        {/* Login */}
        {mode === "login" && (
          <>
            <div className="text-center mb-4">
              <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
                Guest Login
              </h6>

              <h2
                id="auth-modal-title"
                className="mt-3 mb-2"
              >
                Welcome Back
              </h2>

              <p className="text-muted mb-0">
                Sign in to manage your spa appointments.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="modal-login-email">
                  Email Address
                </label>

                <input
                  id="modal-login-email"
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  className="form-control p-4"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-login-password">
                  Password
                </label>

                <input
                  id="modal-login-password"
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  className="form-control p-4"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input
                    id="modal-remember"
                    type="checkbox"
                    className="form-check-input"
                  />

                  <label
                    className="form-check-label"
                    htmlFor="modal-remember"
                  >
                    Remember me
                  </label>
                </div>

                <button
                  type="button"
                  className="auth-text-button"
                >
                  Forgot Password?
                </button>
              </div>

              {error && (
                <p className="text-danger text-center">
                  {error}
                </p>
              )}

              {message && (
                <p className="text-success text-center">
                  {message}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block py-3"
              >
                Login
              </button>
            </form>

            <p className="text-center mt-4 mb-0">
              Don't have an account?{" "}
              <button
                type="button"
                className="auth-text-button font-weight-bold"
                onClick={showRegister}
              >
                Register here
              </button>
            </p>
          </>
        )}

        {/* Register */}
        {mode === "register" && (
          <>
            <div className="text-center mb-4">
              <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
                Create Account
              </h6>

              <h2
                id="auth-modal-title"
                className="mt-3 mb-2"
              >
                Join Zenora
              </h2>

              <p className="text-muted mb-0">
                Create a guest account to book and manage
                your appointments.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit}>
              <div className="form-row">
                <div className="col-sm-6">
                  <div className="form-group">
                    <label htmlFor="modal-first-name">
                      First Name
                    </label>

                    <input
                      id="modal-first-name"
                      type="text"
                      name="firstName"
                      value={registerData.firstName}
                      onChange={handleRegisterChange}
                      className="form-control p-4"
                      placeholder="First name"
                      required
                    />
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="form-group">
                    <label htmlFor="modal-last-name">
                      Last Name
                    </label>

                    <input
                      id="modal-last-name"
                      type="text"
                      name="lastName"
                      value={registerData.lastName}
                      onChange={handleRegisterChange}
                      className="form-control p-4"
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="modal-register-email">
                  Email Address
                </label>

                <input
                  id="modal-register-email"
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  className="form-control p-4"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-phone">
                  Contact Number
                </label>

                <input
                  id="modal-phone"
                  type="tel"
                  name="phone"
                  value={registerData.phone}
                  onChange={handleRegisterChange}
                  className="form-control p-4"
                  placeholder="Enter your contact number"
                  required
                />
              </div>

              <div className="form-row">
                <div className="col-sm-6">
                  <div className="form-group">
                    <label htmlFor="modal-register-password">
                      Password
                    </label>

                    <input
                      id="modal-register-password"
                      type="password"
                      name="password"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      className="form-control p-4"
                      placeholder="Password"
                      required
                    />
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="form-group">
                    <label htmlFor="modal-confirm-password">
                      Confirm Password
                    </label>

                    <input
                      id="modal-confirm-password"
                      type="password"
                      name="confirmPassword"
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      className="form-control p-4"
                      placeholder="Confirm password"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-danger text-center">
                  {error}
                </p>
              )}

              {message && (
                <p className="text-success text-center">
                  {message}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block py-3"
              >
                Create Account
              </button>
            </form>

            <p className="text-center mt-4 mb-0">
              Already have an account?{" "}
              <button
                type="button"
                className="auth-text-button font-weight-bold"
                onClick={showLogin}
              >
                Login here
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthModal;