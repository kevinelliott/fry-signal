import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3027",
    trace: "on-first-retry",
  },
  webServer: {
    command: process.env.FRY_SIGNAL_E2E_PRODUCTION
      ? "pnpm exec next start --hostname 127.0.0.1 --port 3027"
      : "pnpm exec next dev --hostname 127.0.0.1 --port 3027",
    url: "http://127.0.0.1:3027",
    reuseExistingServer: false,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 960 } } },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
