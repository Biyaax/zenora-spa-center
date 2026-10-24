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
              <Link className="text-white" to="/">
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
              style={{ minHeight: "500px" }}
            >
              <div className="position-relative h-100">
                <iframe
                  className="position-absolute w-100 h-100"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3001156.4288297426!2d-78.01371936852176!3d42.72876761954724!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4ccc4bf0f123a5a9%3A0xddcfc6c1de189567!2sNew%20York%2C%20USA!5e0!3m2!1sen!2sbd!4v1603794290143!5m2!1sen!2sbd"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="Spa Center Location"
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
                  Contact For Any Query
                </h1>

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