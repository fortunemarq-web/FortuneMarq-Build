import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * Wrap a cron route handler so every run is recorded to cron_heartbeats with
 * duration + success/failure. Unauthorized pings (401/403) are NOT recorded —
 * only real, authenticated runs count. Fail-open: a monitoring error never
 * affects the wrapped handler's response.
 */
export function withHeartbeat(
  job: string,
  handler: (req: NextRequest) => Promise<Response>,
): (req: NextRequest) => Promise<Response> {
  return async (req: NextRequest): Promise<Response> => {
    const t = Date.now();
    let res: Response;
    try {
      res = await handler(req);
    } catch (e: unknown) {
      await recordRun(job, "error", e instanceof Error ? e.message : String(e), Date.now() - t);
      throw e;
    }
    if (res.status !== 401 && res.status !== 403) {
      await recordRun(job, res.ok ? "ok" : "error", res.ok ? undefined : `HTTP ${res.status}`, Date.now() - t);
    }
    return res;
  };
}

/**
 * 6.8 — record a cron run into public.cron_heartbeats (via the cron_heartbeat RPC).
 * FAIL-OPEN by design: monitoring must NEVER break a working cron, so every error
 * here is swallowed. Call at the start (status "ok") and again on failure ("error").
 */
export async function recordRun(
  job: string,
  status: "ok" | "error" = "ok",
  error?: string,
  ms?: number,
): Promise<void> {
  try {
    const sb = createAdminClient() as any;
    await sb.rpc("cron_heartbeat", {
      p_job: job,
      p_status: status,
      p_error: error ? String(error).slice(0, 500) : null,
      p_ms: ms ?? null,
    });
  } catch {
    /* never throw from monitoring */
  }
}
