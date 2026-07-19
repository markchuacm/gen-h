import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "../authClient";

const RESEND_COOLDOWN_SECONDS = 60;

export default function StepVerifyEmail({
  email,
  onDone,
}: {
  email: string;
  onDone: () => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const sentOnce = useRef(false);

  async function sendCode() {
    setError(null);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    const { error: err } = await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
    if (err) setError(err.message ?? "We couldn't send a code. Try again in a moment.");
  }

  // Send once on mount.
  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    void sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await authClient.emailOtp.verifyEmail({ email, otp: code });
    if (err) {
      const message = (err.message ?? "").toLowerCase();
      setError(
        message.includes("too many")
          ? "Too many attempts. Request a new code and try again."
          : message.includes("expired")
            ? "That code has expired. Request a new one."
            : "That code wasn't right. Check it and try again.",
      );
      setBusy(false);
      return;
    }
    await onDone();
  }

  return (
    <div className="auth-card">
      <span className="auth-brand">Verae</span>
      <div className="auth-step">
        <p className="setup-steps">Step 2 of 3</p>
        <h1 className="auth-title">Verify your <em>email</em></h1>
        <p className="auth-copy">
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below — it expires in 5 minutes.
        </p>
        <form className="auth-form" onSubmit={submit}>
          <label className="auth-field">
            <span>Verification code</span>
            <input
              className="setup-otp-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
            />
          </label>
          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          <button type="submit" className="auth-submit" disabled={busy || code.length !== 6}>
            {busy ? "Verifying…" : "Verify and continue"}
          </button>
          <button
            type="button"
            className="auth-link auth-link-action"
            disabled={cooldown > 0}
            onClick={() => void sendCode()}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </form>
      </div>
    </div>
  );
}
