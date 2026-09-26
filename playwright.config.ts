import { defineConfig, devices } from "@playwright/test";

/**
 * The dev server runs against a Supabase URL that does not exist. Every request
 * to it is intercepted in-browser by the fixture in `e2e/fixtures/supabase.ts`,
 * so no test can accidentally reach a real backend — if interception were ever
 * to break, the request fails rather than hitting production.
 */
const PORT = 5174;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Each test gets its own dataset and its own page, so nothing is shared and
  // there is no reason to serialise on CI — the runner has more than one core.
  workers: process.env.CI ? 2 : undefined,
  // The HTML report is what the CI job uploads as an artifact, so it has to be
  // produced there too; `list` keeps the log readable while it runs.
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: `pnpm vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_SUPABASE_URL: "https://test-project.supabase.co",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
    },
  },
});
