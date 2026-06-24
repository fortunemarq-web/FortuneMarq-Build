import { createAdminClient } from "@/lib/supabase-admin";
import { verifyCronSecret } from "@/lib/cron-auth";
import { syncAdConversions } from "@/lib/ads/conversions";
import { type NextRequest, NextResponse } from "next/server";

// Uploads offline conversions (meeting booked / won) back to Meta CAPI + Google
// OCI for paid-click leads. No-ops gracefully until the platform tokens are set.
async function handle(req: NextRequest) {
  const denied = verifyCronSecret(req);
  if (denied) return denied;
  try {
    const summary = await syncAdConversions(createAdminClient() as never);
    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    console.error("ad-conversions cron error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
