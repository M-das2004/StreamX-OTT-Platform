const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function buildCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

// Signs a JWT, sets it as an httpOnly cookie, and sends the sanitized user
// back in the response body (the cookie is what actually authenticates
// future requests; the body is just convenient for the frontend to read).
function sendTokenResponse(user, statusCode, res) {
  const token = generateToken(user._id);
  res.cookie("token", token, buildCookieOptions());
  res.status(statusCode).json({ user: user.toJSON(), token });
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide name, email and password." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({ name, email, password });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please enter your email and password." });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user || user.provider) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    if (user.suspended) {
      return res.status(403).json({ message: "Your account has been suspended. Contact support." });
    }

    if (user.twoFactorEnabled) {
      // Don't issue a real session yet — only a short-lived token proving
      // the password was correct. A second request with a valid TOTP code
      // (see twoFactorController.verifyLoginTwoFactor) is required before
      // any session cookie is set.
      const tempToken = jwt.sign({ id: user._id, purpose: "2fa-pending" }, process.env.JWT_SECRET, {
        expiresIn: "5m",
      });
      return res.status(200).json({ requiresTwoFactor: true, tempToken });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// POST /api/auth/forgot-password  { email }
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Please enter your email." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond the same way whether or not the account exists (and
    // whether it's a password account at all) — otherwise this endpoint
    // becomes a way to check which emails are registered.
    const genericResponse = {
      message: "If an account exists for that email, a password reset link has been sent.",
    };

    // Social-login accounts have no password to reset — silently no-op
    // rather than revealing that distinction to the caller.
    if (!user || user.provider) {
      return res.status(200).json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    const resetUrl = `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/reset-password/${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your StreamX password",
      text: `You requested a password reset. Click this link to choose a new password (expires in 30 minutes):\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    });

    // Dev convenience only: surface the link directly in the response so
    // the flow is testable without a real mail server configured. Remove
    // this in production — it defeats the point of email verification if
    // anyone can read the token straight from the API response.
    if (process.env.NODE_ENV !== "production") {
      genericResponse.devResetUrl = resetUrl;
    }

    res.status(200).json(genericResponse);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// POST /api/auth/reset-password/:token  { password }
async function resetPassword(req, res) {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid or has expired." });
    }

    user.password = password; // pre-save hook re-hashes this
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Log them straight in — they just proved control of their email, no
    // need to make them go type the new password again on a login screen.
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// GET /api/auth/{google,facebook}/callback
// Passport has already run the strategy and found/created req.user by the
// time this fires (see config/passport.js). Since this is a full-page
// browser redirect (not a fetch call the frontend is waiting on), we set
// the cookie and redirect back into the app rather than returning JSON.
function oauthCallback(req, res) {
  if (req.user?.suspended) {
    return res.redirect(`${process.env.CLIENT_ORIGIN}/login?error=suspended`);
  }

  const token = generateToken(req.user._id);
  res.cookie("token", token, buildCookieOptions());
  res.redirect(process.env.CLIENT_ORIGIN || "http://localhost:5173");
}

// POST /api/auth/logout
function logout(_req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ message: "Logged out." });
}

// GET /api/auth/me
function getMe(req, res) {
  res.status(200).json({ user: req.user.toJSON() });
}

// PUT /api/auth/verify-email
async function verifyEmail(req, res) {
  req.user.emailVerified = true;
  await req.user.save();
  res.status(200).json({ user: req.user.toJSON() });
}

// PUT /api/auth/change-password
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Fill in all password fields." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (user.provider) {
      return res
        .status(400)
        .json({ message: "This account signed in with a social provider and has no password to change." });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    user.password = newPassword; // pre-save hook re-hashes this
    await user.save();

    res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// PUT /api/auth/profile
// Generic account-settings update — name, email, language, parental
// controls, notifications, 2FA toggle. (A dedicated /api/users module is the
// more "correct" home for this long-term; it lives here for now since it's
// just the same User document.)
async function updateProfile(req, res) {
  try {
    const allowed = ["name", "email", "language", "parentalControls", "notifications", "twoFactorEnabled"];
    for (const key of allowed) {
      if (key in req.body) req.user[key] = req.body[key];
    }
    if (req.body.email) req.user.email = req.body.email.toLowerCase();

    await req.user.save();
    res.status(200).json({ user: req.user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// POST /api/auth/watchlist/:movieId
async function toggleWatchlist(req, res) {
  try {
    const movieId = Number(req.params.movieId);
    const exists = req.user.watchlist.includes(movieId);

    req.user.watchlist = exists
      ? req.user.watchlist.filter((id) => id !== movieId)
      : [...req.user.watchlist, movieId];

    await req.user.save();
    res.status(200).json({ user: req.user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// POST /api/auth/history  { movieId, progressSeconds }
async function saveProgress(req, res) {
  try {
    const movieId = Number(req.body.movieId);
    const { progressSeconds } = req.body;

    const existing = req.user.history.find((h) => h.movieId === movieId);
    if (existing) {
      existing.progressSeconds = progressSeconds;
      existing.updatedAt = new Date();
    } else {
      req.user.history.push({ movieId, progressSeconds, updatedAt: new Date() });
    }

    await req.user.save();
    res.status(200).json({ user: req.user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// DELETE /api/auth/history/:movieId
async function removeFromHistory(req, res) {
  try {
    const movieId = Number(req.params.movieId);
    req.user.history = req.user.history.filter((h) => h.movieId !== movieId);
    await req.user.save();
    res.status(200).json({ user: req.user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// DELETE /api/auth/history
async function clearHistory(req, res) {
  try {
    req.user.history = [];
    await req.user.save();
    res.status(200).json({ user: req.user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// PUT /api/auth/subscription  { planId }
async function chooseSubscription(req, res) {
  try {
    req.user.plan = req.body.planId;
    await req.user.save();
    res.status(200).json({ user: req.user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  oauthCallback,
  logout,
  getMe,
  verifyEmail,
  changePassword,
  updateProfile,
  toggleWatchlist,
  saveProgress,
  removeFromHistory,
  clearHistory,
  chooseSubscription,
};
