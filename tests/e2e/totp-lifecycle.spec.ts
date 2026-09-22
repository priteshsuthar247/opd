import { test, expect, type Page } from "@playwright/test";
import { createHmac } from "node:crypto";

// @auth — full TOTP lifecycle on the spare doctor account (Rohan — no
// other spec uses it): enable via QR setup, sign in with a code, then
// disable to leave the account clean.
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function totpNow(secret: string): string {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of secret) {
    const idx = B32.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  const counter = Math.floor(Date.now() / 30000);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", Buffer.from(out)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(code % 1_000_000).padStart(6, "0");
}

async function loginAs(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Username or email").fill("rohan.mehta");
  await page.getByRole("textbox", { name: "Password" }).fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("@auth two-factor lifecycle", () => {
  test("enable, sign in with code, disable", async ({ page }) => {
    await loginAs(page);
    await expect(page).not.toHaveURL(/login/, { timeout: 15000 });

    await page.goto("/profile");
    await page.getByRole("button", { name: "Enable two-factor" }).click();
    await expect(page.getByText(/scan with your authenticator/i)).toBeVisible({
      timeout: 15000,
    });
    const manual = (await page
      .getByText(/Manual entry:/)
      .textContent()) as string;
    const secret = manual.replace(/.*Manual entry:\s*/, "").trim();

    await page.getByLabel("Authenticator code").fill(totpNow(secret));
    await page.getByRole("button", { name: "Confirm", exact: true }).click();
    await expect(page.getByText(/shown once/i)).toBeVisible({
      timeout: 15000,
    });

    // Fresh login now demands the second factor.
    await page.goto("/login");
    await page.getByLabel("Username or email").fill("rohan.mehta");
    await page.getByRole("textbox", { name: "Password" }).fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByLabel("Authenticator code")).toBeVisible({
      timeout: 15000,
    });
    await page.getByLabel("Authenticator code").fill(totpNow(secret));
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).not.toHaveURL(/login/, { timeout: 15000 });

    // Cleanup: disable again so other runs start clean.
    await page.goto("/profile");
    await page.getByLabel("Password (for the actions above)").fill("password123");
    await page.getByRole("button", { name: "Disable two-factor" }).click();
    await expect(page.getByRole("button", { name: "Enable two-factor" })).toBeVisible({
      timeout: 15000,
    });
  });
});
