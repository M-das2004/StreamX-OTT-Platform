import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ForgotPassword() {
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [devResetPath, setDevResetPath] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setDevResetPath("");

    try {
      const data = await requestPasswordReset(email);
      setMessage(data.message);

      // Dev convenience: if SMTP isn't configured, the backend hands the
      // reset link straight back so you can test without a mail server.
      if (data.devResetUrl) {
        try {
          setDevResetPath(new URL(data.devResetUrl).pathname);
        } catch {
          // ignore malformed URL, just skip the dev link
        }
      }
    } catch (err) {
      setMessage(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-box">
        <h1>Reset your password</h1>
        <p>Enter your email and we'll send you a link to reset your password.</p>

        {message && (
          <div className="save-status" style={{ display: "block", marginBottom: "12px" }}>
            {message}
          </div>
        )}

        {devResetPath && (
          <div className="hint-text" style={{ marginBottom: "12px", wordBreak: "break-all" }}>
            Dev mode — no email server configured yet, so here's the link directly:{" "}
            <Link to={devResetPath}>{devResetPath}</Link>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p>
          Remembered your password? <Link to="/login">Login</Link>
        </p>
      </div>
    </main>
  );
}

export default ForgotPassword;
