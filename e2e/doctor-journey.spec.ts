import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";

const state = process.env.E2E_DOCTOR_STORAGE ?? ".auth/doctor.json";
const apiURL = process.env.E2E_API_URL ?? "https://api-uat.veraehealth.com";
test.use({ storageState: state });
test.skip(!existsSync(state), `Create ${state} from an MFA-enrolled synthetic doctor session`);

test("selected case and workflow view restore on refresh and browser history", async ({ page }) => {
  await page.goto("/member");
  await expect(page.getByRole("heading", { name: /Your cases/i })).toBeVisible();
  const firstCase = page.locator(".doc-case").first();
  test.skip(await firstCase.count() === 0, "The doctor fixture has no assigned case");
  await firstCase.click();
  await expect(page).toHaveURL(/\/member\/doctor\/cases\/[^?]+/);
  const caseURL = page.url();
  await page.reload();
  await expect(page.getByText("Case brief")).toBeVisible();

  const panelAction = page.getByRole("button", { name: /Order blood panel|View\/edit panel/ });
  await panelAction.click();
  await expect(page).toHaveURL(/[?&]view=panel/);
  await page.goBack();
  await expect(page).toHaveURL(caseURL);
  await expect(page.getByText("Case brief")).toBeVisible();
});

test("a released care plan rejects in-place updates", async ({ page }) => {
  const cases = await page.request.get(`${apiURL}/v1/doctor/cases`);
  expect(cases.status()).toBe(200);
  const rows = (await cases.json()).data as Array<{ memberId: string }>;
  let released: { id: string; title: string } | null = null;
  for (const row of rows) {
    const response = await page.request.get(`${apiURL}/v1/doctor/care-plans/${row.memberId}`);
    if (!response.ok()) continue;
    const plan = (await response.json()).data as { id: string; title: string; status: string } | null;
    if (plan?.status === "released") {
      released = plan;
      break;
    }
  }
  test.skip(!released, "No released care plan exists in the approved fixtures");
  const response = await page.request.patch(`${apiURL}/v1/doctor/care-plans/${released!.id}`, {
    data: { title: released!.title },
  });
  expect(response.status()).toBe(409);
  await expect(response.json()).resolves.toMatchObject({ code: "RELEASED_IMMUTABLE" });
});
