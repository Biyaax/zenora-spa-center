import { Link } from "react-router-dom";

import HeroCarousel from "../components/HeroCarousel";
import ServiceCarousel from "../components/ServiceCarousel";
import PricingCarousel from "../components/PricingCarousel";
import TestimonialCarousel from "../components/TestimonialCarousel";
import AppointmentForm from "../components/AppointmentForm";

import therapists from "../data/therapists";

function Home() {
  return (
    <>
      {/* ================================
          HERO
      ================================= */}
      <HeroCarousel />


      {/* ================================
          ABOUT
      ================================= */}
      <div className="container-fluid py-5">
        <div className="container py-5">
          <div className="row align-items-center">

            <div className="col-lg-6 pb-5 pb-lg-0">
              <img
                className="img-fluid w-100"
                src="/img/about.jpg"
                alt="Zenora Spa"
              />
            </div>

            <div className="col-lg-6">
              <h6 className="d-inline-block text-primary text-uppercase bg-light py-1 px-2">
                About Us
              </h6>

              <h1 className="mb-4">
                Your Place for Relaxation and Wellness
              </h1>

              <p className="pl-4 border-left border-primary">
                Zenora Spa & Massage Wellness Center provides a relaxing
                environment where guests can enjoy massage, skin care,
                and wellness treatments delivered by professional
                massage therapists.
              </p>

              <div className="row pt-3">

                <div className="col-6">
                  <div className="bg-light text-center p-4">
                    <h3 className="display-4 text-primary">
                      6
                    </h3>

                    <h6 className="text-uppercase">
                      Spa Services
                    </h6>
                  </div>
                </div>

                <div className="col-6">
                  <div className="bg-light text-center p-4">
                    <h3 className="display-4 text-primary">
                      {therapists.length}
                    </h3>

                    <h6 className="text-uppercase">
                      Therapists
                    </h6>
                  </div>
                </div>

              </div>

              <Link
                to="/about"
                className="btn btn-primary mt-4"
              >
                Learn More
              </Link>
            </div>

          </div>
        </div>
      </div>


      {/* ================================
          SERVICES
      ================================= */}
      <div className="container-fluid px-0 py-5 my-5">

        <div className="row mx-0 justify-content-center text-center">
          <div className="col-lg-6">

            <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
              Our Services
            </h6>

            <h1>
              Spa & Wellness Services
            </h1>

            <p className="text-muted mb-4">
              Explore the treatments and wellness services available
              at Zenora.
            </p>

          </div>
        </div>

        <ServiceCarousel />

      </div>


      {/* ================================
          APPOINTMENT
      ================================= */}
      <div className="container-fluid">

        <div className="row justify-content-center bg-appointment mx-0">

          <div className="col-lg-6 py-5">

            <div
              className="p-5 my-5"
              style={{
                background: "rgba(33, 30, 28, 0.7)",
              }}
            >
              <h1 className="text-white text-center mb-4">
                Make an Appointment
              </h1>

              <AppointmentForm />

            </div>

          </div>

        </div>

      </div>


      {/* ================================
          OPENING HOURS
      ================================= */}
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


      {/* ================================
          PACKAGES / PRICING
      ================================= */}
      <div
        className="container-fluid bg-pricing"
        style={{
          margin: "90px 0",
        }}
      >
        <div className="container">

          <div className="row">

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
                  alt="Zenora Spa packages and pricing"
                />

              </div>
            </div>

            <div className="col-lg-7 pt-5 pb-lg-5">

              <div className="pricing-text bg-light p-4 p-lg-5 my-lg-5">

                <PricingCarousel />

              </div>

            </div>

          </div>

        </div>
      </div>


      {/* ================================
          THERAPISTS
      ================================= */}
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
                Browse our therapist profiles and find the professional
                that best matches your preferred spa treatment.
              </p>

            </div>

          </div>


          <div className="row justify-content-center">

            {therapists.slice(0, 4).map((therapist) => (

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

                    <p className="text-white mb-2">
                      <strong>
                        Experience:
                      </strong>{" "}
                      {therapist.experience}
                    </p>


                    <div className="mb-3">

                      <p className="text-white font-weight-bold mb-2">
                        Specialties:
                      </p>

                      <div>

                        {therapist.specialties.map((specialty) => (

                          <span
                            key={specialty}
                            className="therapist-specialty"
                          >
                            {specialty}
                          </span>

                        ))}

                      </div>

                    </div>


                    <p className="text-white-50 mb-4 home-therapist-bio">
                      {therapist.bio}
                    </p>


                    <Link
                      to="/appointment"
                      className="btn btn-primary mt-auto"
                    >
                      Book With Therapist
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


      {/* ================================
          TESTIMONIALS
      ================================= */}
      <div className="container-fluid py-5">

        <div className="container py-5">

          <div className="row align-items-center">

            <div className="col-lg-6 pb-5 pb-lg-0">

              <img
                className="img-fluid w-100"
                src="/img/testimonial.jpg"
                alt="Zenora client testimonial"
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
    </>
  );
}

export default Home;