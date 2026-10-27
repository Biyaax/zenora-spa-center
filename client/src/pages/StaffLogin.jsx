
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffLogin } from "../api/staffAuth";

function StaffLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await staffLogin(email, password);

      if (
        !["Spa Manager", "Massage Therapist"].includes(
          data.user.role
        )
      ) {
        throw new Error("This staff role is not supported yet.");
      }

      sessionStorage.setItem("zenoraStaffToken", data.token);
      sessionStorage.setItem(
        "zenoraStaffUser",
        JSON.stringify(data.user)
      );

      if (data.user.role === "Spa Manager") {
        navigate("/manager/dashboard", { replace: true });
      } else {
        navigate("/therapist/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Unable to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="bg-light p-4 rounded">
        <h2 className="text-center mb-3">Zenora Staff Login</h2>
        <p className="text-center">
          Spa Manager and Massage Therapist
        </p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="staff-email">Email</label>
            <input
              id="staff-email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="staff-password">Password</label>
            <input
              id="staff-password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p role="alert" className="text-danger mt-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block mt-3"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Staff Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StaffLogin;
