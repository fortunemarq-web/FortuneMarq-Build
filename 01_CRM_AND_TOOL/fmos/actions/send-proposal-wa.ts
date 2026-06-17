"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { sendWhatsAppTemplate, toWaNumber } from "@/lib/whatsapp/send";
import { leadStageUpdate } from "@/lib/pipeline";

const APP_URL = () =>
  (process.env.NEXT_PUBLIC_APP_URL || "https://fmos.fortunemarq.com").replace(/\/$/, "");

export interface SendProposalResult {
  ok: boolean;
  error?: string;
}

/**
 * Send the proposal_sent WhatsApp template to the lead + schedule a 48h followup.
 * Also stamps proposal status=sent + moves lead to proposal_sent stage.
 */
export async function sendProposalWA(proposalId: string): Promise<SendProposalResult> {
  const supabase = createAdminClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, proposal_number, lead_id, total_setup, total_monthly, services, status")
    .eq("id", proposalId)
    .maybeSingle();

  if (!proposal) return { ok: false, error: "Proposal not found" };

  const { data: lead } = await (supabase.from("leads") as any)
    .select("id, company_name, contact_person, phone, wa_opt_out")
    .eq("id", proposal.lead_id)
    .maybeSingle();

  if (!lead) return { ok: false, error: "Lead not found" };

  const phone = lead.phone as string | null;
  if (!phone || !toWaNumber(phone)) {
    return { ok: false, error: "No valid phone on lead" };
  }
  if (lead.wa_opt_out === true) {
    return { ok: false, error: "Lead has opted out of WhatsApp" };
  }

  const contactName = (lead.contact_person || lead.company_name || "there") as string;
  const companyName = (lead.company_name || "") as string;
  const proposalUrl = `${APP_URL()}/p/${proposalId}`;

  // Send proposal_sent template: {{1}}=contact, {{2}}=company, {{3}}=url
  const waResult = await sendWhatsAppTemplate(phone, "proposal_sent", {
    language: "en",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: contactName },
          { type: "text", text: companyName },
          { type: "text", text: proposalUrl },
        ],
      },
    ],
    leadId: lead.id,
  });

  if (!waResult.success) {
    return { ok: false, error: waResult.error || "WhatsApp send failed" };
  }

  // Stamp proposal as sent
  await supabase
    .from("proposals")
    .update({ status: "sent", sent_at: new Date().toISOString() } as any)
    .eq("id", proposalId);

  // Move lead to proposal_sent stage
  await (supabase.from("leads") as any)
    .update(leadStageUpdate("proposal_sent"))
    .eq("id", proposal.lead_id);

  // Schedule proposal_followup at +48h
  const fireAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await (supabase as any).from("scheduled_messages").upsert(
    {
      lead_id: lead.id,
      phone,
      template_name: "proposal_followup",
      params: [contactName, companyName],
      lang: "en",
      fire_at: fireAt.toISOString(),
      status: "pending",
    },
    { onConflict: "lead_id,template_name" }
  );

  return { ok: true };
}

/**
 * Cancel a pending proposal_followup (e.g. when lead responds or moves forward).
 */
export async function cancelProposalFollowup(leadId: string): Promise<void> {
  const supabase = createAdminClient() as any;
  await supabase
    .from("scheduled_messages")
    .update({ status: "cancelled" })
    .eq("lead_id", leadId)
    .eq("template_name", "proposal_followup")
    .eq("status", "pending");
}
