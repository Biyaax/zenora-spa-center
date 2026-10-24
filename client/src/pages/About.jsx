import { Link } from "react-router-dom";

function About() {
  return (
    <>
      {/* Header Start */}
      <div
        className="jumbotron jumbotron-fluid bg-jumbotron"
        style={{ marginBottom: "90px" }}
      >
        <div className="container text-center py-5">
          <h3 className="text-white display-3 mb-4">About</h3>

          <div className="d-inline-flex align-items-center text-white">
            <p className="m-0">
              <Link className="text-white" to="/">
                Home
              </Link>
            </p>

            <i className="far fa-circle px-3"></i>

            <p className="m-0">About</p>
          </div>
        </div>
      </div>
      {/* Header End */}

      {/* About Start */}
      <div className="container-fluid py-5">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-6 pb-5 pb-lg-0">
              <img
                className="img-fluid w-100"
                src="/img/about.jpg"
                alt="Spa and beauty center"
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
            {/* Olivia Mia */}
            <div className="col-lg-3 col-md-6">
              <div className="team position-relative overflow-hidden mb-5">
                <img
                  className="img-fluid"
                  src="/img/team-1.jpg"
                  alt="Olivia Mia"
                />

                <div className="position-relative text-center">
                  <div className="team-text bg-primary text-white">
                    <h5 className="text-white text-uppercase">
                      Olivia Mia
                    </h5>

                    <p className="m-0">Spa & Beauty Expert</p>
                  </div>

                  <div className="team-social bg-dark text-center">
                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                      aria-label="Olivia Mia on Twitter"
                    >
                      <i className="fab fa-twitter"></i>
                    </a>

                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                      aria-label="Olivia Mia on Facebook"
                    >
                      <i className="fab fa-facebook-f"></i>
                    </a>

                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                      aria-label="Olivia Mia on LinkedIn"
                    >
                      <i className="fab fa-linkedin-in"></i>
                    </a>

                    <a
                      className="btn btn-outline-primary btn-square"
                      href="#"
                      aria-label="Olivia Mia on Instagram"
                    >
                      <i className="fab fa-instagram"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Cory Brown */}
            <div className="col-lg-3 col-md-6">
              <div className="team position-relative overflow-hidden mb-5">
                <img
                  className="img-fluid"
                  src="/img/team-2.jpg"
                  alt="Cory Brown"
                />

                <div className="position-relative text-center">
                  <div className="team-text bg-primary text-white">
                    <h5 className="text-white text-uppercase">
                      Cory Brown
                    </h5>

                    <p className="m-0">Spa & Beauty Expert</p>
                  </div>

                  <div className="team-social bg-dark text-center">
                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                      aria-label="Cory Brown on Twitter"
                    >
                      <i className="fab fa-twitter"></i>
                    </a>

                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                      aria-label="Cory Brown on Facebook"
                    >
                      <i className="fab fa-facebook-f"></i>
                    </a>

                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                      aria-label="Cory Brown on LinkedIn"
                    >
                      <i className="fab fa-linkedin-in"></i>
                    </a>

                    <a
                      className="btn btn-outline-primary btn-square"
                      href="#"
                      aria-label="Cory Brown on Instagram"
                    >
                      <i className="fab fa-instagram"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Elizabeth Ross */}
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
                      aria-label="Elizabeth Ross on Twitter"
                    >
                      <i className="fab fa-twitter"></i>
                    </a>

                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                      aria-label="Elizabeth Ross on Facebook"
                    >
                      <i className="fab fa-facebook-f"></i>
                    </a>

                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                      aria-label="Elizabeth Ross on LinkedIn"
                    >
                      <i className="fab fa-linkedin-in"></i>
                    </a>

                    <a
                      className="btn btn-outline-primary btn-square"
                      href="#"
                      aria-label="Elizabeth Ross on Instagram"
                    >
                      <i className="fab fa-instagram"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Kelly Walke */}
            <div className="col-lg-3 col-md-6">
              <div className="team position-relative overflow-hidden mb-5">
                <img
                  className="img-fluid"
                  src="/img/team-4.jpg"
                  alt="Kelly Walke"
                />

                <div className="position-relative text-center">
                  <div className="team-text bg-primary text-white">
                    <h5 className="text-white text-uppercase">
                      Kelly Walke
                    </h5>

                    <p className="m-0">Spa & Beauty Expert</p>
                  </div>

                  <div className="team-social bg-dark text-center">
                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                      aria-label="Kelly Walke on Twitter"
                    >
                      <i className="fab fa-twitter"></i>
                    </a>

                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                      aria-label="Kelly Walke on Facebook"
                    >
                      <i className="fab fa-facebook-f"></i>
                    </a>

                    <a
                      className="btn btn-outline-primary btn-square mr-2"
                      href="#"
                      aria-label="Kelly Walke on LinkedIn"
                    >
                      <i className="fab fa-linkedin-in"></i>
                    </a>

                    <a
                      className="btn btn-outline-primary btn-square"
                      href="#"
                      aria-label="Kelly Walke on Instagram"
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
    </>
  );
}

export default About;