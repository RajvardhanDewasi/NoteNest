
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

function EyeIcon({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none"
      stroke="currentColor" strokeWidth="1.7">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none"
      stroke="currentColor" strokeWidth="1.7">
      <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a14 14 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7c1.1 0 2.1-.2 3-.5" />
    </svg>
  );
}

function NotePreview({ title, text, color, delay }) {
  return (
    <div
      className="auth-preview-card"
      style={{
        "--preview-color": color,
        "--preview-delay": delay,
      }}
    >
      <span className="preview-dot" />
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
      <span className="preview-check">✓</span>
    </div>
  );
}

export default function AuthPage() {
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isRegister = mode === "register";

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  const strength = checks.filter(Boolean).length;

  const strengthLabel =
    strength <= 1 ? "Weak" :
    strength === 2 ? "Fair" :
    strength === 3 ? "Good" : "Strong";

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setPassword("");
    setShowPassword(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setBusy(true);

    try {
      if (isRegister) {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
        });
      } else {
        await login({
          email: email.trim(),
          password,
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (err.request
          ? "Unable to connect. Please check your server."
          : "Something went wrong. Please try again.")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">

      {/* Ambient background */}
      <div className="auth-background" aria-hidden="true">
        <span className="auth-orb orb-one" />
        <span className="auth-orb orb-two" />
        <span className="auth-orb orb-three" />
      </div>

      <section className="auth-shell">

        {/* LEFT SHOWCASE */}
        <aside className="auth-showcase">

          <div className="auth-brand">
            <span className="auth-brand-mark">N</span>
            <span>NoteNest</span>
          </div>

          <div className="showcase-content">
            <span className="auth-eyebrow">
              A LITTLE SPACE FOR YOUR THOUGHTS
            </span>

            <h1>
              Your thoughts.
              <br />
              <span>Your space.</span>
            </h1>

            <p className="showcase-description">
              Capture ideas, organize your everyday
              and keep everything that matters
              in one calm, personal space.
            </p>

            <div className="auth-preview-stack">

              <NotePreview
                title="Today's thoughts"
                text="Little ideas worth remembering..."
                color="#e8eee6"
                delay="0s"
              />

              <NotePreview
                title="College tasks"
                text="Complete the pending assignments."
                color="#edf0f5"
                delay="0.15s"
              />

              <NotePreview
                title="Future ideas"
                text="Something exciting is coming."
                color="#f1eee8"
                delay="0.3s"
              />

            </div>

            <div className="showcase-footer">
              <span className="showcase-dot" />
              A quieter way to stay organized.
            </div>
          </div>
        </aside>

        {/* RIGHT LOGIN CARD */}
        <section className="auth-card">

          <div className="auth-mobile-brand">
            <span className="auth-brand-mark">N</span>
            <strong>NoteNest</strong>
          </div>

          <div className="auth-heading" key={mode}>

            <span className="auth-heading-icon">
              {isRegister ? "✦" : "↗"}
            </span>

            <p className="auth-eyebrow">
              {isRegister ? "GET STARTED" : "WELCOME BACK"}
            </p>

            <h2>
              {isRegister
                ? "Create your account"
                : "Good to see you again."}
            </h2>

            <p>
              {isRegister
                ? "A fresh space for everything on your mind."
                : "Your notes are waiting right where you left them."}
            </p>

          </div>

          <form
            key={mode}
            className="auth-form"
            onSubmit={handleSubmit}
          >

            {isRegister && (
              <label className="auth-field">
                <span>Your name</span>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  autoComplete="name"
                  minLength={2}
                  maxLength={50}
                  required
                />
              </label>
            )}

            <label className="auth-field">
              <span>Email address</span>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={254}
                required
              />
            </label>

            <label className="auth-field">
              <span>Password</span>

              <div className="auth-password-wrap">

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isRegister
                      ? "Create a strong password"
                      : "Enter your password"
                  }
                  autoComplete={
                    isRegister
                      ? "new-password"
                      : "current-password"
                  }
                  minLength={isRegister ? 8 : undefined}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon visible={showPassword} />
                </button>

              </div>
            </label>

            {/* Password strength */}
            {isRegister && password.length > 0 && (
              <div className="password-strength">

                <div className="strength-bars">
                  {[1, 2, 3, 4].map((item) => (
                    <span
                      key={item}
                      className={strength >= item ? `filled strength-${strength}` : ""}
                    />
                  ))}
                </div>

                <span>
                  Password strength: <strong>{strengthLabel}</strong>
                </span>

              </div>
            )}

            {error && (
              <div className="auth-error" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={busy}
            >

              <span>
                {busy
                  ? isRegister
                    ? "Creating your space..."
                    : "Signing you in..."
                  : isRegister
                    ? "Create my account"
                    : "Sign in to NoteNest"}
              </span>

              {busy ? (
                <span className="auth-spinner" />
              ) : (
                <span className="auth-arrow">→</span>
              )}

            </button>

          </form>

          <div className="auth-switch">

            <span>
              {isRegister
                ? "Already have an account?"
                : "New to NoteNest?"}
            </span>

            <button
              type="button"
              onClick={() =>
                changeMode(isRegister ? "login" : "register")
              }
            >
              {isRegister ? "Sign in" : "Create an account"}
            </button>

          </div>

          <div className="auth-privacy">
            <span>✧</span>
            Your notes. Your space. Just yours.
          </div>

        </section>

      </section>
    </main>
  );
}
