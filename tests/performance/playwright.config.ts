import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.test.ts",
  timeout: 120 * 1000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ["html", { outputFolder: "../../playwright-report/performance" }],
    ["json", { outputFile: "../../test-results/performance-results.json" }],
    ["list"],
  ],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 720 },
    actionTimeout: 30 * 1000,
    navigationTimeout: 60 * 1000,
    extraHTTPHeaders: {
      "Accept": "application/json",
    },
  },
  projects: [
    {
      name: "api-performance",
      testMatch: "api-performance.test.ts",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "web-vitals",
      testMatch: "web-vitals.test.ts",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
