const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    // Stable numeric id — kept separate from Mongo's _id so it matches the
    // ids already referenced in User.watchlist / User.history (and in the
    // frontend's existing routes like /movie/:id, /watch/:id).
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["movie", "series"], required: true },
    year: { type: Number, required: true },
    rating: { type: Number, required: true },
    duration: { type: String, required: true },
    genres: { type: [String], default: [] },
    image: { type: String, required: true },
    description: { type: String, required: true },
    director: { type: String, default: "" },
    cast: { type: [String], default: [] },
    videoUrl: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        // Drop Mongo internals so the shape matches exactly what the
        // frontend already expects from the old mock catalog.
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("Movie", movieSchema);
