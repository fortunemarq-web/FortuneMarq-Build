/**
 * Playwright config for the FULL E2E suite (verify-the-row + route-health).
 * Separate from playwright.config.ts (the legacy page-loads smoke suite).
 *
 * Loads .env.staging and injects it into BOTH the Playwright worker process
 * (so the DB fixture talks to staging) AND the `next dev` server it starts
 * (so the app itself talks to staging). It will not start without .env.staging.
 */
import { defineConfig, devices } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// ── tiny .env loader (no extra dependency) ──
const ENV_PATH = resolve(__dirname, ".env.staging");
if (!existsSync(ENV_PATH)) {
  throw new Error(
    "[e2e] .env.staging not found. Copy .env.staging.example → .env.staging and " +
      "fill in your STAGING Supabase values. See E2E_STAGING_SETUP.md."
  );
}
const stagingEnv: Record<string, string> = {};
for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  const val = m[2].replace(/^["']|["']$/g, "");
  stagingEnv[m[1]] = val;
  process.env[m[1]] = val; // make available to specs (db.ts / auth.ts)
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /.*\.e2e\.ts$/,
  fullyParallel: false, // verify-the-row specs touch shared seed data; keep ordered
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: stagingEnv, // next dev connects to STAGING, not prod
  },
});
