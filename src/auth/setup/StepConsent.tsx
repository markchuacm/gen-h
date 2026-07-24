import { useState } from "react";
import type { FormEvent } from "react";
import { acceptConsent } from "./api";
import { apiError } from "../../lib/apiClient";
import MarkdownContent from "../../legal/MarkdownContent";
import { LEGAL_PATHS, TERMS_OF_SERVICE, publicLegalUrl } from "../../legal/legalDocuments";

function toProperCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-MY")
    .replace(/(^|[\s'-])(\p{L})/gu, (_, separator: string, letter: string) => `${separator}${letter.toLocaleUpperCase("en-MY")}`);
}

export default function StepConsent({ onDone }: { onDone: () => Promise<void> }) {
  const [signature, setSignature] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acknowledgePrivacy, setAcknowledgePrivacy] = useState(false);
  const [acceptConsentBox, setAcceptConsentBox] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = acceptTerms && acknowledgePrivacy && acceptConsentBox && signature.trim().length >= 2;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    try {
      await acceptConsent(toProperCase(signature));
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
        <p className="auth-copy">Please review these documents before we set up your care.</p>

        <section className="setup-consent-doc" tabIndex={0} aria-label="Terms of Service">
          <MarkdownContent source={TERMS_OF_SERVICE.content} omitTitle />
        </section>

        <form className="auth-form" onSubmit={submit}>
          <div className="setup-check-list" role="group" aria-label="Required acknowledgements">
            <div className="setup-check">
              <input id="accept-terms" type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
              <label htmlFor="accept-terms">
                I have read and agree to the <a href={publicLegalUrl(LEGAL_PATHS.terms)} target="_blank" rel="noreferrer">Terms of Service</a>
              </label>
            </div>
            <div className="setup-check">
              <input id="acknowledge-privacy" type="checkbox" checked={acknowledgePrivacy} onChange={(e) => setAcknowledgePrivacy(e.target.checked)} />
              <label htmlFor="acknowledge-privacy">
                I acknowledge the{" "}
                <a href={publicLegalUrl(LEGAL_PATHS.privacy)} target="_blank" rel="noreferrer">Privacy Policy</a>
              </label>
            </div>
            <div className="setup-check">
              <input id="accept-informed-consent" type="checkbox" checked={acceptConsentBox} onChange={(e) => setAcceptConsentBox(e.target.checked)} />
              <label htmlFor="accept-informed-consent">
                I consent to the collection and processing of my health information under the{" "}
                <a href={publicLegalUrl(LEGAL_PATHS.informedConsent)} target="_blank" rel="noreferrer">Informed Consent Policy</a>
              </label>
            </div>
          </div>
          <label className="auth-field setup-signature-field">
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
