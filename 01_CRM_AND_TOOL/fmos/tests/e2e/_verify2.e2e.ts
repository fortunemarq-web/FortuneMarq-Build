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
  { name: "10-agreements", path: "/admin/agreements" }, // re-shoot after FK fix
  { name: "14-strategy", path: "/admin/strategy" },
  { name: "16-growth", path: "/admin/growth" },
  { name: "19-tasks", path: "/tasks" },
  { name: "20-projects", path: "/projects" },
  { name: "21-inbox", path: "/admin/inbox" },
];

test("capture remaining screens", async ({ page }) => {
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
