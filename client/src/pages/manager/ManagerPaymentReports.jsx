
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { staffRequest } from "../../api/staffAuth";

export default function ManagerPaymentReports() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPayments() {
      try {
        const token = sessionStorage.getItem("zenoraStaffToken");

        const data = await staffRequest(
          "/api/manager/reports/payments",
          token
        );

        if (active) {
          setPayments(data.payments || []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load payment reports.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPayments();

    return () => {
      active = false;
    };
  }, []);

  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(amount) || 0);

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <h2>Payment Reports</h2>

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
        <p>Loading payment reports...</p>
      ) : !error && payments.length === 0 ? (
        <p>No payment records found.</p>
      ) : !error && (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Appointment ID</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Reference Number</th>
                <th>Date Paid</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.id}</td>
                  <td>{payment.appointment_id}</td>
                  <td>{formatAmount(payment.amount)}</td>
                  <td>{payment.payment_method || "N/A"}</td>
                  <td>{payment.reference_number || "N/A"}</td>
                  <td>{payment.paid_at || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
