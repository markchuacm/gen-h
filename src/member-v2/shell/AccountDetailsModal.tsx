import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchMemberProfile, updateMemberIdentity } from "../../lib/api/memberProfile";
import { dobFromIc, PhoneField } from "../screens/profile/identityFields";

/**
 * Standalone editor for the member's request-form details, opened from the
 * top-nav "Account details" menu item. Just these five fields plus Save — it
 * never enters the multi-step profile brief flow.
 */
function AccountDetailsModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [icPassportNo, setIcPassportNo] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchMemberProfile().then(({ data }) => {
      if (cancelled) return;
      if (data) {
        setFullName(data.full_name ?? "");
        setIcPassportNo(data.ic_passport_no ?? "");
        setDateOfBirth(data.date_of_birth ? data.date_of_birth.slice(0, 10) : "");
        setPhone(data.phone ?? "");
        setAddress(data.address ?? "");
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onIcChange = (value: string) => {
    setIcPassportNo(value);
    const derived = dobFromIc(value);
    if (derived) setDateOfBirth(derived);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const { error: err } = await updateMemberIdentity({
      fullName: fullName.trim() || undefined,
      dateOfBirth: dateOfBirth || null,
      icPassportNo: icPassportNo.trim() || null,
      address: address.trim() || null,
      phone: phone.trim() || null,
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  };

  return (
    <div className="p-account-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="account-details-title">
      <div className="p-account-modal">
        <button className="p-account-modal-close" type="button" aria-label="Close" onClick={onClose}>
          <X strokeWidth={2} />
        </button>
        <h2 id="account-details-title">Account details</h2>
        <p className="p-account-modal-sub">
          Used on your blood test request form. Your name must match your IC exactly.
        </p>
        {loading ? (
          <p role="status" className="p-account-modal-loading">Loading…</p>
        ) : (
          <>
            <div className="p-account-modal-fields">
              <label>
                <span>Full name (as per IC / Passport)</span>
                <input className="pf-other-input" value={fullName} autoComplete="name" onChange={(e) => setFullName(e.target.value)} />
              </label>
              <label>
                <span>IC / passport number</span>
                <input className="pf-other-input" value={icPassportNo} onChange={(e) => onIcChange(e.target.value)} />
              </label>
              <label>
                <span>Date of birth</span>
                <input className="pf-other-input" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </label>
              <label>
                <span>Phone</span>
                <PhoneField value={phone} onChange={setPhone} />
              </label>
              <label>
                <span>Address</span>
                <textarea className="pf-other-input pf-id-address-input" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
              </label>
            </div>
            {error && <p className="p-account-modal-error" role="alert">{error}</p>}
            <div className="p-account-modal-actions">
              <button className="p-btn-ghost" type="button" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="p-btn" type="button" onClick={() => void save()} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AccountDetailsModal;
