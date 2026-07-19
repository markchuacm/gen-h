import { useCallback, useEffect, useState } from "react";
import { fetchAdminDoctors, fetchDoctorMembers, setDoctorActive } from "../lib/api/admin";
import type { AdminDoctorRow, DoctorMember } from "../lib/api/admin";
import AddDoctorModal from "./AddDoctorModal";
import DeleteAccountDialog from "./DeleteAccountDialog";

function DoctorRow({
  doctor,
  developerMode,
  onChange,
}: {
  doctor: AdminDoctorRow;
  developerMode: boolean;
  onChange: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<DoctorMember[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && members === null) setMembers(await fetchDoctorMembers(doctor.doctorId));
  };

  const status = doctor.accountStatus === "pending"
    ? { label: "Invitation pending", className: "adm-pill-draft" }
    : doctor.isActive
      ? { label: "Active", className: "adm-pill-released" }
      : { label: "Inactive", className: "adm-pill-none" };

  return (
    <>
      <tr>
        <td>
          <button type="button" className="adm-link" onClick={() => void toggle()}>
            {doctor.fullName ?? "—"}
          </button>
        </td>
        <td>{doctor.email}</td>
        <td><span className={`adm-pill ${status.className}`}>{status.label}</span></td>
        <td className="adm-num">{doctor.assignedCount}</td>
        <td className="adm-row-actions">
          {doctor.accountStatus === "active" && (
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
          )}
          {developerMode && (
            <button type="button" className="adm-link adm-link-danger" onClick={() => setDeleteOpen(true)}>Delete</button>
          )}
        </td>
      </tr>
      {open && (
        <tr className="adm-subrow">
          <td colSpan={5}>
            {members === null ? <span className="adm-muted">Loading…</span>
              : members.length === 0 ? <span className="adm-muted">No active members assigned.</span>
                : <ul className="adm-inline-list">{members.map((member) => <li key={member.memberId}>{member.fullName ?? member.email}</li>)}</ul>}
          </td>
        </tr>
      )}
      {deleteOpen && (
        <DeleteAccountDialog
          userId={doctor.doctorId}
          label={doctor.fullName ?? doctor.email ?? "This doctor"}
          kind="doctor"
          onClose={() => setDeleteOpen(false)}
          onDeleted={onChange}
        />
      )}
    </>
  );
}

function DoctorsPage({ developerMode }: { developerMode: boolean }) {
  const [doctors, setDoctors] = useState<AdminDoctorRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const reload = useCallback(async () => {
    const result = await fetchAdminDoctors();
    if (result.error) setError(result.error);
    else {
      setDoctors(result.data);
      setError(null);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  return (
    <section className="adm-page">
      <div className="adm-page-head">
        <div>
          <p className="p-eyebrow">Admin · Doctors</p>
          <h1 className="p-h1">Doctors</h1>
        </div>
        <button type="button" className="adm-btn" onClick={() => setAddOpen(true)}>Add doctor</button>
      </div>

      {addOpen && <AddDoctorModal onClose={() => setAddOpen(false)} onCreated={reload} />}
      {error && <p role="alert" className="adm-error">{error}</p>}
      {doctors === null && !error && <p className="adm-muted">Loading doctors…</p>}
      {doctors !== null && doctors.length === 0 && <p className="adm-muted">No doctors yet.</p>}

      {doctors && doctors.length > 0 && (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Doctor</th><th>Email</th><th>Status</th><th>Cases</th><th /></tr></thead>
            <tbody>{doctors.map((doctor) => <DoctorRow key={doctor.doctorId} doctor={doctor} developerMode={developerMode} onChange={reload} />)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default DoctorsPage;
