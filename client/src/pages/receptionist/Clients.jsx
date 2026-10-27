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

function formatDate(date) {
  if (!date) {
    return "No visits yet";
  }

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function Clients() {
  const navigate =
    useNavigate();

  const [
    clients,
    setClients,
  ] = useState([]);

  const [
    summary,
    setSummary,
  ] = useState({
    totalClients: 0,
    totalBookings: 0,
  });

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    selectedClient,
    setSelectedClient,
  ] = useState(null);

  const [
    editData,
    setEditData,
  ] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    modalError,
    setModalError,
  ] = useState("");

  const loadClients =
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
              "/api/reception/clients",
              token
            );

          setClients(
            Array.isArray(
              data.clients
            )
              ? data.clients
              : []
          );

          setSummary({
            totalClients:
              Number(
                data.summary
                  ?.totalClients ||
                  0
              ),

            totalBookings:
              Number(
                data.summary
                  ?.totalBookings ||
                  0
              ),
          });
        } catch (err) {
          setClients([]);

          setError(
            err.message ||
              "Unable to load client records."
          );
        } finally {
          setLoading(false);
        }
      },
      [navigate]
    );

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filteredClients =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return clients;
      }

      return clients.filter(
        (client) => {
          const fullName =
            `${client.firstName} ${client.lastName}`
              .toLowerCase();

          return [
            client.clientId,
            fullName,
            client.email,
            client.phone,
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
        }
      );
    }, [
      clients,
      search,
    ]);

  const openEditModal =
    (client) => {
      setSelectedClient(
        client
      );

      setEditData({
        firstName:
          client.firstName ||
          "",

        lastName:
          client.lastName ||
          "",

        email:
          client.email || "",

        phone:
          client.phone || "",

        notes:
          client.notes || "",
      });

      setModalError("");
      setSuccessMessage("");
    };

  const closeEditModal =
    () => {
      if (saving) {
        return;
      }

      setSelectedClient(null);

      setEditData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        notes: "",
      });

      setModalError("");
    };

  const handleEditChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setEditData(
        (current) => ({
          ...current,
          [name]: value,
        })
      );

      setModalError("");
    };

  const saveClientChanges =
    async (event) => {
      event.preventDefault();

      if (
        !selectedClient
      ) {
        return;
      }

      if (
        !editData.firstName.trim() ||
        !editData.lastName.trim() ||
        !editData.phone.trim()
      ) {
        setModalError(
          "First name, last name, and phone number are required."
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
        setModalError("");
        setError("");
        setSuccessMessage("");

        await staffRequest(
          `/api/reception/clients/${selectedClient.id}`,
          token,
          {
            method: "PATCH",

            body:
              JSON.stringify({
                firstName:
                  editData.firstName.trim(),

                lastName:
                  editData.lastName.trim(),

                email:
                  editData.email.trim(),

                phone:
                  editData.phone.trim(),

                notes:
                  editData.notes.trim(),
              }),
          }
        );

        setSelectedClient(null);

        setEditData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          notes: "",
        });

        setSuccessMessage(
          "Client record updated successfully."
        );

        await loadClients();
      } catch (err) {
        setModalError(
          err.message ||
            "Unable to update client record."
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="receptionist-layout">
      <ReceptionistSidebar />

      <main className="receptionist-main">
        <ReceptionistTopbar
          title="Client Records"
        />

        <div className="receptionist-content">
          <div className="mb-4">
            <h1 className="mb-2">
              Client Records
            </h1>

            <p className="text-muted mb-0">
              Search client
              information and
              update their contact
              details.
            </p>
          </div>

          {error && (
            <div
              className="alert alert-danger d-flex justify-content-between align-items-center"
              role="alert"
            >
              <span>
                {error}
              </span>

              <button
                type="button"
                className="btn btn-sm btn-outline-danger ml-3"
                onClick={
                  loadClients
                }
              >
                Retry
              </button>
            </div>
          )}

          {successMessage && (
            <div
              className="alert alert-success"
              role="status"
            >
              {
                successMessage
              }
            </div>
          )}

          <div className="row mb-2">
            <div className="col-md-6 mb-4">
              <div className="receptionist-stat-card">
                <div>
                  <p className="text-muted mb-1">
                    Total Clients
                  </p>

                  <h2 className="mb-0">
                    {loading
                      ? "—"
                      : summary.totalClients}
                  </h2>
                </div>

                <div className="receptionist-stat-icon">
                  <i className="fas fa-users"></i>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="receptionist-stat-card">
                <div>
                  <p className="text-muted mb-1">
                    Total Bookings
                  </p>

                  <h2 className="mb-0">
                    {loading
                      ? "—"
                      : summary.totalBookings}
                  </h2>
                </div>

                <div className="receptionist-stat-icon">
                  <i className="far fa-calendar-check"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="receptionist-panel mb-4">
            <div className="receptionist-search-box">
              <i className="fas fa-search"></i>

              <input
                type="text"
                placeholder="Search client ID, name, email, or phone..."
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
                Client List
              </h4>

              <p className="text-muted mb-0">
                {loading
                  ? "Loading client records..."
                  : `${
                      filteredClients.length
                    } client${
                      filteredClients.length ===
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
                  Loading Clients
                </h4>

                <p>
                  Retrieving client
                  records from the
                  database.
                </p>
              </div>
            ) : filteredClients.length >
              0 ? (
              <div className="table-responsive">
                <table className="table receptionist-table receptionist-client-table">
                  <thead>
                    <tr>
                      <th>
                        Client ID
                      </th>

                      <th>
                        Name
                      </th>

                      <th>
                        Contact
                      </th>

                      <th>
                        Account Type
                      </th>

                      <th>
                        Bookings
                      </th>

                      <th>
                        Last Visit
                      </th>

                      <th>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredClients.map(
                      (
                        client
                      ) => (
                        <tr
                          key={
                            client.id
                          }
                        >
                          <td>
                            <strong>
                              {
                                client.clientId
                              }
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {
                                client.firstName
                              }{" "}
                              {
                                client.lastName
                              }
                            </strong>
                          </td>

                          <td>
                            <span>
                              {client.phone ||
                                "—"}
                            </span>

                            <small className="d-block text-muted">
                              {client.email ||
                                "No email"}
                            </small>
                          </td>

                          <td>
                            <span
                              className={`badge ${
                                client.hasAccount
                                  ? "badge-primary"
                                  : "badge-secondary"
                              } px-3 py-2`}
                            >
                              {client.hasAccount
                                ? "Online Account"
                                : "Walk-In / Manual"}
                            </span>
                          </td>

                          <td>
                            {
                              client.totalBookings
                            }
                          </td>

                          <td>
                            {formatDate(
                              client.lastVisit
                            )}
                          </td>

                          <td>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() =>
                                openEditModal(
                                  client
                                )
                              }
                            >
                              <i className="fas fa-edit mr-1"></i>
                              Edit
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="receptionist-empty-state">
                <i className="fas fa-user-slash"></i>

                <h4>
                  No Clients Found
                </h4>

                <p>
                  {search.trim()
                    ? "No client records match your search."
                    : "There are currently no client records in the database."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedClient && (
        <div className="receptionist-modal-backdrop">
          <div className="receptionist-client-modal">
            <button
              type="button"
              className="receptionist-modal-close"
              onClick={
                closeEditModal
              }
              disabled={saving}
            >
              ×
            </button>

            <h3 className="mb-1">
              Edit Client
            </h3>

            <p className="text-muted mb-4">
              {
                selectedClient.clientId
              }
            </p>

            {selectedClient.hasAccount && (
              <div className="alert alert-info">
                This client has an
                online Zenora
                account. Their email
                belongs to their
                login account and
                cannot be changed by
                Receptionist staff.
              </div>
            )}

            <form
              onSubmit={
                saveClientChanges
              }
            >
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label>
                      First Name *
                    </label>

                    <input
                      type="text"
                      name="firstName"
                      className="form-control"
                      value={
                        editData.firstName
                      }
                      onChange={
                        handleEditChange
                      }
                      maxLength="80"
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <label>
                      Last Name *
                    </label>

                    <input
                      type="text"
                      name="lastName"
                      className="form-control"
                      value={
                        editData.lastName
                      }
                      onChange={
                        handleEditChange
                      }
                      maxLength="80"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Phone Number *
                </label>

                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={
                    editData.phone
                  }
                  onChange={
                    handleEditChange
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={
                    editData.email
                  }
                  onChange={
                    handleEditChange
                  }
                  disabled={
                    selectedClient.hasAccount
                  }
                />

                {selectedClient.hasAccount && (
                  <small className="text-muted">
                    Account email
                    cannot be edited
                    by Receptionist
                    staff.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>
                  Notes
                </label>

                <textarea
                  name="notes"
                  className="form-control"
                  rows="4"
                  maxLength="500"
                  placeholder="Optional client notes"
                  value={
                    editData.notes
                  }
                  onChange={
                    handleEditChange
                  }
                />
              </div>

              {modalError && (
                <div className="alert alert-danger">
                  {
                    modalError
                  }
                </div>
              )}

              <div className="d-flex justify-content-end mt-4">
                <button
                  type="button"
                  className="btn btn-light mr-2"
                  onClick={
                    closeEditModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <i className="fas fa-save mr-2"></i>

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clients;