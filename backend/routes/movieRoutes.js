const express = require("express");
const {
  getMovies,
  searchMovies,
  getMovieById,
  getRelatedMovies,
  createMovie,
  updateMovie,
  deleteMovie,
} = require("../controllers/movieController");
const {
  submitRating,
  getMovieRatings,
  getMyRating,
  deleteRating,
} = require("../controllers/ratingController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

const router = express.Router();

// IMPORTANT: /search must be registered before /:id, otherwise Express
// treats "search" itself as an :id value.
router.get("/search", searchMovies);
router.get("/", getMovies);
router.get("/:id/related", getRelatedMovies);

// Ratings (section 8) — nested under a title's own id.
router.get("/:id/ratings", getMovieRatings);
router.get("/:id/rating/me", protect, getMyRating);
router.post("/:id/rating", protect, submitRating);
router.delete("/:id/rating", protect, deleteRating);

router.get("/:id", getMovieById);

router.post("/", protect, adminOnly, createMovie);
router.put("/:id", protect, adminOnly, updateMovie);
router.delete("/:id", protect, adminOnly, deleteMovie);

module.exports = router;
