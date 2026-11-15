import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function MovieCard({ movie }) {
  const { isAuthenticated, isInWatchlist, toggleWatchlist } = useAuth();
  const navigate = useNavigate();
  const saved = isInWatchlist(movie.id);

  function handleToggleWatchlist(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    toggleWatchlist(movie.id);
  }

  return (
    <div className="movie-card">
      <button
        className={`watchlist-toggle ${saved ? "active" : ""}`}
        onClick={handleToggleWatchlist}
        aria-label={saved ? "Remove from My List" : "Add to My List"}
        title={saved ? "Remove from My List" : "Add to My List"}
      >
        {saved ? "✓" : "＋"}
      </button>

      <Link to={`/movie/${movie.id}`} className="movie-card-link">
        <img src={movie.image} alt={movie.title} />

        <div className="movie-info">
          <h3>{movie.title}</h3>

          <div className="movie-meta">
            <span>{movie.year}</span>
            <span><i class="fa-solid fa-star"></i> {movie.rating}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default MovieCard;
