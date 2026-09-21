import { test as setup, expect, type Page } from "@playwright/test";
import path from "path";

// One storage state per role, reused by every spec. Runs once before the
// suite (see playwright.config.ts `setup` project).
const authFile = (role: string) =>
  path.resolve(__dirname, `../.auth/${role}.json`);

async function loginAs(page: Page, identifier: string) {
  await page.goto("/login");
  await page.getByLabel("Username or email").fill(identifier);
  await page.getByRole("textbox", { name: "Password" }).fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/login/, { timeout: 15000 });
}

setup("authenticate as admin", async ({ page }) => {
  await loginAs(page, "admin@opdclinic.com");
  await page.context().storageState({ path: authFile("admin") });
});

setup("authenticate as receptionist", async ({ page }) => {
  await loginAs(page, "reception@opdclinic.com");
  await page.context().storageState({ path: authFile("receptionist") });
});

setup("authenticate as doctor", async ({ page }) => {
  // Doctors log in with their short handle, not the full email.
  await loginAs(page, "aisha.verma");
  await page.context().storageState({ path: authFile("doctor") });
});
