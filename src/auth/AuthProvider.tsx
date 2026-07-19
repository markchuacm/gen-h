import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiError, apiRequest } from "../lib/apiClient";
import { authClient } from "./authClient";

export type Role = "member" | "doctor" | "admin";

/** First-login setup state for invited members. Absent for staff. */
export type SetupState = {
  required: boolean;
  inviteExpired: boolean;
  authMethod: "password" | "google" | null;
  otpVerified: boolean;
};

export type Profile = {
  id: string;
  role: Role;
  email: string | null;
  full_name: string | null;
  /** Full name typed by the member when signing the latest consent. */
  consent_name: string | null;
  avatar_url: string | null;
  account_status: "pending" | "active" | "suspended";
  email_verified: boolean;
  two_factor_enabled: boolean;
  setup?: SetupState | null;
};

type AuthContextValue = {
  /** undefined while the initial session is still being restored. */
  session: { user: { id: string; email: string; name: string } } | null | undefined;
  /** null until loaded; a signed-in user always has a row (created by DB trigger). */
  profile: Profile | null;
  role: Role | null;
  profileError: string | null;
  /** Re-fetch /v1/me — used by the setup wizard to advance after each step. */
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const sessionState = authClient.useSession();
  const session = sessionState.isPending
    ? undefined
    : sessionState.data
      ? { user: sessionState.data.user }
      : null;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const userId = session?.user.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setProfileError(null);
      return;
    }
    try {
      const { profile: data } = await apiRequest<{ profile: Profile | null }>("/v1/me");
      if (!data) {
        setProfileError("profile missing");
        setProfile(null);
      } else {
        setProfile(data);
        setProfileError(null);
      }
    } catch (error) {
      setProfileError(apiError(error));
      setProfile(null);
    }
  }, [userId]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const value: AuthContextValue = {
    session,
    profile,
    role: profile?.role ?? null,
    profileError,
    refreshProfile,
    signOut: async () => {
      await authClient.signOut();
      setProfile(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
