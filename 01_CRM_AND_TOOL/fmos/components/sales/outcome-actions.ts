"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { sendOutcomeWhatsApp, type OutcomeSendResult } from "@/lib/whatsapp/outcome-send";

/**
 * Client-callable wrapper so the (client-side) call-outcome modal can fire
 * an outcome-driven WhatsApp send server-side. Authenticates first, then
 * delegates to the fail-open helper. Never throws.
 */
export async function notifyOutcome(
  leadId: string,
  outcomeKey: string
): Promise<OutcomeSendResult> {
  const supabase = await createServerClientWithCookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sent: false, skipped: "not authenticated" };
  return await sendOutcomeWhatsApp(leadId, outcomeKey, user.id);
}
