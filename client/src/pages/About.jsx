import { Link } from "react-router-dom";

function About() {
  return (
    <>
      {/* =========================================
          HEADER
      ========================================= */}
      <div className="jumbotron jumbotron-fluid page-banner about-banner">
        <div className="container text-center">
          <h3 className="text-white page-banner-title mb-4">
            About
          </h3>

          <div className="d-inline-flex align-items-center text-white">
            <p className="m-0">
              <Link
                className="text-white"
                to="/"
              >
                Home
              </Link>
            </p>

            <i className="far fa-circle px-3"></i>

            <p className="m-0">
              About
            </p>
          </div>
        </div>
      </div>

      {/* =========================================
          ABOUT ZENORA
      ========================================= */}
      <div className="container-fluid py-5">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-6 pb-5 pb-lg-0">
              <img
                className="img-fluid w-100"
                src="/img/about.jpg"
                alt="Zenora Spa and Massage Wellness Center"
              />
            </div>

            <div className="col-lg-6">
              <h6 className="d-inline-block text-primary text-uppercase bg-light py-1 px-2">
                About Us
              </h6>

              <h1 className="mb-4">
                Relax, Recharge, and Feel Your Best
              </h1>

              <p className="pl-4 border-left border-primary">
                Zenora Spa & Massage Wellness Center offers a relaxing
                space where guests can enjoy massage, skin care, and
                wellness treatments designed to promote comfort and
                relaxation.
              </p>

              <p>
                Guests can explore our available services and packages
                and conveniently schedule appointments through the
                Zenora web portal.
              </p>

              <div className="row pt-3">
                <div className="col-6">
                  <div className="bg-light text-center p-4 h-100">
                    <h3 className="display-4 text-primary">
                      6
                    </h3>

                    <h6 className="text-uppercase mb-0">
                      Spa Services
                    </h6>
                  </div>
                </div>

                <div className="col-6">
                  <div className="bg-light text-center p-4 h-100">
                    <h3 className="display-4 text-primary">
                      <i className="far fa-calendar-check"></i>
                    </h3>

                    <h6 className="text-uppercase mb-0">
                      Online Booking
                    </h6>
                  </div>
                </div>
              </div>

              <Link
                to="/services"
                className="btn btn-primary mt-4 mr-2"
              >
                View Services
              </Link>

              <Link
                to="/appointment"
                className="btn btn-outline-primary mt-4"
              >
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          WHY ZENORA
      ========================================= */}
      <div className="container-fluid bg-light py-5">
        <div className="container py-5">
          <div className="row justify-content-center text-center">
            <div className="col-lg-7">
              <h6 className="d-inline-block bg-white text-primary text-uppercase py-1 px-2">
                Why Zenora
              </h6>

              <h1 className="mb-5">
                Your Wellness Experience Matters
              </h1>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-4 col-md-6 mb-4">
              <div className="bg-white text-center h-100 p-4">
                <i className="fas fa-spa fa-3x text-primary mb-4"></i>

                <h4>
                  Relaxing Treatments
                </h4>

                <p className="text-muted mb-0">
                  Choose from massage, facial, skin care, and other
                  wellness treatments designed for relaxation and comfort.
                </p>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 mb-4">
              <div className="bg-white text-center h-100 p-4">
                <i className="fas fa-user-md fa-3x text-primary mb-4"></i>

                <h4>
                  Professional Care
                </h4>

                <p className="text-muted mb-0">
                  Receive spa and wellness services from trained staff
                  assigned according to the selected treatment and
                  availability.
                </p>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 mb-4">
              <div className="bg-white text-center h-100 p-4">
                <i className="far fa-calendar-check fa-3x text-primary mb-4"></i>

                <h4>
                  Convenient Booking
                </h4>

                <p className="text-muted mb-0">
                  Registered guests can schedule and manage their
                  appointments conveniently through the Zenora portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default About;