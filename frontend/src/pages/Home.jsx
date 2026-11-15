import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MovieRow from "../components/MovieRow";
import { fetchMovies } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isInWatchlist, toggleWatchlist } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMovies().then((data) => {
      setMovies(data);
      setLoading(false);
    });
  }, []);

  const featured = movies[0];
  const savedFeatured = featured ? isInWatchlist(featured.id) : false;

  function handleWatchNow() {
    if (!featured) return;
    navigate(`/watch/${featured.id}`);
  }

  function handleToggleFeaturedWatchlist() {
    if (!featured) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    toggleWatchlist(featured.id);
  }

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  return (
    <main>
      {featured && (
        <section className="hero">
          <div className="hero-content">
            <span className="hero-label">STREAMX ORIGINAL</span>

            <h1>{featured.title}</h1>

            <p>{featured.description}</p>

            <div className="hero-buttons">
              <button className="watch-btn" onClick={handleWatchNow}>
                <i class="fa-solid fa-play"></i> Watch Now
              </button>

              <button
                className={`list-btn ${savedFeatured ? "active" : ""}`}
                onClick={handleToggleFeaturedWatchlist}
              >
                {savedFeatured ? "✓ In My List" : "＋ My List"}
              </button>
            </div>
          </div>
        </section>
      )}

      <MovieRow title="Trending Now" movies={movies} />

      <MovieRow title="Popular Movies" movies={[...movies].reverse()} />

      <MovieRow title="Recommended For You" movies={movies.slice(0, 4)} />
    </main>
  );
}

export default Home;
