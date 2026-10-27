
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { staffRequest } from "../api/staffAuth";

function StaffProtectedRoute({ allowedRole, children }) {
  const [state, setState] = useState({
    loading: true,
    user: null,
  });

  useEffect(() => {
    let active = true;
    const token = sessionStorage.getItem("zenoraStaffToken");

    if (!token) {
      return;
    }

    staffRequest("/api/auth/me", token)
      .then((data) => {
        if (active) {
          setState({ loading: false, user: data.user });
        }
      })
      .catch(() => {
        if (active) {
          sessionStorage.removeItem("zenoraStaffToken");
          sessionStorage.removeItem("zenoraStaffUser");
          setState({ loading: false, user: null });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const token = sessionStorage.getItem("zenoraStaffToken");

  if (!token) {
    return <Navigate to="/staff/login" replace />;
  }

  if (state.loading) {
    return (
      <div className="container py-5">
        <p>Verifying staff session...</p>
      </div>
    );
  }

  if (!state.user) {
    return <Navigate to="/staff/login" replace />;
  }

  if (state.user.role !== allowedRole) {
    return (
      <div className="container py-5">
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return children;
}

export default StaffProtectedRoute;
