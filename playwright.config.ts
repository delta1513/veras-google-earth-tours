import { defineConfig } from "@playwright/test";

const touch = { hasTouch: true, isMobile: false, trace: "off" as const };

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "off",
    // Fallback if the default browser cache lacks the matching Chromium:
    // launchOptions: { executablePath: "/opt/pw-browsers/chromium" },
  },
  // Serves the already-built out/ folder. `npm run test:e2e` builds first.
  webServer: {
    command: "node e2e/serve.mjs",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "ipad-landscape",
      testMatch: "app.spec.ts",
      use: { browserName: "chromium", viewport: { width: 1180, height: 820 }, ...touch },
    },
    {
      name: "ipad-portrait",
      testMatch: "app.spec.ts",
      use: { browserName: "chromium", viewport: { width: 820, height: 1180 }, ...touch },
    },
    // Data checks need no browser, so they run once.
    { name: "data", testMatch: "data.spec.ts" },
  ],
});
