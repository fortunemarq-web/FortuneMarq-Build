import { createAdminClient } from "@/lib/supabase-admin";

/**
 * 6.3 — outbound suppression guards, keyed by lead.
 *
 *   - optedOut     : lead set wa_opt_out / do_not_contact → never message.
 *   - activeInbound: lead messaged us inside the active window (last_inbound_at)
 *                    → a live conversation is open, so PROACTIVE automated
 *                    outbound (direct report, outcome blasts) is suppressed to
 *                    avoid double-contact. Reactive replies (bot answering the
 *                    very message that opened the thread) pass a flag to bypass.
 *
 * Defensive: a missing column or absent lead resolves to "not suppressed" for
 * activeInbound and "not opted out", so the guard never blocks legitimate sends
 * because of a schema gap.
 */

function activeThreadHours(): number {
  const n = parseInt(process.env.WHATSAPP_ACTIVE_THREAD_HOURS || "", 10);
  return Number.isFinite(n) && n > 0 ? n : 24;
}

export interface LeadGuardState {
  optedOut: boolean;
  activeInbound: boolean;
}

export async function getLeadGuardState(leadId: string): Promise<LeadGuardState> {
  try {
    const supabase = createAdminClient() as any;
    const { data } = await supabase
      .from("leads")
      .select("wa_opt_out, do_not_contact, last_inbound_at")
      .eq("id", leadId)
      .maybeSingle();

    if (!data) return { optedOut: false, activeInbound: false };

    const optedOut = data.wa_opt_out === true || data.do_not_contact === true;

    let activeInbound = false;
    if (data.last_inbound_at) {
      const last = new Date(data.last_inbound_at).getTime();
      const windowMs = activeThreadHours() * 60 * 60 * 1000;
      activeInbound = Date.now() - last < windowMs;
    }

    return { optedOut, activeInbound };
  } catch {
    return { optedOut: false, activeInbound: false };
  }
}
