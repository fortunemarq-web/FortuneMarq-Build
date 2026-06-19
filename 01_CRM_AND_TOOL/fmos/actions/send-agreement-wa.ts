"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { sendWhatsAppTemplate, toWaNumber } from "@/lib/whatsapp/send";
import { cancelProposalFollowup } from "@/actions/send-proposal-wa";

const APP_URL = () =>
  (process.env.NEXT_PUBLIC_APP_URL || "https://fmos.fortunemarq.com").replace(/\/$/, "");

export interface SendAgreementResult {
  ok: boolean;
  agreementId?: string;
  error?: string;
}

/**
 * Create an agreement from a proposal, send the agreement_sent WhatsApp template.
 * Cancels the pending proposal_followup since the deal is moving forward.
 */
export async function sendAgreementWA(proposalId: string): Promise<SendAgreementResult> {
  const supabase = createAdminClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, proposal_number, lead_id, services, total_setup, total_monthly, start_date")
    .eq("id", proposalId)
    .maybeSingle();

  if (!proposal) return { ok: false, error: "Proposal not found" };

  const { data: lead } = await (supabase.from("leads") as any)
    .select("id, company_name, contact_person, phone, wa_opt_out")
    .eq("id", proposal.lead_id)
    .maybeSingle();

  if (!lead) return { ok: false, error: "Lead not found" };

  const phone = lead.phone as string | null;
  if (!phone || !toWaNumber(phone)) return { ok: false, error: "No valid phone on lead" };
  if (lead.wa_opt_out === true) return { ok: false, error: "Lead has opted out of WhatsApp" };

  // Generate agreement number
  const agreementNumber = `AGR-${proposal.proposal_number.replace("PROP-", "")}`;

  // Create or retrieve existing agreement
  const { data: existing } = await supabase
    .from("agreements")
    .select("id")
    .eq("proposal_id", proposalId)
    .maybeSingle();

  let agreementId: string;

  if (existing) {
    agreementId = existing.id;
  } else {
    const { data: created, error: createErr } = await supabase
      .from("agreements")
      .insert({
        proposal_id: proposalId,
        lead_id: proposal.lead_id,
        agreement_number: agreementNumber,
        services: proposal.services,
        total_setup: proposal.total_setup,
        total_monthly: proposal.total_monthly,
        start_date: proposal.start_date,
        // agreements.status CHECK allows only pending/confirmed/cancelled.
        // A freshly-sent agreement is "pending" (awaiting the client's "Yes, confirmed").
        status: "pending",
      } as any)
      .select("id")
      .single();

    if (createErr || !created) return { ok: false, error: createErr?.message || "Failed to create agreement" };
    agreementId = (created as any).id;
  }

  const agreementUrl = `${APP_URL()}/a/${agreementId}`;
  const contactName = (lead.contact_person || lead.company_name || "there") as string;

  // Top 2 service labels for the template {{3}} and {{4}}
  const services: { label: string }[] = Array.isArray(proposal.services) ? (proposal.services as any[]) : [];
  const svc1 = services[0]?.label || "Digital Marketing";
  const svc2 = services[1]?.label || "Growth Strategy";

  // Send agreement_sent: {{1}}=contact, {{2}}=url, {{3}}=service1, {{4}}=service2
  const waResult = await sendWhatsAppTemplate(phone, "agreement_sent", {
    language: "en",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: contactName },
          { type: "text", text: agreementUrl },
          { type: "text", text: svc1 },
          { type: "text", text: svc2 },
        ],
      },
    ],
    leadId: lead.id,
  });

  if (!waResult.success) return { ok: false, error: waResult.error || "WhatsApp send failed" };

  // Stamp agreement_sent_at on proposal
  await supabase
    .from("proposals")
    .update({ agreement_sent_at: new Date().toISOString() } as any)
    .eq("id", proposalId);

  // Cancel proposal_followup — deal is progressing
  await cancelProposalFollowup(lead.id as string);

  return { ok: true, agreementId };
}
