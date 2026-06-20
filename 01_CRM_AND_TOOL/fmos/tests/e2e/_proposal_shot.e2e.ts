/**
 * Screenshot the redesigned proposal document (verification only).
 * Run: SHOT_DIR=__v3__ npx playwright test --config=playwright.e2e.config.ts tests/e2e/_proposal_shot.e2e.ts
 */
import { test } from "@playwright/test";
import { loginAdmin } from "./fixtures/auth";
import { db } from "./fixtures/db";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(__dirname, process.env.SHOT_DIR || "__v3__");
mkdirSync(OUT, { recursive: true });
const LEAD_PHONE = "+918904192656";

test("capture proposal document", async ({ page }) => {
  test.skip(!process.env.SHOT_DIR, "screenshot capture only");
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 1280, height: 1000 });

  const { data: lead } = await db.from("leads").select("id").eq("phone", LEAD_PHONE).single();
  if (!lead) { console.log("no seeded lead"); return; }
  await db.from("proposals").delete().eq("lead_id", lead.id);

  await loginAdmin(page);
  await page.goto(`/admin/leads/${lead.id}/proposal/new`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  // Select two services for a fuller document
  for (const re of [/^Website/, /^SEO/]) {
    const card = page.locator("div").filter({ hasText: re }).first();
    await card.getByRole("button").first().click().catch(() => {});
  }
  const fees = page.locator('input[type="number"]');
  await fees.nth(0).fill("25000").catch(() => {});
  await fees.nth(1).fill("12000").catch(() => {});

  await page.getByRole("button", { name: /Preview Proposal/i }).click();
  await page.waitForTimeout(1500);

  const h = await page.evaluate(() => document.querySelector("main")?.scrollHeight ?? 0);
  console.log("main scrollHeight", h);
  const offsets = [0, 850, 1700, 2550, 3400, 4250];
  for (let i = 0; i < offsets.length; i++) {
    await page.evaluate((y) => document.querySelector("main")?.scrollTo(0, y), offsets[i]);
    await page.waitForTimeout(350);
    await page.screenshot({ path: resolve(OUT, `40-proposal-${i}.png`) });
  }
  console.log("captured 40-proposal segments");

  await db.from("proposals").delete().eq("lead_id", lead.id);
});
