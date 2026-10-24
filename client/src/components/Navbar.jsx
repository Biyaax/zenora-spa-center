import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import AuthModal from "./AuthModal";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const location = useLocation();

  const {
    user,
    isLoggedIn,
    logout,
  } = useAuth();

  const pageRoutes = [
    "/appointment",
    "/opening",
    "/team",
    "/testimonial",
  ];

  const pagesActive = pageRoutes.includes(
    location.pathname
  );

  useEffect(() => {
    setMenuOpen(false);
    setPagesOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  const navLinkClass = ({ isActive }) =>
    `nav-item nav-link ${isActive ? "active" : ""}`;

  const dropdownLinkClass = ({ isActive }) =>
    `dropdown-item ${isActive ? "active" : ""}`;

  const openAuthModal = () => {
    setMenuOpen(false);
    setPagesOpen(false);
    setAccountOpen(false);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();

    setMenuOpen(false);
    setPagesOpen(false);
    setAccountOpen(false);
  };

  return (
    <>
      <div className="container-fluid p-0">
        <nav className="navbar navbar-expand-lg bg-white navbar-light py-3 py-lg-0 px-lg-5">
          {/* Logo */}
          <NavLink
            to="/"
            className="navbar-brand ml-lg-3"
          >
            <h1 className="m-0 text-primary">
              <span className="text-dark">
                SPA
              </span>{" "}
              Center
            </h1>
          </NavLink>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="navbar-toggler"
            onClick={() =>
              setMenuOpen((current) => !current)
            }
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            aria-controls="navbarCollapse"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Navigation */}
          <div
            id="navbarCollapse"
            className={`collapse navbar-collapse justify-content-between px-lg-3 ${
              menuOpen ? "show" : ""
            }`}
          >
            <div className="navbar-nav m-auto py-0">
              <NavLink
                to="/"
                end
                className={navLinkClass}
              >
                Home
              </NavLink>

              <NavLink
                to="/about"
                className={navLinkClass}
              >
                About
              </NavLink>

              <NavLink
                to="/services"
                className={navLinkClass}
              >
                Services
              </NavLink>

              <NavLink
                to="/pricing"
                className={navLinkClass}
              >
                Pricing
              </NavLink>

              {/* Pages */}
              <div
                className={`nav-item dropdown ${
                  pagesOpen ? "show" : ""
                }`}
              >
                <button
                  type="button"
                  className={`nav-link dropdown-toggle border-0 bg-transparent ${
                    pagesActive ? "active" : ""
                  }`}
                  onClick={() =>
                    setPagesOpen(
                      (current) => !current
                    )
                  }
                  aria-expanded={pagesOpen}
                >
                  Pages
                </button>

                <div
                  className={`dropdown-menu rounded-0 m-0 ${
                    pagesOpen ? "show" : ""
                  }`}
                >
                  <NavLink
                    to="/appointment"
                    className={dropdownLinkClass}
                  >
                    Appointment
                  </NavLink>

                  <NavLink
                    to="/opening"
                    className={dropdownLinkClass}
                  >
                    Open Hours
                  </NavLink>

                  <NavLink
                    to="/team"
                    className={dropdownLinkClass}
                  >
                    Therapists
                  </NavLink>

                  <NavLink
                    to="/testimonial"
                    className={dropdownLinkClass}
                  >
                    Testimonial
                  </NavLink>
                </div>
              </div>

              <NavLink
                to="/contact"
                className={navLinkClass}
              >
                Contact
              </NavLink>

              {/* Mobile Account */}
              <div className="d-lg-none mt-3">
                {!isLoggedIn ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={openAuthModal}
                  >
                    <i className="fa fa-user mr-2"></i>
                    Login
                  </button>
                ) : (
                  <>
                    <NavLink
                      to="/guest/dashboard"
                      className="btn btn-primary btn-block mb-2"
                    >
                      <i className="fa fa-user mr-2"></i>
                      My Account
                    </NavLink>

                    <button
                      type="button"
                      className="btn btn-outline-primary btn-block"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Desktop Account */}
            <div className="d-none d-lg-block">
              {!isLoggedIn ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openAuthModal}
                >
                  <i className="fa fa-user mr-2"></i>
                  Login
                </button>
              ) : (
                <div
                  className={`nav-item dropdown ${
                    accountOpen ? "show" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="btn btn-primary dropdown-toggle"
                    onClick={() =>
                      setAccountOpen(
                        (current) => !current
                      )
                    }
                    aria-expanded={accountOpen}
                  >
                    <i className="fa fa-user mr-2"></i>

                    {user?.firstName || "My Account"}
                  </button>

                  <div
                    className={`dropdown-menu dropdown-menu-right rounded-0 ${
                      accountOpen ? "show" : ""
                    }`}
                  >
                    <NavLink
                      to="/guest/dashboard"
                      className="dropdown-item"
                    >
                      <i className="fa fa-home mr-2"></i>
                      Dashboard
                    </NavLink>

                    <NavLink
                      to="/guest/appointments"
                      className="dropdown-item"
                    >
                      <i className="fa fa-calendar mr-2"></i>
                      My Appointments
                    </NavLink>

                    <NavLink
                      to="/guest/notifications"
                      className="dropdown-item"
                    >
                      <i className="fa fa-bell mr-2"></i>
                      Notifications
                    </NavLink>

                    <div className="dropdown-divider"></div>

                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={handleLogout}
                    >
                      <i className="fa fa-sign-out-alt mr-2"></i>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() =>
          setAuthModalOpen(false)
        }
      />
    </>
  );
}

export default Navbar;