import { Link } from "react-router-dom";
import therapists from "../data/therapists";

function Team() {
  return (
    <>
      {/* =========================================
          HEADER
      ========================================= */}
      <div className="jumbotron jumbotron-fluid page-banner therapists-banner">
        <div className="container text-center">
          <h3 className="text-white page-banner-title mb-4">
            Our Therapists
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
              Therapists
            </p>
          </div>
        </div>
      </div>


      {/* =========================================
          THERAPIST PROFILES
      ========================================= */}
      <div className="container-fluid py-5">
        <div className="container py-5">

          <div className="row mx-0 justify-content-center text-center">
            <div className="col-lg-7">

              <h6 className="d-inline-block bg-light text-primary text-uppercase py-1 px-2">
                Our Therapists
              </h6>

              <h1 className="mb-4">
                Meet Our Massage Therapists
              </h1>

              <p className="text-muted mb-5">
                Browse our therapist profiles and choose the
                professional who best matches your preferred
                spa treatment.
              </p>

            </div>
          </div>


          <div className="row justify-content-center">

            {therapists.map((therapist) => (
              <div
                className="col-xl-3 col-lg-3 col-md-6 mb-4"
                key={therapist.id}
              >

                <div className="therapist-card team-therapist-card">

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


                    <p className="text-white-50 mb-4 team-therapist-bio">
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

        </div>
      </div>
    </>
  );
}

export default Team;