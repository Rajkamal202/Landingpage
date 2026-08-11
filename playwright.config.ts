import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env["E2E_PORT"] ?? 3210);
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * The QA harness for SPEC §11 and §13.
 *
 * Runs against a production build rather than `next dev`: dev ships an error
 * overlay and unminified React that both distort accessibility trees and
 * timings, so auditing dev would measure the wrong application.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: 0,
  workers: process.env["CI"] ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
  ],

  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env["CI"],
    timeout: 240_000,
    env: { NEXT_PUBLIC_DEV_ROUTES: "1" },
  },
});
