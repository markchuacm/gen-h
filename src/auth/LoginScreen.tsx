import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import "./auth.css";

// The portal is a separate Vite entry (member.html). Redirects must land
// there: the landing bundle has no Supabase client, so a PKCE code returned
// to "/" would never be exchanged and the user would appear logged out.
const PORTAL_URL = `${window.location.origin}/member.html`;

type Mode = "signIn" | "signUp";

function LoginScreen() {
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function signInWithGoogle() {
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: PORTAL_URL },
    });
    if (err) {
      setError(err.message);
      setBusy(false);
    }
    // On success the browser navigates away; no state to reset.
  }

  async function submitEmailForm(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    if (mode === "signUp") {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: PORTAL_URL },
      });
      setBusy(false);
      if (err) {
        setError(err.message);
      } else if (data.session) {
        // Email confirmation disabled in project settings — session is live.
      } else {
        setConfirmationSent(true);
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (err) {
        setError(
          err.message === "Invalid login credentials"
            ? "Incorrect email or password."
            : err.message,
        );
      }
      // On success onAuthStateChange swaps this screen out.
    }
  }

  if (confirmationSent) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <span className="auth-brand">Gen-H</span>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-copy">
            We sent a confirmation link to <strong>{email}</strong>. Open it on this device to
            finish creating your account.
          </p>
          <button
            type="button"
            className="auth-link"
            onClick={() => {
              setConfirmationSent(false);
              setMode("signIn");
            }}
          >
            Back to sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <span className="auth-brand">Gen-H</span>
        <h1 className="auth-title">
          {mode === "signIn" ? "Welcome back" : "Start your health journey"}
        </h1>
        <p className="auth-copy">
          {mode === "signIn"
            ? "Sign in to your member portal."
            : "Create your account to begin."}
        </p>

        <button type="button" className="auth-google" onClick={signInWithGoogle} disabled={busy}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.9z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.1 0-5.8-2.1-6.8-5l-3.9 3C3.3 21.3 7.3 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3z"
            />
            <path
              fill="#EA4335"
              d="M12 4.6c1.8 0 3 .7 3.7 1.4l3.3-3.2C17.9 1 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.9 3c1-2.9 3.7-5 6.8-5z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form className="auth-form" onSubmit={submitEmailForm}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
              minLength={8}
              required
            />
          </label>
          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "One moment…" : mode === "signIn" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "signIn" ? "New to Gen-H?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="auth-link"
            onClick={() => {
              setMode(mode === "signIn" ? "signUp" : "signIn");
              setError(null);
            }}
          >
            {mode === "signIn" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}

export default LoginScreen;
