import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getMovieById, getRelatedContent, castAvatar, getMovieRatings, getMyRating, rateMovie } from "../services/api";
import { useAuth } from "../context/AuthContext";
import MovieRow from "../components/MovieRow";

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isInWatchlist, toggleWatchlist } = useAuth();

  const [movie, setMovie] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ratings (section 8) — community average/count is public; "myRating" is
  // only fetched when logged in.
  const [ratingStats, setRatingStats] = useState({ average: null, count: 0 });
  const [myRating, setMyRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  // getMovieById/getRelatedContent now hit the real backend, so this needs
  // to be async — same loading-state pattern as Home.jsx.
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setMovie(null);
    setRelated([]);
    setRatingStats({ average: null, count: 0 });
    setMyRating(null);

    getMovieById(id).then((m) => {
      if (ignore) return;
      setMovie(m);
      setLoading(false);

      if (m) {
        getRelatedContent(m.id).then((r) => {
          if (!ignore) setRelated(r);
        });

        getMovieRatings(m.id).then((data) => {
          if (!ignore) setRatingStats({ average: data.average, count: data.count });
        });

        if (isAuthenticated) {
          getMyRating(m.id).then((r) => {
            if (!ignore) setMyRating(r?.rating || null);
          });
        }
      }
    });

    return () => {
      ignore = true;
    };
  }, [id, isAuthenticated]);

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (!movie) {
    return (
      <main className="details-page">
        <p>We couldn't find that title.</p>
        <Link to="/" className="list-btn">
          <i class="fa-solid fa-arrow-left"></i> Back to Home
        </Link>
      </main>
    );
  }

  const saved = isInWatchlist(movie.id);

  function handleToggleWatchlist() {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    toggleWatchlist(movie.id);
  }

  async function handleRate(value) {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setSubmittingRating(true);
    try {
      const data = await rateMovie(movie.id, value);
      setMyRating(value);
      setRatingStats({ average: data.average, count: data.count });
    } finally {
      setSubmittingRating(false);
    }
  }

  return (
    <main className="details-page">
      <div className="details-container">
        <div className="details-poster">
          <img src={movie.image} alt={movie.title} />
        </div>

        <div className="details-content">
          <span className="details-label">{movie.type === "series" ? "SERIES" : "MOVIE"}</span>

          <h1>{movie.title}</h1>

          <div className="details-meta">
            <span>{movie.year}</span>
            <span><i class="fa-solid fa-star"></i> {movie.rating}</span>
            <span>{movie.duration}</span>
          </div>

          <div className="genres">
            {movie.genres.map((g) => (
              <span key={g}>{g}</span>
            ))}
          </div>

          <p>{movie.description}</p>

          <p>
            <strong>Director:</strong> {movie.director}
          </p>

          <div className="details-buttons">
            <Link to={`/watch/${movie.id}`} className="watch-btn">
              <i class="fa-solid fa-play"></i> Watch Now
            </Link>

            <button className={`list-btn ${saved ? "active" : ""}`} onClick={handleToggleWatchlist}>
              {saved ? "✓ In My List" : "＋ Add to My List"}
            </button>
          </div>

          <div style={{ marginTop: "22px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "13px", color: "var(--text-muted)" }}>
              {myRating ? "Your rating" : "Rate this title"}
              {ratingStats.count > 0 && (
                <span>
                  {" "}
                  — community average {ratingStats.average} ({ratingStats.count} rating
                  {ratingStats.count === 1 ? "" : "s"})
                </span>
              )}
            </p>

            <div style={{ display: "flex", gap: "4px" }} onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((value) => {
                const filled = value <= (hoverRating || myRating || 0);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleRate(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    disabled={submittingRating}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: submittingRating ? "default" : "pointer",
                      fontSize: "22px",
                      padding: "2px",
                      color: filled ? "var(--accent)" : "var(--text-muted)",
                    }}
                    aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
                  >
                    <i class={filled ? "fa-solid fa-star" : "fa-regular fa-star"}></i>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <section className="cast-section">
        <h2>Cast</h2>

        <div className="cast-row">
          {movie.cast.map((actor) => (
            <div className="cast-card" key={actor}>
              <img src={castAvatar(actor)} alt={actor} />
              <span>{actor}</span>
            </div>
          ))}
        </div>
      </section>

      {related.length > 0 && <MovieRow title="Related Movies" movies={related} />}
    </main>
  );
}

export default MovieDetails;
