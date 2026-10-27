import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

function getStoredStaffUser() {
  try {
    return JSON.parse(
      sessionStorage.getItem(
        "zenoraStaffUser"
      ) || "null"
    );
  } catch {
    return null;
  }
}

function ReceptionistTopbar({
  title = "Dashboard",
}) {
  const navigate = useNavigate();

  const [open, setOpen] =
    useState(false);

  const menuRef = useRef(null);

  const user = useMemo(
    () => getStoredStaffUser(),
    []
  );

  const firstName =
    user?.firstName ||
    user?.first_name ||
    "Receptionist";

  const lastName =
    user?.lastName ||
    user?.last_name ||
    "";

  const fullName = [
    firstName,
    lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const initial =
    firstName
      ?.charAt(0)
      ?.toUpperCase() || "R";

  useEffect(() => {
    const handleOutsideClick = (
      event
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const logout = () => {
    sessionStorage.removeItem(
      "zenoraStaffToken"
    );

    sessionStorage.removeItem(
      "zenoraStaffUser"
    );

    navigate(
      "/staff/login",
      {
        replace: true,
      }
    );
  };

  return (
    <div className="receptionist-topbar">
      <div>
        <p className="text-muted mb-1">
          Receptionist Portal
        </p>

        <h3 className="mb-0">
          {title}
        </h3>
      </div>

      <div
        ref={menuRef}
        style={{
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={() =>
            setOpen((value) => !value)
          }
          aria-expanded={open}
          style={{
            border: 0,
            background: "transparent",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <div className="receptionist-topbar-user">
            <i className="far fa-bell mr-3"></i>

            <div className="receptionist-user-circle">
              {initial}
            </div>

            <div
              className="ml-2"
              style={{
                textAlign: "left",
              }}
            >
              <strong>
                {fullName}
              </strong>

              <small className="d-block text-muted">
                Receptionist
              </small>
            </div>

            <i
              className={`fas ${
                open
                  ? "fa-chevron-up"
                  : "fa-chevron-down"
              } ml-2`}
              style={{
                fontSize: "11px",
              }}
            ></i>
          </div>
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 12px)",
              minWidth: "210px",
              background: "#ffffff",
              border:
                "1px solid #eadfd9",
              borderRadius: "8px",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.12)",
              zIndex: 1000,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding:
                  "14px 16px",
                borderBottom:
                  "1px solid #eee5e0",
              }}
            >
              <strong
                style={{
                  display: "block",
                }}
              >
                {fullName}
              </strong>

              <small className="text-muted">
                {user?.email ||
                  "Receptionist"}
              </small>
            </div>

            <button
              type="button"
              onClick={logout}
              style={{
                width: "100%",
                padding:
                  "12px 16px",
                border: 0,
                background:
                  "transparent",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReceptionistTopbar;