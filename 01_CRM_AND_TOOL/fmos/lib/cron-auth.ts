import { type NextRequest, NextResponse } from "next/server";

/**
 * Verifies the CRON_SECRET bearer token on a cron route.
 * Returns a NextResponse to short-circuit with, or null when authorized.
 *
 * Usage:
 *   const denied = verifyCronSecret(req);
 *   if (denied) return denied;
 *
 * Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` automatically
 * when CRON_SECRET is set in the project env.
 */
export function verifyCronSecret(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    // Fail closed: a cron endpoint without a configured secret must not run.
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
