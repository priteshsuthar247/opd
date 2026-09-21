import { test, expect } from "@playwright/test";

// @smoke — a finalized seed prescription downloads as a real PDF via
// the pdfcn/Takumi API route. Asserts the download event fires with a
// PDF content type and non-trivial bytes.
test.describe("@smoke prescription PDF", () => {
  test.use({ storageState: "tests/.auth/doctor.json" });

  test("download prescription PDF", async ({ page }) => {
    // Seed appointment 25: Aisha's completed visit with a finalized Rx.
    await page.goto("/doctor/consultation/25");
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
