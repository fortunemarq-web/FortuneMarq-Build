/**
 * VERIFY-THE-ROW — proposal (DEAL-05) and agreement (DEAL-06).
 *
 * The proposal half is live + asserted. The agreement half is PARKED as test.fixme
 * for two reasons (re-enable when both are addressed):
 *   1. AGREEMENT BLOCKER: actions/send-agreement-wa.ts sends the 'agreement_sent'
 *      WhatsApp template; on stock .env.staging WHATSAPP_API_TOKEN is EMPTY, so the
 *      send fails and the UI shows toast.error. Needs real WHATSAPP_API_TOKEN +
 *      WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_TEST_RECIPIENTS on staging.
 *   2. LIST FRESHNESS: app/admin/proposals/page.tsx has `revalidate = 60`; a just-
 *      sent proposal can fail to render on first server paint (same quirk that
 *      parked record-payment.e2e.ts).
 *
 * The proposal half deliberately uses 'Mark Sent (no WA)' (pure DB writes, no
 * WhatsApp) — NOT 'Send via FMOS WhatsApp' (WA-dependent, fails on empty creds).
 */
import { test, expect } from "@playwright/test";
import { loginAdmin } from "./fixtures/auth";
import { db } from "./fixtures/db";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const LEAD_PHONE = "+918904192656"; // seeded "E2E Test Lead"

async function resolveLead(): Promise<string> {
  const { data: lead } = await db.from("leads").select("id").eq("phone", LEAD_PHONE).single();
  expect(lead, "seeded E2E Test Lead must exist — run scripts/seed-staging.mjs").toBeTruthy();
  return lead!.id as string;
}

async function cleanProposals(leadId: string) {
  await db.from("agreements").delete().eq("lead_id", leadId);
  await db.from("proposals").delete().eq("lead_id", leadId);
}

async function createAndSendProposal(page: any, leadId: string): Promise<string> {
  await page.goto(`${BASE_URL}/admin/leads/${leadId}/proposal/new`);
  await expect(page.getByRole("heading", { name: "New Proposal" })).toBeVisible();

  // Select the WEBSITE service (Foundation Layer) — checkbox is the first button
  // in the card whose text starts with "Website".
  const websiteCard = page.locator("div").filter({ hasText: /^Website/ }).first();
  await websiteCard.getByRole("button").first().click();

  // Fees appear once selected: [0] = Setup Fee, [1] = Monthly Retainer.
  const feeInputs = page.locator('input[type="number"]');
  await feeInputs.nth(0).fill("15000"); // total_setup
  await feeInputs.nth(1).fill("8000"); // total_monthly

  await page.getByRole("button", { name: /Preview Proposal/i }).click();
  await page.getByRole("button", { name: /Save & Send to Client/i }).click();

  await expect
    .poll(async () => {
      const { count } = await db
        .from("proposals")
        .select("*", { count: "exact", head: true })
        .eq("lead_id", leadId);
      return count ?? 0;
    }, { timeout: 8_000 })
    .toBe(1);

  // Dark, WA-free button: status -> sent, lead -> proposal_sent.
  await page.getByRole("button", { name: "Mark Sent (no WA)" }).click();

  await expect
    .poll(async () => {
      const { data } = await db.from("proposals").select("status").eq("lead_id", leadId).single();
      return data?.status ?? null;
    }, { timeout: 8_000 })
    .toBe("sent");

  const { data: sent } = await db
    .from("proposals")
    .select("id, status, sent_at")
    .eq("lead_id", leadId)
    .single();
  expect(sent!.sent_at).toBeTruthy();
  return sent!.id as string;
}

test.describe("Deals — proposal + agreement (verify the rows)", () => {
  // DEAL-05 — works on staging (pure DB writes, no WhatsApp).
  test("create + send proposal moves it to sent + lead to proposal_sent", async ({ page }) => {
    const leadId = await resolveLead();
    await cleanProposals(leadId);

    await loginAdmin(page);
    const proposalId = await createAndSendProposal(page, leadId);

    const { data: movedLead } = await db
      .from("leads")
      .select("outreach_stage")
      .eq("id", leadId)
      .single();
    expect(movedLead!.outreach_stage).toBe("proposal_sent");

    const { data: proposal } = await db
      .from("proposals")
      .select("status, lead_id")
      .eq("id", proposalId)
      .single();
    expect(proposal!.status).toBe("sent");
    expect(proposal!.lead_id).toBe(leadId);

    // --- cleanup (staging only) ---
    await cleanProposals(leadId);
    await db.from("leads").update({ outreach_stage: null, status: null, last_activity_at: null }).eq("id", leadId);
  });

  // DEAL-06 — PARKED: agreement send needs real WhatsApp creds on staging, and the
  // proposals list has revalidate=60 (freshness). See the file header.
  test.fixme("send agreement writes a pending agreement", async ({ page }) => {
    const leadId = await resolveLead();
    await cleanProposals(leadId);

    await loginAdmin(page);
    const proposalId = await createAndSendProposal(page, leadId);

    await page.goto(`${BASE_URL}/admin/proposals`);
    await page.reload(); // mitigate revalidate=60 list freshness

    const row = page.locator("tr", { hasText: "E2E Test Lead" }).first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row).toContainText(/sent/i);

    await row.getByTitle("Send Agreement via WhatsApp").click();

    await expect
      .poll(async () => {
        const { count } = await db
          .from("agreements")
          .select("*", { count: "exact", head: true })
          .eq("proposal_id", proposalId);
        return count ?? 0;
      }, { timeout: 10_000 })
      .toBe(1);

    const { data: agr } = await db
      .from("agreements")
      .select("status, proposal_id, lead_id")
      .eq("proposal_id", proposalId)
      .single();
    expect(agr!.status).toBe("pending");
    expect(agr!.proposal_id).toBe(proposalId);
    expect(agr!.lead_id).toBe(leadId);

    // --- cleanup (staging only) ---
    await db.from("agreements").delete().eq("proposal_id", proposalId);
    await cleanProposals(leadId);
    await db.from("scheduled_messages").delete().eq("lead_id", leadId);
    await db.from("whatsapp_logs").delete().eq("lead_id", leadId);
    await db.from("leads").update({ outreach_stage: null, status: null, last_activity_at: null }).eq("id", leadId);
  });
});
