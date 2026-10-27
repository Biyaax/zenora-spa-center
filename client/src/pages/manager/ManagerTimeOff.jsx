
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { staffRequest } from "../../api/staffAuth";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function ManagerTimeOff() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getToken = () =>
    sessionStorage.getItem("zenoraStaffToken");

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const data = await staffRequest(
        "/api/manager/time-off",
        getToken()
      );

      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message || "Unable to load requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function reviewRequest(id, status) {
    const confirmed = window.confirm(
      `Are you sure you want to ${status === "approved" ? "approve" : "reject"} this request?`
    );

    if (!confirmed) return;

    try {
      setBusyId(id);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/manager/time-off/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to review request."
        );
      }

      setMessage("Time-off request reviewed successfully.");
      await loadRequests();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <h2>Time-Off Requests</h2>
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
        <p>Loading time-off requests...</p>
      ) : requests.length === 0 ? (
        <p>No time-off requests found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Therapist</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    {request.first_name} {request.last_name}
                  </td>
                  <td>{request.start_date}</td>
                  <td>{request.end_date}</td>
                  <td>{request.reason || "N/A"}</td>
                  <td>{request.status}</td>
                  <td>
                    {request.status === "pending" ? (
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-success"
                          disabled={busyId === request.id}
                          onClick={() =>
                            reviewRequest(request.id, "approved")
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          disabled={busyId === request.id}
                          onClick={() =>
                            reviewRequest(request.id, "rejected")
                          }
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span>Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
