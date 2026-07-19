import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";

const state = process.env.E2E_ADMIN_STORAGE ?? ".auth/admin.json";
const apiURL = process.env.E2E_API_URL ?? "https://api-uat.veraehealth.com";
test.use({ storageState: state });
test.skip(!existsSync(state), `Create ${state} from an MFA-enrolled synthetic administrator session`);

test("admin navigation, five-click unlock, and narrow layout remain usable", async ({ page }) => {
  await page.goto("/member");
  await expect(page.getByRole("heading", { name: "Member cases" })).toBeVisible();
  const account = page.getByRole("button", { name: /Account menu for/ });
  await account.click();
  const settings = page.getByRole("menuitem", { name: "Settings" });
  for (let click = 1; click <= 4; click += 1) {
    await settings.click();
    await expect(page.getByRole("menuitem", { name: /Developer mode/ })).toHaveCount(0);
  }
  await settings.click();
  await expect(page.getByRole("menuitem", { name: /Developer mode/ })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("released lab reports reject update and delete without changing data", async ({ page }) => {
  const casesResponse = await page.request.get(`${apiURL}/v1/admin/cases`);
  expect(casesResponse.status()).toBe(200);
  const cases = (await casesResponse.json()).data as Array<{ memberId: string }>;
  let released: { id: string; lab_name: string | null } | null = null;
  for (const row of cases) {
    const reportsResponse = await page.request.get(`${apiURL}/v1/admin/members/${row.memberId}/reports`);
    if (!reportsResponse.ok()) continue;
    const reports = (await reportsResponse.json()).data as Array<{ id: string; lab_name: string | null; status: string }>;
    released = reports.find((report) => report.status === "released") ?? null;
    if (released) break;
  }
  test.skip(!released, "No released lab report exists in the approved fixtures");

  const update = await page.request.patch(`${apiURL}/v1/admin/reports/${released!.id}`, {
    data: { lab_name: released!.lab_name },
  });
  expect(update.status()).toBe(409);
  await expect(update.json()).resolves.toMatchObject({ code: "RELEASED_IMMUTABLE" });

  const remove = await page.request.delete(`${apiURL}/v1/admin/reports/${released!.id}`);
  expect(remove.status()).toBe(409);
  await expect(remove.json()).resolves.toMatchObject({ code: "RELEASED_IMMUTABLE" });
});
