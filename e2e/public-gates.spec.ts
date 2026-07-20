import { expect, test } from "@playwright/test";

const apiURL = process.env.E2E_API_URL ?? "https://api-uat.veraehealth.com";

test("portal sends the public launch security headers", async ({ page }) => {
  const response = await page.goto("/member");
  expect(response).not.toBeNull();
  const headers = response!.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBeTruthy();
  expect(headers["permissions-policy"]).toBeTruthy();
  if (new URL(page.url()).protocol === "https:") {
    expect(headers["strict-transport-security"]).toContain("max-age=");
  }
});

test("login exposes the shared password limits and has no page overflow", async ({ page }) => {
  await page.goto("/member");
  const password = page.getByLabel("Password");
  await expect(password).toHaveAttribute("minlength", "10");
  await expect(password).toHaveAttribute("maxlength", "200");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("staging exposes its generated API contract", async ({ request }) => {
  test.skip(!apiURL.includes("uat"), "API documentation must remain hidden outside staging");
  const [docs, spec] = await Promise.all([
    request.get(`${apiURL}/docs`),
    request.get(`${apiURL}/openapi.json`),
  ]);
  expect(docs.status()).toBe(200);
  expect(spec.status()).toBe(200);
  expect(spec.headers()["content-type"]).toContain("application/json");
  const contract = await spec.json();
  expect(contract.paths["/v1/admin/reports/{reportId}/corrections"]).toBeTruthy();
  expect(contract.paths["/v1/doctor/care-plans/{planId}/versions"]).toBeTruthy();
});
