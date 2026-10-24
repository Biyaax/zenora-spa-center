import { Link } from "react-router-dom";
import AppointmentForm from "../components/AppointmentForm";

function Appointment() {
  return (
    <>
      {/* =========================================
          HEADER
      ========================================= */}
      <div className="jumbotron jumbotron-fluid page-banner appointment-banner">
        <div className="container text-center">
          <h3 className="text-white page-banner-title mb-4">
            Appointment
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
              Appointment
            </p>
          </div>
        </div>
      </div>


      {/* =========================================
          APPOINTMENT
      ========================================= */}
      <div className="container-fluid py-5">
        <div className="container py-5">

          <div className="row mx-0 justify-content-center text-center">

            <div className="col-lg-7">
              <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
                Book Your Visit
              </h6>

              <h1 className="mb-3">
                Make an Appointment
              </h1>

              <p className="text-muted mb-5">
                Choose your preferred service, therapist, date, and
                time to schedule your Zenora spa appointment.
              </p>
            </div>

          </div>


          <div className="row justify-content-center bg-appointment mx-0">

            <div className="col-lg-7 py-5">

              <div
                className="p-4 p-md-5 my-5"
                style={{
                  background: "rgba(33, 30, 28, 0.72)",
                }}
              >
                <h6 className="text-primary text-uppercase text-center mb-2">
                  Zenora Booking
                </h6>

                <h1 className="text-white text-center mb-4">
                  Appointment Details
                </h1>

                <AppointmentForm />

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
                  alt="Zenora Spa opening hours"
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
                  Schedule your appointment during our operating
                  hours and enjoy a relaxing spa and wellness
                  experience with our professional therapists.
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
                  to="/services"
                  className="btn btn-primary mt-2"
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

export default Appointment;