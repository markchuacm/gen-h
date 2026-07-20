import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider, useAuth } from "../auth/AuthProvider";
import LoginScreen from "../auth/LoginScreen";
import MfaSetup from "../auth/MfaSetup";
import SetupWizard from "../auth/setup/SetupWizard";
import InviteExpiredScreen from "../auth/setup/InviteExpiredScreen";
import "./tokens.css";

const MemberApp = lazy(() => import("./MemberApp"));
const DoctorApp = lazy(() => import("../doctor/DoctorApp"));
const AdminApp = lazy(() => import("../admin/AdminApp"));

function LoadingApp() {
  return <main className="auth-screen"><p role="status">Loading your workspace…</p></main>;
}

function Gate() {
  const { session, profile, profileError, signOut } = useAuth();

  // Initial session restore (and OAuth code exchange) still in flight.
  if (session === undefined) return null;

  if (!session) return <LoginScreen />;

  if (profileError) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <span className="auth-brand">Verae</span>
          <h1 className="auth-title">Something went wrong</h1>
          <p className="auth-copy">
            We couldn't load your profile ({profileError}). Try again in a moment.
          </p>
          <button type="button" className="auth-link" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </main>
    );
  }

  // Session live, profile still loading.
  if (!profile) return null;

  // Invited members complete first-login setup (choose auth method -> verify email
  // -> consent) before reaching the portal. The wizard is driven by server flags.
  if (profile.role === "member" && profile.setup?.required) {
    return profile.setup.inviteExpired ? (
      <InviteExpiredScreen onSignOut={() => void signOut()} />
    ) : (
      <SetupWizard />
    );
  }

  if ((profile.role === "admin" || profile.role === "doctor") && !profile.two_factor_enabled) {
    return <MfaSetup />;
  }

  // Admins get the ops console; doctors get the doctor console; members the portal.
  if (profile.role === "admin") return <Suspense fallback={<LoadingApp />}><AdminApp /></Suspense>;
  if (profile.role === "doctor") return <Suspense fallback={<LoadingApp />}><DoctorApp /></Suspense>;

  return <Suspense fallback={<LoadingApp />}><MemberApp /></Suspense>;
}

ReactDOM.createRoot(document.getElementById("member-root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <Gate />
    </AuthProvider>
  </React.StrictMode>,
);
