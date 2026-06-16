"use server";

import { handleOutcomeWaSend, type OutcomeId } from "@/lib/whatsapp/outcome-handler";
import { createAdminClient } from "@/lib/supabase-admin";

export interface OutcomeWaSendInput {
  leadId: string;
  outcome: OutcomeId;
  followUpDate?: string | null;
  meetLink?: string | null;
  lang?: string;
}

export interface OutcomeWaSendResult {
  sent: boolean;
  skipped: boolean;
  skipReason?: string;
  template?: string;
  error?: string;
  reminderScheduled?: boolean;
}

/**
 * Fire-and-forget server action called after logOutcome writes to the DB.
 * Fetches the fresh lead snapshot from Supabase (so pitch_type etc. are correct),
 * then delegates to the outcome handler. Never throws.
 */
export async function sendOutcomeWhatsApp(
  input: OutcomeWaSendInput
): Promise<OutcomeWaSendResult> {
  try {
    const supabase = createAdminClient();
    const { data: lead, error } = await (supabase
      .from("leads") as any)
      .select("id, phone, company_name, pitch_type, is_low_volume, serp_ranked, has_website, wa_opt_out, industry, city")
      .eq("id", input.leadId)
      .single();

    if (error || !lead) {
      return { sent: false, skipped: true, skipReason: "lead_not_found" };
    }

    return await handleOutcomeWaSend({
      lead: lead as Record<string, unknown>,
      outcome: input.outcome,
      followUpDate: input.followUpDate,
      meetLink: input.meetLink,
      lang: input.lang || "en",
    });
  } catch (e) {
    console.error("[outcome-wa-send] unexpected error:", e);
    return { sent: false, skipped: false, error: String(e) };
  }
}
