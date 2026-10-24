import { useState } from "react";

function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setStatus("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.subject.trim() ||
      !formData.message.trim()
    ) {
      setStatus("Please complete all fields.");
      return;
    }

    console.log("Contact message:", formData);

    setStatus("Your message has been submitted.");

    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Name + Email */}
      <div className="row">
        <div className="col-md-6">
          <div className="form-group">
            <input
              type="text"
              name="name"
              className="form-control contact-input"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="col-md-6">
          <div className="form-group">
            <input
              type="email"
              name="email"
              className="form-control contact-input"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Subject */}
      <div className="form-group">
        <input
          type="text"
          name="subject"
          className="form-control contact-input"
          placeholder="Subject"
          value={formData.subject}
          onChange={handleChange}
        />
      </div>

      {/* Message */}
      <div className="form-group">
        <textarea
          name="message"
          className="form-control contact-message"
          rows="6"
          placeholder="Message"
          value={formData.message}
          onChange={handleChange}
        />
      </div>

      {status && (
        <div
          className={`alert ${
            status.includes("submitted")
              ? "alert-success"
              : "alert-danger"
          }`}
        >
          {status}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary px-4 py-3"
      >
        <i className="far fa-paper-plane mr-2"></i>
        Send Message
      </button>
    </form>
  );
}

export default ContactForm;