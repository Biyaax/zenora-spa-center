import { Link } from "react-router-dom";

function Opening() {
  return (
    <>
      {/* =========================================
          HEADER
      ========================================= */}
      <div className="jumbotron jumbotron-fluid page-banner opening-banner">
        <div className="container text-center">
          <h3 className="text-white page-banner-title mb-4">
            Open Hours
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
              Open Hours
            </p>
          </div>
        </div>
      </div>


      {/* =========================================
          OPEN HOURS
      ========================================= */}
      <div className="container-fluid py-5">
        <div className="container py-5">

          <div className="row">

            {/* Image */}
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
                  alt="Zenora Spa opening hours"
                />

              </div>
            </div>


            {/* Hours */}
            <div className="col-lg-6 pt-5 pb-lg-5">

              <div className="hours-text bg-light p-4 p-lg-5 my-lg-5">

                <h6 className="d-inline-block text-white text-uppercase bg-primary py-1 px-2">
                  Open Hours
                </h6>

                <h1 className="mb-4">
                  Plan Your Visit to Zenora
                </h1>

                <p className="text-muted">
                  Visit Zenora during our operating hours and enjoy
                  a relaxing spa and wellness experience. We recommend
                  booking ahead so you can choose your preferred
                  service, therapist, date, and time.
                </p>


                <ul className="list-inline mt-4">

                  <li className="h6 py-2">
                    <i className="far fa-clock text-primary mr-3"></i>
                    Monday – Friday
                    <span className="float-right">
                      9:00 AM - 7:00 PM
                    </span>
                  </li>

                  <li className="h6 py-2">
                    <i className="far fa-clock text-primary mr-3"></i>
                    Saturday
                    <span className="float-right">
                      9:00 AM - 6:00 PM
                    </span>
                  </li>

                  <li className="h6 py-2">
                    <i className="far fa-clock text-primary mr-3"></i>
                    Sunday
                    <span className="float-right text-muted">
                      Closed
                    </span>
                  </li>

                </ul>


                <hr className="my-4" />


                <p className="text-muted mb-4">
                  Appointment availability may vary depending on
                  therapist schedules and existing bookings.
                </p>


                <Link
                  to="/appointment"
                  className="btn btn-primary mr-2"
                >
                  <i className="far fa-calendar-alt mr-2"></i>
                  Book Appointment
                </Link>

                <Link
                  to="/services"
                  className="btn btn-outline-primary"
                >
                  View Services
                </Link>

              </div>

            </div>

          </div>

        </div>
      </div>
    </>
  );
}

export default Opening;