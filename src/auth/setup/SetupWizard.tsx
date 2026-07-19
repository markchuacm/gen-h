import { useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";
import StepAuthMethod from "./StepAuthMethod";
import StepVerifyEmail from "./StepVerifyEmail";
import StepConsent from "./StepConsent";
import "../auth.css";
import "./setup.css";

// Read (and clear) a Google-link callback error from the URL. Better Auth appends
// ?error=... to callbackURL when account linking fails (e.g. email mismatch).
function readCallbackError(): string | null {
  const url = new URL(window.location.href);
  const err = url.searchParams.get("error");
  if (!err) return null;
  url.searchParams.delete("error");
  window.history.replaceState(null, "", url);
  return err;
}

export default function SetupWizard() {
  const { profile, refreshProfile } = useAuth();
  const [callbackError, setCallbackError] = useState<string | null>(null);

  useEffect(() => {
    setCallbackError(readCallbackError());
  }, []);

  const setup = profile?.setup;
  const email = profile?.email ?? "";

  // Derive the current step from server state so a mid-setup re-login (or the
  // Google redirect round-trip) always resumes at the right place.
  const step: "auth" | "otp" | "consent" = !setup?.authMethod
    ? "auth"
    : !setup.otpVerified
      ? "otp"
      : "consent";

  return (
    <main className="auth-screen">
      {callbackError && step === "auth" ? (
        <p className="auth-error setup-callback-error" role="alert">
          That Google account uses a different email than your invite. Use {email || "your invited email"} instead,
          or set a password below.
        </p>
      ) : null}
      {step === "auth" ? (
        <StepAuthMethod onDone={refreshProfile} />
      ) : step === "otp" ? (
        <StepVerifyEmail email={email} onDone={refreshProfile} />
      ) : (
        <StepConsent onDone={refreshProfile} />
      )}
    </main>
  );
}
