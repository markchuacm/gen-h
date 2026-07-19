import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createPatient, fetchAdminDoctors } from "../lib/api/admin";
import type { AdminDoctorRow, InviteResult } from "../lib/api/admin";
import InviteReveal from "./InviteReveal";

export default function AddPatientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [doctors, setDoctors] = useState<AdminDoctorRow[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);

  useEffect(() => {
    fetchAdminDoctors().then(({ data }) => setDoctors(data.filter((d) => d.isActive)));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const { data, error: err } = await createPatient({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      doctorId: doctorId || undefined,
    });
    setBusy(false);
    if (err || !data) {
      setError(err === "email_exists" ? "A member with this email already exists." : (err ?? "Couldn't create patient."));
      return;
    }
    setResult(data);
    void onCreated();
  }

  return (
    <div className="adm-ing-layer" role="dialog" aria-modal="true" aria-label="Add patient">
      <div className="adm-ing-backdrop" onClick={busy ? undefined : onClose} />
      <div className="adm-ing-panel">
        <header className="adm-ing-panel-head">
          <h2>{result ? "Patient invited" : "Add patient"}</h2>
          <button type="button" className="adm-ing-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        {error && <p role="alert" className="adm-error">{error}</p>}

        {result ? (
          <div className="adm-ing-body">
            <InviteReveal email={email.trim()} tempPassword={result.tempPassword} fullName={fullName.trim()} />
            <div className="adm-bio-actions">
              <button type="button" className="adm-btn-ghost" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <form className="adm-ing-body" onSubmit={submit}>
            <label className="adm-field">
              <span>Full name</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus />
            </label>
            <label className="adm-field">
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="adm-field">
              <span>Phone</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
            <label className="adm-field">
              <span>Assigned doctor</span>
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                <option value="">Assign later</option>
                {doctors.map((d) => (
                  <option key={d.doctorId} value={d.doctorId}>{d.fullName ?? d.email}</option>
                ))}
              </select>
            </label>
            <div className="adm-bio-actions">
              <button type="submit" className="adm-btn" disabled={busy}>
                {busy ? "Creating…" : "Create & get invite"}
              </button>
              <button type="button" className="adm-btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
