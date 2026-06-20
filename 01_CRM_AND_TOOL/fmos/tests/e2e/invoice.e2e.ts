/**
 * VERIFY-THE-ROW exemplar — the pattern the whole suite follows.
 *
 * It does NOT trust the success toast. It performs the real UI action, then
 * opens the STAGING database and asserts the exact row/column the button was
 * supposed to write. Copy this shape for every action in
 * FMOS_MANUAL_TESTING_GUIDE.md to turn a manual check into an automated one.
 *
 * NOTE: UI selectors below are best-effort from the code map. On the FIRST
 * staging run, if a locator misses, run `npm run test:e2e:ui` to open the
 * Playwright inspector and adjust the locator — the DB-assertion half is the
 * part that matters and is already correct.
 */
import { test, expect } from "@playwright/test";
import { loginAdmin } from "./fixtures/auth";
import { db } from "./fixtures/db";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

test.describe("Finance — create invoice (verify the row)", () => {
  test("Create Invoice writes invoices + invoice_line_items", async ({ page }) => {
    // Unique marker so we can find exactly the row this test created.
    const marker = `E2E-${Date.now()}`;

    await loginAdmin(page);
    await page.goto(`${BASE_URL}/admin/finance/invoices`);

    // --- UI action ---
    await page.getByRole("button", { name: /create invoice/i }).click();

    // Pick the seeded client. Target the <select> that actually contains the seeded
    // client option (avoids the page filters and the Revenue Type select) and choose
    // it by its visible business_name.
    const clientSelect = page
      .locator("select")
      .filter({ has: page.locator("option", { hasText: "E2E Test Client" }) })
      .first();
    await clientSelect.selectOption({ label: "E2E Test Client" });

    // First line item: description + amount.
    await page.getByPlaceholder(/description/i).first().fill(`E2E line item ${marker}`);
    await page.getByPlaceholder(/amount|0\.00|^0$/i).first().fill("10000");

    // Stash the marker in the notes field so we can query it back deterministically.
    // It's a <textarea> with placeholder "E.g. Bank details…" (no "note" text), so
    // target the textarea directly and fill unconditionally — the DB query needs it.
    await page.locator("textarea").first().fill(marker);

    // Submit. Scope to the modal's "Generate Invoice →" button — the page's own
    // "Create Invoice" trigger is still in the DOM, so a broad name match is ambiguous.
    await page.getByRole("button", { name: /generate invoice/i }).click();

    // --- DB assertion (the real verification) ---
    // Poll briefly for the row to land, then assert its computed amounts.
    await expect
      .poll(async () => {
        const { count } = await db
          .from("invoices")
          .select("*", { count: "exact", head: true })
          .ilike("notes", `%${marker}%`);
        return count ?? 0;
      }, { timeout: 8000 })
      .toBe(1);

    const { data: created } = await db
      .from("invoices")
      .select("id, subtotal, gst_amount, total_amount, status, revenue_type")
      .ilike("notes", `%${marker}%`)
      .single();

    expect(created).toBeTruthy();
    expect(Number(created!.subtotal)).toBe(10000);
    // GST is 18% in the create modal; total = subtotal + gst.
    expect(Number(created!.gst_amount)).toBeCloseTo(1800, 0);
    expect(Number(created!.total_amount)).toBeCloseTo(11800, 0);
    expect(created!.status).toBe("unpaid");

    // Line items written too.
    const { count: liCount } = await db
      .from("invoice_line_items")
      .select("*", { count: "exact", head: true })
      .eq("invoice_id", created!.id);
    expect(liCount).toBeGreaterThanOrEqual(1);

    // --- cleanup (staging only) ---
    await db.from("invoice_line_items").delete().eq("invoice_id", created!.id);
    await db.from("invoices").delete().eq("id", created!.id);
  });
});
