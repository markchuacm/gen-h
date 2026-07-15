import { useAuth } from "../auth/AuthProvider";

/** Slim top bar for the doctor console — the member onboarding's quiet header
    (wordmark left, one quiet action right) rather than the portal capsule nav,
    which carries tabs the console doesn't have. */
function DoctorNav() {
  const { profile, signOut } = useAuth();
  const name = profile?.full_name ?? profile?.email ?? "";

  return (
    <header className="doc-topbar">
      <span className="doc-topbar-wordmark">Verae</span>
      <button type="button" className="doc-topbar-signout" title={name} onClick={() => void signOut()}>
        Sign out
      </button>
    </header>
  );
}

export default DoctorNav;
