import { Link } from "react-router-dom";

import PricingCarousel from "../components/PricingCarousel";
import services from "../data/services";

function Pricing() {
  return (
    <>
      {/* =========================================
          HEADER
      ========================================= */}
      <div className="jumbotron jumbotron-fluid page-banner pricing-banner">
        <div className="container text-center">
          <h3 className="text-white page-banner-title mb-4">
            Pricing
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
              Pricing
            </p>
          </div>
        </div>
      </div>


      {/* =========================================
          INDIVIDUAL SERVICES
      ========================================= */}
      <div className="container-fluid py-5">
        <div className="container py-5">

          <div className="row mx-0 justify-content-center text-center">
            <div className="col-lg-7">

              <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
                Our Prices
              </h6>

              <h1 className="mb-4">
                Individual Spa Services
              </h1>

              <p className="text-muted mb-5">
                Choose from our available massage, skin care,
                and wellness services.
              </p>

            </div>
          </div>


          <div className="row">

            {services.map((service) => (
              <div
                className="col-lg-4 col-md-6 mb-4"
                key={service.id}
              >
                <div className="bg-light h-100">

                  <img
                    src={service.image}
                    className="img-fluid w-100"
                    alt={service.name}
                    style={{
                      height: "220px",
                      objectFit: "cover",
                    }}
                  />


                  <div className="p-4">

                    <div className="d-flex justify-content-between align-items-start mb-3">

                      <h4 className="mb-0">
                        {service.name}
                      </h4>

                      <h5 className="text-primary mb-0 ml-3">
                        ₱{service.price.toLocaleString()}
                      </h5>

                    </div>


                    <p className="text-muted mb-2">
                      <i className="far fa-clock mr-2"></i>

                      {service.durationMinutes} minutes
                    </p>


                    <p>
                      {service.description}
                    </p>


                    <Link
                      to="/appointment"
                      className="btn btn-primary"
                    >
                      Book Service
                    </Link>

                  </div>

                </div>
              </div>
            ))}

          </div>

        </div>
      </div>


      {/* =========================================
          SPA PACKAGES
      ========================================= */}
      <div className="container-fluid py-5">
        <div className="container py-5">

          <div className="row mx-0 justify-content-center text-center mb-5">

            <div className="col-lg-7">

              <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
                Spa Packages
              </h6>

              <h1 className="mb-4">
                Wellness Packages
              </h1>

              <p className="text-muted">
                Enjoy selected treatments together through
                Zenora's wellness packages.
              </p>

            </div>

          </div>


          <div className="row">

            {/* Image */}
            <div
              className="col-lg-5"
              style={{
                minHeight: "500px",
              }}
            >
              <div className="position-relative h-100">

                <img
                  className="position-absolute w-100 h-100"
                  src="/img/pricing.jpg"
                  style={{
                    objectFit: "cover",
                  }}
                  alt="Zenora spa packages"
                />

              </div>
            </div>


            {/* Package Carousel */}
            <div className="col-lg-7 pt-5 pb-lg-5">

              <div className="pricing-text bg-light p-4 p-lg-5 my-lg-5">

                <PricingCarousel />

              </div>

            </div>

          </div>

        </div>
      </div>


      {/* =========================================
          OPEN HOURS
      ========================================= */}
      <div className="container-fluid py-5">
        <div className="container py-5">

          <div className="row">

            <div
              className="col-lg-6"
              style={{
                minHeight: "500px",
              }}
            >
              <div className="position-relative h-100">

                <img
                  className="position-absolute w-100 h-100"
                  src="/img/opening.jpg"
                  style={{
                    objectFit: "cover",
                  }}
                  alt="Zenora spa opening hours"
                />

              </div>
            </div>


            <div className="col-lg-6 pt-5 pb-lg-5">

              <div className="hours-text bg-light p-4 p-lg-5 my-lg-5">

                <h6 className="d-inline-block text-white text-uppercase bg-primary py-1 px-2">
                  Open Hours
                </h6>

                <h1 className="mb-4">
                  Plan Your Visit to Zenora
                </h1>

                <p>
                  Visit Zenora during our operating hours and enjoy
                  a relaxing spa and wellness experience with our
                  professional therapists.
                </p>


                <ul className="list-inline">

                  <li className="h6 py-1">
                    <i className="far fa-circle text-primary mr-3"></i>
                    Mon – Fri : 9:00 AM - 7:00 PM
                  </li>

                  <li className="h6 py-1">
                    <i className="far fa-circle text-primary mr-3"></i>
                    Saturday : 9:00 AM - 6:00 PM
                  </li>

                  <li className="h6 py-1">
                    <i className="far fa-circle text-primary mr-3"></i>
                    Sunday : Closed
                  </li>

                </ul>


                <Link
                  to="/appointment"
                  className="btn btn-primary mt-2"
                >
                  Book Now
                </Link>

              </div>

            </div>

          </div>

        </div>
      </div>
    </>
  );
}

export default Pricing;