const Rating = require("../models/Rating");
const Movie = require("../models/Movie");

async function computeStats(movieId) {
  const ratings = await Rating.find({ movieId });
  const count = ratings.length;
  const average = count
    ? Number((ratings.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
    : null;
  return { count, average };
}

// POST /api/movies/:id/rating  { rating (1-5), review? }
async function submitRating(req, res) {
  try {
    const movieId = Number(req.params.id);
    const { rating, review = "" } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    const movie = await Movie.findOne({ id: movieId });
    if (!movie) return res.status(404).json({ message: "Title not found." });

    const doc = await Rating.findOneAndUpdate(
      { user: req.user._id, movieId },
      { rating, review },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const stats = await computeStats(movieId);
    res.status(200).json({ rating: doc.toJSON(), ...stats });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// GET /api/movies/:id/ratings — public: everyone can see the breakdown
async function getMovieRatings(req, res) {
  try {
    const movieId = Number(req.params.id);
    const ratings = await Rating.find({ movieId })
      .populate("user", "name")
      .sort({ createdAt: -1 });
    const stats = await computeStats(movieId);

    res.status(200).json({
      ratings: ratings.map((r) => ({
        id: r._id,
        rating: r.rating,
        review: r.review,
        userName: r.user?.name || "Anonymous",
        createdAt: r.createdAt,
      })),
      ...stats,
    });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// GET /api/movies/:id/rating/me
async function getMyRating(req, res) {
  try {
    const movieId = Number(req.params.id);
    const doc = await Rating.findOne({ user: req.user._id, movieId });
    res.status(200).json({ rating: doc ? doc.toJSON() : null });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// DELETE /api/movies/:id/rating
async function deleteRating(req, res) {
  try {
    const movieId = Number(req.params.id);
    await Rating.findOneAndDelete({ user: req.user._id, movieId });
    const stats = await computeStats(movieId);
    res.status(200).json({ ...stats });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

module.exports = { submitRating, getMovieRatings, getMyRating, deleteRating };
