// Better Auth sends failed Google round-trips back to errorCallbackURL with
// ?error=<code> appended. Read the code once and scrub it from the address bar
// so a refresh doesn't re-show a stale error.
export function readOAuthCallbackError(): string | null {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("error");
  if (!code) return null;
  url.searchParams.delete("error");
  window.history.replaceState(null, "", url);
  return code;
}
