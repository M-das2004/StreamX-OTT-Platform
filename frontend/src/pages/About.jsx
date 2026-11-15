import React from "react";

const About = () => {
  return (
    <div className="info-page">
      <div className="info-container">
        <h1>About StreamX</h1>

        <p>
          Welcome to <strong>StreamX</strong>, your destination for movies and
          series. StreamX is a modern OTT streaming platform designed to make
          discovering and watching entertainment simple and enjoyable.
        </p>

        <h2>What is StreamX?</h2>

        <p>
          StreamX allows users to explore a collection of movies and series,
          search for their favorite content, manage a personal watchlist,
          continue watching from where they stopped, and rate titles.
        </p>

        <h2>Our Features</h2>

        <ul>
          <li><i class="fa-solid fa-clapperboard"></i> Movies and series catalog</li>
          <li><i class="fa-solid fa-magnifying-glass"></i> Search and genre filtering</li>
          <li><i class="fa-solid fa-heart"></i> Personal watchlist</li>
          <li><i class="fa-solid fa-play"></i> Continue Watching</li>
          <li><i class="fa-solid fa-star"></i> Movie and series ratings</li>
          <li><i class="fa-solid fa-user"></i> User profiles</li>
          <li><i class="fa-solid fa-credit-card"></i> Subscription plans</li>
          <li><i class="fa-solid fa-user-lock"></i> Secure user authentication</li>
        </ul>

        <h2>Our Goal</h2>

        <p>
          Our goal is to provide a clean, easy-to-use and enjoyable streaming
          experience where users can discover great content and manage their
          entertainment in one place.
        </p>

        <p className="info-footer">
          Thank you for choosing StreamX. Sit back, relax, and enjoy watching!
        </p>
      </div>
    </div>
  );
};

export default About;