import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withHeartbeat } from "@/lib/cron-heartbeat";
import { runBackup } from "@/lib/backup/export";

/**
 * 6.9 — daily data export. Snapshots the core business tables to the private
 * `backups` Storage bucket and prunes snapshots older than 30 days.
 */
async function postHandler(req: NextRequest) {
  const denied = verifyCronSecret(req);
  if (denied) return denied;
  const result = await runBackup(new Date().toISOString());
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export const POST = withHeartbeat("backup-export", postHandler);
// Vercel Cron invokes via GET; same handler, same secret check.
export { POST as GET };
