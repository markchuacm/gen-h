import { useState } from "react";
import type { FormEvent } from "react";
import { createDoctor } from "../lib/api/admin";

export default function AddDoctorModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const result = await createDoctor({ fullName: fullName.trim(), email: email.trim() });
    setBusy(false);
    if (result.error) {
      setError(result.error === "email_exists" ? "An account with this email already exists." : "The invitation could not be sent. Please try again.");
      return;
    }
    setSent(true);
    await onCreated();
  }

  return (
    <div className="adm-ing-layer" role="dialog" aria-modal="true" aria-label="Add doctor">
      <div className="adm-ing-backdrop" onClick={busy ? undefined : onClose} />
      <div className="adm-ing-panel adm-form-panel">
        <header className="adm-ing-panel-head">
          <h2>{sent ? "Invitation sent" : "Add doctor"}</h2>
          <button type="button" className="adm-ing-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        {error && <p role="alert" className="adm-error">{error}</p>}
        {sent ? (
          <div className="adm-ing-body">
            <div className="adm-success-note">
              <strong>{fullName.trim()}</strong>
              <p>An activation link was sent to {email.trim()}. It expires in 7 days.</p>
            </div>
            <div className="adm-bio-actions">
              <button type="button" className="adm-btn-ghost" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <form className="adm-ing-body" onSubmit={submit}>
            <p className="adm-form-intro">They’ll choose their own password from a secure activation link.</p>
            <label className="adm-field">
              <span>Full name</span>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required autoFocus />
            </label>
            <label className="adm-field">
              <span>Email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </label>
            <div className="adm-bio-actions">
              <button type="submit" className="adm-btn" disabled={busy}>
                {busy ? "Sending…" : "Send activation link"}
              </button>
              <button type="button" className="adm-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
