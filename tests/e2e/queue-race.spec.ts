import { test, expect, type Page } from "@playwright/test";

// @race — two receptionists book the same doctor + day at the same
// instant. The FOR UPDATE lock serializes them: both must succeed with
// DISTINCT tokens (no double-assign), or one must get the retry message.
// Cleanup cancels every token this spec creates.
async function fillBooking(page: Page, patient: string) {
  await page.goto("/reception/book");
  await page.getByRole("combobox", { name: "Patient" }).fill(patient);
  await page.getByRole("option", { name: new RegExp(patient) }).click();
  await page.getByRole("combobox", { name: "Doctor" }).click();
  await page.getByRole("option", { name: /Dr\. Aisha Verma/ }).click();
}

async function cancelWaitingRow(page: Page, patient: string) {
  // Narrow first: the seeded board spans pages.
  await page.getByPlaceholder("Search queue…").fill(patient);
  const row = page.getByRole("row", {
    name: new RegExp(`${patient}.*Waiting`),
  });
  if ((await row.count()) === 0) return;
  await row.first().getByRole("button", { name: "Open row menu" }).click();
  await page.getByRole("menuitem", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "Cancel appointment" }).click();
  await expect(page.getByText(/cancelled\./)).toBeVisible({
    timeout: 10000,
  });
}

test.describe("@race concurrent booking", () => {
  test("same doctor+day raced twice yields distinct tokens", async ({
    browser,
  }) => {
    const ctxA = await browser.newContext({
      storageState: "tests/.auth/receptionist.json",
    });
    const ctxB = await browser.newContext({
      storageState: "tests/.auth/receptionist.json",
    });
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await fillBooking(pageA, "Ramesh Patel");
    await fillBooking(pageB, "Karan Joshi");

    // Fire both submits in the same tick.
    await Promise.all([
      pageA.getByRole("button", { name: "Book token" }).click(),
      pageB.getByRole("button", { name: "Book token" }).click(),
    ]);

    // Each side either books (View queue card) or gets the retry toast.
    const tokens: string[] = [];
    for (const page of [pageA, pageB]) {
      const booked = page.getByText("View queue");
      const retried = page.getByText(/just taken/);
      await expect(booked.or(retried)).toBeVisible({ timeout: 15000 });
      if (await booked.isVisible()) {
        const heading = await page
          .getByText(/Token \d+ booked/)
          .first()
          .textContent();
        const m = heading?.match(/Token (\d+) booked/);
        if (m) tokens.push(m[1]);
      }
    }

    // No double-assign: every booked token is unique.
    expect(new Set(tokens).size).toBe(tokens.length);

    // Cleanup: cancel whatever this spec booked.
    await pageA.goto("/reception/queue");
    await cancelWaitingRow(pageA, "Ramesh Patel");
    await cancelWaitingRow(pageA, "Karan Joshi");

    await ctxA.close();
    await ctxB.close();
  });
});
