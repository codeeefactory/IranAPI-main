import { defineConfig, devices } from "@playwright/test";


const frontendPort = 4173;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${frontendPort}`;
const hostResolverRules = process.env.PLAYWRIGHT_HOST_RESOLVER_RULES;


export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  workers: 1,
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    launchOptions: hostResolverRules ? { args: [`--host-resolver-rules=${hostResolverRules}`] } : undefined,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
