const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/User");

// Shared find-or-create logic for both providers. Matches by
// provider+providerId first (the reliable, stable identifier), and falls
// back to matching by email so someone who registered with a password can
// later sign in with a social account on the same address without ending
// up with two accounts.
async function findOrCreateOAuthUser({ provider, providerId, email, name }) {
  let user = await User.findOne({ provider, providerId });
  if (user) return user;

  if (email) {
    user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user.provider = provider;
      user.providerId = providerId;
      await user.save();
      return user;
    }
  }

  // Facebook in particular can decline to share an email (e.g. the account
  // has no verified email, or the person denied that permission) — fall
  // back to a synthetic placeholder rather than failing the whole login.
  const fallbackEmail = `${provider}.${providerId}@streamx.oauth`;

  user = await User.create({
    name: name || "New User",
    email: email ? email.toLowerCase() : fallbackEmail,
    provider,
    providerId,
    emailVerified: !!email,
  });

  return user;
}

// Only registers strategies that have credentials configured, so a
// half-configured .env (e.g. Google set up, Facebook not yet) doesn't crash
// the whole server on startup.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser({
            provider: "google",
            providerId: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
          });
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
} else {
  console.warn("Google OAuth not configured — GOOGLE_CLIENT_ID/SECRET missing from .env");
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ["id", "displayName", "emails"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser({
            provider: "facebook",
            providerId: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
          });
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
} else {
  console.warn("Facebook OAuth not configured — FACEBOOK_APP_ID/SECRET missing from .env");
}

module.exports = passport;
