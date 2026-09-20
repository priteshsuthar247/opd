import { test, expect } from "@playwright/test";

// Role-matrix gate: every spec §8 boundary must reject the wrong role.
// Unauthenticated users bounce to /login via middleware; authenticated
// users with the wrong role bounce to / via layout guards.
test.describe("@auth role matrix", () => {
  test("unauthenticated /admin redirects to /login", async ({ page }) => {
    await page.goto("/admin/doctors");
    await expect(page).toHaveURL(/login/);
  });

  test("unauthenticated /doctor redirects to /login", async ({ page }) => {
    await page.goto("/doctor/queue");
    await expect(page).toHaveURL(/login/);
  });

  test("receptionist cannot open /admin (redirects home)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/receptionist.json",
    });
    const page = await context.newPage();
    await page.goto("/admin/doctors");
    await expect(page).not.toHaveURL(/admin\/doctors/);
    await context.close();
  });

  test("doctor cannot open /reception (redirects home)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/doctor.json",
    });
    const page = await context.newPage();
    await page.goto("/reception/patients");
    await expect(page).not.toHaveURL(/reception\/patients/);
    await context.close();
  });

  test("admin can open /admin/doctors", async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/admin.json",
    });
    const page = await context.newPage();
    await page.goto("/admin/doctors");
    await expect(
      page.getByRole("heading", { name: "Doctors" }).first()
    ).toBeVisible();
    await context.close();
  });
});
