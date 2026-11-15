import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import MovieRow from "../components/MovieRow";
import { searchMovies } from "../services/api";

function Search() {
  const [searchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const query = searchParams.get("query") || "";
  const genre = searchParams.get("genre") || "";

  useEffect(() => {
    setLoading(true);
    searchMovies({ query, genre }).then((results) => {
      setMovies(results);
      setLoading(false);
    });
  }, [query, genre]);

  const hasFilters = query || genre;

  return (
    <main className="search-page">
      <h1>Search Movies</h1>

      <SearchBar />

      {hasFilters && !loading && (
        <p className="search-status">
          {movies.length} result{movies.length === 1 ? "" : "s"}
          {query && <> for "{query}"</>}
          {genre && <> in {genre}</>}
        </p>
      )}

      <MovieRow
        title={hasFilters ? "Search Results" : "Browse All"}
        movies={movies}
        emptyMessage="No movies matched your search. Try a different title or genre."
      />
    </main>
  );
}

export default Search;
