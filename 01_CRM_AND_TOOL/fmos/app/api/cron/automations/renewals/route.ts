import { createAdminClient } from "@/lib/supabase-admin";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withHeartbeat } from "@/lib/cron-heartbeat";

export const POST = withHeartbeat("renewals", postHandler);

import { type NextRequest, NextResponse } from "next/server";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/send";
import { sendAdminAlert } from "@/lib/whatsapp/admin-alert";

/**
 * 4.8 — Auto-renewal reminders.
 *
 * A retainer that lapses unnoticed is lost revenue. When a client's renewal_date
 * is within RENEWAL_REMINDER_DAYS (default 14), send the approved `renewal_reminder`
 * to the client and alert the owner to prep (a natural upsell moment). One reminder
 * per cycle — `clients.renewal_reminded_at` dedups so it doesn't fire daily through
 * the window. `?dry=1` previews. Runs through the WhatsApp choke point (throttle +
 * allowlist), so it's inert against real clients pre-go-live.
 */

const IST = "Asia/Kolkata";
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { timeZone: IST, day: "numeric", month: "short", year: "numeric" });

async function postHandler(req: NextRequest) {
  const denied = verifyCronSecret(req);
  if (denied) return denied;

  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const supabase = createAdminClient();
  const windowDays = Number(process.env.RENEWAL_REMINDER_DAYS) || 14;
  const batch = Number(process.env.RENEWAL_BATCH) || 25;

  const today = new Date().toISOString().slice(0, 10);
  const future = new Date(Date.now() + windowDays * 86400000).toISOString().slice(0, 10);
  const reRemindCutoff = new Date(Date.now() - 25 * 86400000).toISOString();

  try {
    const { data: clients, error } = await (supabase.from("clients") as any)
      .select("id, business_name, owner_name, phone, renewal_date, renewal_reminded_at, package_tier")
      .not("renewal_date", "is", null)
      .gte("renewal_date", today)
      .lte("renewal_date", future)
      .not("phone", "is", null)
      .or(`renewal_reminded_at.is.null,renewal_reminded_at.lt.${reRemindCutoff}`)
      .limit(batch);
    if (error) throw error;

    const candidates = (clients || []) as any[];

    if (dry) {
      return NextResponse.json({
        success: true,
        mode: "dry-run",
        window_days: windowDays,
        candidates: candidates.length,
        sample: candidates.slice(0, 5).map((c) => ({ business: c.business_name, renews: c.renewal_date })),
      });
    }

    let sent = 0;
    let skipped = 0;
    for (const c of candidates) {
      const service = c.package_tier ? `${c.business_name} (${c.package_tier})` : c.business_name || "your retainer";
      const components = [
        {
          type: "body",
          parameters: [
            { type: "text", text: c.owner_name || c.business_name || "there" },
            { type: "text", text: service },
            { type: "text", text: fmtDate(c.renewal_date) },
          ],
        },
      ];
      const r = await sendWhatsAppTemplate(c.phone, "renewal_reminder", { language: "en", components });
      if (r.success) {
        await (supabase.from("clients") as any).update({ renewal_reminded_at: new Date().toISOString() }).eq("id", c.id);
        await sendAdminAlert("Retainer renewal approaching", `${c.business_name} renews on ${fmtDate(c.renewal_date)} — good moment to review results + upsell.`);
        sent++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({ success: true, candidates: candidates.length, sent, skipped });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// Vercel/GitHub cron invokes via GET; same handler, same secret check.
export { POST as GET };
