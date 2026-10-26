
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { staffRequest } from "../../api/staffAuth";

export default function ManagerActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLogs() {
      try {
        const token = sessionStorage.getItem("zenoraStaffToken");

        const data = await staffRequest(
          "/api/manager/activity-logs",
          token
        );

        if (active) {
          setLogs(data.logs || []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load activity logs.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLogs();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <h2>Activity Logs</h2>

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

      {loading ? (
        <p>Loading activity logs...</p>
      ) : !error && logs.length === 0 ? (
        <p>No activity logs found.</p>
      ) : !error && (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>User ID</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th>Entity ID</th>
                <th>Details</th>
                <th>Date and Time</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.user_id ?? "N/A"}</td>
                  <td>{log.action || "N/A"}</td>
                  <td>{log.entity_type || "N/A"}</td>
                  <td>{log.entity_id ?? "N/A"}</td>
                  <td>
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        margin: 0,
                        fontFamily: "inherit",
                      }}
                    >
                      {typeof log.details === "string"
                        ? log.details
                        : JSON.stringify(log.details ?? "")}
                    </pre>
                  </td>
                  <td>{log.created_at || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
