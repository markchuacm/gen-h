import { generateRandomString } from "better-auth/crypto";

// How long an admin-issued temporary password stays valid before the member must
// ask for a fresh one.
export const INVITE_TTL_DAYS = 7;

// 14 chars across three alphabets — comfortably above emailAndPassword.minPasswordLength (10)
// and enough entropy for a short-lived, single-use credential.
export function generateTempPassword(): string {
  return generateRandomString(14, "a-z", "A-Z", "0-9");
}

export function inviteExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

type TimestampLike = Date | string | null | undefined;

export type InviteState = {
  role: string;
  setupCompletedAt: TimestampLike;
  passwordSetAt: TimestampLike;
  tempPasswordExpiresAt: TimestampLike;
};

// A member is still on their temporary password until they either finish setup or
// set their own password. Google-only members clear password_set_at but finish
// setup, so setup_completed_at is the backstop.
export function isStillOnTempPassword(
  state: Pick<InviteState, "role" | "setupCompletedAt" | "passwordSetAt">,
): boolean {
  return state.role === "member" && !state.setupCompletedAt && !state.passwordSetAt;
}

// The temp password has lapsed: block sign-in and prompt the member to request a
// new invite. Only applies while still on the temp password.
export function isInviteExpired(state: InviteState, now: Date = new Date()): boolean {
  if (!isStillOnTempPassword(state)) return false;
  if (!state.tempPasswordExpiresAt) return false;
  return new Date(state.tempPasswordExpiresAt).getTime() < now.getTime();
}
