import { test as setup, expect, type Page } from "@playwright/test";
import path from "path";

// One storage state per role, reused by every spec. Runs once before the
// suite (see playwright.config.ts `setup` project).
const authFile = (role: string) =>
  path.resolve(__dirname, `../.auth/${role}.json`);

async function loginAs(page: Page, identifier: string, password?: string) {
  await page.goto("/login");
  await page.getByLabel("Username or email").fill(identifier);
  await page
    .getByRole("textbox", { name: "Password" })
    .fill(password ?? "password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/login/, { timeout: 15000 });
}

setup("authenticate as admin", async ({ page }) => {
  // Dev-DB admin (the seeded admin@ was replaced by a personal account
  // on this database; fresh seeds use admin@opdclinic.com instead).
  // Password comes from E2E_ADMIN_PASSWORD so personal credentials are
  // never committed; defaults to the demo password.
  await loginAs(
    page,
    "pritesh.suthar247@gmail.com",
    process.env.E2E_ADMIN_PASSWORD
  );
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
