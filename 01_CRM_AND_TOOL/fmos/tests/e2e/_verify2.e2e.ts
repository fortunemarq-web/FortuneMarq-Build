/**
 * Focused capture of the remaining main-nav screens (verification only).
 * Run: SHOT_DIR=__verify__ npx playwright test --config=playwright.e2e.config.ts tests/e2e/_verify2.e2e.ts
 */
import { test } from "@playwright/test";
import { loginAdmin } from "./fixtures/auth";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(__dirname, process.env.SHOT_DIR || "__verify__");
mkdirSync(OUT, { recursive: true });

const SCREENS = [
  { name: "30-settings", path: "/admin/settings" },
  { name: "31-audit-log", path: "/admin/audit-log" },
  { name: "32-finance-gst", path: "/admin/finance/gst" },
  { name: "33-finance-pnl", path: "/admin/finance/pnl" },
  { name: "34-build-tracker", path: "/admin/build-tracker" },
  { name: "35-niche-kits", path: "/admin/niche-kits" },
  { name: "36-growth-gmb", path: "/admin/growth/gmb" },
  { name: "37-work-hours", path: "/admin/work-hours" },
  { name: "38-agreements", path: "/admin/agreements" }, // FK now patched on staging
];

test("capture remaining screens", async ({ page }) => {
  test.skip(!process.env.SHOT_DIR, "screenshot capture only — set SHOT_DIR to run");
  test.setTimeout(600_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAdmin(page);

  for (const s of SCREENS) {
    try {
      await page.goto(s.path, { waitUntil: "domcontentloaded", timeout: 120_000 });
      await page.waitForLoadState("networkidle", { timeout: 6_000 }).catch(() => {});
      await page.waitForTimeout(1200);
      await page.screenshot({ path: resolve(OUT, `${s.name}.png`), fullPage: true });
      console.log(`captured ${s.name} (${s.path})`);
    } catch (e) {
      console.log(`FAILED ${s.name} (${s.path}): ${(e as Error).message}`);
    }
  }
});
