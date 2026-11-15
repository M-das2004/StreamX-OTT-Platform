import { useParams, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import VideoPlayer from "../components/VideoPlayer";
import { getMovieById } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Watch() {
  const { id } = useParams();
  const { user, saveProgress } = useAuth();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  // Throttle progress writes so we're not hitting the backend on every frame
  const lastSaved = useRef(0);

  // getMovieById now hits the real backend, so this needs to be async.
  useEffect(() => {
    let ignore = false;
    setLoading(true);

    getMovieById(id).then((m) => {
      if (!ignore) {
        setMovie(m);
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (!movie) {
    return (
      <main className="watch-page">
        <p>We couldn't find that title.</p>
        <Link to="/" className="list-btn">
          <i class="fa-solid fa-arrow-left"></i> Back to Home
        </Link>
      </main>
    );
  }

  const existingProgress = user?.history?.find((h) => h.movieId === movie.id);
  const startAt = existingProgress?.progressSeconds || 0;

  function handleProgress(currentTime) {
    if (!user) return;
    if (currentTime - lastSaved.current < 5) return; // save at most every 5s

    lastSaved.current = currentTime;
    saveProgress(movie.id, currentTime);
  }

  return (
    <main className="watch-page">
      <div className="video-container">
        <VideoPlayer
          videoUrl={movie.videoUrl}
          poster={movie.image}
          startAt={startAt}
          onProgress={handleProgress}
        />
      </div>

      <div className="watch-info">
        <h1>{movie.title}</h1>

        <div className="details-meta">
          <span>{movie.year}</span>
          <span><i class="fa-solid fa-star"></i> {movie.rating}</span>
          <span>{movie.duration}</span>
        </div>

        <p>
          You are watching <strong>{movie.title}</strong>. Enjoy the movie and continue watching
          from where you left off.
        </p>

        <Link to="/" className="list-btn">
          <i class="fa-solid fa-arrow-left"></i> Back to Home
        </Link>
      </div>
    </main>
  );
}

export default Watch;
