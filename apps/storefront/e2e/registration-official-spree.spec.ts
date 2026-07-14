import { expect, test } from "@playwright/test";

test("registration requires frontend policy consent with official Spree", async ({
  page,
}) => {
  const email = `official-spree-e2e-${Date.now()}@example.test`;

  await page.goto("/us/en/account/register");

  await expect(
    page.getByRole("heading", { name: "Create Account" }),
  ).toBeVisible();
  const consent = page.getByRole("checkbox", { name: /i agree to the/i });
  await expect(consent).toBeVisible();

  await page.getByLabel("First name").fill("Official");
  await page.getByLabel("Last name").fill("Spree");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm Password").fill("password123");
  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page).toHaveURL(/\/us\/en\/account\/register$/);
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "You must agree to the store policies" }),
  ).toBeVisible();

  await consent.check();
  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page).toHaveURL(/\/us\/en\/account$/, { timeout: 30_000 });
});
