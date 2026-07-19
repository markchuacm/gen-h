export default function InviteExpiredScreen({ onSignOut }: { onSignOut: () => void }) {
  return (
    <main className="auth-screen">
      <div className="auth-card">
        <span className="auth-brand">Verae</span>
        <div className="auth-step">
          <h1 className="auth-title">Your invitation has <em>expired</em></h1>
          <p className="auth-copy">
            The temporary password you were given is no longer valid. Ask your Verae contact to send you a
            new temporary password, then sign in again.
          </p>
          <button type="button" className="auth-link auth-link-action" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
