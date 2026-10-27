import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function destinationForRole(role) {
  switch (String(role || "").toLowerCase()) {
    case "spa manager":
    case "manager":
      return "/manager/dashboard";

    case "receptionist":
      return "/receptionist/dashboard";

    case "massage therapist":
      return "/therapist/dashboard";

    case "guest":
    default:
      return "/guest/dashboard";
  }
}

function Login() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [formData, setFormData] =
    useState({
      email: "",
      password: "",
    });

  const [error, setError] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (busy) {
      return;
    }

    const email =
      formData.email.trim();

    const password =
      formData.password;

    if (!email || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    setBusy(true);
    setError("");

    try {
      const user = await login(
        email,
        password
      );

      navigate(
        destinationForRole(
          user?.role
        ),
        {
          replace: true,
        }
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to log in. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div
        className="jumbotron jumbotron-fluid bg-jumbotron"
        style={{
          marginBottom: "90px",
        }}
      >
        <div className="container text-center py-5">
          <h3 className="text-white display-3 mb-4">
            Login
          </h3>

          <div className="d-inline-flex align-items-center text-white">
            <p className="m-0">
              <Link
                className="text-white"
                to="/"
              >
                Home
              </Link>
            </p>

            <i className="far fa-circle px-3"></i>

            <p className="m-0">
              Login
            </p>
          </div>
        </div>
      </div>

      {/* Login */}
      <div className="container-fluid py-5">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-8">
              <div className="bg-light p-4 p-md-5">
                <div className="text-center mb-4">
                  <h6 className="d-inline-block bg-white text-primary text-uppercase py-1 px-2">
                    Account Login
                  </h6>

                  <h1 className="mb-3">
                    Welcome Back
                  </h1>

                  <p className="mb-0">
                    Sign in to access your
                    Zenora account.
                  </p>
                </div>

                <form
                  onSubmit={
                    handleSubmit
                  }
                >
                  <div className="form-group">
                    <label htmlFor="login-email">
                      Email Address
                    </label>

                    <input
                      id="login-email"
                      type="email"
                      name="email"
                      value={
                        formData.email
                      }
                      onChange={
                        handleChange
                      }
                      className="form-control p-4"
                      placeholder="Enter your email"
                      autoComplete="email"
                      disabled={busy}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="login-password">
                      Password
                    </label>

                    <input
                      id="login-password"
                      type="password"
                      name="password"
                      value={
                        formData.password
                      }
                      onChange={
                        handleChange
                      }
                      className="form-control p-4"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={busy}
                      required
                    />
                  </div>

                  {error && (
                    <div className="alert alert-danger">
                      {error}
                    </div>
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
                  Don't have an
                  account?{" "}

                  <Link to="/register">
                    Register here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;