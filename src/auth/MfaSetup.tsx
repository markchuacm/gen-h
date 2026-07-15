import { useState } from "react";
import QRCode from "qrcode";
import { authClient } from "./authClient";

export default function MfaSetup() {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function begin() {
    setBusy(true);
    setError(null);
    const result = await authClient.twoFactor.enable({ password });
    if (result.error || !result.data) {
      setError(result.error?.message ?? "MFA setup failed.");
    } else {
      setQr(await QRCode.toDataURL(result.data.totpURI, { width: 240, margin: 1 }));
      setBackupCodes(result.data.backupCodes);
      setPassword("");
    }
    setBusy(false);
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: true });
    if (result.error) {
      setError(result.error.message ?? "That code was not accepted.");
      setBusy(false);
      return;
    }
    window.location.reload();
  }

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <span className="auth-brand">Verae</span>
        <h1 className="auth-title">Secure your staff account</h1>
        {!qr ? (
          <>
            <p className="auth-copy">Doctors and administrators must use an authenticator app. Confirm your password to begin.</p>
            <label className="auth-field">
              <span>Current password</span>
              <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="button" className="auth-submit" disabled={busy || password.length < 10} onClick={() => void begin()}>
              {busy ? "One moment…" : "Set up authenticator"}
            </button>
          </>
        ) : (
          <>
            <p className="auth-copy">Scan this code with your authenticator app, then enter the six-digit code.</p>
            <img className="auth-qr" src={qr} alt="Authenticator setup QR code" />
            <label className="auth-field">
              <span>Six-digit code</span>
              <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} />
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="button" className="auth-submit" disabled={busy || code.length !== 6} onClick={() => void confirm()}>
              {busy ? "Checking…" : "Confirm MFA"}
            </button>
            <details>
              <summary>Backup codes</summary>
              <p className="auth-copy">Store these offline. Each code can be used once.</p>
              <code className="auth-backup-codes">{backupCodes.join("\n")}</code>
            </details>
          </>
        )}
      </div>
    </main>
  );
}
