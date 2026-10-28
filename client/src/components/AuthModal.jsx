import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const {
    login,
    register,
    resendVerification,
  } = useAuth();

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

  const [verificationEmail, setVerificationEmail] =
    useState("");

  const [verificationNotice, setVerificationNotice] =
    useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Password visibility
  const [showLoginPassword, setShowLoginPassword] =
    useState(false);

  const [
    showRegisterPassword,
    setShowRegisterPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  /* =======================================================
     MODAL BEHAVIOR
  ======================================================= */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    };

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isOpen, onClose, busy]);

  useEffect(() => {
    if (isOpen) {
      setMessage("");
      setError("");
    }
  }, [mode, isOpen]);

  if (!isOpen) {
    return null;
  }

  /* =======================================================
     INPUT HANDLERS
  ======================================================= */

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

  /* =======================================================
     LOGIN
  ======================================================= */

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    if (busy) {
      return;
    }

    setMessage("");
    setError("");

    const email = loginData.email.trim();
    const password = loginData.password;

    if (!email || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    setBusy(true);

    try {
      await login(email, password);

      setLoginData({
        email: "",
        password: "",
      });

      setShowLoginPassword(false);

      setError("");
      setMessage("");

      // Close login modal
      onClose();

      // Guest goes directly to dashboard after login
      navigate("/guest/dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(
        err?.message ||
          "Unable to log in. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  /* =======================================================
     REGISTER
  ======================================================= */

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    if (busy) {
      return;
    }

    setMessage("");
    setError("");

    const cleanedData = {
      firstName:
        registerData.firstName.trim(),

      lastName:
        registerData.lastName.trim(),

      email:
        registerData.email
          .trim()
          .toLowerCase(),

      phone:
        registerData.phone.trim(),

      password:
        registerData.password,

      confirmPassword:
        registerData.confirmPassword,
    };

    if (
      !cleanedData.firstName ||
      !cleanedData.lastName ||
      !cleanedData.email ||
      !cleanedData.phone ||
      !cleanedData.password ||
      !cleanedData.confirmPassword
    ) {
      setError(
        "Please complete all required fields."
      );
      return;
    }

    if (
      cleanedData.password !==
      cleanedData.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const result = await register(
        cleanedData
      );

      setVerificationEmail(
        result?.email ||
          cleanedData.email
      );

      setVerificationNotice(
        result?.message ||
          "Your account was created. Please check your email and verify your account before signing in."
      );

      setRegisterData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      setShowRegisterPassword(false);
      setShowConfirmPassword(false);

      // Keep modal open and show email verification screen
      setMode("verify");
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  /* =======================================================
     RESEND VERIFICATION
  ======================================================= */

  const handleResend = async () => {
    if (
      busy ||
      !verificationEmail
    ) {
      return;
    }

    setMessage("");
    setError("");
    setBusy(true);

    try {
      const result =
        await resendVerification(
          verificationEmail
        );

      setMessage(
        result?.message ||
          "A new verification email has been sent."
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to resend the verification email."
      );
    } finally {
      setBusy(false);
    }
  };

  /* =======================================================
     MODE HELPERS
  ======================================================= */

  const showLogin = () => {
    if (busy) {
      return;
    }

    setMode("login");
    setMessage("");
    setError("");

    setShowRegisterPassword(false);
    setShowConfirmPassword(false);
  };

  const showRegister = () => {
    if (busy) {
      return;
    }

    setMode("register");
    setMessage("");
    setError("");

    setShowLoginPassword(false);
  };

  const closeModal = () => {
    if (!busy) {
      setMessage("");
      setError("");

      setShowLoginPassword(false);
      setShowRegisterPassword(false);
      setShowConfirmPassword(false);

      onClose();
    }
  };

  /* =======================================================
     PASSWORD FIELD STYLES
  ======================================================= */

  const passwordWrapperStyle = {
    position: "relative",
  };

  const passwordInputStyle = {
    paddingRight: "55px",
  };

  const passwordButtonStyle = {
    position: "absolute",
    right: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    padding: "5px",
    margin: 0,
    color: "#777",
    cursor: "pointer",
    zIndex: 3,
    fontSize: "18px",
    lineHeight: 1,
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="auth-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          closeModal();
        }
      }}
    >
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          type="button"
          className="auth-modal-close"
          onClick={closeModal}
          aria-label="Close"
          disabled={busy}
        >
          &times;
        </button>

        {/* =============================================
            LOGIN
        ============================================= */}

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
                Sign in to manage your spa
                appointments.
              </p>
            </div>

            <form
              onSubmit={
                handleLoginSubmit
              }
            >
              <div className="form-group">
                <label htmlFor="modal-login-email">
                  Email Address
                </label>

                <input
                  id="modal-login-email"
                  type="email"
                  name="email"
                  value={
                    loginData.email
                  }
                  onChange={
                    handleLoginChange
                  }
                  className="form-control p-4"
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={busy}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-login-password">
                  Password
                </label>

                <div
                  style={
                    passwordWrapperStyle
                  }
                >
                  <input
                    id="modal-login-password"
                    type={
                      showLoginPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={
                      loginData.password
                    }
                    onChange={
                      handleLoginChange
                    }
                    className="form-control p-4"
                    style={
                      passwordInputStyle
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={busy}
                    required
                  />

                  <button
                    type="button"
                    style={
                      passwordButtonStyle
                    }
                    onClick={() =>
                      setShowLoginPassword(
                        (current) =>
                          !current
                      )
                    }
                    aria-label={
                      showLoginPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    title={
                      showLoginPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    disabled={busy}
                  >
                    <i
                      className={
                        showLoginPassword
                          ? "fas fa-eye-slash"
                          : "fas fa-eye"
                      }
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input
                    id="modal-remember"
                    type="checkbox"
                    className="form-check-input"
                    disabled={busy}
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
                  disabled
                  title="Password recovery is not available yet."
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
                disabled={busy}
              >
                {busy
                  ? "Signing In..."
                  : "Login"}
              </button>
            </form>

            <p className="text-center mt-4 mb-0">
              Don't have an account?{" "}

              <button
                type="button"
                className="auth-text-button font-weight-bold"
                onClick={
                  showRegister
                }
                disabled={busy}
              >
                Register here
              </button>
            </p>
          </>
        )}

        {/* =============================================
            REGISTER
        ============================================= */}

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
                Create a guest account
                to book and manage your
                appointments.
              </p>
            </div>

            <form
              onSubmit={
                handleRegisterSubmit
              }
            >
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
                      value={
                        registerData
                          .firstName
                      }
                      onChange={
                        handleRegisterChange
                      }
                      className="form-control p-4"
                      placeholder="First name"
                      autoComplete="given-name"
                      disabled={busy}
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
                      value={
                        registerData
                          .lastName
                      }
                      onChange={
                        handleRegisterChange
                      }
                      className="form-control p-4"
                      placeholder="Last name"
                      autoComplete="family-name"
                      disabled={busy}
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
                  value={
                    registerData.email
                  }
                  onChange={
                    handleRegisterChange
                  }
                  className="form-control p-4"
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={busy}
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
                  value={
                    registerData.phone
                  }
                  onChange={
                    handleRegisterChange
                  }
                  className="form-control p-4"
                  placeholder="09171234567"
                  autoComplete="tel"
                  disabled={busy}
                  required
                />
              </div>

              <div className="form-row">
                <div className="col-sm-6">
                  <div className="form-group">
                    <label htmlFor="modal-register-password">
                      Password
                    </label>

                    <div
                      style={
                        passwordWrapperStyle
                      }
                    >
                      <input
                        id="modal-register-password"
                        type={
                          showRegisterPassword
                            ? "text"
                            : "password"
                        }
                        name="password"
                        value={
                          registerData
                            .password
                        }
                        onChange={
                          handleRegisterChange
                        }
                        className="form-control p-4"
                        style={
                          passwordInputStyle
                        }
                        placeholder="Password"
                        autoComplete="new-password"
                        disabled={busy}
                        required
                      />

                      <button
                        type="button"
                        style={
                          passwordButtonStyle
                        }
                        onClick={() =>
                          setShowRegisterPassword(
                            (current) =>
                              !current
                          )
                        }
                        aria-label={
                          showRegisterPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        title={
                          showRegisterPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        disabled={busy}
                      >
                        <i
                          className={
                            showRegisterPassword
                              ? "fas fa-eye-slash"
                              : "fas fa-eye"
                          }
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="form-group">
                    <label htmlFor="modal-confirm-password">
                      Confirm Password
                    </label>

                    <div
                      style={
                        passwordWrapperStyle
                      }
                    >
                      <input
                        id="modal-confirm-password"
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        name="confirmPassword"
                        value={
                          registerData
                            .confirmPassword
                        }
                        onChange={
                          handleRegisterChange
                        }
                        className="form-control p-4"
                        style={
                          passwordInputStyle
                        }
                        placeholder="Confirm password"
                        autoComplete="new-password"
                        disabled={busy}
                        required
                      />

                      <button
                        type="button"
                        style={
                          passwordButtonStyle
                        }
                        onClick={() =>
                          setShowConfirmPassword(
                            (current) =>
                              !current
                          )
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        title={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        disabled={busy}
                      >
                        <i
                          className={
                            showConfirmPassword
                              ? "fas fa-eye-slash"
                              : "fas fa-eye"
                          }
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-danger text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block py-3"
                disabled={busy}
              >
                {busy
                  ? "Creating Account..."
                  : "Create Account"}
              </button>
            </form>

            <p className="text-center mt-4 mb-0">
              Already have an account?{" "}

              <button
                type="button"
                className="auth-text-button font-weight-bold"
                onClick={showLogin}
                disabled={busy}
              >
                Login here
              </button>
            </p>
          </>
        )}

        {/* =============================================
            EMAIL VERIFICATION
        ============================================= */}

        {mode === "verify" && (
          <>
            <div className="text-center">
              <div className="mb-4">
                <i className="fas fa-envelope fa-3x text-primary"></i>
              </div>

              <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
                Email Verification
              </h6>

              <h2
                id="auth-modal-title"
                className="mt-3 mb-3"
              >
                Check Your Email
              </h2>

              <p className="text-muted">
                {verificationNotice}
              </p>

              {verificationEmail && (
                <p className="mb-4">
                  We sent the verification
                  link to:
                  <br />

                  <strong>
                    {verificationEmail}
                  </strong>
                </p>
              )}

              <p className="text-muted">
                Click the verification link
                in the email before signing
                in to your Zenora account.
              </p>

              {error && (
                <p className="text-danger">
                  {error}
                </p>
              )}

              {message && (
                <p className="text-success">
                  {message}
                </p>
              )}

              <button
                type="button"
                className="btn btn-primary btn-block py-3 mt-4"
                onClick={
                  handleResend
                }
                disabled={
                  busy ||
                  !verificationEmail
                }
              >
                {busy
                  ? "Sending..."
                  : "Resend Verification Email"}
              </button>

              <button
                type="button"
                className="auth-text-button font-weight-bold mt-4"
                onClick={
                  showLogin
                }
                disabled={busy}
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthModal;