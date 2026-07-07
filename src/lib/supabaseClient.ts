import { createClient } from "@supabase/supabase-js";

// Frontend-safe values only. The service role key must never appear anywhere
// in this repo — RLS is the security boundary.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !publishableKey) {
  throw new Error(
    "Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env",
  );
}

// Only import this module from portal entries (member.html, later the doctor
// entry) — never from the landing bundle, which has no authenticated surface.
export const supabase = createClient(url, publishableKey);
