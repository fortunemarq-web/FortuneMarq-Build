/**
 * VERIFY-THE-ROW — record an invoice payment.
 *
 * Creates an invoice through the real modal (so it lands in the list immediately),
 * then drives the Record-Payment prompt flow (amount -> method) and asserts the
 * DB row's paid_amount + status. Cleans up afterwards (staging only).
 */
import { test, expect } from "@playwright/test";
import { loginAdmin } from "./fixtures/auth";
import { db } from "./fixtures/db";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

test.describe("Finance — record payment (verify the row)", () => {
  // Previously flaky for two reasons, both fixed: (1) the invoices list could omit a
  // just-created invoice (fixed by making the invoices page force-dynamic + this spec
  // re-navigates to a fresh list before acting); (2) leftover invoices from failed runs
  // made the Record-Payment trigger ambiguous (fixed by the clean-slate below).
  test("Record Payment writes paid_amount + partially_paid status", async ({ page }) => {
    const marker = `E2E-PAY-${Date.now()}`;

    // Clean slate: remove any leftover E2E invoices so our created one is the only payable row.
    const { data: stale } = await db.from("invoices").select("id").ilike("notes", "E2E%");
    for (const s of stale || []) await db.from("invoice_line_items").delete().eq("invoice_id", s.id);
    if ((stale || []).length) await db.from("invoices").delete().ilike("notes", "E2E%");

    await loginAdmin(page);
    await page.goto(`${BASE_URL}/admin/finance/invoices`);

    // --- create an invoice via the real modal (subtotal 10000 -> total 11800) ---
    await page.getByRole("button", { name: /create invoice/i }).click();
    const clientSelect = page
      .locator("select")
      .filter({ has: page.locator("option", { hasText: "E2E Test Client" }) })
      .first();
    await clientSelect.selectOption({ label: "E2E Test Client" });
    await page.getByPlaceholder(/description/i).first().fill(`E2E pay item ${marker}`);
    await page.getByPlaceholder(/amount|0\.00|^0$/i).first().fill("10000");
    await page.locator("textarea").first().fill(marker); // notes — our lookup key
    await page.getByRole("button", { name: /generate invoice/i }).click();

    // Re-navigate to the (force-dynamic) invoices list so the just-created invoice is
    // server-rendered fresh — avoids a client-state timing race on the same page that
    // made this spec flaky when relying on the modal's optimistic state.
    await page.goto(`${BASE_URL}/admin/finance/invoices`);

    // --- record a partial payment against it ---
    // The created invoice is the only payable one, so its Record-Payment action is unique.
    await page.getByTitle(/record payment/i).first().click();

    // The prompt modal is the z-[100] overlay; scope to it so the page's own
    // "Record payment" trigger is never re-matched.
    const dialog = page.locator('div.z-\\[100\\]');
    await dialog.locator("input").fill("4000"); // amount (default is the full outstanding)
    await dialog.getByRole("button", { name: "Next" }).click();
    await dialog.getByRole("button", { name: "Record Payment" }).click(); // method defaults to UPI

    // --- DB assertion (the real verification) ---
    const fetchRow = async () => {
      const { data } = await db
        .from("invoices")
        .select("id, paid_amount, status")
        .ilike("notes", `%${marker}%`)
        .single();
      return data;
    };

    await expect.poll(async () => (await fetchRow())?.status, { timeout: 8000 }).toBe("partially_paid");
    const row = await fetchRow();
    expect(Number(row!.paid_amount)).toBe(4000);
    expect(row!.status).toBe("partially_paid");

    // --- cleanup (staging only) ---
    await db.from("invoice_line_items").delete().eq("invoice_id", row!.id);
    await db.from("invoices").delete().eq("id", row!.id);
  });
});
