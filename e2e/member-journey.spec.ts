import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";

const state = process.env.E2E_MEMBER_STORAGE ?? ".auth/member.json";
test.use({ storageState: state });
test.skip(!existsSync(state), `Create ${state} from an approved synthetic member session`);

test("member profile and journey-aware results survive refresh", async ({ page }) => {
  await page.goto("/member");
  await expect(page.getByRole("navigation", { name: "Portal" })).toBeVisible();

  await page.getByRole("button", { name: "Profile" }).click();
  await expect(page.getByRole("main")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Profile" })).toBeVisible();

  await page.getByRole("button", { name: "Results" }).click();
  await expect(page.getByRole("heading", { name: /results|biomarker/i })).toBeVisible();
  const empty = page.getByRole("heading", { name: "No results yet" });
  if (await empty.isVisible().catch(() => false)) {
    await expect(page.getByText(/markers measured/)).toHaveCount(0);
  } else {
    await expect(page.getByText(/of \d+ markers measured/)).toBeVisible();
  }
});

test("member portal has no body overflow at the configured viewport", async ({ page }) => {
  await page.goto("/member");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
