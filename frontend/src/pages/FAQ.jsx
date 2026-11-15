import React from "react";

const FAQ = () => {
  return (
    <div className="info-page">
      <div className="info-container">
        <h1>Frequently Asked Questions</h1>

        <div className="faq-item">
          <h3>What is StreamX?</h3>
          <p>
            StreamX is an OTT streaming platform where you can discover and
            watch movies and series.
          </p>
        </div>

        <div className="faq-item">
          <h3>Do I need an account to use StreamX?</h3>
          <p>
            Some features require you to log in, including watchlists, viewing
            history, ratings, and subscription features.
          </p>
        </div>

        <div className="faq-item">
          <h3>Can I search for movies and series?</h3>
          <p>
            Yes. StreamX provides search functionality along with genre and
            content-type filtering.
          </p>
        </div>

        <div className="faq-item">
          <h3>Can I create a Watchlist?</h3>
          <p>
            Yes. Logged-in users can add or remove titles from their personal
            Watchlist.
          </p>
        </div>

        <div className="faq-item">
          <h3>Does StreamX save my viewing progress?</h3>
          <p>
            Yes. StreamX can save your viewing progress so you can continue
            watching later.
          </p>
        </div>

        <div className="faq-item">
          <h3>Can I rate movies and series?</h3>
          <p>
            Yes. Users can submit a rating from 1 to 5 stars for available
            titles.
          </p>
        </div>

        <div className="faq-item">
          <h3>Does StreamX have subscription plans?</h3>
          <p>
            Yes. StreamX provides multiple subscription tiers and supports
            subscription checkout.
          </p>
        </div>

        <div className="faq-item">
          <h3>How can I contact StreamX?</h3>
          <p>
            Visit the Contact page and submit the contact form with your
            question or issue.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;