import { Link } from "react-router-dom";
import TestimonialCarousel from "../components/TestimonialCarousel";

function Testimonial() {
  return (
    <>
      {/* Header Start */}
      <div
        className="jumbotron jumbotron-fluid bg-jumbotron"
        style={{ marginBottom: "90px" }}
      >
        <div className="container text-center py-5">
          <h3 className="text-white display-3 mb-4">
            Testimonial
          </h3>

          <div className="d-inline-flex align-items-center text-white">
            <p className="m-0">
              <Link className="text-white" to="/">
                Home
              </Link>
            </p>

            <i className="far fa-circle px-3"></i>

            <p className="m-0">
              Testimonial
            </p>
          </div>
        </div>
      </div>
      {/* Header End */}

      {/* Testimonial Start */}
      <div className="container-fluid py-5">
        <div className="container py-5">
          <div className="row align-items-center">

            <div className="col-lg-6 pb-5 pb-lg-0">
              <img
                className="img-fluid w-100"
                src="/img/testimonial.jpg"
                alt="Spa client testimonial"
              />
            </div>

            <div className="col-lg-6">
              <h6 className="d-inline-block text-primary text-uppercase bg-light py-1 px-2">
                Testimonial
              </h6>

              <h1 className="mb-4">
                What Our Clients Say!
              </h1>

              <TestimonialCarousel />

            </div>

          </div>
        </div>
      </div>
      {/* Testimonial End */}
    </>
  );
}

export default Testimonial;