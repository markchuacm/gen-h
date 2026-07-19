import { useState } from "react";
import type { FormEvent } from "react";
import { acceptConsent } from "./api";
import { apiError } from "../../lib/apiClient";
import { TERMS_SECTIONS, CONSENT_SECTIONS } from "./consentContent";

export default function StepConsent({ onDone }: { onDone: () => Promise<void> }) {
  const [signature, setSignature] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptConsentBox, setAcceptConsentBox] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = acceptTerms && acceptConsentBox && signature.trim().length >= 2;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    try {
      await acceptConsent(signature.trim());
      await onDone();
    } catch (err) {
      setError(apiError(err));
      setBusy(false);
    }
  }

  return (
    <div className="auth-card setup-consent-card">
      <span className="auth-brand">Verae</span>
      <div className="auth-step">
        <p className="setup-steps">Step 3 of 3</p>
        <h1 className="auth-title">Terms &amp; <em>consent</em></h1>
        <p className="auth-copy">Please read and accept the following before we set up your care.</p>

        <div className="setup-consent-doc" tabIndex={0}>
        <h2 className="setup-consent-heading">Terms of Service & Privacy</h2>
        {TERMS_SECTIONS.map((s) => (
          <div key={s.heading} className="setup-consent-section">
            <h3>{s.heading}</h3>
            <p>{s.body}</p>
          </div>
        ))}
        <h2 className="setup-consent-heading">Health-data & Telehealth Consent</h2>
        {CONSENT_SECTIONS.map((s) => (
          <div key={s.heading} className="setup-consent-section">
            <h3>{s.heading}</h3>
            <p>{s.body}</p>
          </div>
        ))}
      </div>

      <form className="auth-form" onSubmit={submit}>
        <label className="setup-check">
          <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
          <span>I have read and agree to the Terms of Service & Privacy.</span>
        </label>
        <label className="setup-check">
          <input type="checkbox" checked={acceptConsentBox} onChange={(e) => setAcceptConsentBox(e.target.checked)} />
          <span>I give my consent to the Health-data & Telehealth Consent above.</span>
        </label>
        <label className="auth-field">
          <span>Type your full name to sign</span>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            autoComplete="name"
            placeholder="Full name as per ID"
            required
          />
        </label>
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        <button type="submit" className="auth-submit" disabled={busy || !canSubmit}>
          {busy ? "Saving…" : "Agree and continue"}
        </button>
        </form>
      </div>
    </div>
  );
}
