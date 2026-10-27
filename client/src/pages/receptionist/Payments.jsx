import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import ReceptionistSidebar from "../../components/ReceptionistSidebar";
import ReceptionistTopbar from "../../components/ReceptionistTopbar";

import {
  staffRequest,
} from "../../api/staffAuth";

function money(value) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }
  ).format(
    Number(value || 0)
  );
}

function labelMethod(method) {
  if (!method) {
    return "—";
  }

  switch (
    String(method).toLowerCase()
  ) {
    case "cash":
      return "Cash";

    case "gcash":
      return "GCash";

    case "card":
      return "Card";

    case "bank transfer":
      return "Bank Transfer";

    case "other":
      return "Other";

    default:
      return method;
  }
}

function Payments() {
  const navigate =
    useNavigate();

  const [
    payments,
    setPayments,
  ] = useState([]);

  const [
    paymentMethods,
    setPaymentMethods,
  ] = useState([
    "cash",
    "gcash",
    "card",
    "bank transfer",
    "other",
  ]);

  const [
    summary,
    setSummary,
  ] = useState({
    awaitingPayment: 0,
    recordedPayments: 0,
  });

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    view,
    setView,
  ] = useState("unpaid");

  const [
    selectedPayment,
    setSelectedPayment,
  ] = useState(null);

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("");

  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState("");

  const [
    reference,
    setReference,
  ] = useState("");

  const [
    receipt,
    setReceipt,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const loadPayments =
    useCallback(
      async () => {
        const token =
          sessionStorage.getItem(
            "zenoraStaffToken"
          );

        if (!token) {
          navigate(
            "/staff/login",
            {
              replace: true,
            }
          );

          return;
        }

        setLoading(true);
        setError("");

        try {
          const data =
            await staffRequest(
              "/api/reception/payments",
              token
            );

          setPayments(
            Array.isArray(
              data.records
            )
              ? data.records
              : []
          );

          setSummary({
            awaitingPayment:
              Number(
                data.summary
                  ?.awaitingPayment ||
                  0
              ),

            recordedPayments:
              Number(
                data.summary
                  ?.recordedPayments ||
                  0
              ),
          });

          if (
            Array.isArray(
              data.paymentMethods
            ) &&
            data.paymentMethods
              .length
          ) {
            setPaymentMethods(
              data.paymentMethods
            );
          }
        } catch (err) {
          setPayments([]);

          setError(
            err.message ||
              "Unable to load payment records."
          );
        } finally {
          setLoading(false);
        }
      },
      [navigate]
    );

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const filteredPayments =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return payments.filter(
        (payment) => {
          const matchesSearch =
            [
              payment.bookingId,
              payment.client,
              payment.email,
              payment.service,
              payment.therapist,
            ].some(
              (field) =>
                String(
                  field || ""
                )
                  .toLowerCase()
                  .includes(
                    keyword
                  )
            );

          if (!matchesSearch) {
            return false;
          }

          if (
            view === "unpaid"
          ) {
            return (
              payment.paymentStatus ===
              "Unpaid"
            );
          }

          if (
            view === "paid"
          ) {
            return (
              payment.paymentStatus ===
              "Paid"
            );
          }

          return true;
        }
      );
    }, [
      payments,
      search,
      view,
    ]);

  const openPaymentModal =
    (payment) => {
      setSelectedPayment(
        payment
      );

      setPaymentMethod(
        ""
      );

      setPaymentAmount(
        String(
          Number(
            payment.balance ||
              0
          ).toFixed(2)
        )
      );

      setReference("");
      setError("");
      setMessage("");
    };

  const closePaymentModal =
    () => {
      if (saving) {
        return;
      }

      setSelectedPayment(null);
      setPaymentMethod("");
      setPaymentAmount("");
      setReference("");
    };

  const recordPayment =
    async () => {
      if (
        !selectedPayment ||
        !paymentMethod
      ) {
        return;
      }

      const amount =
        Number(paymentAmount);

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        setError(
          "Enter a valid payment amount."
        );

        return;
      }

      if (
        amount >
        Number(
          selectedPayment.balance
        )
      ) {
        setError(
          `Payment cannot exceed the remaining balance of ${money(
            selectedPayment.balance
          )}.`
        );

        return;
      }

      const token =
        sessionStorage.getItem(
          "zenoraStaffToken"
        );

      if (!token) {
        navigate(
          "/staff/login",
          {
            replace: true,
          }
        );

        return;
      }

      try {
        setSaving(true);
        setError("");
        setMessage("");

        const data =
          await staffRequest(
            `/api/reception/payments/${selectedPayment.appointmentId}`,
            token,
            {
              method: "POST",

              body:
                JSON.stringify({
                  amount,

                  method:
                    paymentMethod,

                  reference:
                    reference.trim(),
                }),
            }
          );

        setSelectedPayment(
          null
        );

        setPaymentMethod("");
        setPaymentAmount("");
        setReference("");

        if (data.receipt) {
          setReceipt(
            data.receipt
          );
        }

        setMessage(
          "Payment recorded successfully."
        );

        await loadPayments();
      } catch (err) {
        setError(
          err.message ||
            "Unable to record payment."
        );
      } finally {
        setSaving(false);
      }
    };

  const openReceipt =
    async (payment) => {
      if (
        !payment.latestPaymentId
      ) {
        setError(
          "No payment receipt is available for this appointment."
        );

        return;
      }

      const token =
        sessionStorage.getItem(
          "zenoraStaffToken"
        );

      if (!token) {
        navigate(
          "/staff/login",
          {
            replace: true,
          }
        );

        return;
      }

      try {
        setError("");

        const data =
          await staffRequest(
            `/api/reception/payments/receipt/${payment.latestPaymentId}`,
            token
          );

        setReceipt(
          data.receipt
        );
      } catch (err) {
        setError(
          err.message ||
            "Unable to load receipt."
        );
      }
    };

  const closeReceipt =
    () => {
      if (sending) {
        return;
      }

      setReceipt(null);
    };

  const printReceipt =
    () => {
      window.print();
    };

  const sendReceipt =
    async () => {
      const paymentId =
        receipt?.payment?.id;

      if (!paymentId) {
        return;
      }

      const token =
        sessionStorage.getItem(
          "zenoraStaffToken"
        );

      if (!token) {
        navigate(
          "/staff/login",
          {
            replace: true,
          }
        );

        return;
      }

      try {
        setSending(true);
        setError("");
        setMessage("");

        const data =
          await staffRequest(
            `/api/reception/payments/receipt/${paymentId}/send`,
            token,
            {
              method: "POST",
            }
          );

        setMessage(
          data.message ||
            "Receipt sent successfully."
        );
      } catch (err) {
        setError(
          err.message ||
            "Unable to send receipt."
        );
      } finally {
        setSending(false);
      }
    };

  return (
    <div className="receptionist-layout">
      <ReceptionistSidebar />

      <main className="receptionist-main">
        <ReceptionistTopbar
          title="Payments"
        />

        <div className="receptionist-content">
          <div className="mb-4">
            <h1 className="mb-2">
              Payment Management
            </h1>

            <p className="text-muted mb-0">
              Record client
              payments and provide
              receipts after spa
              sessions.
            </p>
          </div>

          {error && (
            <div
              className="alert alert-danger"
              role="alert"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              className="alert alert-success"
              role="status"
            >
              {message}
            </div>
          )}

          <div className="row mb-2">
            <div className="col-md-6 mb-4">
              <div className="receptionist-stat-card">
                <div>
                  <p className="text-muted mb-1">
                    Awaiting Payment
                  </p>

                  <h2 className="mb-0">
                    {loading
                      ? "—"
                      : summary.awaitingPayment}
                  </h2>
                </div>

                <div className="receptionist-stat-icon">
                  <i className="far fa-clock"></i>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="receptionist-stat-card">
                <div>
                  <p className="text-muted mb-1">
                    Recorded Payments
                  </p>

                  <h2 className="mb-0">
                    {loading
                      ? "—"
                      : money(
                          summary.recordedPayments
                        )}
                  </h2>
                </div>

                <div className="receptionist-stat-icon">
                  <i className="fas fa-wallet"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="receptionist-payment-tabs mb-4">
            <button
              type="button"
              className={
                view ===
                "unpaid"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setView(
                  "unpaid"
                )
              }
            >
              Awaiting Payment
            </button>

            <button
              type="button"
              className={
                view ===
                "paid"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setView(
                  "paid"
                )
              }
            >
              Paid
            </button>

            <button
              type="button"
              className={
                view ===
                "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setView(
                  "all"
                )
              }
            >
              All
            </button>
          </div>

          <div className="receptionist-panel mb-4">
            <div className="receptionist-search-box">
              <i className="fas fa-search"></i>

              <input
                type="text"
                placeholder="Search booking ID, client, service, or therapist..."
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
              />
            </div>
          </div>

          <div className="receptionist-panel">
            <div className="mb-4">
              <h4 className="mb-1">
                Payment Records
              </h4>

              <p className="text-muted mb-0">
                {loading
                  ? "Loading payment records..."
                  : `${
                      filteredPayments.length
                    } record${
                      filteredPayments.length ===
                      1
                        ? ""
                        : "s"
                    } found`}
              </p>
            </div>

            {loading ? (
              <div className="receptionist-empty-state">
                <i className="fas fa-spinner fa-spin"></i>

                <h4>
                  Loading Payments
                </h4>

                <p>
                  Retrieving real
                  payment records.
                </p>
              </div>
            ) : filteredPayments.length >
              0 ? (
              <div className="table-responsive">
                <table className="table receptionist-table receptionist-payment-table">
                  <thead>
                    <tr>
                      <th>
                        Booking ID
                      </th>

                      <th>
                        Client
                      </th>

                      <th>
                        Service
                      </th>

                      <th>
                        Therapist
                      </th>

                      <th>
                        Balance
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Method
                      </th>

                      <th>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPayments.map(
                      (
                        payment
                      ) => (
                        <tr
                          key={
                            payment.appointmentId
                          }
                        >
                          <td>
                            <strong>
                              {
                                payment.bookingId
                              }
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {payment.client ||
                                "—"}
                            </strong>

                            <small className="d-block text-muted">
                              {payment.email ||
                                "No email"}
                            </small>
                          </td>

                          <td>
                            {payment.service ||
                              "—"}
                          </td>

                          <td>
                            {payment.therapist ||
                              "—"}
                          </td>

                          <td>
                            <strong>
                              {money(
                                payment.balance
                              )}
                            </strong>

                            <small className="d-block text-muted">
                              Due:{" "}
                              {money(
                                payment.amountDue
                              )}
                            </small>
                          </td>

                          <td>
                            <span
                              className={`badge ${
                                payment.paymentStatus ===
                                "Paid"
                                  ? "badge-success"
                                  : "badge-warning"
                              } px-3 py-2`}
                            >
                              {
                                payment.paymentStatus
                              }
                            </span>
                          </td>

                          <td>
                            {labelMethod(
                              payment.latestPaymentMethod
                            )}
                          </td>

                          <td>
                            {payment.paymentStatus ===
                            "Unpaid" ? (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() =>
                                  openPaymentModal(
                                    payment
                                  )
                                }
                              >
                                <i className="fas fa-money-bill-wave mr-1"></i>
                                Record Payment
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={() =>
                                  openReceipt(
                                    payment
                                  )
                                }
                              >
                                <i className="fas fa-receipt mr-1"></i>
                                Receipt
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="receptionist-empty-state">
                <i className="fas fa-receipt"></i>

                <h4>
                  No Payment Records
                </h4>

                <p>
                  No records match
                  the selected view.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedPayment && (
        <div className="receptionist-modal-backdrop">
          <div className="receptionist-payment-modal">
            <button
              type="button"
              className="receptionist-modal-close"
              onClick={
                closePaymentModal
              }
              disabled={saving}
            >
              ×
            </button>

            <h3 className="mb-1">
              Record Payment
            </h3>

            <p className="text-muted mb-4">
              {
                selectedPayment.bookingId
              }
            </p>

            <div className="receptionist-payment-summary">
              <div>
                <span>
                  Client
                </span>

                <strong>
                  {
                    selectedPayment.client
                  }
                </strong>
              </div>

              <div>
                <span>
                  Service
                </span>

                <strong>
                  {
                    selectedPayment.service
                  }
                </strong>
              </div>

              <div>
                <span>
                  Total Due
                </span>

                <strong>
                  {money(
                    selectedPayment.amountDue
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Paid So Far
                </span>

                <strong>
                  {money(
                    selectedPayment.paidToDate
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Remaining Balance
                </span>

                <strong className="text-primary">
                  {money(
                    selectedPayment.balance
                  )}
                </strong>
              </div>
            </div>

            <div className="form-group mt-4">
              <label>
                Amount *
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                max={
                  selectedPayment.balance
                }
                className="form-control"
                value={
                  paymentAmount
                }
                onChange={(
                  event
                ) =>
                  setPaymentAmount(
                    event.target
                      .value
                  )
                }
              />
            </div>

            <div className="form-group">
              <label>
                Payment Method *
              </label>

              <select
                className="form-control"
                value={
                  paymentMethod
                }
                onChange={(
                  event
                ) =>
                  setPaymentMethod(
                    event.target
                      .value
                  )
                }
              >
                <option value="">
                  Select payment
                  method
                </option>

                {paymentMethods.map(
                  (method) => (
                    <option
                      key={
                        method
                      }
                      value={
                        method
                      }
                    >
                      {labelMethod(
                        method
                      )}
                    </option>
                  )
                )}
              </select>

              <small className="text-muted">
                The system records
                the payment only. It
                does not charge the
                customer's card or
                wallet automatically.
              </small>
            </div>

            <div className="form-group">
              <label>
                Reference Number
              </label>

              <input
                type="text"
                className="form-control"
                maxLength={60}
                placeholder="Optional"
                value={reference}
                onChange={(
                  event
                ) =>
                  setReference(
                    event.target
                      .value
                  )
                }
              />
            </div>

            <div className="d-flex justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-light mr-2"
                onClick={
                  closePaymentModal
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={
                  saving ||
                  !paymentMethod ||
                  !paymentAmount
                }
                onClick={
                  recordPayment
                }
              >
                {saving
                  ? "Recording..."
                  : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div className="receptionist-modal-backdrop">
          <div className="receptionist-receipt-modal">
            <button
              type="button"
              className="receptionist-modal-close receptionist-no-print"
              onClick={
                closeReceipt
              }
              disabled={sending}
            >
              ×
            </button>

            <div className="receptionist-receipt">
              <div className="text-center mb-4">
                <h2 className="text-primary mb-1">
                  ZENORA
                </h2>

                <p className="mb-0">
                  Spa & Massage
                  Wellness Center
                </p>

                <small className="text-muted">
                  Official Payment
                  Receipt
                </small>
              </div>

              <hr />

              <div className="receptionist-receipt-row">
                <span>
                  Receipt No.
                </span>

                <strong>
                  {
                    receipt.receipt_number
                  }
                </strong>
              </div>

              <div className="receptionist-receipt-row">
                <span>
                  Booking ID
                </span>

                <strong>
                  {`APT-${String(
                    receipt
                      .appointment
                      ?.id || ""
                  ).padStart(
                    4,
                    "0"
                  )}`}
                </strong>
              </div>

              <div className="receptionist-receipt-row">
                <span>
                  Client
                </span>

                <strong>
                  {receipt.client
                    ?.name || "—"}
                </strong>
              </div>

              <div className="receptionist-receipt-row">
                <span>
                  Service
                </span>

                <strong>
                  {receipt
                    .appointment
                    ?.service_name ||
                    "—"}
                </strong>
              </div>

              <div className="receptionist-receipt-row">
                <span>
                  Therapist
                </span>

                <strong>
                  {receipt
                    .appointment
                    ?.therapist_name ||
                    "—"}
                </strong>
              </div>

              <div className="receptionist-receipt-row">
                <span>
                  Payment Method
                </span>

                <strong>
                  {labelMethod(
                    receipt
                      .payment
                      ?.method
                  )}
                </strong>
              </div>

              {receipt.payment
                ?.reference_number && (
                <div className="receptionist-receipt-row">
                  <span>
                    Reference
                  </span>

                  <strong>
                    {
                      receipt
                        .payment
                        .reference_number
                    }
                  </strong>
                </div>
              )}

              <hr />

              <div className="receptionist-receipt-row">
                <span>
                  Total Due
                </span>

                <strong>
                  {money(
                    receipt.amount_due
                  )}
                </strong>
              </div>

              <div className="receptionist-receipt-row">
                <span>
                  Paid To Date
                </span>

                <strong>
                  {money(
                    receipt.paid_to_date
                  )}
                </strong>
              </div>

              <div className="receptionist-receipt-row">
                <span>
                  Remaining Balance
                </span>

                <strong>
                  {money(
                    receipt.balance
                  )}
                </strong>
              </div>

              <div className="receptionist-receipt-total">
                <span>
                  Amount Paid
                </span>

                <strong>
                  {money(
                    receipt.payment
                      ?.amount
                  )}
                </strong>
              </div>

              <p className="text-center text-muted small mt-4 mb-0">
                Thank you for
                choosing Zenora.
              </p>
            </div>

            <div className="receptionist-receipt-actions receptionist-no-print">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={
                  printReceipt
                }
              >
                <i className="fas fa-print mr-2"></i>
                Print Receipt
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={
                  sendReceipt
                }
                disabled={sending}
              >
                <i className="far fa-envelope mr-2"></i>

                {sending
                  ? "Sending..."
                  : "Send Receipt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;