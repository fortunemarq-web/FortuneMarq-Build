import { createAdminClient } from "@/lib/supabase-admin";
import { runTrigger } from "@/lib/automations/engine";

/**
 * PHASE F — single inbound pipeline. Every channel (LP form, webhooks,
 * manual quick-add) funnels through processInboundLead so dedup,
 * attribution, auto-assignment, and audit behave identically everywhere.
 *
 * Server-only (service role): callers are either public-by-design
 * (LP form, token-verified webhooks) or authenticated UI passing actorId.
 */

export const CHANNEL_LABELS: Record<string, string> = {
  lp: "Landing Page",
  meta_lead_ad: "Meta Lead Ad",
  ctwa: "Click-to-WhatsApp Ad",
  whatsapp: "WhatsApp Inbound",
  google_lead_form: "Google Lead Form",
  call: "Phone Call",
  gbp: "Google Business Profile",
  referral: "Referral",
  dm: "Social DM",
  manual: "Manual Entry",
};

export interface InboundLeadInput {
  channel: keyof typeof CHANNEL_LABELS | string;
  external_id?: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone: string;
  industry?: string;
  city?: string;
  message?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  gclid?: string;
  fbclid?: string;
  landing_page?: string;
  referrer_url?: string;
  campaign_external_id?: string;
  campaign_name?: string;
  adset_name?: string;
  ad_name?: string;
  /** raw webhook payload, stored verbatim in inbound_events */
  raw?: unknown;
  /** authenticated user performing a manual capture, if any */
  actorId?: string;
}

export interface InboundResult {
  success: boolean;
  status: "created" | "duplicate" | "invalid" | "error";
  leadId?: string;
  message?: string;
}

/** Last 10 digits — Indian numbers; tolerant of +91/0 prefixes and formatting. */
export function normalizePhone(phone: string): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

const PLATFORM_BY_CHANNEL: Record<string, string> = {
  meta_lead_ad: "meta",
  ctwa: "meta",
  dm: "meta",
  google_lead_form: "google",
};

export async function processInboundLead(input: InboundLeadInput): Promise<InboundResult> {
  const supabase = createAdminClient() as any;
  const channel = String(input.channel || "manual");
  const channelLabel = CHANNEL_LABELS[channel] || channel;

  // 1. Log the raw event first — even invalid hits leave a trace we can replay
  const { data: event } = await supabase
    .from("inbound_events")
    .insert({
      channel,
      external_id: input.external_id ?? null,
      payload: (input.raw ?? { ...input, raw: undefined }) as any,
    })
    .select("id")
    .single();
  const eventId = event?.id;

  const finishEvent = async (status: string, leadId?: string, error?: string) => {
    if (!eventId) return;
    await supabase
      .from("inbound_events")
      .update({ status, lead_id: leadId ?? null, error: error ?? null })
      .eq("id", eventId);
  };

  try {
    // 2. Validate
    const phone10 = normalizePhone(input.phone);
    if (!phone10) {
      await finishEvent("failed", undefined, "invalid phone");
      return { success: false, status: "invalid", message: "A valid phone number is required." };
    }
    const company_name =
      (input.company_name || "").trim().slice(0, 200) ||
      (input.contact_person || "").trim().slice(0, 200) ||
      `Unknown (${channelLabel})`;

    // 3. Dedupe by phone (suffix match handles +91/0 format drift)
    const { data: existing } = await supabase
      .from("leads")
      .select("id, company_name, assigned_sales_exec, outreach_stage")
      .like("phone", `%${phone10}`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Re-enquiry: don't create a duplicate — surface it on the existing lead
      await supabase.from("activity_events").insert({
        entity_type: "lead",
        entity_id: existing.id,
        event_type: "inbound_reenquiry",
        title: `Re-enquired via ${channelLabel}`,
        body: input.message || null,
        metadata: { channel, utm: input.utm ?? null },
      });
      await supabase
        .from("leads")
        .update({
          last_activity_at: new Date().toISOString(),
          follow_up_date: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (existing.assigned_sales_exec) {
        await supabase.from("notifications").insert({
          user_id: existing.assigned_sales_exec,
          type: "lead_status_changed",
          title: "Lead re-enquired",
          body: `${existing.company_name} reached out again via ${channelLabel}.`,
          link: `/admin/leads/${existing.id}`,
          entity_type: "lead",
          entity_id: existing.id,
        });
      }
      await finishEvent("duplicate", existing.id);
      return { success: true, status: "duplicate", leadId: existing.id, message: "Matched existing lead — logged as re-enquiry." };
    }

    // 4. Resolve / auto-create the ad campaign for attribution
    let adCampaignId: string | null = null;
    const campaignKey = input.campaign_external_id || input.utm?.campaign || input.campaign_name;
    if (campaignKey) {
      const platform = PLATFORM_BY_CHANNEL[channel] || (input.gclid ? "google" : input.fbclid ? "meta" : "other");
      const { data: byExternal } = input.campaign_external_id
        ? await supabase.from("ad_campaigns").select("id").eq("external_campaign_id", input.campaign_external_id).maybeSingle()
        : { data: null };
      const { data: byName } = !byExternal && campaignKey
        ? await supabase.from("ad_campaigns").select("id").ilike("campaign_name", campaignKey).maybeSingle()
        : { data: null };
      adCampaignId = byExternal?.id ?? byName?.id ?? null;
      if (!adCampaignId) {
        const { data: createdCampaign } = await supabase
          .from("ad_campaigns")
          .insert({
            campaign_name: input.campaign_name || campaignKey,
            platform,
            status: "active",
            objective: "lead_generation",
            external_campaign_id: input.campaign_external_id ?? null,
            notes: `Auto-created from inbound ${channelLabel} lead.`,
          })
          .select("id")
          .single();
        adCampaignId = createdCampaign?.id ?? null;
      }
    }

    // 5. Create the lead
    const noteParts = [`Inbound via ${channelLabel}.`];
    if (input.message) noteParts.push(`Message: ${input.message.slice(0, 500)}`);
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        company_name,
        contact_person: (input.contact_person || "").trim().slice(0, 200) || null,
        email: (input.email || "").trim().slice(0, 200) || null,
        phone: input.phone.trim(),
        industry: (input.industry || "").trim().slice(0, 200) || null,
        city: (input.city || "").trim().slice(0, 200) || null,
        status: "new",
        lead_type: "inbound",
        source: channel,
        lead_source: channelLabel,
        captured_at: new Date().toISOString(),
        notes: noteParts.join("\n"),
      })
      .select("id")
      .single();
    if (leadError) throw new Error(leadError.message);

    // 6. Attribution row
    await supabase.from("lead_source_attribution").insert({
      lead_id: lead.id,
      ad_campaign_id: adCampaignId,
      utm_source: input.utm?.source ?? null,
      utm_medium: input.utm?.medium ?? null,
      utm_campaign: input.utm?.campaign ?? null,
      utm_content: input.utm?.content ?? null,
      utm_term: input.utm?.term ?? null,
      landing_page: input.landing_page ?? null,
      referrer_url: input.referrer_url ?? null,
    });

    // 7. Audit
    await supabase.from("audit_logs").insert({
      actor_id: input.actorId ?? null,
      action: "create",
      resource_type: "lead",
      resource_id: lead.id,
      resource_label: `Inbound Lead: ${company_name}`,
      new_value: { channel, phone: input.phone, industry: input.industry, city: input.city },
      summary: `Inbound lead captured via ${channelLabel}`,
      user_name: input.actorId ? "user" : `inbound:${channel}`,
      user_role: "system",
      entity_type: "lead",
      entity_id: lead.id,
    });

    // 8. Fire the automation engine — seeded "Auto-Assign Inbound" rule
    //    (round-robin assign → set status calling → notify owner → next action +10min)
    try {
      await runTrigger("lead_created", "lead", lead.id, input.actorId ?? null);
    } catch (e) {
      console.error("[inbound] lead_created automation failed:", e);
    }

    await finishEvent("processed", lead.id);
    return { success: true, status: "created", leadId: lead.id };
  } catch (e: any) {
    await finishEvent("failed", undefined, e?.message || String(e));
    return { success: false, status: "error", message: e?.message || "Capture failed" };
  }
}
