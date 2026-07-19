import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "../authClient";
import { portalUrl } from "../portalUrl";
import { setSetupPassword } from "./api";
import { apiError } from "../../lib/apiClient";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@verae/contracts";

export default function StepAuthMethod({ onDone }: { onDone: () => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function continueWithGoogle() {
    setError(null);
    setBusy(true);
    const { error: err } = await authClient.linkSocial({ provider: "google", callbackURL: portalUrl() });
    if (err) {
      setError(err.message ?? "Google sign-in failed.");
      setBusy(false);
    }
    // On success the browser navigates to Google; the wizard re-derives the step on return.
  }

  async function submitPassword(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      setError(`Use between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await setSetupPassword(password);
      await onDone();
    } catch (err) {
      setError(apiError(err));
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <span className="auth-brand">Verae</span>
      <div className="auth-step">
        <p className="setup-steps">Step 1 of 3</p>
        <h1 className="auth-title">Secure your <em>account</em></h1>
        <p className="auth-copy">Choose how you'll sign in from now on. This replaces the temporary password you were given.</p>

        <button type="button" className="auth-option" onClick={continueWithGoogle} disabled={busy}>
          <svg className="auth-option-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
            <path d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.9z" />
            <path d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.1 0-5.8-2.1-6.8-5l-3.9 3C3.3 21.3 7.3 24 12 24z" />
            <path d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3z" />
            <path d="M12 4.6c1.8 0 3 .7 3.7 1.4l3.3-3.2C17.9 1 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.9 3c1-2.9 3.7-5 6.8-5z" />
          </svg>
          Continue with Google
        </button>

        <form className="auth-form" onSubmit={submitPassword}>
          <label className="auth-field">
            <span>New password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={10}
              maxLength={PASSWORD_MAX_LENGTH}
              aria-describedby="setup-password-rule"
              required
            />
          </label>
          <label className="auth-field">
            <span>Confirm new password</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={10}
              maxLength={PASSWORD_MAX_LENGTH}
              aria-describedby="setup-password-rule"
              required
            />
          </label>
          <p id="setup-password-rule" className="auth-copy">Use {PASSWORD_MIN_LENGTH}–{PASSWORD_MAX_LENGTH} characters.</p>
          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "One moment…" : "Set password and continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
