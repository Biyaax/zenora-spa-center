
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffRequest } from "../../api/staffAuth";

function ManagerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("zenoraStaffToken");

    if (!token) {
      navigate("/staff/login", { replace: true });
      return;
    }

    staffRequest("/api/manager/dashboard", token)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [navigate]);

  const logout = () => {
    sessionStorage.removeItem("zenoraStaffToken");
    sessionStorage.removeItem("zenoraStaffUser");
    navigate("/staff/login", { replace: true });
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Spa Manager Dashboard</h2>
        <button className="btn btn-outline-danger" onClick={logout}>
          Logout
        </button>
      </div>
            {/* MANAGER NAVIGATION */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/manager/services")}
        >
          Manage Services
        </button>

        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/manager/therapists")}
        >
          Manage Therapists
        </button>

        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/manager/time-off")}
        >
          Time-Off Requests
        </button>

        <button
        className="btn btn-outline-primary"
        onClick={() => navigate("/manager/reports/payments")}
        >
          Payment Reports
        </button>

        <button
        className="btn btn-outline-primary"
        onClick={() => navigate("/manager/activity-logs")}
        >
          Activity Logs
        </button>

      </div>
      
      {error && <p className="text-danger">{error}</p>}
      {!data && !error && <p>Loading dashboard...</p>}

      {data && (
        <div className="row">
          <div className="col-md-4 mb-3">
            <div className="bg-light p-4 rounded">
              <h5>Appointments</h5>
              <h2>{data.dashboard?.appointments ?? 0}</h2>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="bg-light p-4 rounded">
              <h5>Active Services</h5>
              <h2>{data.dashboard?.activeServices ?? 0}</h2>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="bg-light p-4 rounded">
              <h5>Therapists</h5>
              <h2>{data.dashboard?.therapists ?? 0}</h2>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerDashboard;
