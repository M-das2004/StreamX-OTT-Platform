const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Reads the JWT from the httpOnly cookie (preferred) or an Authorization:
// Bearer header (useful for non-browser clients), verifies it, and attaches
// the user document to req.user.
async function protect(req, res, next) {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authenticated." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    if (user.suspended) {
      return res.status(403).json({ message: "Your account has been suspended. Contact support." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired session." });
  }
}

module.exports = { protect };
