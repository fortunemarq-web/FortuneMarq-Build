/**
 * 3.2 — Outcome → WhatsApp auto-send
 *
 * Deterministic mapping: call outcome + lead snapshot → approved template + params.
 * Called server-side immediately after logOutcome writes to the DB.
 * Fail-open: every error is caught and returned, never throws.
 *
 * Template names (all approved or in review — exact Meta names):
 *   meeting_confirmation      — INTERESTED_BOOK (has meetLink, calStart, calEnd via 3.4)
 *   followup_scheduled        — INTERESTED_FOLLOW_UP (follow-up date filled)
 *   send_info                 — INTERESTED_SEND_INFO
 *   follow_back               — FOLLOW_BACK (callback date filled)
 *   not_interested            — NOT_INTERESTED
 *   followback_reminder_interested — reminder when follow_back >= 24h out (was interested)
 *   followback_reminder_busy  — reminder when follow_back >= 24h out (was gatekeeper/busy)
 *
 * No-send outcomes: NO_ANSWER, GATEKEEPER, WRONG_NUMBER, LANGUAGE_BARRIER
 * (retry logic lives in the cockpit; these outcomes never send WhatsApp)
 */

import { sendWhatsAppTemplate, toWaNumber } from "./send";
import { isOptedOut } from "./recipients";
import { buildComponents } from "./params";
import type { WaTemplateConfig } from "./params";
import { createAdminClient } from "@/lib/supabase-admin";

export type OutcomeId =
  | "INTERESTED_BOOK"
  | "INTERESTED_FOLLOW_UP"
  | "INTERESTED_SEND_INFO"
  | "NOT_INTERESTED"
  | "FOLLOW_BACK"
  | "WRONG_NUMBER"
  | "NO_ANSWER"
  | "GATEKEEPER"
  | "LANGUAGE_BARRIER";

export interface OutcomeSendResult {
  sent: boolean;
  skipped: boolean;
  skipReason?: string;
  template?: string;
  error?: string;
  reminderScheduled?: boolean;
}

// ─── IST datetime formatting (same logic as params.ts) ───────────────────────
const IST = "Asia/Kolkata";

function fmtDatetime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    timeZone: IST, weekday: "short", day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: true });
}

/** Hours between now and a future ISO datetime. Negative = already past. */
function hoursUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / 3_600_000;
}

// ─── Reminder scheduling ─────────────────────────────────────────────────────

async function scheduleFollowBackReminder(
  leadId: string,
  phone: string,
  templateName: string,
  params: string[],
  fireAt: Date,
  lang: string,
): Promise<void> {
  // Store in a lightweight scheduled_messages table (created below if missing).
  // The daily-digest cron (or a dedicated cron) will pick these up and fire them.
  const supabase = createAdminClient() as any;
  await supabase.from("scheduled_messages").upsert(
    {
      lead_id: leadId,
      phone,
      template_name: templateName,
      params, // jsonb array — NOT JSON.stringify (the cron reads it as an array)
      lang,
      fire_at: fireAt.toISOString(),
      status: "pending",
    },
    { onConflict: "lead_id,template_name" }
  );
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function handleOutcomeWaSend(opts: {
  lead: Record<string, unknown>;
  outcome: OutcomeId;
  followUpDate?: string | null;   // ISO — set for INTERESTED_FOLLOW_UP, FOLLOW_BACK, INTERESTED_BOOK
  meetLink?: string | null;       // set by 3.4 Google Calendar integration
  lang?: string;
}): Promise<OutcomeSendResult> {
  const { lead, outcome, followUpDate, meetLink, lang = "en" } = opts;

  const phone = String(lead.phone || "");
  const to = toWaNumber(phone);
  const leadId = String(lead.id || "");

  // Body-param fillers. Templates greet a person, so prefer contact_person.
  // Every param MUST be a non-empty string (Meta rejects blank params with #132000),
  // and the array length MUST equal the template's numbered-var count.
  const SITE_URL = "https://fortunemarq.com";
  const contactName = String(lead.contact_person || lead.company_name || "there");
  const city = String(lead.city || "your area");
  const niche = String(lead.industry || "your business");
  const workLink = SITE_URL;

  // Guard: opt-out
  if (isOptedOut(lead)) {
    return { sent: false, skipped: true, skipReason: "opted_out" };
  }

  // Guard: no valid phone
  if (!to) {
    return { sent: false, skipped: true, skipReason: "invalid_phone" };
  }

  // ── Outcomes that never send a WhatsApp ──────────────────────────────────
  if (outcome === "NO_ANSWER" || outcome === "GATEKEEPER" || outcome === "WRONG_NUMBER" || outcome === "LANGUAGE_BARRIER") {
    return { sent: false, skipped: true, skipReason: "no_send_outcome" };
  }

  try {
    switch (outcome) {

      // ── INTERESTED_BOOK → meeting_confirmation ───────────────────────────
      case "INTERESTED_BOOK": {
        const template = "meeting_confirmation";
        // meeting_confirmation has 3 numbered vars: {{1}}=name, {{2}}=date+time, {{3}}=join link.
        const whenStr = followUpDate ? fmtDatetime(followUpDate) : "your scheduled time";
        const cfg: WaTemplateConfig = {
          audience: "lead",
          template,
          lang,
          params: [contactName, whenStr, meetLink || SITE_URL],
        };
        const components = buildComponents(cfg, lead);
        const r = await sendWhatsAppTemplate(phone, template, {
          language: lang, components: components.length ? components : undefined, leadId, proactive: true,
        });
        return { sent: r.success, skipped: false, template, error: r.error };
      }

      // ── INTERESTED_FOLLOW_UP → followup_scheduled ────────────────────────
      case "INTERESTED_FOLLOW_UP": {
        const template = "followup_scheduled";
        // 3 vars: {{1}}=name, {{2}}=follow-up date/time, {{3}}=what-we-do link.
        const dateStr = followUpDate ? fmtDatetime(followUpDate) : "soon";
        const cfg: WaTemplateConfig = {
          audience: "lead",
          template,
          lang,
          params: [contactName, dateStr, workLink],
        };
        const components = buildComponents(cfg, lead);
        const r = await sendWhatsAppTemplate(phone, template, {
          language: lang, components: components.length ? components : undefined, leadId, proactive: true,
        });
        return { sent: r.success, skipped: false, template, error: r.error };
      }

      // ── INTERESTED_SEND_INFO → send_info ─────────────────────────────────
      case "INTERESTED_SEND_INFO": {
        const template = "send_info";
        // 3 vars: {{1}}=name, {{2}}=city, {{3}}=see-our-work link.
        const cfg: WaTemplateConfig = { audience: "lead", template, lang, params: [contactName, city, workLink] };
        const components = buildComponents(cfg, lead);
        const r = await sendWhatsAppTemplate(phone, template, {
          language: lang, components: components.length ? components : undefined, leadId, proactive: true,
        });
        return { sent: r.success, skipped: false, template, error: r.error };
      }

      // ── NOT_INTERESTED → not_interested ──────────────────────────────────
      case "NOT_INTERESTED": {
        const template = "not_interested";
        // 2 vars: {{1}}=name, {{2}}=what-we-do link.
        const cfg: WaTemplateConfig = { audience: "lead", template, lang, params: [contactName, workLink] };
        const components = buildComponents(cfg, lead);
        const r = await sendWhatsAppTemplate(phone, template, {
          language: lang, components: components.length ? components : undefined, leadId, proactive: true,
        });
        return { sent: r.success, skipped: false, template, error: r.error };
      }

      // ── FOLLOW_BACK → follow_back + optional reminder ────────────────────
      case "FOLLOW_BACK": {
        const template = "follow_back";
        // 2 vars: {{1}}=name, {{2}}=callback date/time.
        const dateStr = followUpDate ? fmtDatetime(followUpDate) : "soon";
        const cfg: WaTemplateConfig = {
          audience: "lead", template, lang,
          params: [contactName, dateStr],
        };
        const components = buildComponents(cfg, lead);
        const r = await sendWhatsAppTemplate(phone, template, {
          language: lang, components: components.length ? components : undefined, leadId, proactive: true,
        });

        // Schedule followback_reminder_busy only if >= 24h out
        let reminderScheduled = false;
        if (followUpDate && hoursUntil(followUpDate) >= 24) {
          // Fire reminder 1h before the scheduled callback.
          // followback_reminder_busy has 5 vars: {{1}}=name, {{2}}=callback time,
          // {{3}}=niche, {{4}}=city, {{5}}=market-research/work link.
          const fireAt = new Date(new Date(followUpDate).getTime() - 60 * 60 * 1000);
          await scheduleFollowBackReminder(
            leadId, phone,
            "followback_reminder_busy",
            [contactName, fmtTime(followUpDate), niche, city, workLink],
            fireAt, lang,
          ).catch(() => null); // fail silently — main send already succeeded
          reminderScheduled = true;
        }

        return { sent: r.success, skipped: false, template, error: r.error, reminderScheduled };
      }

      default:
        return { sent: false, skipped: true, skipReason: "unhandled_outcome" };
    }
  } catch (e) {
    return { sent: false, skipped: false, error: String(e) };
  }
}
