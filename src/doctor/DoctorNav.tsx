import { useAuth } from "../auth/AuthProvider";

/** Floating capsule nav for the doctor console — same shell as the member
    portal (p-nav), with the doctor's identity and sign-out instead of tabs. */
function DoctorNav() {
  const { profile, signOut } = useAuth();
  const name = profile?.full_name ?? profile?.email ?? "";
  const initial = name.trim().charAt(0).toUpperCase() || "D";

  return (
    <nav className="p-nav" aria-label="Doctor console">
      <span className="p-nav-wordmark">Gen-H</span>
      <span className="doc-nav-role">Doctor console</span>
      <div className="p-nav-right">
        <button type="button" className="doc-nav-signout" onClick={() => void signOut()}>
          Sign out
        </button>
        <span className="p-avatar" title={name}>
          {initial}
        </span>
      </div>
    </nav>
  );
}

export default DoctorNav;
