const express = require("express");
const passport = require("passport");
const {
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
} = require("../controllers/authController");
const {
  setupTwoFactor,
  confirmTwoFactor,
  disableTwoFactor,
  verifyLoginTwoFactor,
} = require("../controllers/twoFactorController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Two-factor authentication (TOTP — Google Authenticator/Authy style).
// login-verify is public (it's literally the second step of logging in,
// authenticated by the short-lived tempToken instead of a session cookie).
router.post("/2fa/setup", protect, setupTwoFactor);
router.post("/2fa/confirm", protect, confirmTwoFactor);
router.post("/2fa/disable", protect, disableTwoFactor);
router.post("/2fa/login-verify", verifyLoginTwoFactor);

// Real OAuth (Passport, stateless — session: false since we issue our own
// JWT cookie instead of using passport's session support). The frontend
// triggers these with a full page navigation (window.location.href), not
// fetch, since the user needs to actually see Google/Facebook's consent screen.
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/login?error=oauth`,
  }),
  oauthCallback
);

router.get("/facebook", passport.authenticate("facebook", { scope: ["email"], session: false }));
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/login?error=oauth`,
  }),
  oauthCallback
);

router.get("/me", protect, getMe);
router.put("/verify-email", protect, verifyEmail);
router.put("/change-password", protect, changePassword);
router.put("/profile", protect, updateProfile);

router.post("/watchlist/:movieId", protect, toggleWatchlist);

router.post("/history", protect, saveProgress);
router.delete("/history/:movieId", protect, removeFromHistory);
router.delete("/history", protect, clearHistory);

router.put("/subscription", protect, chooseSubscription);

module.exports = router;
