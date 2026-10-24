import { Link } from "react-router-dom";
import therapists from "../data/therapists";

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
                Guests can explore our available services and packages,
                learn more about our massage therapists, and conveniently
                schedule appointments through the Zenora web portal.
              </p>


              <div className="row pt-3">

                <div className="col-6">
                  <div className="bg-light text-center p-4">

                    <h3 className="display-4 text-primary">
                      6
                    </h3>

                    <h6 className="text-uppercase mb-0">
                      Spa Services
                    </h6>

                  </div>
                </div>


                <div className="col-6">
                  <div className="bg-light text-center p-4">

                    <h3 className="display-4 text-primary">
                      {therapists.length}
                    </h3>

                    <h6 className="text-uppercase mb-0">
                      Therapists
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
                  Professional Therapists
                </h4>

                <p className="text-muted mb-0">
                  Browse therapist profiles and select a professional
                  whose specialties match your preferred treatment.
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


      {/* =========================================
          THERAPISTS
      ========================================= */}
      <div className="container-fluid py-5">
        <div className="container py-5">

          <div className="row justify-content-center text-center">

            <div className="col-lg-7">

              <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
                Our Therapists
              </h6>

              <h1 className="mb-3">
                Meet Our Massage Therapists
              </h1>

              <p className="text-muted mb-5">
                Get to know the professionals who provide Zenora's
                spa and wellness treatments.
              </p>

            </div>

          </div>


          <div className="row justify-content-center">

            {therapists.map((therapist) => (

              <div
                className="col-xl-3 col-lg-3 col-md-6 mb-4"
                key={therapist.id}
              >

                <div className="therapist-card home-therapist-card">

                  <img
                    className="therapist-card-image"
                    src={therapist.image}
                    alt={therapist.name}
                  />

                  <div className="therapist-card-body">

                    <h5 className="text-white mb-1">
                      {therapist.name}
                    </h5>

                    <p className="text-primary mb-2">
                      {therapist.role}
                    </p>

                    <p className="text-white mb-3">
                      <strong>Experience:</strong>{" "}
                      {therapist.experience}
                    </p>


                    <div className="mb-3">

                      {therapist.specialties.map((specialty) => (

                        <span
                          key={specialty}
                          className="therapist-specialty"
                        >
                          {specialty}
                        </span>

                      ))}

                    </div>


                    <Link
                      to="/team"
                      className="btn btn-primary mt-auto"
                    >
                      View Profile
                    </Link>

                  </div>

                </div>

              </div>

            ))}

          </div>


          <div className="text-center mt-3">

            <Link
              to="/team"
              className="btn btn-outline-primary px-4"
            >
              View All Therapist Profiles
            </Link>

          </div>

        </div>
      </div>
    </>
  );
}

export default About;