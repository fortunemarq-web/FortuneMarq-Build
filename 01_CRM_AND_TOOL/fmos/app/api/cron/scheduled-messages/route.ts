import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { verifyCronSecret } from "@/lib/cron-auth";
import { sendWhatsAppTemplate, toWaNumber } from "@/lib/whatsapp/send";

/**
 * Fires scheduled_messages rows whose fire_at <= now and status = 'pending'.
 * Handles follow-back reminders (followback_reminder_busy / _interested)
 * and meeting reminders (meeting_reminder_1h / meeting_reminder_15m — added by 3.4).
 * Run every 15 minutes via vercel.json cron.
 */
export async function POST(req: NextRequest) {
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
    const to = toWaNumber(row.phone);
    if (!to) {
      await supabase
        .from("scheduled_messages")
        .update({ status: "failed", error: "invalid_phone", sent_at: now })
        .eq("id", row.id);
      failed++;
      continue;
    }

    // Build components from stored params
    const components = row.params && row.params.length > 0
      ? [{
          type: "body",
          parameters: row.params.map((p: string) => ({ type: "text", text: p })),
        }]
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
  }

  return NextResponse.json({ ok: true, processed: rows.length, sent, failed, errors });
}
