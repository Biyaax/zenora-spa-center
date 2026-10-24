import { useState } from "react";
import ReceptionistSidebar from "../../components/ReceptionistSidebar";

const initialClients = [
  {
    id: "CLI-1001",
    firstName: "Bea",
    lastName: "Mendoza",
    email: "bea@example.com",
    phone: "09171234567",
    address: "Quezon City",
    totalBookings: 5,
    lastVisit: "2026-10-24",
  },
  {
    id: "CLI-1002",
    firstName: "Angela",
    lastName: "Cruz",
    email: "angela@example.com",
    phone: "09181234567",
    address: "Caloocan City",
    totalBookings: 3,
    lastVisit: "2026-10-18",
  },
  {
    id: "CLI-1003",
    firstName: "Carla",
    lastName: "Gomez",
    email: "carla@example.com",
    phone: "09191234567",
    address: "Manila",
    totalBookings: 7,
    lastVisit: "2026-10-24",
  },
  {
    id: "CLI-1004",
    firstName: "Daniel",
    lastName: "Reyes",
    email: "daniel@example.com",
    phone: "09201234567",
    address: "Pasig City",
    totalBookings: 2,
    lastVisit: "2026-09-30",
  },
];

function Clients() {
  const [clients, setClients] =
    useState(initialClients);

  const [search, setSearch] = useState("");

  const [selectedClient, setSelectedClient] =
    useState(null);

  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [message, setMessage] = useState("");

  const filteredClients = clients.filter(
    (client) => {
      const keyword = search
        .trim()
        .toLowerCase();

      const fullName =
        `${client.firstName} ${client.lastName}`.toLowerCase();

      return (
        client.id
          .toLowerCase()
          .includes(keyword) ||
        fullName.includes(keyword) ||
        client.email
          .toLowerCase()
          .includes(keyword) ||
        client.phone.includes(keyword)
      );
    }
  );

  const formatDate = (date) => {
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
  };

  const openEditModal = (client) => {
    setSelectedClient(client);

    setEditData({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      address: client.address,
    });

    setMessage("");
  };

  const closeEditModal = () => {
    setSelectedClient(null);

    setEditData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
    });

    setMessage("");
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditData((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
  };

  const saveClientChanges = (event) => {
    event.preventDefault();

    if (
      !editData.firstName.trim() ||
      !editData.lastName.trim() ||
      !editData.email.trim() ||
      !editData.phone.trim()
    ) {
      setMessage(
        "Please complete all required fields."
      );

      return;
    }

    setClients((current) =>
      current.map((client) =>
        client.id === selectedClient.id
          ? {
              ...client,
              firstName:
                editData.firstName.trim(),
              lastName:
                editData.lastName.trim(),
              email:
                editData.email.trim(),
              phone:
                editData.phone.trim(),
              address:
                editData.address.trim(),
            }
          : client
      )
    );

    closeEditModal();
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
              Client Records
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
              Client Records
            </h1>

            <p className="text-muted mb-0">
              Search client information and
              update their contact details.
            </p>
          </div>

          {/* Summary */}
          <div className="row mb-2">
            <div className="col-md-6 mb-4">
              <div className="receptionist-stat-card">
                <div>
                  <p className="text-muted mb-1">
                    Total Clients
                  </p>

                  <h2 className="mb-0">
                    {clients.length}
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
                    {clients.reduce(
                      (total, client) =>
                        total +
                        client.totalBookings,
                      0
                    )}
                  </h2>
                </div>

                <div className="receptionist-stat-icon">
                  <i className="far fa-calendar-check"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="receptionist-panel mb-4">
            <div className="receptionist-search-box">
              <i className="fas fa-search"></i>

              <input
                type="text"
                placeholder="Search client ID, name, email, or phone..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          </div>

          {/* Client Table */}
          <div className="receptionist-panel">
            <div className="mb-4">
              <h4 className="mb-1">
                Client List
              </h4>

              <p className="text-muted mb-0">
                {
                  filteredClients.length
                }{" "}
                client
                {filteredClients.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>

            {filteredClients.length > 0 ? (
              <div className="table-responsive">
                <table className="table receptionist-table receptionist-client-table">
                  <thead>
                    <tr>
                      <th>Client ID</th>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Address</th>
                      <th>Bookings</th>
                      <th>Last Visit</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredClients.map(
                      (client) => (
                        <tr key={client.id}>
                          <td>
                            <strong>
                              {client.id}
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
                              {client.phone}
                            </span>

                            <small className="d-block text-muted">
                              {client.email}
                            </small>
                          </td>

                          <td>
                            {client.address ||
                              "—"}
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
                  No client records match
                  your search.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Client Modal */}
      {selectedClient && (
        <div className="receptionist-modal-backdrop">
          <div className="receptionist-client-modal">
            <button
              type="button"
              className="receptionist-modal-close"
              onClick={closeEditModal}
            >
              ×
            </button>

            <h3 className="mb-1">
              Edit Client
            </h3>

            <p className="text-muted mb-4">
              {selectedClient.id}
            </p>

            <form
              onSubmit={saveClientChanges}
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
                  value={editData.phone}
                  onChange={
                    handleEditChange
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Email *
                </label>

                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={editData.email}
                  onChange={
                    handleEditChange
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Address
                </label>

                <textarea
                  name="address"
                  className="form-control"
                  rows="3"
                  value={
                    editData.address
                  }
                  onChange={
                    handleEditChange
                  }
                />
              </div>

              {message && (
                <div className="alert alert-danger">
                  {message}
                </div>
              )}

              <div className="d-flex justify-content-end mt-4">
                <button
                  type="button"
                  className="btn btn-light mr-2"
                  onClick={
                    closeEditModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  <i className="fas fa-save mr-2"></i>
                  Save Changes
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