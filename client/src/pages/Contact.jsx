import { Link } from "react-router-dom";
import ContactForm from "../components/ContactForm";

function Contact() {
  return (
    <>
      {/* Header Start */}
      <div
        className="jumbotron jumbotron-fluid bg-jumbotron"
        style={{ marginBottom: "90px" }}
      >
        <div className="container text-center py-5">
          <h3 className="text-white display-3 mb-4">
            Contact
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
              Contact
            </p>
          </div>
        </div>
      </div>
      {/* Header End */}


      {/* Contact Start */}
      <div className="container-fluid py-5">
        <div className="container py-5">

          <div className="row">

            {/* Map */}
            <div
              className="col-lg-6"
              style={{
                minHeight: "500px",
              }}
            >
              <div className="position-relative h-100">

                <iframe
                  className="position-absolute w-100 h-100"
                  src="https://www.google.com/maps?q=Caloocan+City,+Metro+Manila,+Philippines&output=embed"
                  style={{
                    border: 0,
                  }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Zenora Spa Location - Caloocan City"
                ></iframe>

              </div>
            </div>


            {/* Contact Form */}
            <div className="col-lg-6 pt-5 pb-lg-5">

              <div className="contact-form bg-light p-4 p-lg-5 my-lg-5">

                <h6 className="d-inline-block text-white text-uppercase bg-primary py-1 px-2">
                  Contact
                </h6>

                <h1 className="mb-4">
                  Get in Touch With Zenora
                </h1>

                <p className="text-muted mb-4">
                  Have questions about our services or your appointment?
                  Send us a message and our team will be happy to assist you.
                </p>

                <ContactForm />

              </div>

            </div>

          </div>

        </div>
      </div>
      {/* Contact End */}
    </>
  );
}

export default Contact;