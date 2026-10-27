
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  duration_minutes: "",
};

function ManagerServices() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getToken = () =>
    sessionStorage.getItem("zenoraStaffToken");

  const apiRequest = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  };

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/api/manager/services");
      setServices(response.services || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (service) => {
    setEditingId(service.id);

    setForm({
      name: service.name || "",
      description: service.description || "",
      price: String(service.price),
      duration_minutes: String(service.duration_minutes),
    });

    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      duration_minutes: Number(form.duration_minutes),
    };

    if (
      !payload.name ||
      form.price.trim() === "" ||
      !Number.isFinite(payload.price) ||
      payload.price < 0 ||
      form.duration_minutes.trim() === "" ||
      !Number.isInteger(payload.duration_minutes) ||
      payload.duration_minutes <= 0
    ) {
      setError("Please enter valid service information.");
      setSaving(false);
      return;
    }

    try {
      const isEditing = editingId !== null;

      await apiRequest(
        isEditing
          ? `/api/manager/services/${editingId}`
          : "/api/manager/services",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      resetForm();
      await loadServices();

      setMessage(
        isEditing
          ? "Service updated successfully!"
          : "Service added successfully!"
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (service) => {
    const currentlyActive = Number(service.is_active) === 1;

    if (
      !window.confirm(
        `Are you sure you want to ${
          currentlyActive ? "deactivate" : "activate"
        } ${service.name}?`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await apiRequest(`/api/manager/services/${service.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          is_active: currentlyActive ? 0 : 1,
        }),
      });

      await loadServices();
      setMessage("Service status updated successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Services Management</h2>
        <Link to="/manager/dashboard" className="btn btn-outline-secondary">
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div role="alert" className="alert alert-danger">
          {error}
        </div>
      )}

      {message && (
        <div role="status" className="alert alert-success">
          {message}
        </div>
      )}

      <div className="p-4 rounded mb-4" style={{ background: "#fff0ee" }}>
        <h4>{editingId !== null ? "Edit Service" : "Add New Service"}</h4>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="service-name">Service Name</label>
              <input
                id="service-name"
                className="form-control"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="service-price">Price (PHP)</label>
              <input
                id="service-price"
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="service-duration">Duration (Minutes)</label>
              <input
                id="service-duration"
                className="form-control"
                type="number"
                min="1"
                step="1"
                name="duration_minutes"
                value={form.duration_minutes}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="service-description">Description</label>
              <textarea
                id="service-description"
                className="form-control"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="2"
              />
            </div>
          </div>

          <button className="btn btn-primary" disabled={saving}>
            {saving
              ? "Saving..."
              : editingId !== null
                ? "Save Changes"
                : "Add Service"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="btn btn-outline-secondary ml-2"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <h4 className="mb-3">All Spa Services</h4>

      {loading ? (
        <p>Loading services...</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead>
              <tr>
                <th>Service</th>
                <th>Description</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>{service.name}</td>
                  <td>{service.description || "—"}</td>
                  <td>
                    ₱{Number(service.price).toLocaleString("en-PH")}
                  </td>
                  <td>{service.duration_minutes} min</td>
                  <td>
                    {Number(service.is_active) === 1
                      ? "Active"
                      : "Inactive"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary mr-2 mb-1"
                      onClick={() => handleEdit(service)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary mb-1"
                      onClick={() => toggleStatus(service)}
                    >
                      {Number(service.is_active) === 1
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}

              {services.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center">
                    No services found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManagerServices;
