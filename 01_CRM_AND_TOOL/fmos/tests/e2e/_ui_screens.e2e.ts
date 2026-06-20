/**
 * UI audit screenshots (NOT a test — captures "before" state for the design pass).
 * Logs in as the seeded staging admin and screenshots the priority screens.
 * Output: tests/e2e/__screens__/<name>.png
 *
 * Run:  npx playwright test --config=playwright.e2e.config.ts tests/e2e/_ui_screens.e2e.ts
 */
import { test } from "@playwright/test";
import { loginAdmin } from "./fixtures/auth";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(__dirname, process.env.SHOT_DIR || "__screens__");
mkdirSync(OUT, { recursive: true });

const SCREENS: { name: string; path: string }[] = [
  { name: "01-login", path: "/login" }, // captured before auth below
  { name: "02-admin-dashboard", path: "/admin" },
  { name: "03-sales-cockpit", path: "/sales" },
  { name: "04-outreach", path: "/admin/outreach" },
  { name: "05-clients", path: "/admin/clients" },
  { name: "06-finance", path: "/admin/finance" },
  { name: "07-proposals", path: "/admin/proposals" },
  { name: "08-meetings", path: "/admin/meetings" },
  { name: "09-marketing", path: "/admin/marketing" },
];

test("capture UI screenshots", async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Login screen first (unauthenticated)
  await page.goto("/login");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: resolve(OUT, "01-login.png"), fullPage: true });

  await loginAdmin(page);

  for (const s of SCREENS.slice(1)) {
    try {
      await page.goto(s.path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(1500); // let charts/skeletons settle
      await page.screenshot({ path: resolve(OUT, `${s.name}.png`), fullPage: true });
      console.log(`captured ${s.name} (${s.path})`);
    } catch (e) {
      console.log(`FAILED ${s.name} (${s.path}): ${(e as Error).message}`);
    }
  }
});
