import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import CasesList from "./CasesList";
import CaseDetail from "./CaseDetail";
import DoctorsPage from "./DoctorsPage";
import "../member-v2/shell/shell.css";
import "./admin.css";

type Tab = "cases" | "doctors";

function AdminApp() {
  const { profile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("cases");
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);

  return (
    <div className="adm-shell">
      <header className="adm-topbar">
        <div className="adm-brand">
          <span className="adm-brand-mark">Verae</span>
          <span className="p-chip">Admin</span>
        </div>
        <nav className="adm-tabs" aria-label="Admin sections">
          <button
            type="button"
            className={tab === "cases" ? "is-active" : ""}
            onClick={() => {
              setOpenMemberId(null);
              setTab("cases");
            }}
          >
            Cases
          </button>
          <button
            type="button"
            className={tab === "doctors" ? "is-active" : ""}
            onClick={() => {
              setOpenMemberId(null);
              setTab("doctors");
            }}
          >
            Doctors
          </button>
        </nav>
        <div className="adm-user">
          <span>{profile?.email}</span>
          <button type="button" className="adm-signout" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <main className="adm-main">
        {tab === "cases" &&
          (openMemberId ? (
            <CaseDetail memberId={openMemberId} onBack={() => setOpenMemberId(null)} />
          ) : (
            <CasesList onOpen={(id) => setOpenMemberId(id)} />
          ))}
        {tab === "doctors" && <DoctorsPage />}
      </main>
    </div>
  );
}

export default AdminApp;
