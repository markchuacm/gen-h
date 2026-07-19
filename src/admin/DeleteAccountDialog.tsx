import { useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import { deleteAdminUser } from "../lib/api/admin";

export default function DeleteAccountDialog({
  userId,
  label,
  kind,
  onClose,
  onDeleted,
}: {
  userId: string;
  label: string;
  kind: "member" | "doctor";
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (confirmation !== "DELETE") return;
    setBusy(true);
    setError(null);
    const result = await deleteAdminUser(userId);
    if (result.error) {
      setBusy(false);
      setError(result.error === "Developer mode is required" ? "Developer mode has expired. Turn it on again to continue." : result.error);
      return;
    }
    await onDeleted();
    onClose();
  }

  return createPortal(
    <div className="adm-ing-layer" role="dialog" aria-modal="true" aria-label={`Delete ${kind}`}>
      <div className="adm-ing-backdrop" onClick={busy ? undefined : onClose} />
      <div className="adm-ing-panel adm-delete-panel">
        <header className="adm-ing-panel-head">
          <h2>Delete {kind}</h2>
          <button type="button" className="adm-ing-close" onClick={onClose} aria-label="Close" disabled={busy}>✕</button>
        </header>
        <form className="adm-ing-body" onSubmit={submit}>
          <div className="adm-danger-note">
            <strong>{label}</strong>
            <p>
              {kind === "member"
                ? "This permanently deletes the account, profile, results, care plans, appointments, and uploaded health documents."
                : "This permanently deletes the account, assignments, scheduled consultations, and authored care plans."}
            </p>
          </div>
          <label className="adm-field">
            <span>Type DELETE to confirm</span>
            <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" autoFocus />
          </label>
          {error && <p className="adm-error" role="alert">{error}</p>}
          <div className="adm-bio-actions">
            <button type="submit" className="adm-btn-danger" disabled={busy || confirmation !== "DELETE"}>
              {busy ? "Deleting…" : `Permanently delete ${kind}`}
            </button>
            <button type="button" className="adm-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
