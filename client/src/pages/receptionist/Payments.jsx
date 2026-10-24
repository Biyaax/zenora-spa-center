import { useState } from "react";
import ReceptionistSidebar from "../../components/ReceptionistSidebar";

const initialPayments = [
  {
    appointmentId: "APT-1001",
    client: "Bea Mendoza",
    email: "bea@example.com",
    service: "Body Massage",
    therapist: "Maria Santos",
    date: "2026-10-24",
    time: "9:00 AM",
    amount: 650,
    paymentStatus: "Unpaid",
    paymentMethod: "",
    receiptNumber: "",
  },
  {
    appointmentId: "APT-1003",
    client: "Carla Gomez",
    email: "carla@example.com",
    service: "Stone Therapy",
    therapist: "Maria Santos",
    date: "2026-10-24",
    time: "2:00 PM",
    amount: 850,
    paymentStatus: "Unpaid",
    paymentMethod: "",
    receiptNumber: "",
  },
  {
    appointmentId: "APT-0999",
    client: "Daniel Reyes",
    email: "daniel@example.com",
    service: "Skin Care",
    therapist: "Angela Reyes",
    date: "2026-10-24",
    time: "10:00 AM",
    amount: 600,
    paymentStatus: "Paid",
    paymentMethod: "Cash",
    receiptNumber: "RCPT-1001",
  },
];

function Payments() {
  const [payments, setPayments] =
    useState(initialPayments);

  const [search, setSearch] = useState("");

  const [view, setView] = useState("unpaid");

  const [selectedPayment, setSelectedPayment] =
    useState(null);

  const [paymentMethod, setPaymentMethod] =
    useState("");

  const [receipt, setReceipt] = useState(null);

  const filteredPayments = payments.filter(
    (payment) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        payment.appointmentId
          .toLowerCase()
          .includes(keyword) ||
        payment.client
          .toLowerCase()
          .includes(keyword) ||
        payment.service
          .toLowerCase()
          .includes(keyword);

      if (view === "unpaid") {
        return (
          matchesSearch &&
          payment.paymentStatus === "Unpaid"
        );
      }

      if (view === "paid") {
        return (
          matchesSearch &&
          payment.paymentStatus === "Paid"
        );
      }

      return matchesSearch;
    }
  );

  const unpaidCount = payments.filter(
    (payment) =>
      payment.paymentStatus === "Unpaid"
  ).length;

  const paidTodayTotal = payments
    .filter(
      (payment) =>
        payment.paymentStatus === "Paid"
    )
    .reduce(
      (total, payment) =>
        total + payment.amount,
      0
    );

  const openPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setPaymentMethod("");
  };

  const closePaymentModal = () => {
    setSelectedPayment(null);
    setPaymentMethod("");
  };

  const recordPayment = () => {
    if (!selectedPayment || !paymentMethod) {
      return;
    }

    const receiptNumber =
      "RCPT-" +
      String(Date.now()).slice(-6);

    const paidPayment = {
      ...selectedPayment,
      paymentStatus: "Paid",
      paymentMethod,
      receiptNumber,
    };

    setPayments((current) =>
      current.map((payment) =>
        payment.appointmentId ===
        selectedPayment.appointmentId
          ? paidPayment
          : payment
      )
    );

    setReceipt(paidPayment);

    closePaymentModal();
  };

  const openReceipt = (payment) => {
    setReceipt(payment);
  };

  const closeReceipt = () => {
    setReceipt(null);
  };

  const printReceipt = () => {
    window.print();
  };

  const sendReceipt = () => {
    if (!receipt) {
      return;
    }

    console.log(
      `Receipt ${receipt.receiptNumber} would be sent to ${receipt.email}`
    );

    alert(
      `Receipt prepared for ${receipt.email}. Email sending will be connected to the backend later.`
    );
  };

  return (
    <div className="receptionist-layout">
      <ReceptionistSidebar />

      <main className="receptionist-main">
        {/* Topbar */}
        <div className="receptionist-topbar">
          <div>
            <p className="text-muted mb-1">
              Receptionist Portal
            </p>

            <h3 className="mb-0">
              Payments
            </h3>
          </div>

          <div className="receptionist-topbar-user">
            <i className="far fa-bell mr-3"></i>

            <div className="receptionist-user-circle">
              R
            </div>

            <div className="ml-2">
              <strong>
                Receptionist
              </strong>

              <small className="d-block text-muted">
                Front Desk
              </small>
            </div>
          </div>
        </div>

        <div className="receptionist-content">
          {/* Heading */}
          <div className="mb-4">
            <h1 className="mb-2">
              Payment Management
            </h1>

            <p className="text-muted mb-0">
              Record client payments and provide
              receipts after spa sessions.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="row mb-2">
            <div className="col-md-6 mb-4">
              <div className="receptionist-stat-card">
                <div>
                  <p className="text-muted mb-1">
                    Awaiting Payment
                  </p>

                  <h2 className="mb-0">
                    {unpaidCount}
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
                    ₱
                    {paidTodayTotal.toLocaleString()}
                  </h2>
                </div>

                <div className="receptionist-stat-icon">
                  <i className="fas fa-wallet"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="receptionist-payment-tabs mb-4">
            <button
              type="button"
              className={
                view === "unpaid"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setView("unpaid")
              }
            >
              Awaiting Payment
            </button>

            <button
              type="button"
              className={
                view === "paid"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setView("paid")
              }
            >
              Paid
            </button>

            <button
              type="button"
              className={
                view === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setView("all")
              }
            >
              All
            </button>
          </div>

          {/* Search */}
          <div className="receptionist-panel mb-4">
            <div className="receptionist-search-box">
              <i className="fas fa-search"></i>

              <input
                type="text"
                placeholder="Search booking ID, client, or service..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          </div>

          {/* Table */}
          <div className="receptionist-panel">
            <div className="mb-4">
              <h4 className="mb-1">
                Payment Records
              </h4>

              <p className="text-muted mb-0">
                {
                  filteredPayments.length
                }{" "}
                record
                {filteredPayments.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>

            {filteredPayments.length >
            0 ? (
              <div className="table-responsive">
                <table className="table receptionist-table receptionist-payment-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Client</th>
                      <th>Service</th>
                      <th>Therapist</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Method</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPayments.map(
                      (payment) => (
                        <tr
                          key={
                            payment.appointmentId
                          }
                        >
                          <td>
                            <strong>
                              {
                                payment.appointmentId
                              }
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {payment.client}
                            </strong>

                            <small className="d-block text-muted">
                              {payment.email}
                            </small>
                          </td>

                          <td>
                            {
                              payment.service
                            }
                          </td>

                          <td>
                            {
                              payment.therapist
                            }
                          </td>

                          <td>
                            <strong>
                              ₱
                              {payment.amount.toLocaleString()}
                            </strong>
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
                            {payment.paymentMethod ||
                              "—"}
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
                  No records match the
                  selected view.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Record Payment Modal */}
      {selectedPayment && (
        <div className="receptionist-modal-backdrop">
          <div className="receptionist-payment-modal">
            <button
              type="button"
              className="receptionist-modal-close"
              onClick={closePaymentModal}
            >
              ×
            </button>

            <h3 className="mb-1">
              Record Payment
            </h3>

            <p className="text-muted mb-4">
              {
                selectedPayment.appointmentId
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
                  Amount Due
                </span>

                <strong className="text-primary">
                  ₱
                  {selectedPayment.amount.toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="form-group mt-4">
              <label>
                Payment Method *
              </label>

              <select
                className="form-control"
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Select payment method
                </option>

                <option value="Cash">
                  Cash
                </option>

                <option value="Card">
                  Card
                </option>

                <option value="E-Wallet">
                  E-Wallet
                </option>
              </select>

              <small className="text-muted">
                The system only records the
                payment method. It does not
                process online payments.
              </small>
            </div>

            <div className="d-flex justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-light mr-2"
                onClick={
                  closePaymentModal
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={!paymentMethod}
                onClick={recordPayment}
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <div className="receptionist-modal-backdrop">
          <div className="receptionist-receipt-modal">
            <button
              type="button"
              className="receptionist-modal-close receptionist-no-print"
              onClick={closeReceipt}
            >
              ×
            </button>

            <div className="receptionist-receipt">
              <div className="text-center mb-4">
                <h2 className="text-primary mb-1">
                  ZENORA
                </h2>

                <p className="mb-0">
                  Spa & Massage Wellness Center
                </p>

                <small className="text-muted">
                  Official Payment Receipt
                </small>
              </div>

              <hr />

              <div className="receptionist-receipt-row">
                <span>
                  Receipt No.
                </span>

                <strong>
                  {
                    receipt.receiptNumber
                  }
                </strong>
              </div>

              <div className="receptionist-receipt-row">
                <span>
                  Booking ID
                </span>

                <strong>
                  {
                    receipt.appointmentId
                  }
                </strong>
              </div>

              <div className="receptionist-receipt-row">
                <span>
                  Client
                </span>

                <strong>
                  {receipt.client}
                </strong>
              </div>

              <div className="receptionist-receipt-row">
                <span>
                  Service
                </span>

                <strong>
                  {receipt.service}
                </strong>
              </div>

              <div className="receptionist-receipt-row">
                <span>
                  Therapist
                </span>

                <strong>
                  {receipt.therapist}
                </strong>
              </div>

              <div className="receptionist-receipt-row">
                <span>
                  Payment Method
                </span>

                <strong>
                  {
                    receipt.paymentMethod
                  }
                </strong>
              </div>

              <hr />

              <div className="receptionist-receipt-total">
                <span>
                  Amount Paid
                </span>

                <strong>
                  ₱
                  {receipt.amount.toLocaleString()}
                </strong>
              </div>

              <p className="text-center text-muted small mt-4 mb-0">
                Thank you for choosing Zenora.
              </p>
            </div>

            <div className="receptionist-receipt-actions receptionist-no-print">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={printReceipt}
              >
                <i className="fas fa-print mr-2"></i>
                Print Receipt
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={sendReceipt}
              >
                <i className="far fa-envelope mr-2"></i>
                Send Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;