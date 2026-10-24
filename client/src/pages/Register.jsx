import { useState } from "react";
import { Link } from "react-router-dom";

function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    console.log("Registration:", formData);

    setError("");

    setMessage(
      "Registration form is ready. Account creation will be connected later."
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
            Register
          </h3>

          <div className="d-inline-flex align-items-center text-white">
            <p className="m-0">
              <Link className="text-white" to="/">
                Home
              </Link>
            </p>

            <i className="far fa-circle px-3"></i>

            <p className="m-0">
              Register
            </p>
          </div>
        </div>
      </div>

      {/* Register */}
      <div className="container-fluid py-5">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-7 col-md-9">
              <div className="bg-light p-4 p-md-5">
                <div className="text-center mb-4">
                  <h6 className="d-inline-block bg-white text-primary text-uppercase py-1 px-2">
                    Create Account
                  </h6>

                  <h1 className="mb-3">
                    Join Zenora
                  </h1>

                  <p className="mb-0">
                    Create a guest account to book and manage
                    your spa appointments.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="first-name">
                          First Name
                        </label>

                        <input
                          id="first-name"
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="form-control p-4"
                          placeholder="First name"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="last-name">
                          Last Name
                        </label>

                        <input
                          id="last-name"
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="form-control p-4"
                          placeholder="Last name"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="register-email">
                      Email Address
                    </label>

                    <input
                      id="register-email"
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
                    <label htmlFor="register-phone">
                      Contact Number
                    </label>

                    <input
                      id="register-phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-control p-4"
                      placeholder="Enter your contact number"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="register-password">
                          Password
                        </label>

                        <input
                          id="register-password"
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="form-control p-4"
                          placeholder="Password"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="confirm-password">
                          Confirm Password
                        </label>

                        <input
                          id="confirm-password"
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
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

                  <button
                    type="submit"
                    className="btn btn-primary btn-block py-3"
                  >
                    Create Account
                  </button>

                  {message && (
                    <p className="text-success text-center mt-3 mb-0">
                      {message}
                    </p>
                  )}
                </form>

                <p className="text-center mt-4 mb-0">
                  Already have an account?{" "}
                  <Link to="/login">
                    Login here
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

export default Register;