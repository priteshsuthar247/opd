import { test, expect } from "@playwright/test";

// @smoke — a seeded invoice downloads as a real PDF via the
// pdfcn/Takumi API route.
test.describe("@smoke invoice PDF", () => {
  test.use({ storageState: "tests/.auth/receptionist.json" });

  test("download invoice PDF", async ({ page }) => {
    // Seed appointment 25: finalized visit with a paid invoice.
    await page.goto("/reception/invoices/25");
    await expect(
      page.getByRole("button", { name: "Download PDF" })
    ).toBeVisible({ timeout: 15000 });

    const downloadPromise = page.waitForEvent("download", {
      timeout: 30000,
    });
    await page.getByRole("button", { name: "Download PDF" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    const path = await download.path();
    expect(path).toBeTruthy();
  });
});
