const User = require("../models/User");
const Movie = require("../models/Movie");
const Rating = require("../models/Rating");
const Subscription = require("../models/Subscription");

// GET /api/admin/users
async function getUsers(_req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ users: users.map((u) => u.toJSON()) });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// PUT /api/admin/users/:id  { role?, suspended? }
async function updateUser(req, res) {
  try {
    const allowed = ["role", "suspended"];
    const updates = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ message: "User not found." });

    res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// DELETE /api/admin/users/:id
async function deleteUser(req, res) {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: "You can't delete your own account." });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    res.status(200).json({ message: "User deleted." });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// GET /api/admin/analytics
async function getAnalytics(_req, res) {
  try {
    const [totalUsers, totalMovies, totalSeries, totalRatings, activeSubscriptions] = await Promise.all([
      User.countDocuments(),
      Movie.countDocuments({ type: "movie" }),
      Movie.countDocuments({ type: "series" }),
      Rating.countDocuments(),
      Subscription.countDocuments({ status: "active" }),
    ]);

    const planBreakdown = await Subscription.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$planId", count: { $sum: 1 } } },
    ]);

    const ratingAgg = await Rating.aggregate([{ $group: { _id: null, average: { $avg: "$rating" } } }]);

    res.status(200).json({
      totalUsers,
      totalMovies,
      totalSeries,
      totalRatings,
      activeSubscriptions,
      planBreakdown: planBreakdown.map((p) => ({ planId: p._id, count: p.count })),
      averageRating: ratingAgg[0] ? Number(ratingAgg[0].average.toFixed(2)) : null,
    });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

module.exports = { getUsers, updateUser, deleteUser, getAnalytics };
