
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { staffRequest } from "../../api/staffAuth";

const API_BASE = "/api/manager";

export default function ManagerTherapists() {
  const navigate = useNavigate();

  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [availability, setAvailability] = useState([]);

const getToken = () =>
  sessionStorage.getItem("zenoraStaffToken");

  const loadTherapists = useCallback(async () => {
    try {
      setError("");
      const token = getToken();

      if (!token) {
        navigate("/staff/login");
        return;
      }

      const data = await staffRequest(
        `${API_BASE}/therapists`,
        token
      );

      setTherapists(data.therapists || []);
    } catch (err) {
      setError(err.message || "Unable to load therapists.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadTherapists();
  }, [loadTherapists]);

  async function updateStatus(therapist) {
    const newStatus = therapist.is_active ? false : true;

    const confirmed = window.confirm(
      `${newStatus ? "Activate" : "Deactivate"} this therapist?`
    );

    if (!confirmed) return;

    try {
      setBusyId(therapist.id);
      setError("");
      setMessage("");

      const token = getToken();

      await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/manager/therapists/${therapist.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            is_active: newStatus,
          }),
        }
      ).then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to update therapist."
          );
        }

        return data;
      });

      setMessage("Therapist status updated successfully.");
      await loadTherapists();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function viewAvailability(therapistId) {
    try {
      setError("");
      setSelectedId(therapistId);
      setAvailability([]);

      const token = getToken();

      const data = await staffRequest(
        `${API_BASE}/therapists/${therapistId}/availability`,
        token
      );

      setAvailability(data.availability || []);
    } catch (err) {
      setError(err.message || "Unable to load availability.");
    }
  }

  return (
    <div
      className="container"
      style={{ paddingTop: 45, paddingBottom: 70 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <h2>Therapist Management</h2>

        <Link
          to="/manager/dashboard"
          className="btn btn-outline-primary"
        >
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {message && (
        <div className="alert alert-success">{message}</div>
      )}

      {loading ? (
        <p>Loading therapists...</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Specialties</th>
                <th>Account Status</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {therapists.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">
                    No therapists found.
                  </td>
                </tr>
              ) : (
                therapists.map((therapist) => (
                  <tr key={therapist.id}>
                    <td>
                      {therapist.first_name}{" "}
                      {therapist.last_name}
                    </td>

                    <td>{therapist.email}</td>

                    <td>
                      {therapist.specialties || "Not specified"}
                    </td>

                    <td>
                      {therapist.is_active
                        ? "Active"
                        : "Inactive"}
                    </td>

                    <td>
                      {therapist.is_available
                        ? "Available"
                        : "Unavailable"}
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() =>
                            viewAvailability(therapist.id)
                          }
                        >
                          View Schedule
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          disabled={busyId === therapist.id}
                          onClick={() =>
                            updateStatus(therapist)
                          }
                        >
                          {busyId === therapist.id
                            ? "Saving..."
                            : therapist.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedId !== null && (
        <div
          style={{
            marginTop: 30,
            padding: 24,
            background: "#fff0ed",
            borderRadius: 6,
          }}
        >
          <h4>Therapist Availability Schedule</h4>

          {availability.length === 0 ? (
            <p>No availability schedule configured yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                  </tr>
                </thead>

                <tbody>
                  {availability.map((slot, index) => (
                    <tr key={slot.id ?? index}>
                      <td>{slot.day_of_week}</td>
                      <td>{slot.start_time}</td>
                      <td>{slot.end_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
