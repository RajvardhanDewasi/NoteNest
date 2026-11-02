
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function AuthPage() {
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isRegister = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setBusy(true);

    try {
      if (isRegister) {
        await register({
          name,
          email,
          password,
        });
      } else {
        await login({
          email,
          password,
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request
            ? "Cannot reach NoteNest. Check your backend."
            : "Something went wrong. Please try again.")
      );
    } finally {
      setBusy(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setPassword("");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">

        <div className="auth-brand">
          <span className="auth-brand-mark">N</span>
          <span>NoteNest</span>
        </div>

        <div className="auth-heading">
          <p className="auth-eyebrow">
            YOUR PERSONAL SPACE
          </p>

          <h1>
            {isRegister
              ? "Create your account"
              : "Welcome back"}
          </h1>

          <p>
            {isRegister
              ? "Create an account to keep your notes private and organized."
              : "Sign in to open your personal notes workspace."}
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          {isRegister && (
            <label>
              <span>Your name</span>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                autoComplete="name"
                minLength={2}
                maxLength={50}
                required
              />
            </label>
          )}

          <label>
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

          <label>
            <span>Password</span>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                isRegister
                  ? "At least 8 characters"
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
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={busy}
          >
            {busy
              ? isRegister
                ? "Creating account..."
                : "Signing in..."
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister
            ? "Already have an account?"
            : "New to NoteNest?"}

          {" "}

          <button
            type="button"
            onClick={() =>
              changeMode(
                isRegister ? "login" : "register"
              )
            }
          >
            {isRegister
              ? "Sign in"
              : "Create an account"}
          </button>
        </div>

        <p className="auth-privacy">
          Your notes are private to your account.
          Other users cannot access them.
        </p>

      </section>
    </main>
  );
}
