// The portal is built from the separate member.html Vite entry, served publicly
// at the clean /member URL. OAuth/callback redirects
// must land there: the landing bundle has no portal auth client, so a callback
// returned to "/" would never be exchanged and the user would appear logged out.
export function portalUrl(): string {
  return window.location.hostname === "app.veraehealth.com"
    ? window.location.origin
    : `${window.location.origin}/member`;
}
