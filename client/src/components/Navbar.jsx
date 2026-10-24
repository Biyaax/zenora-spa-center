import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);

  const location = useLocation();

  const pageRoutes = [
    "/appointment",
    "/opening",
    "/team",
    "/testimonial",
  ];

  const pagesActive = pageRoutes.includes(location.pathname);

  // Close the mobile menu and Pages dropdown
  // whenever the user goes to another page.
  useEffect(() => {
    setMenuOpen(false);
    setPagesOpen(false);
  }, [location.pathname]);

  const navLinkClass = ({ isActive }) =>
    `nav-item nav-link ${isActive ? "active" : ""}`;

  const dropdownLinkClass = ({ isActive }) =>
    `dropdown-item ${isActive ? "active" : ""}`;

  return (
    <div className="container-fluid p-0">
      <nav className="navbar navbar-expand-lg bg-white navbar-light py-3 py-lg-0 px-lg-5">
        {/* Logo */}
        <NavLink to="/" className="navbar-brand ml-lg-3">
          <h1 className="m-0 text-primary">
            <span className="text-dark">SPA</span> Center
          </h1>
        </NavLink>

        {/* Mobile Hamburger */}
        <button
          type="button"
          className="navbar-toggler"
          onClick={() => setMenuOpen((current) => !current)}
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
            {/* Home */}
            <NavLink
              to="/"
              end
              className={navLinkClass}
            >
              Home
            </NavLink>

            {/* About */}
            <NavLink
              to="/about"
              className={navLinkClass}
            >
              About
            </NavLink>

            {/* Services */}
            <NavLink
              to="/services"
              className={navLinkClass}
            >
              Services
            </NavLink>

            {/* Pricing */}
            <NavLink
              to="/pricing"
              className={navLinkClass}
            >
              Pricing
            </NavLink>

            {/* Pages Dropdown */}
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
                  setPagesOpen((current) => !current)
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
                  Our Team
                </NavLink>

                <NavLink
                  to="/testimonial"
                  className={dropdownLinkClass}
                >
                  Testimonial
                </NavLink>
              </div>
            </div>

            {/* Contact */}
            <NavLink
              to="/contact"
              className={navLinkClass}
            >
              Contact
            </NavLink>
          </div>

          {/* Book Now */}
          <NavLink
            to="/appointment"
            className="btn btn-primary d-none d-lg-block"
          >
            Book Now
          </NavLink>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;