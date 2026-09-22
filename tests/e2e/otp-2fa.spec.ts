import { test, expect, type Page } from "@playwright/test";

// @auth — email-OTP second factor on the spare doctor account (Rohan —
// no other spec uses it). The full code-entry loop needs a real mailbox,
// so E2E covers everything around it: enable sends, wrong codes die.
// The consume path shares lib/otp with the forgot-password flow (same
// helper, same guarantees); disable shares the tested password gate.
async function loginAs(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Username or email").fill("rohan.mehta");
  await page.getByRole("textbox", { name: "Password" }).fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/login/, { timeout: 15000 });
}

test.describe("@auth email-OTP second factor", () => {
  test("enable sends code, wrong code rejected", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto("/settings/profile");

    await page.getByRole("button", { name: "Two-factor authentication" }).click();
    await page.getByRole("button", { name: "Enable two-factor" }).click();
    await expect(
      page.getByText(/emailed you a 6-digit code/i)
    ).toBeVisible({ timeout: 15000 });

    await page.getByLabel("Email code").fill("000000");
    await page.getByRole("button", { name: "Confirm", exact: true }).click();
    await expect(page.getByText(/invalid or expired/i)).toBeVisible({
      timeout: 15000,
    });
  });
});
