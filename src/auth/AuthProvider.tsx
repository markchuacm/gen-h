import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

export type Role = "member" | "doctor" | "admin";

export type Profile = {
  id: string;
  role: Role;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type AuthContextValue = {
  /** undefined while the initial session is still being restored. */
  session: Session | null | undefined;
  /** null until loaded; a signed-in user always has a row (created by DB trigger). */
  profile: Profile | null;
  role: Role | null;
  profileError: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    // Note: keep this callback synchronous — awaiting supabase calls inside it
    // deadlocks the auth client. Profile loading happens in the effect below.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setProfileError(null);
      return;
    }
    let cancelled = false;
    const fetchProfile = () =>
      supabase
        .from("profiles")
        .select("id, role, email, full_name, avatar_url")
        .eq("id", userId)
        .maybeSingle<Profile>();

    (async () => {
      let { data, error } = await fetchProfile();
      if (!error && !data) {
        // Auth user without a profiles row (e.g. the row was removed via the
        // dashboard). Recreate it server-side and refetch.
        const { error: healError } = await supabase.rpc("ensure_profile");
        if (healError) error = healError;
        else ({ data, error } = await fetchProfile());
      }
      if (cancelled) return;
      if (error || !data) {
        setProfileError(error?.message ?? "profile missing");
        setProfile(null);
      } else {
        setProfile(data);
        setProfileError(null);
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
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
