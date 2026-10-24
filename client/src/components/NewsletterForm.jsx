import { useState } from "react";

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    // Temporary until backend is connected.
    console.log("Newsletter email:", email);

    setMessage("Email is ready to be subscribed.");
  };

  return (
    <form onSubmit={handleSubmit} className="w-100">
      <div className="input-group">
        <input
          type="email"
          className="form-control border-light"
          style={{ padding: "30px" }}
          placeholder="Your Email Address"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setMessage("");
          }}
          required
        />

        <div className="input-group-append">
          <button
            className="btn btn-primary px-4"
            type="submit"
          >
            Sign Up
          </button>
        </div>
      </div>

      {message && (
        <small className="d-block text-white mt-2">
          {message}
        </small>
      )}
    </form>
  );
}

export default NewsletterForm;