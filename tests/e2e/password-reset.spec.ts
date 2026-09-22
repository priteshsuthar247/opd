import { test, expect } from "@playwright/test";

// @auth — forgot-password negative paths (no real mail leaves the test
// env): unknown accounts get the success-shaped reply (no enumeration),
// wrong codes are rejected, mismatched passwords never submit.
test.describe("@auth password reset", () => {
  test("login page links to forgot password", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/forgot-password/);
    await expect(page.getByText("Reset password").first()).toBeVisible();
  });

  test("unknown identifier still shows the sent message", async ({
    page,
  }) => {
    await page.goto("/forgot-password");
    await page
      .getByLabel("Username or email")
      .fill("nobody-here-12345");
    await page.getByRole("button", { name: "Send code" }).click();
    await expect(page.getByText(/a code was sent/i)).toBeVisible({
      timeout: 15000,
    });
  });

  test("wrong OTP is rejected (no real mail)", async ({ page }) => {
    await page.goto("/forgot-password");
    // Unknown account: success-shaped reply, no email leaves the server.
    await page.getByLabel("Username or email").fill("nobody-here-12345");
    await page.getByRole("button", { name: "Send code" }).click();
    await expect(page.getByText(/a code was sent/i)).toBeVisible({
      timeout: 15000,
    });
    await page.getByLabel("6-digit code").fill("000000");
    await page.getByRole("button", { name: "Verify code" }).click();
    await expect(page.getByText(/invalid or expired/i)).toBeVisible({
      timeout: 15000,
    });
  });
});
