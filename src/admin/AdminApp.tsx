import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../auth/AuthProvider";
import { apiError } from "../lib/apiClient";
import { disableDeveloperMode, enableDeveloperMode, fetchDeveloperMode } from "../lib/api/admin";
import CasesList from "./CasesList";
import CaseDetail from "./CaseDetail";
import DoctorsPage from "./DoctorsPage";
import CatalogPage from "./CatalogPage";
import "../member-v2/shell/shell.css";
import "./admin.css";

type Tab = "cases" | "doctors" | "biomarkers";

function AdminApp() {
  const { profile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("cases");
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [developerPrompt, setDeveloperPrompt] = useState(false);
  const [developerUnlocked, setDeveloperUnlocked] = useState(false);
  const [, setSettingsClickCount] = useState(0);
  const [developerMode, setDeveloperMode] = useState(false);
  const [developerAvailable, setDeveloperAvailable] = useState(false);
  const [developerExpiresAt, setDeveloperExpiresAt] = useState<string | null>(null);
  const [developerPassword, setDeveloperPassword] = useState("");
  const [developerError, setDeveloperError] = useState<string | null>(null);
  const [developerBusy, setDeveloperBusy] = useState(false);
  const userMenu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetchDeveloperMode().then((status) => {
      setDeveloperMode(status.enabled);
      setDeveloperAvailable(status.available);
      setDeveloperExpiresAt(status.expiresAt);
    }).catch(() => {
      setDeveloperAvailable(false);
    });
  }, []);

  useEffect(() => {
    if (!developerMode || !developerExpiresAt) return;
    const remaining = new Date(developerExpiresAt).getTime() - Date.now();
    if (remaining <= 0) {
      setDeveloperMode(false);
      setDeveloperExpiresAt(null);
      return;
    }
    const timeout = window.setTimeout(() => {
      setDeveloperMode(false);
      setDeveloperExpiresAt(null);
    }, remaining);
    return () => window.clearTimeout(timeout);
  }, [developerMode, developerExpiresAt]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (!userMenu.current?.contains(event.target as Node)) {
        setMenuOpen(false);
        setDeveloperPrompt(false);
        setDeveloperError(null);
        setDeveloperPassword("");
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [menuOpen]);

  async function turnOnDeveloperMode(event: FormEvent) {
    event.preventDefault();
    setDeveloperBusy(true);
    setDeveloperError(null);
    try {
      const status = await enableDeveloperMode(developerPassword);
      setDeveloperMode(true);
      setDeveloperExpiresAt(status.expiresAt);
      setDeveloperPassword("");
      setDeveloperPrompt(false);
      setMenuOpen(false);
    } catch (error) {
      setDeveloperError(apiError(error) === "Incorrect developer password" ? "That password wasn’t accepted." : apiError(error));
    } finally {
      setDeveloperBusy(false);
    }
  }

  async function turnOffDeveloperMode() {
    setDeveloperBusy(true);
    try {
      await disableDeveloperMode();
      setDeveloperMode(false);
      setDeveloperExpiresAt(null);
      setMenuOpen(false);
    } finally {
      setDeveloperBusy(false);
    }
  }

  async function handleSignOut() {
    if (developerMode) await disableDeveloperMode().catch(() => undefined);
    await signOut();
  }

  return (
    <div className={`adm-shell ${developerMode ? "is-developer" : ""}`}>
      <header className="adm-topbar">
        <div className="adm-brand">
          <span className="adm-brand-mark">Verae</span>
          <span className="p-chip">Admin</span>
          {developerMode && <span className="adm-developer-chip">Developer mode</span>}
        </div>
        <nav className="adm-tabs" aria-label="Admin sections">
          <button
            type="button"
            className={tab === "cases" ? "is-active" : ""}
            onClick={() => { setOpenMemberId(null); setTab("cases"); }}
          >
            Cases
          </button>
          <button
            type="button"
            className={tab === "doctors" ? "is-active" : ""}
            onClick={() => { setOpenMemberId(null); setTab("doctors"); }}
          >
            Doctors
          </button>
          <button
            type="button"
            className={tab === "biomarkers" ? "is-active" : ""}
            onClick={() => { setOpenMemberId(null); setTab("biomarkers"); }}
          >
            Biomarkers
          </button>
        </nav>
        <div className="adm-user" ref={userMenu}>
          <button
            type="button"
            className="adm-user-trigger"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Account menu for ${profile?.email ?? "administrator"}`}
            onClick={() => {
              setMenuOpen((open) => !open);
              setDeveloperPrompt(false);
              setDeveloperError(null);
            }}
          >
            <span className="adm-user-email">{profile?.email}</span>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
          </button>
          {menuOpen && (
            <div className="adm-user-menu" role="menu">
              {developerMode ? (
                <button type="button" role="menuitem" className="adm-menu-item" disabled={developerBusy} onClick={() => void turnOffDeveloperMode()}>
                  <span>Turn off developer mode</span>
                  <span className="adm-menu-status is-on">On</span>
                </button>
              ) : developerPrompt ? (
                <form className="adm-developer-form" onSubmit={turnOnDeveloperMode}>
                  <label htmlFor="developer-password">Developer password</label>
                  <input
                    id="developer-password"
                    type="password"
                    autoComplete="off"
                    value={developerPassword}
                    onChange={(event) => setDeveloperPassword(event.target.value)}
                    disabled={developerBusy}
                    autoFocus
                  />
                  {developerError && <p role="alert">{developerError}</p>}
                  <div>
                    <button type="submit" className="adm-menu-confirm" disabled={!developerPassword || developerBusy}>
                      {developerBusy ? "Checking…" : "Turn on"}
                    </button>
                    <button type="button" className="adm-menu-cancel" onClick={() => setDeveloperPrompt(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  className="adm-menu-item"
                  disabled={developerUnlocked && !developerAvailable}
                  onClick={() => {
                    if (developerUnlocked) {
                      setDeveloperPrompt(true);
                      return;
                    }
                    setSettingsClickCount((count) => {
                      const nextCount = count + 1;
                      if (nextCount >= 5) setDeveloperUnlocked(true);
                      return Math.min(nextCount, 5);
                    });
                  }}
                >
                  <span>{developerUnlocked ? "Developer mode" : "Settings"}</span>
                  {developerUnlocked && (
                    <span className="adm-menu-status">{developerAvailable ? "Off" : "Not configured"}</span>
                  )}
                </button>
              )}
              <div className="adm-menu-divider" />
              <button type="button" role="menuitem" className="adm-menu-item" onClick={() => void handleSignOut()}>Sign out</button>
            </div>
          )}
        </div>
      </header>

      <main className="adm-main">
        {tab === "cases" && (openMemberId
          ? <CaseDetail memberId={openMemberId} onBack={() => setOpenMemberId(null)} />
          : <CasesList onOpen={(id) => setOpenMemberId(id)} developerMode={developerMode} />)}
        {tab === "doctors" && <DoctorsPage developerMode={developerMode} />}
        {tab === "biomarkers" && <CatalogPage />}
      </main>
    </div>
  );
}

export default AdminApp;
