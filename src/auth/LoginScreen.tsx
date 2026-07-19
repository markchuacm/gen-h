import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "./authClient";
import { portalUrl } from "./portalUrl";
import TurnstileWidget, { captchaEnabled } from "./TurnstileWidget";
import "./auth.css";

const PORTAL_URL = portalUrl();

type Mode = "signIn" | "forgotPassword" | "twoFactor";
const TWO_FACTOR_PARAM = "twofactor";

// The two-factor prompt lives in component state, but signIn.email triggers a
// session refetch whose pending flip makes the Gate unmount this screen. Persist
// the step in the URL so the code-entry screen survives the remount instead of
// resetting to sign-in.
function twoFactorPromptIsActive() {
  return new URL(window.location.href).searchParams.get(TWO_FACTOR_PARAM) === "1";
}

function setTwoFactorPromptInUrl(active: boolean) {
  const url = new URL(window.location.href);
  if (active) url.searchParams.set(TWO_FACTOR_PARAM, "1");
  else url.searchParams.delete(TWO_FACTOR_PARAM);
  window.history.replaceState(null, "", url);
}

function PasswordResetScreen() {
  const token = useRef<string | null>(null);
  const initialized = useRef(false);
  const [status, setStatus] = useState<"ready" | "working" | "succeeded" | "failed">("ready");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const fragment = new URLSearchParams(window.location.hash.slice(1));
    token.current = fragment.get("token");
    // Remove the credential from the address bar before the member enters a password.
    window.history.replaceState(null, "", window.location.pathname);
    if (!token.current) setStatus("failed");
  }, []);

  async function submitNewPassword(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!token.current) {
      setStatus("failed");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setStatus("working");
    const result = await authClient.resetPassword({ newPassword: password, token: token.current });
    if (result.error) {
      token.current = null;
      setStatus("failed");
      return;
    }

    token.current = null;
    setPassword("");
    setConfirmation("");
    setStatus("succeeded");
  }

  if (status === "failed" || status === "succeeded") {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <span className="auth-brand">Verae</span>
          <div className="auth-step">
            <h1 className="auth-title">{status === "succeeded" ? "Password updated" : "Link unavailable"}</h1>
            <p className="auth-copy">
              {status === "succeeded"
                ? "Your password has been changed and your other sessions have been signed out."
                : "This password reset link is invalid or has expired. Request a new link from the sign-in screen."}
            </p>
            <button type="button" className="auth-link auth-link-action" onClick={() => window.location.replace(PORTAL_URL)}>
              {status === "succeeded" ? "Continue to sign in" : "Back to sign in"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <span className="auth-brand">Verae</span>
        <div className="auth-step">
          <h1 className="auth-title">Choose a new <em>password</em></h1>
          <p className="auth-copy">Use at least 10 characters and avoid a password you use elsewhere.</p>
          <form className="auth-form" onSubmit={submitNewPassword}>
            <label className="auth-field">
              <span>New password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={10}
                required
                autoFocus
              />
            </label>
            <label className="auth-field">
              <span>Confirm new password</span>
              <input
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
                minLength={10}
                required
              />
            </label>
            {error ? <p className="auth-error" role="alert">{error}</p> : null}
            <button type="submit" className="auth-submit" disabled={status === "working"}>
              {status === "working" ? "Updating password…" : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function LoginScreen() {
  const [mode, setMode] = useState<Mode>(() => (twoFactorPromptIsActive() ? "twoFactor" : "signIn"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [inviteHintOpen, setInviteHintOpen] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaHeaders = captchaToken ? { "x-captcha-response": captchaToken } : undefined;

  if (window.location.pathname === "/reset-password") return <PasswordResetScreen />;

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
    const { data, error: err } = await authClient.signIn.email(
      { email, password, callbackURL: PORTAL_URL },
      { headers: captchaHeaders },
    );
    setBusy(false);
    if (err) {
      const message = (err.message ?? "").toLowerCase();
      setError(
        message.includes("invite_expired")
          ? "Your invitation has expired. Contact Verae to receive a new temporary password."
          : message.includes("invalid") || message.includes("incorrect") || message.includes("not found")
            ? "We couldn't sign you in with those details. Check your email and password."
            : (err.message ?? "Sign-in failed."),
      );
    } else if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      // Persist the step before the session refetch can remount this screen.
      setTwoFactorPromptInUrl(true);
      setMode("twoFactor");
    }
    // On success the Gate swaps this screen out.
  }

  async function verifySecondFactor(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await authClient.twoFactor.verifyTotp({ code: totpCode, trustDevice: true });
    setBusy(false);
    if (result.error) setError(result.error.message ?? "That code was not accepted.");
    // On success the session becomes valid and the Gate swaps this screen out;
    // drop the URL flag so a later sign-out doesn't reopen the code prompt.
    else setTwoFactorPromptInUrl(false);
  }

  async function requestPasswordReset(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await authClient.requestPasswordReset(
      { email, redirectTo: `${window.location.origin}/reset-password` },
      { headers: captchaHeaders },
    );
    setBusy(false);
    if (result.error) {
      setError(result.error.message ?? "We couldn't send the reset email. Please try again.");
      return;
    }
    setResetRequested(true);
  }

  if (mode === "twoFactor") {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <span className="auth-brand">Verae</span>
          <div className="auth-step">
            <h1 className="auth-title">Enter your <em>security code</em></h1>
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
              <button
                type="button"
                className="auth-link auth-link-action"
                onClick={() => {
                  setTwoFactorPromptInUrl(false);
                  setMode("signIn");
                  setError(null);
                  setTotpCode("");
                  setPassword("");
                }}
              >
                Back to sign in
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  if (mode === "forgotPassword") {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <span className="auth-brand">Verae</span>
          <div className="auth-step">
            <h1 className="auth-title">{resetRequested ? <>Check your <em>email</em></> : <>Reset your <em>password</em></>}</h1>
            <p className="auth-copy">
              {resetRequested
                ? "If an account exists for that address, we sent a password reset link. It will expire in 15 minutes."
                : "Enter your email address and we'll send you a secure reset link."}
            </p>
            {resetRequested ? (
              <button
                type="button"
                className="auth-link auth-link-action"
                onClick={() => {
                  setMode("signIn");
                  setResetRequested(false);
                  setError(null);
                }}
              >
                Back to sign in
              </button>
            ) : (
              <form className="auth-form" onSubmit={requestPasswordReset}>
                <label className="auth-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                    autoFocus
                  />
                </label>
                <TurnstileWidget onToken={setCaptchaToken} />
                {error ? <p className="auth-error" role="alert">{error}</p> : null}
                <button type="submit" className="auth-submit" disabled={busy || (captchaEnabled() && !captchaToken)}>
                  {busy ? "Sending…" : "Send reset link"}
                </button>
                <button type="button" className="auth-link auth-link-action" onClick={() => setMode("signIn")}>
                  Back to sign in
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <span className="auth-brand">Verae</span>
        <div className="auth-step" key={mode}>
          <h1 className="auth-title">Welcome <em>back</em></h1>
          <p className="auth-copy">Sign in to your member portal</p>

          <button type="button" className="auth-option" onClick={signInWithGoogle} disabled={busy}>
            <svg className="auth-option-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
              <path d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.9z" />
              <path d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.1 0-5.8-2.1-6.8-5l-3.9 3C3.3 21.3 7.3 24 12 24z" />
              <path d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3z" />
              <path d="M12 4.6c1.8 0 3 .7 3.7 1.4l3.3-3.2C17.9 1 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.9 3c1-2.9 3.7-5 6.8-5z" />
            </svg>
            Continue with Google
          </button>

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
                autoComplete="current-password"
                minLength={10}
                required
              />
            </label>
            <button
              type="button"
              className="auth-link auth-forgot-link"
              onClick={() => {
                setMode("forgotPassword");
                setError(null);
                setPassword("");
              }}
            >
              Forgot password?
            </button>
            <TurnstileWidget onToken={setCaptchaToken} />
            {error ? <p className="auth-error" role="alert">{error}</p> : null}
            <button type="submit" className="auth-submit" disabled={busy || (captchaEnabled() && !captchaToken)}>
              {busy ? "One moment…" : "Sign in"}
            </button>
          </form>

          <div className="auth-switch">
            <button
              type="button"
              className="auth-link auth-switch-trigger"
              onClick={() => setInviteHintOpen((open) => !open)}
              aria-expanded={inviteHintOpen}
            >
              New to Verae?
            </button>
            <p className={`auth-switch-hint${inviteHintOpen ? " is-open" : ""}`} aria-hidden={!inviteHintOpen}>
              Use the temporary password sent to your email
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default LoginScreen;
