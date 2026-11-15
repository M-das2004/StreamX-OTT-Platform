import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login, completeTwoFactorLogin, loginWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Set once login() reports the account needs a 2FA code — switches the
  // form from email/password to a single code input.
  const [tempToken, setTempToken] = useState(null);
  const [code, setCode] = useState("");

  const redirectTo = location.state?.from?.pathname || "/";

  // The OAuth callback redirects back here with ?error=... if Google/
  // Facebook denied consent, or if the account is suspended.
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError === "suspended") {
      setError("Your account has been suspended. Contact support.");
    } else if (oauthError === "oauth") {
      setError("Something went wrong signing in. Please try again.");
    }
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (result?.requiresTwoFactor) {
        setTempToken(result.tempToken);
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setError("");

    if (!code) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setSubmitting(true);
    try {
      await completeTwoFactorLogin(tempToken, code);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSocialLogin(provider) {
    setError("");
    loginWithProvider(provider); // full-page redirect, this call doesn't return
  }

  if (tempToken) {
    return (
      <main className="auth-page">
        <div className="auth-box">
          <h1>Two-Factor Verification</h1>
          <p>Enter the 6-digit code from your authenticator app.</p>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleVerifyCode}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoComplete="one-time-code"
              autoFocus
            />

            <button type="submit" disabled={submitting}>
              {submitting ? "Verifying..." : "Verify"}
            </button>
          </form>

          <p>
            <button
              type="button"
              className="mini-btn"
              onClick={() => {
                setTempToken(null);
                setCode("");
                setError("");
              }}
            >
              Back to login
            </button>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-box">
        <h1>Welcome Back</h1>

        <p>Login to continue watching.</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <p style={{ margin: "-4px 0 0", textAlign: "right" }}>
            <Link to="/forgot-password" style={{ fontSize: "12px" }}>
              Forgot password?
            </Link>
          </p>

          <button type="submit" disabled={submitting}>
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <div className="social-buttons">
          <button
            type="button"
            className="social-btn google"
            onClick={() => handleSocialLogin("google")}
          >
            G  Google
          </button>
          <button
            type="button"
            className="social-btn facebook"
            onClick={() => handleSocialLogin("facebook")}
          >
            f  Facebook
          </button>
        </div>

        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </main>
  );
}

export default Login;
