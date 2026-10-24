import { useState } from "react";

function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [statusMessage, setStatusMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setStatusMessage("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Temporary until we connect the backend.
    console.log("Contact form submitted:", formData);

    setStatusMessage(
      "Your message is ready to be submitted."
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="col-sm-6 control-group">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-control border-0 p-4"
            placeholder="Your Name"
            required
          />
        </div>

        <div className="col-sm-6 control-group">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-control border-0 p-4"
            placeholder="Your Email"
            required
          />
        </div>
      </div>

      <div className="control-group">
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          className="form-control border-0 p-4"
          placeholder="Subject"
          required
        />
      </div>

      <div className="control-group">
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          className="form-control border-0 py-3 px-4"
          rows="3"
          placeholder="Message"
          required
        ></textarea>
      </div>

      <div>
        <button
          className="btn btn-primary py-3 px-4"
          type="submit"
        >
          Send Message
        </button>
      </div>

      {statusMessage && (
        <p className="text-success mt-3 mb-0">
          {statusMessage}
        </p>
      )}
    </form>
  );
}

export default ContactForm;