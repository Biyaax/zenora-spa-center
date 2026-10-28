import { Link } from "react-router-dom";
import NewsletterForm from "./NewsletterForm";

function Footer() {
  return (
    <>
      <div
        className="footer container-fluid position-relative bg-dark py-5"
        style={{ marginTop: "90px" }}
      >
        <div className="container pt-5">
          <div className="row">
            {/* Spa Info */}
            <div className="col-lg-6 pr-lg-5 mb-5">
              <Link to="/" className="navbar-brand">
                <h1 className="mb-3 text-white">
                  <span className="text-primary">ZENORA</span>
                </h1>
              </Link>

              <p>
                 Zenora Spa & Massage Wellness Center offers a relaxing space where
  guests can enjoy quality massage and wellness services designed to
  promote comfort, relaxation, and overall well-being.
              </p>

              <p>
                <i className="fa fa-map-marker-alt mr-2"></i>
                Caloocan City, Metro Manila, Philippines
              </p>

              <p>
                <i className="fa fa-phone-alt mr-2"></i>
                +63 9123456789
              </p>

              <p>
                <i className="fa fa-envelope mr-2"></i>
                zenora.spa.center@gmail.com
              </p>

              {/* Social Links */}
              <div className="d-flex justify-content-start mt-4">
                <a
                  className="btn btn-lg btn-primary btn-lg-square mr-2"
                  href="#"
                  aria-label="Twitter"
                >
                  <i className="fab fa-twitter"></i>
                </a>

                <a
                  className="btn btn-lg btn-primary btn-lg-square mr-2"
                  href="#"
                  aria-label="Facebook"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>

                <a
                  className="btn btn-lg btn-primary btn-lg-square mr-2"
                  href="#"
                  aria-label="LinkedIn"
                >
                  <i className="fab fa-linkedin-in"></i>
                </a>

                <a
                  className="btn btn-lg btn-primary btn-lg-square"
                  href="#"
                  aria-label="Instagram"
                >
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>

            {/* Links */}
            <div className="col-lg-6 pl-lg-5">
              <div className="row">
                {/* Quick Links */}
                <div className="col-sm-6 mb-5">
                  <h5 className="text-white text-uppercase mb-4">
                    Quick Links
                  </h5>

                  <div className="d-flex flex-column justify-content-start">
                    <Link className="text-white-50 mb-2" to="/">
                      <i className="fa fa-angle-right mr-2"></i>
                      Home
                    </Link>

                    <Link className="text-white-50 mb-2" to="/about">
                      <i className="fa fa-angle-right mr-2"></i>
                      About Us
                    </Link>

                    <Link className="text-white-50 mb-2" to="/services">
                      <i className="fa fa-angle-right mr-2"></i>
                      Our Services
                    </Link>

                    <Link className="text-white-50 mb-2" to="/pricing">
                      <i className="fa fa-angle-right mr-2"></i>
                      Pricing Plan
                    </Link>

                    <Link className="text-white-50" to="/contact">
                      <i className="fa fa-angle-right mr-2"></i>
                      Contact Us
                    </Link>
                  </div>
                </div>

                {/* Our Services */}
                <div className="col-sm-6 mb-5">
                  <h5 className="text-white text-uppercase mb-4">
                    Our Services
                  </h5>

                  <div className="d-flex flex-column justify-content-start">
                    <Link className="text-white-50 mb-2" to="/services">
                      <i className="fa fa-angle-right mr-2"></i>
                      Body Massage
                    </Link>

                    <Link className="text-white-50 mb-2" to="/services">
                      <i className="fa fa-angle-right mr-2"></i>
                      Stone Therapy
                    </Link>

                    <Link className="text-white-50 mb-2" to="/services">
                      <i className="fa fa-angle-right mr-2"></i>
                      Facial Therapy
                    </Link>

                    <Link className="text-white-50 mb-2" to="/services">
                      <i className="fa fa-angle-right mr-2"></i>
                      Skin Care
                    </Link>

                    <Link className="text-white-50" to="/services">
                      <i className="fa fa-angle-right mr-2"></i>
                      Nail Care
                    </Link>
                  </div>
                </div>

                {/* Newsletter */}
                <div className="col-sm-12 mb-5">
                  <h5 className="text-white text-uppercase mb-4">
                    Newsletter
                  </h5>

                  <NewsletterForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div
        className="container-fluid bg-dark text-light border-top py-4"
        style={{
          borderColor: "rgba(255, 255, 255, 0.15)",
        }}
      >
        <div className="container">
          <div className="row">
            <div className="col-md-6 text-center text-md-left mb-3 mb-md-0">
              <p className="m-0 text-white">
                &copy;{" "}
                <Link to="/">
                  Zenora
                </Link>
                . All Rights Reserved.
              </p>
            </div>

            <div className="col-md-6 text-center text-md-right">
              <p className="m-0 text-white">
                Designed by{" "}
                <a
                  href="https://htmlcodex.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  LIKHADA
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Footer;