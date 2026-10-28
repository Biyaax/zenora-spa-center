import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { validateStaffLogin } from "../utils/validation";
import { normalizePhPhone, validateRegistration, registrationEmailError } from "../utils/registrationValidation";
import "./AuthModal.css";

function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const {
    login,
    register,
  } = useAuth();

  const [mode, setMode] = useState("login");
  const [codeAction, setCodeAction] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [emailProof, setEmailProof] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [proofUntil, setProofUntil] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  const [clock, setClock] = useState(() => Date.now());


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

  const normalizedEmail = registerData.email.trim().toLowerCase();
  const emailVerified = Boolean(emailProof && verifiedEmail === normalizedEmail && clock < proofUntil);
  useEffect(() => {
    if (!isOpen || mode !== "register") return;
    const timer=setInterval(()=>setClock(Date.now()),1000);
    return ()=>clearInterval(timer);
  },[isOpen,mode]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submittingRef = useRef(false);
  const registerFormRef = useRef(null);
  const [touched, setTouched] = useState({});
  const [serverFields, setServerFields] = useState({});
  const loginErrors = validateStaffLogin(loginData.email, loginData.password);
  const registerErrors = {
    ...validateRegistration(registerData),
    ...serverFields,
  };

  function validationProps(scope, field) {
    const errors = scope === "register" ? registerErrors : loginErrors;
    const invalid = Boolean(touched[`${scope}.${field}`] && errors[field]);
    return {
      onBlur: () => setTouched((current) => ({ ...current, [`${scope}.${field}`]: true })),
      "aria-invalid": invalid,
      "aria-describedby": invalid ? `auth-${scope}-${field}-error` :
        scope === "register" && ["email", "phone", "password"].includes(field) ? `auth-${field}-help` : undefined,
    };
  }

  function fieldError(scope, field) {
    const errors = scope === "register" ? registerErrors : loginErrors;
    return touched[`${scope}.${field}`] && errors[field] ? (
      <div id={`auth-${scope}-${field}-error`} className="text-danger small mt-1">{errors[field]}</div>
    ) : null;
  }

  function showInvalidFields(event, scope, errors) {
    const fields = scope === "register" ? Object.keys(registerData) : Object.keys(loginData);
    setTouched((current) => ({ ...current, ...Object.fromEntries(fields.map((field) => [`${scope}.${field}`, true])) }));
    if (Object.keys(errors).length) {
      setError("Please correct the highlighted fields.");
      event.currentTarget.elements.namedItem(Object.keys(errors)[0])?.focus();
      return true;
    }
    return false;
  }

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
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !busy && !submittingRef.current) {
        setMessage("");
        setError("");
        setTouched({});
        setServerFields({});
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
    const firstField = Object.keys(serverFields)[0];
    if (isOpen && mode === "register" && !busy && firstField) {
      registerFormRef.current?.elements.namedItem(firstField)?.focus();
    }
  }, [isOpen, mode, busy, serverFields]);

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

    setTouched((current) => ({ ...current, [`login.${name}`]: true }));
    setMessage("");
    setError("");
    setServerFields({});
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;

    if (name === "email") {
      setChallengeId(""); setCode(""); setCodeError(""); setEmailProof(""); setVerifiedEmail(""); setProofUntil(0); setResendAt(0);
    }
    setRegisterData((current) => ({
      ...current,
      [name]: value,
    }));

    setTouched((current) => ({ ...current, [`register.${name}`]: true }));
    setMessage("");
    setError("");
    setServerFields((current) => {
      if (!current[name]) return current;
      const next = { ...current }; delete next[name]; return next;
    });
  };

  async function sendRegistrationCode() {
    if (submittingRef.current || busy) return;
    setTouched((current)=>({...current,"register.email":true}));
    const invalidEmail=registrationEmailError(registerData.email);
    if (invalidEmail) { setError(invalidEmail); return; }
    setServerFields((current)=>{const next={...current};delete next.email;return next;});
    setCodeAction("sending");
    submittingRef.current=true; setBusy(true); setError(""); setMessage(""); setCodeError("");
    setEmailProof(""); setVerifiedEmail("");
    try {
      const result=await api("/auth/registration-code/send",{method:"POST",body:{email:normalizedEmail}});
      setChallengeId(result.challengeId); setCode(""); setResendAt(Date.now()+result.resendAfter*1000); setMessage(result.message);
    } catch(failure){setError(failure.message);} finally{submittingRef.current=false;setBusy(false);setCodeAction("");}
  }
  async function verifyRegistrationCode() {
    if (submittingRef.current || busy) return;
    if (!/^\d{8}$/.test(code)) {setCodeError("Enter the 8-digit code from your Gmail inbox.");return;}
    setCodeAction("verifying");
    submittingRef.current=true;setBusy(true);setError("");setCodeError("");
    try {
      const result=await api("/auth/registration-code/verify",{method:"POST",body:{email:normalizedEmail,challengeId,code}});
      setEmailProof(result.verificationToken);setVerifiedEmail(normalizedEmail);setProofUntil(Date.now()+result.expiresIn*1000);setMessage(result.message);
    } catch(failure){setCodeError(failure.message);}finally{submittingRef.current=false;setBusy(false);setCodeAction("");}
  }

  /* =======================================================
     LOGIN
  ======================================================= */

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    if (busy || submittingRef.current) {
      return;
    }

    setMessage("");
    setError("");

    const email = loginData.email.trim().toLowerCase();
    const password = loginData.password;

    if (showInvalidFields(event, "login", loginErrors)) return;
    submittingRef.current = true;
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

      setTouched({});
      setServerFields({});
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
      submittingRef.current = false;
      setBusy(false);
    }
  };

  /* =======================================================
     REGISTER
  ======================================================= */

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    if (busy || submittingRef.current) {
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
        normalizePhPhone(registerData.phone),

      password:
        registerData.password,

      confirmPassword:
        registerData.confirmPassword,
    };

    setServerFields({});
    const registrationErrors = {
      ...validateRegistration(registerData),
      };
    if (showInvalidFields(event, "register", registrationErrors)) return;
    if (!emailVerified) { setError("Verify your Gmail with the emailed code before creating your account."); return; }
    cleanedData.emailVerificationToken = emailProof;
    submittingRef.current = true;
    setBusy(true);

    try {
      const result = await register(
        cleanedData
      );

      setTouched({});
      setServerFields({});
      if (!result.emailVerified || result.requiresEmailVerification) throw new Error("The running backend is outdated. Use the updated API before registering.");
      setLoginData({email:cleanedData.email,password:""});
      setRegisterData({firstName:"",lastName:"",email:"",phone:"",password:"",confirmPassword:""});
      setChallengeId(""); setCode(""); setEmailProof(""); setVerifiedEmail("");
      setShowRegisterPassword(false); setShowConfirmPassword(false);
      setMode("login"); setMessage(result.message);
    } catch (err) {
      const fields = err?.details?.fields || {};
      setServerFields(fields);
      setError(
        err?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  };

  /* =======================================================
     MODE HELPERS
  ======================================================= */

  const showLogin = () => {
    if (busy || submittingRef.current) {
      return;
    }

    setMode("login");
    setMessage("");
    setError("");
    setTouched({});
    setServerFields({});

    setShowRegisterPassword(false);
    setShowConfirmPassword(false);
  };

  const showRegister = () => {
    if (busy || submittingRef.current) {
      return;
    }

    setMode("register");
    setMessage("");
    setError("");
    setTouched({});
    setServerFields({});

    setShowLoginPassword(false);
  };

  const closeModal = () => {
    if (!busy && !submittingRef.current) {
      setTouched({});
      setServerFields({});
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

            <form noValidate aria-busy={busy}
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
                  autoCapitalize="none"
                  spellCheck={false}
                  {...validationProps("login", "email")}
                  maxLength={254}
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
                {fieldError("login", "email")}
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
                    {...validationProps("login", "password")}
                    maxLength={4096}
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
                {fieldError("login", "password")}
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
                  title="Password recovery will be provided separately."
                >
                  Forgot Password?
                </button>
              </div>

              {error && (
                <p className="text-danger text-center" role="alert">
                  {error}
                </p>
              )}

              {message && (
                <p className="text-success text-center" role="status">
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

            <form ref={registerFormRef} noValidate aria-busy={busy}
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
                      {...validationProps("register", "firstName")}
                      maxLength={80}
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
                    {fieldError("register", "firstName")}
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="form-group">
                    <label htmlFor="modal-last-name">
                      Last Name
                    </label>

                    <input
                      id="modal-last-name"
                      {...validationProps("register", "lastName")}
                      maxLength={80}
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
                    {fieldError("register", "lastName")}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="modal-register-email">
                  Email Address
                </label>

                <input
                  id="modal-register-email"
                  autoCapitalize="none"
                  spellCheck={false}
                  {...validationProps("register", "email")}
                  maxLength={254}
                  type="email"
                  name="email"
                  value={
                    registerData.email
                  }
                  onChange={
                    handleRegisterChange
                  }
                  className="form-control p-4"
                  placeholder="yourname@gmail.com"
                  autoComplete="email"
                  disabled={busy}
                  required
                />
                {fieldError("register", "email")}
                <small id="auth-email-help" className="text-muted d-block mt-1">Verify the code sent to your Gmail before creating an account.</small>
              </div>

              <div className="form-group">
                <button type="button" className="btn btn-outline-primary btn-block" onClick={sendRegistrationCode} disabled={busy || Boolean(registrationEmailError(registerData.email)) || clock < resendAt}>
                  {codeAction === "sending" ? "Sending Code..." : clock < resendAt ? `Resend code in ${Math.ceil((resendAt-clock)/1000)}s` : challengeId ? "Send New Verification Code" : "Send Verification Code"}
                </button>
                {challengeId && !emailVerified && <div className="mt-3">
                  <label htmlFor="registration-code">Gmail Verification Code</label>
                  <input id="registration-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8} className="form-control" value={code} disabled={busy}
                    onChange={event=>{setCode(event.target.value);setCodeError(/^\d{8}$/.test(event.target.value)?"":"Enter the 8-digit code from your Gmail inbox.");}}
                    aria-invalid={Boolean(codeError)} aria-describedby={codeError?"registration-code-error":undefined}/>
                  {codeError && <div id="registration-code-error" className="text-danger small mt-1">{codeError}</div>}
                  <button type="button" className="btn btn-primary btn-block mt-2" onClick={verifyRegistrationCode} disabled={busy}>{codeAction === "verifying" ? "Verifying..." : "Verify Code"}</button>
                </div>}
                {emailVerified && <p className="text-success mt-2" role="status">Gmail verified. Complete the details and create your account.</p>}
                {!emailVerified && emailProof && <p className="text-danger mt-2">Verification expired. Request a new code.</p>}
                {message && <p className="text-success mt-2" role="status">{message}</p>}
                <small className="text-muted d-block mt-2">No account is created when requesting or verifying a code.</small>
              </div>

              <div className="form-group">
                <label htmlFor="modal-phone">
                  Contact Number
                </label>

                <input
                  id="modal-phone"
                  {...validationProps("register", "phone")}
                  maxLength={30}
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
                {fieldError("register", "phone")}
                <small id="auth-phone-help" className="text-muted d-block mt-1">09XXXXXXXXX or +639XXXXXXXXX</small>
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
                        {...validationProps("register", "password")}
                        maxLength={72}
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
                    {fieldError("register", "password")}
                    <small id="auth-password-help" className="text-muted d-block mt-1">At least 8 characters. Very long passwords with emojis may exceed the limit.</small>
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
                        {...validationProps("register", "confirmPassword")}
                        maxLength={72}
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
                    {fieldError("register", "confirmPassword")}
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-danger text-center" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block py-3"
                disabled={busy || !emailVerified}
              >
                {busy
                  ? (codeAction ? "Verify Gmail First" : "Creating Account...")
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

      </div>
    </div>
  );
}

export default AuthModal;
