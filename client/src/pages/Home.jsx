import HeroCarousel from "../components/HeroCarousel";
import ServiceCarousel from "../components/ServiceCarousel";
import PricingCarousel from "../components/PricingCarousel";
import TestimonialCarousel from "../components/TestimonialCarousel";
import AppointmentForm from "../components/AppointmentForm";

function Home() {
  return (
    <>
      <HeroCarousel />

      {/* About Start */}
      <div className="container-fluid py-5">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-6 pb-5 pb-lg-0">
              <img
                className="img-fluid w-100"
                src="/img/about.jpg"
                alt="Spa"
              />
            </div>

            <div className="col-lg-6">
              <h6 className="d-inline-block text-primary text-uppercase bg-light py-1 px-2">
                About Us
              </h6>

              <h1 className="mb-4">
                Your Best Spa, Beauty & Skin Care Center
              </h1>

              <p className="pl-4 border-left border-primary">
                Dolores lorem lorem ipsum sit et ipsum. Sadip sea amet diam
                dolore sed et. Sit rebum labore sit sit ut vero no sit. Et elitr
                stet dolor sed sit et sed ipsum et kasd erat duo eos et erat
              </p>

              <div className="row pt-3">
                <div className="col-6">
                  <div className="bg-light text-center p-4">
                    <h3
                      className="display-4 text-primary"
                      data-toggle="counter-up"
                    >
                      99
                    </h3>
                    <h6 className="text-uppercase">Spa Specialist</h6>
                  </div>
                </div>

                <div className="col-6">
                  <div className="bg-light text-center p-4">
                    <h3
                      className="display-4 text-primary"
                      data-toggle="counter-up"
                    >
                      999
                    </h3>
                    <h6 className="text-uppercase">Happy Clients</h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* About End */}

      {/* Service Start */}
      <div className="container-fluid px-0 py-5 my-5">
        <div className="row mx-0 justify-content-center text-center">
          <div className="col-lg-6">
            <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
              Our Service
            </h6>
            <h1>Spa & Beauty Services</h1>
          </div>
        </div>

        <HeroCarousel />

        {/* Appointment */}
        <div className="row justify-content-center bg-appointment mx-0">
          <div className="col-lg-6 py-5">
            <div
              className="p-5 my-5"
              style={{ background: "rgba(33, 30, 28, 0.7)" }}
            >
              <h1 className="text-white text-center mb-4">
                Make Appointment
              </h1>

              <AppointmentForm />

            </div>
          </div>
        </div>
      </div>
      {/* Service End */}

      {/* Open Hours Start */}
      <div className="container-fluid py-5">
        <div className="container py-5">
          <div className="row">
            <div className="col-lg-6" style={{ minHeight: "500px" }}>
              <div className="position-relative h-100">
                <img
                  className="position-absolute w-100 h-100"
                  src="/img/opening.jpg"
                  style={{ objectFit: "cover" }}
                  alt="Spa opening hours"
                />
              </div>
            </div>

            <div className="col-lg-6 pt-5 pb-lg-5">
              <div className="hours-text bg-light p-4 p-lg-5 my-lg-5">
                <h6 className="d-inline-block text-white text-uppercase bg-primary py-1 px-2">
                  Open Hours
                </h6>

                <h1 className="mb-4">Best Relax And Spa Zone</h1>

                <p>
                  Dolores lorem lorem ipsum sit et ipsum. Sadip sea amet diam
                  dolore sed et. Sit rebum labore sit sit ut vero no sit. Et
                  elitr stet dolor sed sit et sed ipsum et kasd ut. Erat duo eos
                  et erat sed diam duo
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

                <a href="/appointment" className="btn btn-primary mt-2">
                  Book Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Open Hours End */}

      {/* Pricing Start */}
      <div
        className="container-fluid bg-pricing"
        style={{ margin: "90px 0" }}
      >
        <div className="container">
          <div className="row">
            <div className="col-lg-5" style={{ minHeight: "500px" }}>
              <div className="position-relative h-100">
                <img
                  className="position-absolute w-100 h-100"
                  src="/img/pricing.jpg"
                  style={{ objectFit: "cover" }}
                  alt="Spa pricing"
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
      {/* Pricing End */}

      {/* Team Start */}
      <div className="container-fluid py-5">
        <div className="container pt-5">
          <div className="row justify-content-center text-center">
            <div className="col-lg-6">
              <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
                Spa Specialist
              </h6>
              <h1 className="mb-5">Spa & Beauty Specialist</h1>
            </div>
          </div>

          <div className="row">
            {/* Member 1 */}
            <div className="col-lg-3 col-md-6">
              <div className="team position-relative overflow-hidden mb-5">
                <img
                  className="img-fluid"
                  src="/img/team-1.jpg"
                  alt="Olivia Mia"
                />

                <div className="position-relative text-center">
                  <div className="team-text bg-primary text-white">
                    <h5 className="text-white text-uppercase">Olivia Mia</h5>
                    <p className="m-0">Spa & Beauty Expert</p>
                  </div>

                  <div className="team-social bg-dark text-center">
                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                    >
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                    >
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                    >
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                    <a
                      className="btn btn-outline-primary btn-square"
                      href="#"
                    >
                      <i className="fab fa-instagram"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Member 2 */}
            <div className="col-lg-3 col-md-6">
              <div className="team position-relative overflow-hidden mb-5">
                <img
                  className="img-fluid"
                  src="/img/team-2.jpg"
                  alt="Cory Brown"
                />

                <div className="position-relative text-center">
                  <div className="team-text bg-primary text-white">
                    <h5 className="text-white text-uppercase">Cory Brown</h5>
                    <p className="m-0">Spa & Beauty Expert</p>
                  </div>

                  <div className="team-social bg-dark text-center">
                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                    >
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                    >
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                    >
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                    <a
                      className="btn btn-outline-primary btn-square"
                      href="#"
                    >
                      <i className="fab fa-instagram"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Member 3 */}
            <div className="col-lg-3 col-md-6">
              <div className="team position-relative overflow-hidden mb-5">
                <img
                  className="img-fluid"
                  src="/img/team-3.jpg"
                  alt="Elizabeth Ross"
                />

                <div className="position-relative text-center">
                  <div className="team-text bg-primary text-white">
                    <h5 className="text-white text-uppercase">
                      Elizabeth Ross
                    </h5>
                    <p className="m-0">Spa & Beauty Expert</p>
                  </div>

                  <div className="team-social bg-dark text-center">
                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                    >
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                    >
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                    >
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                    <a
                      className="btn btn-outline-primary btn-square"
                      href="#"
                    >
                      <i className="fab fa-instagram"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Member 4 */}
            <div className="col-lg-3 col-md-6">
              <div className="team position-relative overflow-hidden mb-5">
                <img
                  className="img-fluid"
                  src="/img/team-4.jpg"
                  alt="Kelly Walke"
                />

                <div className="position-relative text-center">
                  <div className="team-text bg-primary text-white">
                    <h5 className="text-white text-uppercase">Kelly Walke</h5>
                    <p className="m-0">Spa & Beauty Expert</p>
                  </div>

                  <div className="team-social bg-dark text-center">
                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                    >
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                    >
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                    >
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                    <a
                      className="btn btn-outline-primary btn-square"
                      href="#"
                    >
                      <i className="fab fa-instagram"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Team End */}

      {/* Testimonial Start */}
      <div className="container-fluid py-5">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-6 pb-5 pb-lg-0">
              <img
                className="img-fluid w-100"
                src="/img/testimonial.jpg"
                alt="Client testimonial"
              />
            </div>

            <div className="col-lg-6">
              <h6 className="d-inline-block text-primary text-uppercase bg-light py-1 px-2">
                Testimonial
              </h6>

              <h1 className="mb-4">What Our Clients Say!</h1>

            <TestimonialCarousel />
              
            </div>
          </div>
        </div>
      </div>
      {/* Testimonial End */}
    </>
  );
}

export default Home;