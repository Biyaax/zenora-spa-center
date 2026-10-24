import { Link } from "react-router-dom";

import ServiceCarousel from "../components/ServiceCarousel";
import TestimonialCarousel from "../components/TestimonialCarousel";
import AppointmentForm from "../components/AppointmentForm";

function Services() {
  return (
    <>
      {/* =========================================
          HEADER
      ========================================= */}
      <div className="jumbotron jumbotron-fluid page-banner services-banner">
        <div className="container text-center">
          <h3 className="text-white page-banner-title mb-4">
            Services
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
              Services
            </p>
          </div>
        </div>
      </div>


      {/* =========================================
          SERVICES
      ========================================= */}
      <div className="container-fluid px-0 py-5">
        <div className="row mx-0 justify-content-center text-center">

          <div className="col-lg-7">
            <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
              Our Services
            </h6>

            <h1 className="mb-3">
              Spa & Wellness Services
            </h1>

            <p className="text-muted mb-5">
              Explore Zenora's massage, skin care, and wellness
              treatments and choose the service that best suits
              your needs.
            </p>
          </div>

        </div>

        <ServiceCarousel />
      </div>


      {/* =========================================
          APPOINTMENT
      ========================================= */}
      <div className="container-fluid py-5">
        <div className="row justify-content-center bg-appointment mx-0">

          <div className="col-lg-6 py-5">

            <div
              className="p-4 p-md-5 my-5"
              style={{
                background: "rgba(33, 30, 28, 0.7)",
              }}
            >
              <h6 className="text-primary text-uppercase text-center mb-2">
                Book Your Visit
              </h6>

              <h1 className="text-white text-center mb-4">
                Make an Appointment
              </h1>

              <AppointmentForm />
            </div>

          </div>

        </div>
      </div>


      {/* =========================================
          TESTIMONIAL
      ========================================= */}
      <div className="container-fluid py-5">
        <div className="container py-5">

          <div className="row align-items-center">

            <div className="col-lg-6 pb-5 pb-lg-0">
              <img
                className="img-fluid w-100"
                src="/img/testimonial.jpg"
                alt="Zenora spa client testimonial"
              />
            </div>

            <div className="col-lg-6">

              <h6 className="d-inline-block text-primary text-uppercase bg-light py-1 px-2">
                Testimonials
              </h6>

              <h1 className="mb-4">
                What Our Clients Say
              </h1>

              <p className="text-muted mb-4">
                See what our guests have to say about their
                experience with Zenora's spa and wellness services.
              </p>

              <TestimonialCarousel />

            </div>

          </div>

        </div>
      </div>
    </>
  );
}

export default Services;