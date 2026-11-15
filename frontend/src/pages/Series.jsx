import { useEffect, useState } from "react";
import MovieRow from "../components/MovieRow";
import { fetchSeries } from "../services/api";

function Series() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeries().then((data) => {
      setSeries(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  return (
    <main className="search-page">
      <h1>Series</h1>

      <MovieRow title="All Series" movies={series} emptyMessage="No series available yet." />

      <MovieRow
        title="New Seasons"
        movies={[...series].reverse()}
        emptyMessage="No series available yet."
      />
    </main>
  );
}

export default Series;
