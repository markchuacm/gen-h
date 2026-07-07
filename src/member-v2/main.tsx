import React from "react";
import ReactDOM from "react-dom/client";
import MemberApp from "./MemberApp";
import DoctorApp from "../doctor/DoctorApp";
import { AuthProvider, useAuth } from "../auth/AuthProvider";
import LoginScreen from "../auth/LoginScreen";
import "./tokens.css";

function Gate() {
  const { session, profile, profileError, signOut } = useAuth();

  // Initial session restore (and OAuth code exchange) still in flight.
  if (session === undefined) return null;

  if (!session) return <LoginScreen />;

  if (profileError) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <span className="auth-brand">Gen-H</span>
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

  // Doctors and admins get the doctor console; members get the portal.
  if (profile.role === "doctor" || profile.role === "admin") return <DoctorApp />;

  return <MemberApp />;
}

ReactDOM.createRoot(document.getElementById("member-root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <Gate />
    </AuthProvider>
  </React.StrictMode>,
);
