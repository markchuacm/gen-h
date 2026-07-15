import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "./authClient";
import TurnstileWidget, { captchaEnabled } from "./TurnstileWidget";
import "./auth.css";

// The portal is a separate Vite entry (member.html). Redirects must land
// there: the landing bundle has no portal auth client, so a callback returned
// to "/" would never be exchanged and the user would appear logged out.
const PORTAL_URL = window.location.hostname === "app.veraehealth.com"
  ? window.location.origin
  : `${window.location.origin}/member.html`;

type Mode = "signIn" | "signUp" | "twoFactor";
const SIGNUP_CONFIRMATION_PARAM = "signup";

function signupConfirmationIsActive() {
  return new URL(window.location.href).searchParams.get(SIGNUP_CONFIRMATION_PARAM) === "check-email";
}

function setSignupConfirmationInUrl(active: boolean) {
  const url = new URL(window.location.href);
  if (active) url.searchParams.set(SIGNUP_CONFIRMATION_PARAM, "check-email");
  else url.searchParams.delete(SIGNUP_CONFIRMATION_PARAM);
  window.history.replaceState(null, "", url);
}

function EmailVerificationScreen() {
  const started = useRef(false);
  const [status, setStatus] = useState<"working" | "failed">("working");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const token = fragment.get("token");
    // Remove the credential from the address bar before making any request.
    window.history.replaceState(null, "", window.location.pathname);

    if (!token) {
      setStatus("failed");
      return;
    }

    void authClient.verifyEmail({ query: { token } }).then((result) => {
      if (result.error) {
        setStatus("failed");
        return;
      }
      window.location.replace(PORTAL_URL);
    });
  }, []);

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <span className="auth-brand">Verae</span>
        <h1 className="auth-title">{status === "working" ? "Verifying your email" : "Link unavailable"}</h1>
        <p className="auth-copy">
          {status === "working"
            ? "Please wait while we securely confirm your email address."
            : "This verification link is invalid or has expired. Return to sign in to request a new one."}
        </p>
        {status === "failed" ? (
          <button type="button" className="auth-link" onClick={() => window.location.replace(PORTAL_URL)}>
            Back to sign in
          </button>
        ) : null}
      </div>
    </main>
  );
}

function LoginScreen() {
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(signupConfirmationIsActive);
  const [totpCode, setTotpCode] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaHeaders = captchaToken ? { "x-captcha-response": captchaToken } : undefined;

  if (window.location.pathname === "/verify-email") return <EmailVerificationScreen />;

  async function signInWithGoogle() {
    setError(null);
    setBusy(true);
    const { error: err } = await authClient.signIn.social(
      { provider: "google", callbackURL: PORTAL_URL },
      { headers: captchaHeaders },
    );
    if (err) {
      setError(err.message ?? "Google sign-in failed.");
      setBusy(false);
    }
    // On success the browser navigates away; no state to reset.
  }

  async function submitEmailForm(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    if (mode === "signUp") {
      const { error: err } = await authClient.signUp.email(
        { name: email.split("@", 1)[0] || "Verae member", email, password, callbackURL: PORTAL_URL },
        { headers: captchaHeaders },
      );
      setBusy(false);
      if (err) {
        setError(err.message ?? "Account creation failed.");
      } else {
        // Better Auth refreshes the session query after signup, which may remount
        // this screen. Keep a non-identifying URL flag so the success state survives.
        setSignupConfirmationInUrl(true);
        setConfirmationSent(true);
      }
    } else {
      const { data, error: err } = await authClient.signIn.email(
        { email, password, callbackURL: PORTAL_URL },
        { headers: captchaHeaders },
      );
      setBusy(false);
      if (err) {
        const message = (err.message ?? "").toLowerCase();
        setError(
          message.includes("email not verified")
            ? "Email not verified. Check your inbox for the verification link."
            : message.includes("invalid") || message.includes("incorrect") || message.includes("not found")
              ? "We couldn't sign you in with those details. Check your email and password, or create an account below if you're new to Verae."
              : (err.message ?? "Sign-in failed."),
        );
      } else if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
        setMode("twoFactor");
      }
      // On success onAuthStateChange swaps this screen out.
    }
  }

  async function verifySecondFactor(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await authClient.twoFactor.verifyTotp({ code: totpCode, trustDevice: true });
    setBusy(false);
    if (result.error) setError(result.error.message ?? "That code was not accepted.");
  }

  if (mode === "twoFactor") {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <span className="auth-brand">Verae</span>
          <h1 className="auth-title">Enter your security code</h1>
          <p className="auth-copy">Open your authenticator app and enter the current six-digit code.</p>
          <form className="auth-form" onSubmit={verifySecondFactor}>
            <label className="auth-field">
              <span>Security code</span>
              <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ""))} autoFocus />
            </label>
            {error ? <p className="auth-error" role="alert">{error}</p> : null}
            <button type="submit" className="auth-submit" disabled={busy || totpCode.length !== 6}>
              {busy ? "Checking…" : "Verify and sign in"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (confirmationSent) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <span className="auth-brand">Verae</span>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-copy">
            We sent a verification link to the email address you entered. Open it on this device
            to finish creating your account.
          </p>
          <button
            type="button"
            className="auth-link"
            onClick={() => {
              setSignupConfirmationInUrl(false);
              setConfirmationSent(false);
              setMode("signIn");
              setPassword("");
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
        <span className="auth-brand">Verae</span>
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
              minLength={10}
              required
            />
          </label>
          <TurnstileWidget onToken={setCaptchaToken} />
          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          <button type="submit" className="auth-submit" disabled={busy || (captchaEnabled() && !captchaToken)}>
            {busy ? "One moment…" : mode === "signIn" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "signIn" ? "New to Verae?" : "Already have an account?"}{" "}
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
