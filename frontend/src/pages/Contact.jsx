import React, { useState } from "react";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="info-page">
      <div className="info-container">
        <h1>Contact Us</h1>

        <p>
          Have a question, suggestion, or need help with StreamX? Send us a
          message and we will be happy to hear from you.
        </p>

        {submitted ? (
          <div className="success-message">
            <h3>Thank You!</h3>
            <p>Your message has been submitted successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="contact-form">
            <label>Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              required
            />

            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              required
            />

            <label>Subject</label>
            <input
              type="text"
              placeholder="Enter subject"
              required
            />

            <label>Message</label>
            <textarea
              rows="6"
              placeholder="Write your message..."
              required
            ></textarea>

            <button type="submit">Send Message</button>
          </form>
        )}

        <div className="contact-details">
          <h2>Other Ways to Reach Us</h2>

          <p>
            <i class="fa-solid fa-envelope mail"></i> <strong>Email:</strong> support@streamx.com
          </p>

          <p>
            <i class="fa-solid fa-clock"></i> <strong>Support Hours:</strong> Monday - Friday, 9:00 AM - 6:00
            PM
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;