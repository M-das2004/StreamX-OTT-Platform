import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PLANS, fetchAllContent } from "../services/api";

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function Profile() {
  const {
    user,
    updateProfile,
    verifyEmail,
    changePassword,
    setupTwoFactor,
    confirmTwoFactor,
    disableTwoFactor,
    logout,
    removeFromHistory,
    clearHistory,
  } = useAuth();
  const navigate = useNavigate();

  // Personal info
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [language, setLanguage] = useState(user?.language || "English");
  const [parentalControls, setParentalControls] = useState(!!user?.parentalControls);
  const [notifications, setNotifications] = useState(user?.notifications !== false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Security / change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Two-factor authentication (real TOTP now, not just a toggle). Three
  // states: nothing shown, "setup" (QR code + confirm code), or "disable"
  // (just a code prompt).
  const [twoFactorPanel, setTwoFactorPanel] = useState(null); // null | "setup" | "disable"
  const [qrCode, setQrCode] = useState("");
  const [manualSecret, setManualSecret] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);

  const currentPlan = PLANS.find((p) => p.id === user?.plan);

  // The catalog now comes from the backend rather than a hardcoded array,
  // so history titles are looked up from a fetched list instead of a
  // synchronous getMovieById call.
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    fetchAllContent().then(setCatalog);
  }, []);

  // updatedAt now comes back from MongoDB as an ISO string, not a raw
  // timestamp number, so it needs to go through `new Date()` to sort.
  const history = [...(user?.history || [])].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await updateProfile({ name, email, language, parentalControls, notifications });
    setSaving(false);
    setSaved(true);
  }

  async function handleVerifyEmail() {
    setVerifying(true);
    await verifyEmail();
    setVerifying(false);
  }

  async function handleStartTwoFactorSetup() {
    setTwoFactorError("");
    setTwoFactorBusy(true);
    try {
      const data = await setupTwoFactor();
      setQrCode(data.qrCode);
      setManualSecret(data.secret);
      setTwoFactorPanel("setup");
    } catch (err) {
      setTwoFactorError(err.message || "Couldn't start setup. Please try again.");
    } finally {
      setTwoFactorBusy(false);
    }
  }

  async function handleConfirmTwoFactor(e) {
    e.preventDefault();
    setTwoFactorError("");
    setTwoFactorBusy(true);
    try {
      await confirmTwoFactor(twoFactorCode);
      closeTwoFactorPanel();
    } catch (err) {
      setTwoFactorError(err.message || "Invalid code.");
    } finally {
      setTwoFactorBusy(false);
    }
  }

  async function handleDisableTwoFactor(e) {
    e.preventDefault();
    setTwoFactorError("");
    setTwoFactorBusy(true);
    try {
      await disableTwoFactor(twoFactorCode);
      closeTwoFactorPanel();
    } catch (err) {
      setTwoFactorError(err.message || "Invalid code.");
    } finally {
      setTwoFactorBusy(false);
    }
  }

  function closeTwoFactorPanel() {
    setTwoFactorPanel(null);
    setQrCode("");
    setManualSecret("");
    setTwoFactorCode("");
    setTwoFactorError("");
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSaved(false);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("Fill in all three password fields.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPasswordError(err.message || "Couldn't change your password.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  if (!user) return null;

  return (
    <main className="profile-page">
      <div className="profile-container">
        <div className="profile-avatar"><i class="fa-solid fa-user"></i></div>

        <h1>My Profile</h1>

        <p>{user.email}</p>

        <div className="profile-options">
          {/* Personal Information ------------------------------------ */}
          <div className="profile-option">
            <h3>Personal Information</h3>
            <p>Manage your name and email.</p>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />

            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {saved && <span className="save-status">Saved <i class="fa-solid fa-check"></i></span>}
          </div>

          {/* Change Password + security ------------------------------- */}
          <div className="profile-option">
            <h3>Change Password</h3>
            <p>Update your password and account security.</p>

            <div className="security-row">
              <span>
                Email: {user.email}{" "}
                {user.emailVerified ? (
                  <span className="verified-badge"><i class="fa-solid fa-check"></i> Verified</span>
                ) : (
                  <span className="unverified-badge">Not verified</span>
                )}
              </span>

              {!user.emailVerified && (
                <button className="mini-btn" onClick={handleVerifyEmail} disabled={verifying}>
                  {verifying ? "Verifying..." : "Verify now"}
                </button>
              )}
            </div>

            <div className="profile-option-header security-row">
              <div>
                <h3 style={{ fontSize: "14px", margin: 0 }}>Two-Factor Authentication</h3>
                <p style={{ margin: 0 }}>
                  {user.twoFactorEnabled
                    ? "Enabled — a code from your authenticator app is required at login."
                    : "Require a code at login for extra security."}
                </p>
              </div>

              {user.twoFactorEnabled ? (
                <button
                  className="mini-btn"
                  onClick={() => setTwoFactorPanel(twoFactorPanel === "disable" ? null : "disable")}
                >
                  Disable
                </button>
              ) : (
                <button
                  className="mini-btn"
                  onClick={handleStartTwoFactorSetup}
                  disabled={twoFactorBusy}
                >
                  {twoFactorBusy ? "Loading..." : "Enable"}
                </button>
              )}
            </div>

            {twoFactorPanel === "setup" && (
              <div style={{ margin: "10px 0", padding: "14px", background: "var(--bg)", borderRadius: "var(--radius)" }}>
                {twoFactorError && <div className="form-error" style={{ marginBottom: "10px" }}>{twoFactorError}</div>}

                <p className="hint-text" style={{ marginBottom: "10px" }}>
                  Scan this QR code with Google Authenticator, Authy, or any TOTP app, then enter the
                  6-digit code it shows.
                </p>

                {qrCode && (
                  <img
                    src={qrCode}
                    alt="Two-factor setup QR code"
                    style={{ display: "block", width: "160px", height: "160px", marginBottom: "10px" }}
                  />
                )}

                <p className="hint-text" style={{ marginBottom: "10px", wordBreak: "break-all" }}>
                  Can't scan it? Enter this key manually: <strong>{manualSecret}</strong>
                </p>

                <form onSubmit={handleConfirmTwoFactor} style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoComplete="one-time-code"
                    style={{ flex: 1 }}
                  />
                  <button className="save-btn" type="submit" disabled={twoFactorBusy} style={{ marginTop: 0 }}>
                    {twoFactorBusy ? "Confirming..." : "Confirm"}
                  </button>
                  <button type="button" className="mini-btn" onClick={closeTwoFactorPanel}>
                    Cancel
                  </button>
                </form>
              </div>
            )}

            {twoFactorPanel === "disable" && (
              <div style={{ margin: "10px 0", padding: "14px", background: "var(--bg)", borderRadius: "var(--radius)" }}>
                {twoFactorError && <div className="form-error" style={{ marginBottom: "10px" }}>{twoFactorError}</div>}

                <p className="hint-text" style={{ marginBottom: "10px" }}>
                  Enter your current 6-digit code to turn off two-factor authentication.
                </p>

                <form onSubmit={handleDisableTwoFactor} style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoComplete="one-time-code"
                    style={{ flex: 1 }}
                  />
                  <button className="save-btn" type="submit" disabled={twoFactorBusy} style={{ marginTop: 0 }}>
                    {twoFactorBusy ? "Disabling..." : "Disable"}
                  </button>
                  <button type="button" className="mini-btn" onClick={closeTwoFactorPanel}>
                    Cancel
                  </button>
                </form>
              </div>
            )}

            {user.provider ? (
              <p className="hint-text">
                You're signed in with {user.provider}, so there's no StreamX password to change.
              </p>
            ) : (
              <form onSubmit={handleChangePassword} className="password-form">
                {passwordError && <div className="form-error">{passwordError}</div>}
                {passwordSaved && <div className="save-status">Password updated ✓</div>}

                <input
                  type="password"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  autoComplete="new-password"
                />

                <button className="save-btn" type="submit" disabled={changingPassword}>
                  {changingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            )}
          </div>

          {/* Language --------------------------------------------------- */}
          <div className="profile-option">
            <h3>Language</h3>
            <p>Choose the language used across StreamX.</p>

            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option>English</option>
              <option>Hindi</option>
              <option>Bengali</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </div>

          {/* Parental Controls ------------------------------------------ */}
          <div className="profile-option">
            <div className="profile-option-header">
              <div>
                <h3>Parental Controls</h3>
                <p>Restrict mature content on this account.</p>
              </div>

              <button
                className={`toggle ${parentalControls ? "on" : ""}`}
                onClick={() => setParentalControls((v) => !v)}
                aria-label="Toggle parental controls"
              />
            </div>
          </div>

          {/* Notifications ------------------------------------------------ */}
          <div className="profile-option">
            <div className="profile-option-header">
              <div>
                <h3>Notifications</h3>
                <p>Get notified about new releases and recommendations.</p>
              </div>

              <button
                className={`toggle ${notifications ? "on" : ""}`}
                onClick={() => setNotifications((v) => !v)}
                aria-label="Toggle notifications"
              />
            </div>
          </div>

          {/* Subscription --------------------------------------------------- */}
          <div className="profile-option">
            <h3>Subscription</h3>
            <p>
              {currentPlan
                ? `Current plan: ${currentPlan.name} (${currentPlan.price}/mo)`
                : "You don't have an active plan yet."}
            </p>
            <Link to="/subscription" className="list-btn profile-link-btn">
              Manage Plan
            </Link>
          </div>

          {/* Watchlist --------------------------------------------------- */}
          <div className="profile-option">
            <h3>Watchlist</h3>
            <p>
              {user.watchlist?.length
                ? `${user.watchlist.length} title${user.watchlist.length === 1 ? "" : "s"} saved.`
                : "Nothing saved yet."}
            </p>
            <Link to="/watchlist" className="list-btn profile-link-btn">
              View My List
            </Link>
          </div>

          {/* Watch History ------------------------------------------------- */}
          <div className="profile-option">
            <div className="profile-option-header">
              <div>
                <h3>Watch History</h3>
                <p>Titles you've started watching.</p>
              </div>

              {history.length > 0 && (
                <button className="mini-btn" onClick={() => clearHistory()}>
                  Clear All
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="hint-text">You haven't watched anything yet.</p>
            ) : (
              <ul className="history-list">
                {history.map((h) => {
                  const title = catalog.find((m) => m.id === h.movieId);
                  if (!title) return null;
                  return (
                    <li key={h.movieId}>
                      <Link to={`/movie/${title.id}`}>{title.title}</Link>
                      <span className="hint-text">{formatDuration(h.progressSeconds)} watched</span>
                      <button className="mini-btn" onClick={() => removeFromHistory(h.movieId)}>
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="profile-logout">
          <button className="logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}

export default Profile;
