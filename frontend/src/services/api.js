// Real API layer.
//
// The content catalog below is still static mock data (the Movie/Content
// backend module doesn't exist yet — see the backend plan, section 4). But
// everything auth/account related now calls the real Express backend at
// API_BASE instead of localStorage. Every exported function keeps the exact
// same name and signature as the old mock, so AuthContext.jsx and every
// page/component that imports from here needs zero changes.

const DELAY = 400;
const wait = (ms = DELAY) => new Promise((resolve) => setTimeout(resolve, ms));

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Thin wrapper around fetch: always sends/receives the httpOnly auth cookie,
// always sends/parses JSON, and throws an Error with the backend's message
// on any non-2xx response so callers can keep doing `catch (err) { err.message }`
// exactly like they did with the mock.
async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // No JSON body (e.g. some error responses) — fine, data stays null.
  }

  if (!res.ok) {
    throw new Error(data?.message || "Something went wrong. Please try again.");
  }

  return data;
}

// ---------------------------------------------------------------------------
// Content catalog — real backend now (/api/movies). Genres stay a static
// list for the search filter dropdown; the titles themselves live in
// MongoDB (see backend/data/seedMovies.js for the same 25 titles that used
// to be hardcoded here, loaded via `npm run seed`).
// ---------------------------------------------------------------------------

export const GENRES = [
  "Action",
  "Adventure",
  "Drama",
  "Sci-Fi",
  "Thriller",
  "Comedy",
];

export async function fetchMovies() {
  const data = await request("/movies?type=movie");
  return data.movies;
}

export async function fetchSeries() {
  const data = await request("/movies?type=series");
  return data.movies;
}

// Movies and series together — used by pages that need the whole catalog
// (Watchlist, Profile history, Landing's trending row).
export async function fetchAllContent() {
  const data = await request("/movies");
  return data.movies;
}

// Search + filter (section 3: Search and Browse)
export async function searchMovies({ query = "", genre = "", type = "" } = {}) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("query", query.trim());
  if (genre) params.set("genre", genre);
  if (type) params.set("type", type);

  const data = await request(`/movies/search?${params.toString()}`);
  return data.movies;
}

// NOTE: this is now async (it used to be a synchronous array lookup).
// Returns null if not found, same as before.
export async function getMovieById(id) {
  try {
    const data = await request(`/movies/${id}`);
    return data.movie;
  } catch {
    return null;
  }
}

// Other titles sharing a genre with the given title (Movie Details page:
// "Related Movies"). Takes a movie id now instead of a movie object.
export async function getRelatedContent(movieId, limit = 5) {
  try {
    const data = await request(`/movies/${movieId}/related?limit=${limit}`);
    return data.related;
  } catch {
    return [];
  }
}

// Generates a placeholder avatar for a cast member's name (no real photos
// stored in the catalog yet) — pure/client-side, no backend needed.
export function castAvatar(name) {
  return `https://ui-avatars.com/api/?background=1e2229&color=fff&size=128&name=${encodeURIComponent(
    name
  )}`;
}

// ---------------------------------------------------------------------------
// Auth (section 1). Real backend now — /api/auth/* on the Express server.
// The session lives in an httpOnly cookie, so these functions don't need to
// juggle tokens themselves; `credentials: "include"` on every request is
// what sends/receives it.
// ---------------------------------------------------------------------------

export async function registerUser({ name, email, password }) {
  const data = await request("/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
  return data.user;
}

// Returns either { user } on a normal login, or { requiresTwoFactor: true,
// tempToken } if the account has 2FA enabled — the caller (AuthContext)
// branches on which shape came back.
export async function loginUser({ email, password }) {
  return request("/auth/login", { method: "POST", body: { email, password } });
}

// Second step of login for 2FA accounts — completes with a real session.
export async function verifyLoginTwoFactor(tempToken, code) {
  const data = await request("/auth/2fa/login-verify", {
    method: "POST",
    body: { tempToken, code },
  });
  return data.user;
}

// Setup/confirm/disable are all for a user managing their OWN 2FA while
// already logged in (Profile page) — distinct from verifyLoginTwoFactor
// above, which is unauthenticated and only usable mid-login.
export async function setupTwoFactor() {
  return request("/auth/2fa/setup", { method: "POST" }); // { qrCode, secret }
}

export async function confirmTwoFactor(code) {
  const data = await request("/auth/2fa/confirm", { method: "POST", body: { code } });
  return data.user;
}

export async function disableTwoFactor(code) {
  const data = await request("/auth/2fa/disable", { method: "POST", body: { code } });
  return data.user;
}

// Social login / SSO (section 1). Real OAuth now — this is a full-page
// browser navigation to the backend (not a fetch call), because the person
// needs to actually see Google/Facebook's consent screen. The backend
// handles the provider callback, sets the session cookie, and redirects
// back into the app — AuthContext picks up the new session via the normal
// getCurrentUser() call on load, same as any other page load.
export function loginWithProvider(provider) {
  window.location.href = `${API_BASE}/auth/${provider}`;
}

export async function logoutUser() {
  await request("/auth/logout", { method: "POST" });
}

// Called on app load to restore the session. No session cookie (or an
// expired one) is a normal, expected case — resolve to null rather than
// throwing so callers don't need a try/catch just to check "am I logged in".
export async function getCurrentUser() {
  try {
    const data = await request("/auth/me");
    return data.user;
  } catch {
    return null;
  }
}

// userId is no longer needed (the backend identifies the user from the auth
// cookie) but kept as a parameter so AuthContext.jsx doesn't need to change.
export async function verifyEmail(_userId) {
  const data = await request("/auth/verify-email", { method: "PUT" });
  return data.user;
}

export async function changePassword(_userId, currentPassword, newPassword) {
  const data = await request("/auth/change-password", {
    method: "PUT",
    body: { currentPassword, newPassword },
  });
  return data.user;
}

export async function updateUser(_id, updates) {
  const data = await request("/auth/profile", { method: "PUT", body: updates });
  return data.user;
}

// Requests a reset link (or, in dev with no SMTP configured, gets one back
// directly as data.devResetUrl — see backend/.env.example).
export async function forgotPassword(email) {
  return request("/auth/forgot-password", { method: "POST", body: { email } });
}

export async function resetPassword(token, password) {
  const data = await request(`/auth/reset-password/${token}`, {
    method: "POST",
    body: { password },
  });
  return data.user;
}

// ---------------------------------------------------------------------------
// Watchlist & continue-watching helpers (section 5)
// ---------------------------------------------------------------------------

export async function toggleWatchlist(_userId, movieId) {
  const data = await request(`/auth/watchlist/${movieId}`, { method: "POST" });
  return data.user;
}

// Fire-and-forget during playback — same behavior as the mock, just against
// the real backend now. Errors are swallowed so a dropped network blip
// mid-playback doesn't interrupt the video.
export async function saveProgress(_userId, movieId, progressSeconds) {
  try {
    await request("/auth/history", { method: "POST", body: { movieId, progressSeconds } });
  } catch {
    // best-effort
  }
}

export async function removeFromHistory(_userId, movieId) {
  const data = await request(`/auth/history/${movieId}`, { method: "DELETE" });
  return data.user;
}

export async function clearHistory(_userId) {
  const data = await request("/auth/history", { method: "DELETE" });
  return data.user;
}

// ---------------------------------------------------------------------------
// Subscription (section 6/9). Real backend now — /api/subscriptions/*, with
// a proper Subscription document per user instead of a plain string field.
// ---------------------------------------------------------------------------

export const PLANS = [
  { id: "basic", name: "Basic", price: "₹149", quality: "HD" },
  { id: "standard", name: "Standard", price: "₹299", quality: "Full HD" },
  { id: "premium", name: "Premium", price: "₹499", quality: "4K Ultra HD" },
];

export async function chooseSubscription(_userId, planId) {
  const data = await request("/subscriptions", { method: "POST", body: { planId } });
  return data.user;
}

// Real payment flow: create a Razorpay order server-side, hand the details
// to the frontend to open the Razorpay checkout widget with.
export async function createCheckoutOrder(planId) {
  return request("/subscriptions/checkout", { method: "POST", body: { planId } });
}

// Called after the Razorpay widget reports success — the backend
// re-verifies the payment signature before actually activating the plan.
export async function verifyPayment(payload) {
  const data = await request("/subscriptions/verify", { method: "POST", body: payload });
  return data.user;
}

export async function cancelSubscription(_userId) {
  const data = await request("/subscriptions/cancel", { method: "POST" });
  return data.user;
}

// ---------------------------------------------------------------------------
// Ratings (section 8)
// ---------------------------------------------------------------------------

// Submits or updates the current user's rating (1-5) for a title. Returns
// { rating, average, count } — average/count reflect everyone's ratings.
export async function rateMovie(movieId, rating, review = "") {
  return request(`/movies/${movieId}/rating`, { method: "POST", body: { rating, review } });
}

// Public breakdown for a title: { ratings: [...], average, count }
export async function getMovieRatings(movieId) {
  return request(`/movies/${movieId}/ratings`);
}

// The current user's own rating for a title, or null if they haven't rated it.
export async function getMyRating(movieId) {
  try {
    const data = await request(`/movies/${movieId}/rating/me`);
    return data.rating;
  } catch {
    return null;
  }
}

export async function removeRating(movieId) {
  return request(`/movies/${movieId}/rating`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Admin (section 11). Every call here requires the logged-in user to have
// role "admin" on the backend — the server enforces this regardless of
// what the UI shows/hides.
// ---------------------------------------------------------------------------

export async function adminGetUsers() {
  const data = await request("/admin/users");
  return data.users;
}

export async function adminUpdateUser(id, updates) {
  const data = await request(`/admin/users/${id}`, { method: "PUT", body: updates });
  return data.user;
}

export async function adminDeleteUser(id) {
  return request(`/admin/users/${id}`, { method: "DELETE" });
}

export async function adminGetAnalytics() {
  return request("/admin/analytics");
}

// Movie catalog moderation (admin-gated on the backend via adminOnly).
export async function adminCreateMovie(movie) {
  const data = await request("/movies", { method: "POST", body: movie });
  return data.movie;
}

export async function adminUpdateMovie(id, updates) {
  const data = await request(`/movies/${id}`, { method: "PUT", body: updates });
  return data.movie;
}

export async function adminDeleteMovie(id) {
  return request(`/movies/${id}`, { method: "DELETE" });
}
