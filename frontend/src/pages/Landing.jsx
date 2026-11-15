import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Landing.css";
import { fetchAllContent } from "../services/api";
import Footer from "../components/Footer";

// ==========================================
// TRENDING CARD
// ==========================================

const TrendingCard = ({ id, rank, title, image }) => {
  return (
    <Link to={`/movie/${id}`} className="trending-card" data-title={title}>
      <img src={image} alt={title} />
      <span className="rank">{rank}</span>
    </Link>
  );
};

// ==========================================
// REASON CARD
// ==========================================

const ReasonCard = ({ title, description }) => {
  return (
    <div className="reason-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

// ==========================================
// LANDING PAGE
// ==========================================

function Landing() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  // Language dropdown state
  const [languageOpen, setLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  const trendingRef = useRef(null);

  // The catalog now comes from the backend rather than a hardcoded array.
  const [content, setContent] = useState([]);

  useEffect(() => {
    fetchAllContent().then(setContent);
  }, []);

  // ==========================================
  // LANGUAGES
  // ==========================================

  const languages = [
    "English",
    "Hindi",
    "Tamil",
    "Telugu",
    "Bengali",
    "Malayalam",
    "Marathi",
  ];

  // ==========================================
  // LANGUAGE SELECT
  // ==========================================

  function handleLanguageSelect(language) {
    setSelectedLanguage(language);
    setLanguageOpen(false);
  }

  // ==========================================
  // TRENDING SCROLL
  // ==========================================

  function scrollNext() {
    trendingRef.current?.scrollBy({
      left: 400,
      behavior: "smooth",
    });
  }

  function scrollPrevious() {
    trendingRef.current?.scrollBy({
      left: -400,
      behavior: "smooth",
    });
  }

  // ==========================================
  // TRENDING MOVIES
  // ==========================================

  const trendingMovies = content.map((item, index) => ({
    rank: index + 1,
    id: item.id,
    title: item.title,
    image: item.image,
  }));

  // ==========================================
  // REASONS
  // ==========================================

  const reasons = [
    {
      title: "Enjoy on your TV",
      description:
        "Watch on smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players and more.",
    },
    {
      title: "Download your shows to watch offline",
      description:
        "Save your favourites easily and always have something to watch.",
    },
    {
      title: "Watch everywhere",
      description:
        "Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV.",
    },
    {
      title: "Create profiles for kids",
      description:
        "Send kids on adventures with their favourite characters in a space made just for them — free with your membership.",
    },
  ];

  // ==========================================
  // GET STARTED
  // ==========================================

  function handleGetStarted(e) {
    e.preventDefault();

    navigate("/register", {
      state: { email },
    });
  }

  return (
    <div className="landing-page">

      {/* ======================================
          HERO SECTION
      ====================================== */}

      <section className="hero-section">

        <div
          className="hero-background"
          style={{ "--hero-image": `url(/assets/hero.jpg)` }}
        ></div>

        {/* ======================================
            HEADER
        ====================================== */}

        <header className="hero-header">

          <div className="brand-logo">
            STREAMX
          </div>

          <div className="header-right">

            {/* ==================================
                LANGUAGE DROPDOWN
            ================================== */}

            <div className="language-dropdown">

              <button
                className="language-btn"
                type="button"
                onClick={() => setLanguageOpen(!languageOpen)}
              >

                <span className="lang-icon">
                  <i className="fa-solid fa-language"></i>
                </span>

                <span className="selected-language">
                  {selectedLanguage}
                </span>

                <span className="down-arrow">
                  <i
                    className={`fa-solid ${
                      languageOpen
                        ? "fa-angle-up"
                        : "fa-angle-down"
                    }`}
                  ></i>
                </span>

              </button>

              {/* ==================================
                  LANGUAGE MENU
              ================================== */}

              {languageOpen && (
                <div className="language-menu">

                  {languages.map((language) => (
                    <button
                      key={language}
                      type="button"
                      className={`language-option ${
                        selectedLanguage === language
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleLanguageSelect(language)
                      }
                    >
                      {language}
                    </button>
                  ))}

                </div>
              )}

            </div>

            {/* ==================================
                SIGN IN
            ================================== */}

            <Link
              to="/login"
              className="sign-in-btn"
            >
              Sign In
            </Link>

          </div>

        </header>

        {/* ======================================
            HERO CONTENT
        ====================================== */}

        <div className="landing-hero-content">

          <h1>
            Unlimited movies,
            <br />
            shows, and more
          </h1>

          <h3>
            Starts at ₹149. Cancel at any time.
          </h3>

          <p>
            Ready to watch? Enter your email to create
            or restart your membership.
          </p>

          <form
            className="hero-form"
            onSubmit={handleGetStarted}
          >

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button type="submit">

              Get Started

              <span>
                <i className="fa-solid fa-angle-right"></i>
              </span>

            </button>

          </form>

        </div>

      </section>

      {/* ======================================
          TRENDING SECTION
      ====================================== */}

      <section className="trending-section">

        <h2>
          Trending Now
        </h2>

        <div className="trending-wrapper">

          <button
            className="scroll-btn previous-btn"
            aria-label="Previous movies"
            type="button"
            onClick={scrollPrevious}
          >
            <i className="fa-solid fa-angle-left"></i>
          </button>

          <div
            className="trending-container"
            ref={trendingRef}
          >

            {trendingMovies.map((movie) => (
              <TrendingCard
                key={movie.id}
                id={movie.id}
                rank={movie.rank}
                title={movie.title}
                image={movie.image}
              />
            ))}

          </div>

          <button
            className="scroll-btn next-btn"
            aria-label="Next movies"
            type="button"
            onClick={scrollNext}
          >
            <i className="fa-solid fa-angle-right"></i>
          </button>

        </div>

      </section>

      {/* ======================================
          REASONS SECTION
      ====================================== */}

      <section className="reasons-section">

        <h2>
          More reasons to join
        </h2>

        <div className="reasons-container">

          {reasons.map((reason, index) => (
            <ReasonCard
              key={index}
              title={reason.title}
              description={reason.description}
            />
          ))}

        </div>

      </section>

      {/* ======================================
          FOOTER
      ====================================== */}

      <Footer />

    </div>
  );
}

export default Landing;