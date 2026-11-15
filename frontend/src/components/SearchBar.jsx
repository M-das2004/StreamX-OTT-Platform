import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GENRES } from "../services/api";

function SearchBar() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [genre, setGenre] = useState(searchParams.get("genre") || "");
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();

    const params = new URLSearchParams();
    if (query.trim()) params.set("query", query.trim());
    if (genre) params.set("genre", genre);

    navigate(`/search?${params.toString()}`);
  }

  return (
    <form className="search-bar" onSubmit={handleSearch}>
      <input
        type="text"
        placeholder="Search movies, series..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <select value={genre} onChange={(e) => setGenre(e.target.value)}>
        <option value="">All genres</option>
        {GENRES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <button type="submit">Search</button>
    </form>
  );
}

export default SearchBar;
