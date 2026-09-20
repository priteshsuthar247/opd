import { defineConfig, devices } from "@playwright/test";

// E2E suite for the OPD clinic app. Runs against an already-running dev
// server with the seeded demo database — NEVER start `next dev` here, the
// user owns :3000. Tests that write (booking) clean up after themselves
// (cancel) so the dev DB stays pristine.
//
//   pnpm test:e2e            # full suite (chromium)
//   pnpm test:e2e -- --grep @smoke        # tagged subset
//   pnpm test:e2e -- --grep -@race        # skip the race spec
//
// Tags: @smoke (critical flows), @auth (role matrix), @race (concurrency),
// @flow (book → queue → cancel). CI: run after `pnpm db:seed`.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
});
