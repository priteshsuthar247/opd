import { test, expect } from "@playwright/test";

// @smoke @flow — reception books a token, sees it on the queue board,
// then cancels it so the seeded dev database stays pristine. The cancel
// at the end is the cleanup: every write this spec makes is reverted.
test.describe("@smoke booking flow", () => {
  test.use({ storageState: "tests/.auth/receptionist.json" });

  test("book token → appears on queue → cancel", async ({ page }) => {
    await page.goto("/reception/book");

    // Patient combobox (cmdk): type, arrow to the option, Enter to pick.
    await page.getByRole("combobox", { name: "Patient" }).fill("Ramesh");
    const option = page.getByRole("option", { name: /Ramesh Patel/ });
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();

    // Doctor select: open the Pick… trigger, choose Aisha Verma.
    await page.getByRole("combobox", { name: "Doctor" }).click();
    await page
      .getByRole("option", { name: /Dr\. Aisha Verma/ })
      .click();

    await page.getByRole("button", { name: "Book token" }).click();
    // Booked card replaces the form (View queue affordance proves success).
    await expect(page.getByText("View queue")).toBeVisible({ timeout: 10000 });

    // Queue board shows the new token for Ramesh Patel. The seeded
    // board spans pages, so narrow with the toolbar search first.
    await page.goto("/reception/queue");
    await page
      .getByPlaceholder("Search queue…")
      .fill("Ramesh Patel");
    const row = page.getByRole("row", { name: /Ramesh Patel.*Waiting/ });
    await expect(row.first()).toBeVisible({ timeout: 10000 });

    // Cancel via the row menu + confirm — the spec's own cleanup.
    await row.first().getByRole("button", { name: "Open row menu" }).click();
    await page.getByRole("menuitem", { name: "Cancel" }).click();
    await page.getByRole("button", { name: "Cancel appointment" }).click();
    await expect(page.getByText(/cancelled\./)).toBeVisible({
      timeout: 10000,
    });
  });
});
