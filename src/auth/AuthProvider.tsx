import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiError, apiRequest } from "../lib/apiClient";
import { authClient } from "./authClient";

export type Role = "member" | "doctor" | "admin";

export type Profile = {
  id: string;
  role: Role;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  account_status: "pending" | "active" | "suspended";
  email_verified: boolean;
  two_factor_enabled: boolean;
};

type AuthContextValue = {
  /** undefined while the initial session is still being restored. */
  session: { user: { id: string; email: string; name: string } } | null | undefined;
  /** null until loaded; a signed-in user always has a row (created by DB trigger). */
  profile: Profile | null;
  role: Role | null;
  profileError: string | null;
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

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setProfileError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { profile: data } = await apiRequest<{ profile: Profile | null }>("/v1/me");
        if (cancelled) return;
        if (!data) {
          setProfileError("profile missing");
          setProfile(null);
        } else {
          setProfile(data);
          setProfileError(null);
        }
      } catch (error) {
        if (cancelled) return;
        setProfileError(apiError(error));
        setProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const value: AuthContextValue = {
    session,
    profile,
    role: profile?.role ?? null,
    profileError,
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
