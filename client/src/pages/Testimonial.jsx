import { Link } from "react-router-dom";
import TestimonialCarousel from "../components/TestimonialCarousel";

function Testimonial() {
  return (
    <>
      {/* =========================================
          HEADER
      ========================================= */}
      <div className="jumbotron jumbotron-fluid page-banner testimonial-banner">
        <div className="container text-center">
          <h3 className="text-white page-banner-title mb-4">
            Testimonials
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
              Testimonials
            </p>
          </div>
        </div>
      </div>


      {/* =========================================
          TESTIMONIALS
      ========================================= */}
      <div className="container-fluid py-5">
        <div className="container py-5">

          <div className="row align-items-center">

            {/* Image */}
            <div className="col-lg-6 pb-5 pb-lg-0">

              <img
                className="img-fluid w-100"
                src="/img/testimonial.jpg"
                alt="Zenora spa client testimonial"
              />

            </div>


            {/* Testimonials */}
            <div className="col-lg-6">

              <h6 className="d-inline-block text-primary text-uppercase bg-light py-1 px-2">
                Testimonials
              </h6>

              <h1 className="mb-3">
                What Our Clients Say
              </h1>

              <p className="text-muted mb-4">
                Read about the experiences of guests who have enjoyed
                Zenora's spa, massage, and wellness services.
              </p>

              <TestimonialCarousel />

            </div>

          </div>

        </div>
      </div>
    </>
  );
}

export default Testimonial;