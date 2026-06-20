/**
 * VERIFY-THE-ROW — Sales cockpit: log a call outcome (NOT_INTERESTED).
 *
 * Drives the real /sales telecaller cockpit, logs a "Not Interested" outcome on
 * the seeded lead, then asserts the actual STAGING rows the cockpit's logOutcome()
 * writes: a fresh outreach_logs row (touch_type='call', outcome='NOT_INTERESTED')
 * and the lead moved to outreach_stage='not_interested'.
 *
 * Source of truth for the writes: components/sales/telecaller-cockpit.tsx logOutcome()
 * (client-side supabase writes — there is no server action for this flow).
 */
import { test, expect } from "@playwright/test";
import { loginTelecaller } from "./fixtures/auth";
import { db } from "./fixtures/db";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SEEDED_LEAD_PHONE = "+918904192656";
const TELECALLER_EMAIL = "e2e-caller@fmos.test";

test.describe("Sales — log a call outcome (verify the row)", () => {
  test("Not Interested writes outreach_logs + moves lead to not_interested", async ({ page }) => {
    const { data: lead } = await db
      .from("leads")
      .select("id")
      .eq("phone", SEEDED_LEAD_PHONE)
      .single();
    expect(lead, "seeded lead must exist — run scripts/seed-staging.mjs").toBeTruthy();
    const leadId = lead!.id as string;

    const { data: caller } = await db
      .from("profiles")
      .select("id")
      .eq("email", TELECALLER_EMAIL)
      .single();
    expect(caller, "seeded telecaller profile must exist").toBeTruthy();
    const callerId = caller!.id as string;

    // Precondition: put the lead in the Priority Queue & clear prior state.
    await db
      .from("leads")
      .update({
        outreach_stage: "touch1_pending",
        status: "new",
        last_outcome: null,
        first_contact_at: null,
        follow_up_date: null,
        no_answer_count: 0,
      })
      .eq("id", leadId);
    await db.from("outreach_logs").delete().eq("lead_id", leadId);

    // --- UI action ---
    await loginTelecaller(page);
    await page.goto(`${BASE_URL}/sales`);

    await page.getByPlaceholder("Search leads...").fill("E2E Test Lead");
    await expect(page.getByRole("heading", { name: "E2E Test Lead" })).toBeVisible();

    await page.getByRole("button", { name: "Log Call Outcome" }).click();

    const modal = page.locator("div.z-50").filter({ hasText: "Log Outcome" }).first();
    await expect(modal).toBeVisible();

    await modal.getByRole("button", { name: "Not Interested" }).click();
    await modal.locator("select").selectOption({ label: "No budget right now" });
    await modal.getByRole("button", { name: /Save & Next Lead|Saving/ }).click();

    // --- DB assertion: a fresh outreach_logs row landed (the real verification) ---
    await expect
      .poll(async () => {
        const { count } = await db
          .from("outreach_logs")
          .select("*", { count: "exact", head: true })
          .eq("lead_id", leadId)
          .eq("outcome", "NOT_INTERESTED")
          .eq("touch_type", "call");
        return count ?? 0;
      }, { timeout: 8_000 })
      .toBe(1);

    const { data: log } = await db
      .from("outreach_logs")
      .select("id, lead_id, actor_id, touch_type, outcome")
      .eq("lead_id", leadId)
      .eq("outcome", "NOT_INTERESTED")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    expect(log!.touch_type).toBe("call");
    expect(log!.outcome).toBe("NOT_INTERESTED");
    expect(log!.actor_id).toBe(callerId);

    // --- DB assertion: the lead moved stages ---
    await expect
      .poll(async () => {
        const { data } = await db.from("leads").select("outreach_stage").eq("id", leadId).single();
        return data?.outreach_stage ?? null;
      }, { timeout: 8_000 })
      .toBe("not_interested");

    const { data: updated } = await db
      .from("leads")
      .select("outreach_stage, status, last_outcome, last_activity_at")
      .eq("id", leadId)
      .single();
    expect(updated!.outreach_stage).toBe("not_interested");
    expect(updated!.last_outcome).toBe("NOT_INTERESTED");
    expect(updated!.last_activity_at).toBeTruthy();

    // --- cleanup (staging only) — restore the shared seed lead ---
    await db.from("outreach_logs").delete().eq("lead_id", leadId);
    await db
      .from("leads")
      .update({
        outreach_stage: "touch1_pending",
        status: "new",
        last_outcome: null,
        first_contact_at: null,
        last_activity_at: null,
        follow_up_date: null,
        no_answer_count: 0,
      })
      .eq("id", leadId);
  });
});
