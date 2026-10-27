
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffRequest } from "../../api/staffAuth";

function TherapistDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("zenoraStaffToken");

    if (!token) {
      navigate("/staff/login", { replace: true });
      return;
    }

    const today = new Date().toLocaleDateString("en-CA");

    staffRequest(
      `/api/therapist/schedule?date=${today}&view=daily`,
      token
    )
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
        <h2>Massage Therapist Dashboard</h2>
        <button className="btn btn-outline-danger" onClick={logout}>
          Logout
        </button>
      </div>

      {error && <p className="text-danger">{error}</p>}
      {!data && !error && <p>Loading schedule...</p>}

      {data && (
        <div className="bg-light p-4 rounded">
          <h4>Today's Appointments</h4>
          <h2>{data.total ?? 0}</h2>
          <p>Schedule data loaded from the Zenora backend.</p>
        </div>
      )}
    </div>
  );
}

export default TherapistDashboard;
