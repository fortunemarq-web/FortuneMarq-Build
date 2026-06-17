import { createAdminClient } from "@/lib/supabase-admin";

/**
 * 6.4 — system-wide throttle. DB-backed so the cap holds across serverless
 * instances (an in-memory limiter wouldn't survive Vercel's stateless model).
 *
 *   - Daily cap  : total outbound messages per calendar day (UTC). Hard stop.
 *   - Rate limit : outbound messages in the trailing 60s. Soft skip.
 *
 * Both count whatsapp_logs(direction='outbound'). There is a small race when
 * many sends fire concurrently (count happens before the new row is logged) —
 * acceptable: these are safety rails against runaway loops, not exact quotas.
 */

const DEFAULT_DAILY_CAP = 1000;
const DEFAULT_RATE_PER_MIN = 60;

function dailyCap(): number {
  const n = parseInt(process.env.WHATSAPP_DAILY_CAP || "", 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_CAP;
}

function ratePerMin(): number {
  const n = parseInt(process.env.WHATSAPP_RATE_PER_MIN || "", 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_RATE_PER_MIN;
}

export interface ThrottleVerdict {
  allowed: boolean;
  reason?: "daily_cap" | "rate_limit";
  count?: number;
  limit?: number;
}

async function outboundCountSince(iso: string): Promise<number> {
  const supabase = createAdminClient() as any;
  const { count } = await supabase
    .from("whatsapp_logs")
    .select("id", { count: "exact", head: true })
    .eq("direction", "outbound")
    .gte("sent_at", iso);
  return count ?? 0;
}

/**
 * Check both limits before a send. Daily cap is checked first (hard stop), then
 * the per-minute rate. Returns allowed:true when under both.
 */
export async function checkThrottle(): Promise<ThrottleVerdict> {
  // Daily cap — start of the current UTC day.
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const dayCount = await outboundCountSince(startOfDay.toISOString());
  const cap = dailyCap();
  if (dayCount >= cap) {
    return { allowed: false, reason: "daily_cap", count: dayCount, limit: cap };
  }

  // Rate limit — trailing 60 seconds.
  const minuteAgo = new Date(Date.now() - 60_000).toISOString();
  const minuteCount = await outboundCountSince(minuteAgo);
  const rate = ratePerMin();
  if (minuteCount >= rate) {
    return { allowed: false, reason: "rate_limit", count: minuteCount, limit: rate };
  }

  return { allowed: true };
}

/**
 * Fire an admin_alert when the daily cap is first hit today — de-duped via
 * app_settings so we don't spam the alert on every subsequent suppressed send.
 * Returns true if an alert was sent this call.
 */
export async function alertDailyCapOnce(count: number, limit: number): Promise<boolean> {
  const supabase = createAdminClient() as any;
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "whatsapp_daily_cap_alerted")
    .maybeSingle();

  if (data?.value?.date === today) return false; // already alerted today

  await supabase
    .from("app_settings")
    .upsert({ key: "whatsapp_daily_cap_alerted", value: { date: today } }, { onConflict: "key" });

  // Lazy import to avoid a cycle (admin-alert → send → throttle).
  const { sendAdminAlert } = await import("@/lib/whatsapp/admin-alert");
  await sendAdminAlert(
    "WhatsApp daily cap reached",
    `${count}/${limit} messages sent today. Further automated sends are paused until tomorrow.`
  ).catch(() => {});
  return true;
}
