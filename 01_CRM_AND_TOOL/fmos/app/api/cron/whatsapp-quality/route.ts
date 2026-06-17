import { NextRequest, NextResponse } from "next/server";
import { fetchMessagingHealth, recordAndAlertHealth } from "@/lib/whatsapp/quality";

/**
 * 6.4 — daily poll of Meta messaging quality + tier. Complements the realtime
 * phone_number_quality_update webhook (the webhook may be missed/disabled; this
 * is the safety net). Fires an admin_alert on a quality drop or tier change.
 */
function verifyCronSecret(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const health = await fetchMessagingHealth();
  if (!health) {
    return NextResponse.json({ ok: true, skipped: "no_credentials_or_fetch_failed" });
  }

  const result = await recordAndAlertHealth(health);
  return NextResponse.json({ ok: true, health, ...result });
}
