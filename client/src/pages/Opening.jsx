import { Link } from "react-router-dom";

function Opening() {
  return (
    <>
      {/* Header Start */}
      <div
        className="jumbotron jumbotron-fluid bg-jumbotron"
        style={{ marginBottom: "90px" }}
      >
        <div className="container text-center py-5">
          <h3 className="text-white display-3 mb-4">
            Open Hours
          </h3>

          <div className="d-inline-flex align-items-center text-white">
            <p className="m-0">
              <Link className="text-white" to="/">
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
      {/* Header End */}

      {/* Open Hours Start */}
      <div className="container-fluid py-5">
        <div className="container py-5">
          <div className="row">

            <div
              className="col-lg-6"
              style={{ minHeight: "500px" }}
            >
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

                <h1 className="mb-4">
                  Best Relax And Spa Zone
                </h1>

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
      {/* Open Hours End */}
    </>
  );
}

export default Opening;