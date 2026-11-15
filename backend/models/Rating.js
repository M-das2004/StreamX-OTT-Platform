const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    movieId: { type: Number, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// One rating per user per title — resubmitting updates it instead of
// creating a duplicate row.
ratingSchema.index({ user: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);
