import { describe, expect, it } from "vitest";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, passwordSchema } from "@verae/contracts";
import { ZodError } from "zod";

describe("shared password policy", () => {
  it("rejects passwords below the shared minimum", () => {
    const parsed = passwordSchema.safeParse("x".repeat(PASSWORD_MIN_LENGTH - 1));
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error).toBeInstanceOf(ZodError);
  });

  it("accepts both limits and rejects values above the maximum", () => {
    expect(passwordSchema.safeParse("x".repeat(PASSWORD_MIN_LENGTH)).success).toBe(true);
    expect(passwordSchema.safeParse("x".repeat(PASSWORD_MAX_LENGTH)).success).toBe(true);
    expect(passwordSchema.safeParse("x".repeat(PASSWORD_MAX_LENGTH + 1)).success).toBe(false);
  });
});
