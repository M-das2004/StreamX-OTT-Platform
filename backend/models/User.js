const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// A single "continue watching" / history entry. movieId stays a plain Number
// for now to match the demo catalog in the frontend's services/api.js — swap
// to a ref('Movie') once the Movie/Content module (backend plan section 4)
// exists.
const historyEntrySchema = new mongoose.Schema(
  {
    movieId: { type: Number, required: true },
    progressSeconds: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // No password for social-login accounts (provider is set instead).
    // select: false keeps it out of normal queries so it's never
    // accidentally sent to the client.
    password: { type: String, select: false, default: null },
    provider: { type: String, enum: ["google", "facebook", null], default: null },
    providerId: { type: String, default: null },

    resetPasswordToken: { type: String, select: false, default: null },
    resetPasswordExpires: { type: Date, select: false, default: null },

    language: { type: String, default: "English" },
    parentalControls: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true },

    emailVerified: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },

    // Section 11 (Admin) groundwork — everyone is a plain "user" until you
    // promote an account manually (e.g. via mongosh) or build an admin UI.
    role: { type: String, enum: ["user", "admin"], default: "user" },
    suspended: { type: Boolean, default: false },

    twoFactorSecret: { type: String, select: false, default: null },

    // Section 6 (Subscription) / section 5 (Watchlist & History) fields.
    // Not populated by the Authentication module, but included here so the
    // shape matches AuthContext's expectations end-to-end.
    plan: { type: String, default: null },
    watchlist: { type: [Number], default: [] },
    history: { type: [historyEntrySchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.twoFactorSecret;
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Hash the password whenever it's set/changed (skip social accounts with no password)
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
