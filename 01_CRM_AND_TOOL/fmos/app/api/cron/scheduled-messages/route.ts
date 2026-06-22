import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withHeartbeat } from "@/lib/cron-heartbeat";

export const POST = withHeartbeat("scheduled-messages", postHandler);
import { sendWhatsAppTemplate, toWaNumber } from "@/lib/whatsapp/send";

/**
 * Fires scheduled_messages rows whose fire_at <= now and status = 'pending'.
 * Handles follow-back reminders (followback_reminder_busy / _interested)
 * and meeting reminders (meeting_reminder_1h / meeting_reminder_15m — added by 3.4).
 * Run every 15 minutes via vercel.json cron.
 */
async function postHandler(req: NextRequest) {
  const denied = verifyCronSecret(req);
  if (denied) return denied;

  const supabase = createAdminClient() as any;
  const now = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("scheduled_messages")
    .select("*")
    .eq("status", "pending")
    .lte("fire_at", now)
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (due || []) as {
    id: string;
    lead_id: string;
    phone: string;
    template_name: string;
    params: string[] | null;
    lang: string;
  }[];

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of rows) {
    // One bad row must NEVER abort the whole batch (which would silently stop
    // ALL meeting/proposal/follow-up reminders forever).
    try {
      const to = toWaNumber(row.phone);
      if (!to) {
        await supabase
          .from("scheduled_messages")
          .update({ status: "failed", error: "invalid_phone", sent_at: now })
          .eq("id", row.id);
        failed++;
        continue;
      }

      // params should be a jsonb array; tolerate legacy rows stored as a JSON string.
      const raw: unknown = (row as { params?: unknown }).params;
      const params: string[] = Array.isArray(raw)
        ? (raw as string[])
        : typeof raw === "string"
          ? (() => { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; } })()
          : [];

      const components = params.length > 0
        ? [{ type: "body", parameters: params.map((p) => ({ type: "text", text: String(p) })) }]
        : undefined;

      const r = await sendWhatsAppTemplate(row.phone, row.template_name, {
        language: row.lang,
        components,
        leadId: row.lead_id,
      });

      await supabase
        .from("scheduled_messages")
        .update({
          status: r.success ? "sent" : "failed",
          sent_at: new Date().toISOString(),
          error: r.error ?? null,
        })
        .eq("id", row.id);

      if (r.success) sent++;
      else { failed++; errors.push(`${row.id}: ${r.error}`); }
    } catch (e: unknown) {
      failed++;
      const msg = e instanceof Error ? e.message : "row error";
      errors.push(`${row.id}: ${msg}`);
      await supabase
        .from("scheduled_messages")
        .update({ status: "failed", error: msg.slice(0, 300), sent_at: new Date().toISOString() })
        .eq("id", row.id)
        .then(() => {}, () => {});
    }
  }

  return NextResponse.json({ ok: true, processed: rows.length, sent, failed, errors });
}
