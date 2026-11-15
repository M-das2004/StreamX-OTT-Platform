import { createContext, useContext, useEffect, useState } from "react";
import * as api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on first load
  useEffect(() => {
    api.getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  // Returns either the logged-in user, or { requiresTwoFactor: true,
  // tempToken } — Login.jsx checks which shape came back and shows the
  // 6-digit code step if needed. setUser only happens on a real login.
  async function login(email, password) {
    const data = await api.loginUser({ email, password });
    if (data.requiresTwoFactor) {
      return data;
    }
    setUser(data.user);
    return data.user;
  }

  // Completes login for a 2FA account — the second step after login()
  // returned { requiresTwoFactor: true, tempToken }.
  async function completeTwoFactorLogin(tempToken, code) {
    const loggedIn = await api.verifyLoginTwoFactor(tempToken, code);
    setUser(loggedIn);
    return loggedIn;
  }

  // Managing 2FA while already logged in (Profile page) — distinct from
  // completeTwoFactorLogin above.
  async function setupTwoFactor() {
    return api.setupTwoFactor();
  }

  async function confirmTwoFactor(code) {
    const updated = await api.confirmTwoFactor(code);
    setUser(updated);
    return updated;
  }

  async function disableTwoFactor(code) {
    const updated = await api.disableTwoFactor(code);
    setUser(updated);
    return updated;
  }

  async function register(name, email, password) {
    const created = await api.registerUser({ name, email, password });
    setUser(created);
    return created;
  }

  // Social login / SSO (section 1). This triggers a full-page redirect to
  // the backend (see services/api.js) — it doesn't return a user, because
  // the browser navigates away to Google/Facebook and back. When it
  // returns, the app reloads and the useEffect above picks up the new
  // session via getCurrentUser().
  function loginWithProvider(provider) {
    api.loginWithProvider(provider);
  }

  async function logout() {
    await api.logoutUser();
    setUser(null);
  }

  async function updateProfile(updates) {
    if (!user) return;
    const updated = await api.updateUser(user.id, updates);
    setUser(updated);
    return updated;
  }

  async function verifyEmail() {
    if (!user) return;
    const updated = await api.verifyEmail(user.id);
    setUser(updated);
    return updated;
  }

  async function changePassword(currentPassword, newPassword) {
    if (!user) return;
    const updated = await api.changePassword(user.id, currentPassword, newPassword);
    setUser(updated);
    return updated;
  }

  // Forgot/reset password (section 1). Neither of these requires the user
  // to already be logged in — resetPassword logs them in on success (the
  // backend issues a fresh session cookie once the token checks out).
  async function requestPasswordReset(email) {
    return api.forgotPassword(email);
  }

  async function resetPassword(token, newPassword) {
    const loggedIn = await api.resetPassword(token, newPassword);
    setUser(loggedIn);
    return loggedIn;
  }

  async function toggleWatchlist(movieId) {
    if (!user) return;
    const updated = await api.toggleWatchlist(user.id, movieId);
    setUser(updated);
    return updated;
  }

  function isInWatchlist(movieId) {
    return !!user?.watchlist?.includes(movieId);
  }

  async function chooseSubscription(planId) {
    if (!user) return;
    const updated = await api.chooseSubscription(user.id, planId);
    setUser(updated);
    return updated;
  }

  async function cancelSubscription() {
    if (!user) return;
    const updated = await api.cancelSubscription(user.id);
    setUser(updated);
    return updated;
  }

  // Called after Razorpay checkout succeeds client-side and the backend has
  // independently verified the payment signature.
  async function confirmPayment(payload) {
    const updated = await api.verifyPayment(payload);
    setUser(updated);
    return updated;
  }

  async function removeFromHistory(movieId) {
    if (!user) return;
    const updated = await api.removeFromHistory(user.id, movieId);
    setUser(updated);
    return updated;
  }

  async function clearHistory() {
    if (!user) return;
    const updated = await api.clearHistory(user.id);
    setUser(updated);
    return updated;
  }

  // Called by VideoPlayer/Watch as playback progresses. Doesn't need to
  // update React state on every tick, so it writes straight through and the
  // next full user refresh (e.g. visiting Watchlist) picks it up.
  function saveProgress(movieId, progressSeconds) {
    if (!user) return;
    api.saveProgress(user.id, movieId, progressSeconds);
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    loginWithProvider,
    completeTwoFactorLogin,
    setupTwoFactor,
    confirmTwoFactor,
    disableTwoFactor,
    logout,
    updateProfile,
    verifyEmail,
    changePassword,
    requestPasswordReset,
    resetPassword,
    toggleWatchlist,
    isInWatchlist,
    chooseSubscription,
    cancelSubscription,
    confirmPayment,
    removeFromHistory,
    clearHistory,
    saveProgress,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
