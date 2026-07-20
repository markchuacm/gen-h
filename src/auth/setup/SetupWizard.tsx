import { useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";
import { readOAuthCallbackError } from "../oauthCallbackError";
import StepAuthMethod from "./StepAuthMethod";
import StepVerifyEmail from "./StepVerifyEmail";
import StepConsent from "./StepConsent";
import "../auth.css";
import "./setup.css";

export default function SetupWizard() {
  const { profile, refreshProfile } = useAuth();
  const [callbackError, setCallbackError] = useState<string | null>(null);

  useEffect(() => {
    setCallbackError(readOAuthCallbackError());
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
          {callbackError === "email_doesn't_match" || callbackError === "account_already_linked_to_different_user"
            ? <>That Google account uses a different email than your invite. Use {email || "your invited email"} instead, or set a password below.</>
            : <>Google sign-in failed. Try again, or set a password below.</>}
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
