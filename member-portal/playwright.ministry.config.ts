import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
if (existsSync(".env.ministry-test")) process.loadEnvFile(".env.ministry-test");
else if (existsSync(".env.local")) process.loadEnvFile(".env.local");
export default defineConfig({
  testDir: "./e2e",
  testMatch: "ministry.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 240000,
  expect: { timeout: 20000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3017",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3017",
    url: "http://127.0.0.1:3017/school-of-ministry",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
