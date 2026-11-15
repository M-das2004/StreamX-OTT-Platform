import { useEffect, useState } from "react";
import MovieRow from "../components/MovieRow";
import { fetchAllContent } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Watchlist() {
  const { user } = useAuth();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  // The catalog now comes from the backend rather than a hardcoded array,
  // so it's fetched once here and filtered client-side against the user's
  // watchlist/history ids — same behavior as before, just async.
  useEffect(() => {
    fetchAllContent().then((data) => {
      setContent(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  const savedMovies = content.filter((m) => user?.watchlist?.includes(m.id));

  const continueWatching = (user?.history || [])
    .filter((h) => h.progressSeconds > 5)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .map((h) => content.find((m) => m.id === h.movieId))
    .filter(Boolean);

  return (
    <main className="watchlist-page">
      <h1 className="myList">My List</h1>

      {continueWatching.length > 0 && (
        <MovieRow title="Continue Watching" movies={continueWatching} />
      )}

      <MovieRow
        title="Saved Movies"
        movies={savedMovies}
        emptyMessage="You haven't added anything to your list yet. Tap ＋ on a title to save it here."
      />
    </main>
  );
}

export default Watchlist;
