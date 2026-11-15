const Movie = require("../models/Movie");

// GET /api/movies?type=movie|series
async function getMovies(req, res) {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;

    const movies = await Movie.find(filter).sort({ id: 1 });
    res.status(200).json({ movies });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// GET /api/movies/search?query=&genre=&type=
async function searchMovies(req, res) {
  try {
    const { query = "", genre = "", type = "" } = req.query;
    const filter = {};

    if (query) filter.title = { $regex: query, $options: "i" };
    if (genre) filter.genres = genre;
    if (type) filter.type = type;

    const movies = await Movie.find(filter).sort({ id: 1 });
    res.status(200).json({ movies });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// GET /api/movies/:id
async function getMovieById(req, res) {
  try {
    const movie = await Movie.findOne({ id: Number(req.params.id) });
    if (!movie) return res.status(404).json({ message: "Title not found." });
    res.status(200).json({ movie });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// GET /api/movies/:id/related?limit=5
async function getRelatedMovies(req, res) {
  try {
    const movie = await Movie.findOne({ id: Number(req.params.id) });
    if (!movie) return res.status(404).json({ message: "Title not found." });

    const limit = Number(req.query.limit) || 5;
    const related = await Movie.find({
      id: { $ne: movie.id },
      genres: { $in: movie.genres },
    }).limit(limit);

    res.status(200).json({ related });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// POST /api/movies (admin only)
async function createMovie(req, res) {
  try {
    const last = await Movie.findOne().sort({ id: -1 });
    const nextId = req.body.id ?? (last?.id || 0) + 1;

    const movie = await Movie.create({ ...req.body, id: nextId });
    res.status(201).json({ movie });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// PUT /api/movies/:id (admin only)
async function updateMovie(req, res) {
  try {
    const movie = await Movie.findOneAndUpdate(
      { id: Number(req.params.id) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!movie) return res.status(404).json({ message: "Title not found." });
    res.status(200).json({ movie });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// DELETE /api/movies/:id (admin only)
async function deleteMovie(req, res) {
  try {
    const movie = await Movie.findOneAndDelete({ id: Number(req.params.id) });
    if (!movie) return res.status(404).json({ message: "Title not found." });
    res.status(200).json({ message: "Deleted." });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

module.exports = {
  getMovies,
  searchMovies,
  getMovieById,
  getRelatedMovies,
  createMovie,
  updateMovie,
  deleteMovie,
};
