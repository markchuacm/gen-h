import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminDoctors,
  fetchDoctorMembers,
  fetchPromotableUsers,
  setDoctorActive,
  setRole,
} from "../lib/api/admin";
import type { AdminDoctorRow, DoctorMember, PromotableUser } from "../lib/api/admin";

function DoctorRow({ doctor, onChange }: { doctor: AdminDoctorRow; onChange: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<DoctorMember[] | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && members === null) setMembers(await fetchDoctorMembers(doctor.doctorId));
  };

  return (
    <>
      <tr>
        <td>
          <button type="button" className="adm-link" onClick={() => void toggle()}>
            {doctor.fullName ?? "—"}
          </button>
        </td>
        <td>{doctor.email}</td>
        <td>
          <span className={`adm-pill ${doctor.isActive ? "adm-pill-released" : "adm-pill-none"}`}>
            {doctor.isActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="adm-num">{doctor.assignedCount}</td>
        <td className="adm-row-actions">
          <button
            type="button"
            className="adm-link"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await setDoctorActive(doctor.doctorId, !doctor.isActive);
              await onChange();
              setBusy(false);
            }}
          >
            {doctor.isActive ? "Deactivate" : "Activate"}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="adm-subrow">
          <td colSpan={5}>
            {members === null ? (
              <span className="adm-muted">Loading…</span>
            ) : members.length === 0 ? (
              <span className="adm-muted">No active members assigned.</span>
            ) : (
              <ul className="adm-inline-list">
                {members.map((m) => (
                  <li key={m.memberId}>{m.fullName ?? m.email}</li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function DoctorsPage() {
  const [doctors, setDoctors] = useState<AdminDoctorRow[] | null>(null);
  const [promotable, setPromotable] = useState<PromotableUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [promoteId, setPromoteId] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const [d, p] = await Promise.all([fetchAdminDoctors(), fetchPromotableUsers()]);
    if (d.error) setError(d.error);
    else setDoctors(d.data);
    setPromotable(p.data);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const promote = async () => {
    if (!promoteId) return;
    setBusy(true);
    setError(null);
    const { error: err } = await setRole(promoteId, "doctor");
    if (err) setError(err);
    else {
      setPromoteId("");
      await reload();
    }
    setBusy(false);
  };

  return (
    <section className="adm-page">
      <div className="adm-page-head">
        <div>
          <p className="p-eyebrow">Admin · Doctors</p>
          <h1 className="p-h1">Doctors</h1>
        </div>
        <div className="adm-promote">
          <select value={promoteId} onChange={(e) => setPromoteId(e.target.value)}>
            <option value="">Promote a member to doctor…</option>
            {promotable.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name ? `${u.full_name} · ${u.email}` : u.email}</option>
            ))}
          </select>
          <button type="button" className="adm-btn" disabled={!promoteId || busy} onClick={() => void promote()}>
            Promote
          </button>
        </div>
      </div>

      {error && <p role="alert" className="adm-error">{error}</p>}
      {doctors === null && !error && <p className="adm-muted">Loading doctors…</p>}
      {doctors !== null && doctors.length === 0 && <p className="adm-muted">No doctors yet.</p>}

      {doctors && doctors.length > 0 && (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Doctor</th><th>Email</th><th>Status</th><th>Cases</th><th /></tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <DoctorRow key={d.doctorId} doctor={d} onChange={reload} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default DoctorsPage;
