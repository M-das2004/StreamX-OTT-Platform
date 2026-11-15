import React from "react";

const Help = () => {
  return (
    <div className="info-page">
      <div className="info-container">
        <h1>Help Center</h1>

        <p>
          Welcome to the StreamX Help Center. Here are some common solutions
          for problems you may experience.
        </p>

        <h2><i class="fa-solid fa-user-lock"></i> Can't Log In?</h2>

        <p>
          Check that your email and password are correct. If you forgot your
          password, use the "Forgot Password" option on the login page.
        </p>

        <h2><i class="fa-solid fa-magnifying-glass"></i> How do I search for a movie?</h2>

        <p>
          Use the search bar available on StreamX and enter the name of a movie,
          series, or other content you want to find.
        </p>

        <h2><i class="fa-solid fa-heart"></i> How do I add something to my Watchlist?</h2>

        <p>
          Open the movie or series details page and select the Watchlist
          option.
        </p>

        <h2><i class="fa-solid fa-play"></i> How does Continue Watching work?</h2>

        <p>
          StreamX saves your viewing progress so you can continue watching a
          title from approximately where you previously stopped.
        </p>

        <h2><i class="fa-solid fa-star"></i> How do ratings work?</h2>

        <p>
          Logged-in users can rate available titles using a 1–5 star rating
          system.
        </p>

        <h2><i class="fa-solid fa-credit-card"></i> Subscription Problems</h2>

        <p>
          If you experience a problem with your subscription or payment, check
          your subscription page first. If the problem continues, contact
          StreamX support.
        </p>

        <h2>Still Need Help?</h2>

        <p>
          If you cannot find a solution, visit our Contact page and send us a
          message.
        </p>
      </div>
    </div>
  );
};

export default Help;