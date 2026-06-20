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
  { name: "10-agreements", path: "/admin/agreements" },
  { name: "11-team", path: "/admin/team" },
  { name: "12-team-sops", path: "/admin/team/sops" },
  { name: "13-team-scorecards", path: "/admin/team/scorecards" },
  { name: "14-strategy", path: "/admin/strategy" },
  { name: "15-strategy-review", path: "/admin/strategy/review" },
  { name: "16-growth", path: "/admin/growth" },
  { name: "17-growth-seo", path: "/admin/growth/seo" },
  { name: "18-growth-gmb", path: "/admin/growth/gmb" },
  { name: "19-tasks", path: "/tasks" },
  { name: "20-projects", path: "/projects" },
  { name: "21-inbox", path: "/admin/inbox" },
  { name: "22-finance-invoices", path: "/admin/finance/invoices" },
  { name: "23-finance-expenses", path: "/admin/finance/expenses" },
];

test("capture UI screenshots", async ({ page }) => {
  test.setTimeout(900_000);
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

  // Client detail page (tabs) — click first client row
  try {
    await page.goto("/admin/clients", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const firstClient = page.locator('a[href^="/admin/clients/"]').first();
    if (await firstClient.count()) {
      await firstClient.click();
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await page.screenshot({ path: resolve(OUT, "24-client-profile.png"), fullPage: true });
      console.log("captured 24-client-profile");
    } else { console.log("SKIP 24-client-profile: no client rows"); }
  } catch (e) { console.log(`FAILED 24-client-profile: ${(e as Error).message}`); }

  // Add Client modal — verify form primitives (Input/Label/Select/Button)
  try {
    await page.goto("/admin/clients", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const addBtn = page.locator('button:has-text("Add Client"), a:has-text("Add Client")').first();
    if (await addBtn.count()) {
      await addBtn.click();
      await page.waitForTimeout(900);
      await page.screenshot({ path: resolve(OUT, "25-add-client-modal.png"), fullPage: true });
      console.log("captured 25-add-client-modal");
    } else { console.log("SKIP 25-add-client-modal: no add button"); }
  } catch (e) { console.log(`FAILED 25-add-client-modal: ${(e as Error).message}`); }
});
