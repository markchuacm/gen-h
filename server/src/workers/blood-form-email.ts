import { env } from "../config.js";
import { withWorker } from "../db/pools.js";
import { sendAccountEmail } from "../services/email.js";

type BloodFormRow = {
  member_email: string;
  member_name: string | null;
  form_released_at: Date | null;
};

/** Mirrors the web client's portalUrl(): production serves the member portal at
 *  the origin root; every other environment serves it from /member. */
function portalUrl(): string {
  const origin = new URL(env.APP_ORIGIN);
  return origin.hostname === "app.veraehealth.com"
    ? origin.origin
    : new URL("/member", origin).toString();
}

function firstName(name: string | null): string {
  return name?.trim().split(/\s+/)[0] ?? "there";
}

type BloodFormEmail = { subject: string; text: string };

/**
 * Build the member's "form ready" email, or null (a silent no-op) when the row
 * is missing or the form has not actually been released. Pure so the staleness
 * rule is unit-tested. The email never attaches the PDF — it links to the
 * dashboard, where the member downloads the form themselves.
 */
export function planBloodFormEmail(row: BloodFormRow | null): BloodFormEmail & { to: string } | null {
  if (!row || row.form_released_at == null) return null;
  const greeting = `Hi ${firstName(row.member_name)},`;
  const link = portalUrl();
  return {
    to: row.member_email,
    subject: "Your blood test request form is ready",
    text: `${greeting}\n\nYour blood test request form is ready. Sign in to your Verae dashboard to download it, then bring it to Innoquest for your blood draw.\n\n${link}\n\nIf you have questions about your appointment, just reply to this email.\n\n— Verae Health`,
  };
}

export async function sendBloodFormEmail(memberId: string): Promise<void> {
  const row = await withWorker(memberId, async (client) => {
    const result = await client.query<BloodFormRow>(
      `select p.email as member_email, p.full_name as member_name, o.form_released_at
       from app.profiles p
       join app.lab_orders o on o.member_id = p.id
       where p.id = $1 and o.status = 'ordered'
       order by o.created_at desc limit 1`,
      [memberId],
    );
    return result.rows[0] ?? null;
  });

  const plan = planBloodFormEmail(row);
  if (!plan) return;
  await sendAccountEmail(plan);
}
