import { useState } from "react";
import { Link } from "react-router-dom";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    console.log("Login:", formData);

    setMessage(
      "Login form is ready. Authentication will be connected later."
    );
  };

  return (
    <>
      {/* Header */}
      <div
        className="jumbotron jumbotron-fluid bg-jumbotron"
        style={{ marginBottom: "90px" }}
      >
        <div className="container text-center py-5">
          <h3 className="text-white display-3 mb-4">
            Login
          </h3>

          <div className="d-inline-flex align-items-center text-white">
            <p className="m-0">
              <Link className="text-white" to="/">
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
                    Guest Login
                  </h6>

                  <h1 className="mb-3">
                    Welcome Back
                  </h1>

                  <p className="mb-0">
                    Sign in to manage your appointments.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="login-email">
                      Email Address
                    </label>

                    <input
                      id="login-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-control p-4"
                      placeholder="Enter your email"
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
                      value={formData.password}
                      onChange={handleChange}
                      className="form-control p-4"
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        id="remember-me"
                        type="checkbox"
                        className="form-check-input"
                      />

                      <label
                        className="form-check-label"
                        htmlFor="remember-me"
                      >
                        Remember me
                      </label>
                    </div>

                    <a href="#forgot-password">
                      Forgot Password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block py-3"
                  >
                    Login
                  </button>

                  {message && (
                    <p className="text-success text-center mt-3 mb-0">
                      {message}
                    </p>
                  )}
                </form>

                <p className="text-center mt-4 mb-0">
                  Don't have an account?{" "}
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