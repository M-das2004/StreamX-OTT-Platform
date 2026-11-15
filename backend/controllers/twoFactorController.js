const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function generateSessionToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function setSessionCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// POST /api/auth/2fa/setup — protected
// Generates a new secret and returns a QR code to scan in an authenticator
// app (Google Authenticator, Authy, etc). The secret is saved immediately,
// but twoFactorEnabled stays false until confirmTwoFactor proves the person
// actually set up the app correctly — otherwise a half-finished setup could
// silently lock someone out at their next login.
async function setupTwoFactor(req, res) {
  try {
    const secret = speakeasy.generateSecret({
      name: `StreamX (${req.user.email})`,
    });

    req.user.twoFactorSecret = secret.base32;
    await req.user.save();

    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    res.status(200).json({ qrCode, secret: secret.base32 });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// POST /api/auth/2fa/confirm  { code } — protected
// Proves the person's authenticator app is actually producing valid codes
// before 2FA is turned on for real.
async function confirmTwoFactor(req, res) {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id).select("+twoFactorSecret");

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: "Start setup first." });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1, // allows the previous/next 30s code too, for clock drift
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid code. Check the app and try again." });
    }

    user.twoFactorEnabled = true;
    await user.save();

    res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// POST /api/auth/2fa/disable  { code } — protected
// Requires a valid code to turn 2FA off, not just a click — otherwise
// anyone with a stolen session cookie could disable it and remove the
// protection instead of just bypassing it once.
async function disableTwoFactor(req, res) {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id).select("+twoFactorSecret");

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: "Two-factor authentication isn't enabled." });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid code." });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// POST /api/auth/2fa/login-verify  { tempToken, code } — public
// The second step of login for accounts with 2FA enabled. tempToken was
// issued by authController.login instead of a real session, and only
// proves "this password was correct" — it does NOT grant access on its
// own. A real session cookie is only issued once the TOTP code checks out.
async function verifyLoginTwoFactor(req, res) {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ message: "Missing verification code." });
    }

    let payload;
    try {
      payload = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "This login attempt has expired. Please log in again." });
    }

    if (payload.purpose !== "2fa-pending") {
      return res.status(401).json({ message: "Invalid verification request." });
    }

    const user = await User.findById(payload.id).select("+twoFactorSecret");
    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid code. Please try again." });
    }

    const sessionToken = generateSessionToken(user._id);
    setSessionCookie(res, sessionToken);

    res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

module.exports = { setupTwoFactor, confirmTwoFactor, disableTwoFactor, verifyLoginTwoFactor };
