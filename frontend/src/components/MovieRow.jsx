import MovieCard from "./MovieCard";

function MovieRow({ title, movies, emptyMessage = "Nothing here yet." }) {
  return (
    <section className="movie-section">
      <div className="section-header">
        <h2>{title}</h2>
      </div>

      {movies && movies.length > 0 ? (
        <div className="movie-row">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="movie-row empty">{emptyMessage}</div>
      )}
    </section>
  );
}

export default MovieRow;
