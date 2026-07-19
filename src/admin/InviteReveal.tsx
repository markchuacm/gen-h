import { useState } from "react";
import { portalUrl } from "../auth/portalUrl";

export function inviteMessage(opts: { email: string; tempPassword: string; fullName: string | null }): string {
  const first = (opts.fullName ?? "").trim().split(/\s+/)[0] || "there";
  return [
    `Hi ${first}, welcome to Verae Health!`,
    ``,
    `Your member portal is ready. Sign in at ${portalUrl()} with:`,
    `Email: ${opts.email}`,
    `Temporary password: ${opts.tempPassword}`,
    ``,
    `The temporary password expires in 7 days. On your first sign-in you'll choose`,
    `your own login, verify your email, and complete a short health profile.`,
    `— The Verae team`,
  ].join("\n");
}

/** One-time reveal of a temp password with copy helpers. Shown right after
    creating an invite or regenerating one — never persisted or re-fetchable. */
export default function InviteReveal({
  email,
  tempPassword,
  fullName,
}: {
  email: string;
  tempPassword: string;
  fullName: string | null;
}) {
  const [copied, setCopied] = useState<"pw" | "msg" | null>(null);

  const copy = async (text: string, which: "pw" | "msg") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 1500);
    } catch {
      // Clipboard blocked; the admin can still select the text manually.
    }
  };

  return (
    <div className="adm-invite-reveal">
      <p className="adm-muted">
        Share these with the member yourself (WhatsApp or email). This password is shown once — Verae does not
        email it.
      </p>
      <div className="adm-invite-code">
        <div>
          <span className="adm-invite-label">Email</span>
          <code>{email}</code>
        </div>
        <div>
          <span className="adm-invite-label">Temporary password</span>
          <code>{tempPassword}</code>
        </div>
      </div>
      <div className="adm-bio-actions">
        <button type="button" className="adm-btn-ghost" onClick={() => void copy(tempPassword, "pw")}>
          {copied === "pw" ? "Copied ✓" : "Copy password"}
        </button>
        <button
          type="button"
          className="adm-btn"
          onClick={() => void copy(inviteMessage({ email, tempPassword, fullName }), "msg")}
        >
          {copied === "msg" ? "Copied ✓" : "Copy invite message"}
        </button>
      </div>
    </div>
  );
}
