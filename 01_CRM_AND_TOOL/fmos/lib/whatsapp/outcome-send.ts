import { createAdminClient } from "@/lib/supabase-admin";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/send";

/**
 * Outcome-driven outbound WhatsApp.
 *
 * When a call outcome is logged, optionally send an approved WhatsApp
 * Cloud API template to the lead — but ONLY if an approved template is
 * mapped to that outcome via the WA_OUTCOME_TEMPLATES env var.
 *
 * WA_OUTCOME_TEMPLATES is JSON, e.g.:
 *   {"interested":"hello_world","callback_scheduled":"hello_world"}
 *
 * Design notes:
 *  - SERVER-ONLY (uses the service role + the WhatsApp token via send.ts).
 *  - FAIL-OPEN: never throws, never blocks outcome logging. If no template
 *    is mapped, or creds/phone are missing, it simply returns `skipped`.
 *  - Cold outbound to a lead needs a Meta-APPROVED template; session text
 *    only works inside the 24h customer window. Hence template-only here.
 */

export interface OutcomeSendResult {
  sent: boolean;
  skipped?: string;
  error?: string;
}

/** Parse WA_OUTCOME_TEMPLATES (JSON map of outcome → approved template name). */
function outcomeTemplateMap(): Record<string, string> {
  const raw = process.env.WA_OUTCOME_TEMPLATES;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    console.error("[outcome-send] WA_OUTCOME_TEMPLATES is not valid JSON; ignoring.");
  }
  return {};
}

// Warn (once per process) rather than silently skip when the feature is
// entirely unconfigured in production — so a misconfigured deploy is visible.
let warnedUnset = false;

export async function sendOutcomeWhatsApp(
  leadId: string,
  outcomeKey: string,
  sentBy?: string | null
): Promise<OutcomeSendResult> {
  try {
    if (!process.env.WA_OUTCOME_TEMPLATES) {
      if (process.env.NODE_ENV === "production" && !warnedUnset) {
        warnedUnset = true;
        console.warn(
          "[outcome-send] WA_OUTCOME_TEMPLATES is not set — outcome-driven WhatsApp is disabled in production. Set it to enable (see .env.example)."
        );
      }
      return { sent: false, skipped: "WA_OUTCOME_TEMPLATES not configured" };
    }

    const templateName = outcomeTemplateMap()[outcomeKey];
    if (!templateName) return { sent: false, skipped: "no template mapped for outcome" };

    const supabase = createAdminClient() as any;
    const { data: lead } = await supabase
      .from("leads")
      .select("id, phone")
      .eq("id", leadId)
      .single();
    if (!lead?.phone) return { sent: false, skipped: "lead has no phone number" };

    const lang = process.env.WA_OUTCOME_TEMPLATE_LANG || "en";
    const r = await sendWhatsAppTemplate(lead.phone, templateName, {
      language: lang,
      leadId: lead.id,
      sentBy: sentBy ?? null,
    });
    return r.success ? { sent: true } : { sent: false, error: r.error };
  } catch (e: any) {
    console.error("[outcome-send] failed:", e);
    return { sent: false, error: e?.message || "send failed" };
  }
}
