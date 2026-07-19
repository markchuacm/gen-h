import nodemailer from "nodemailer";
import { env } from "../config.js";

const transporter = env.SMTP_URL ? nodemailer.createTransport(env.SMTP_URL) : null;

type AccountEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendAccountEmail(message: AccountEmail): Promise<void> {
  if (!transporter) {
    if (env.NODE_ENV === "production") throw new Error("SMTP transport is not configured");
    // Deliberately do not log verification/reset URLs or tokens.
    console.info(JSON.stringify({ event: "email_suppressed", to: message.to, subject: message.subject }));
    return;
  }
  await transporter.sendMail({ from: env.EMAIL_FROM, ...message });
}
