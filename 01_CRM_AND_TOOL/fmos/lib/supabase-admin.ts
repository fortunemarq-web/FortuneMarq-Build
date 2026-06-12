import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Creates a Supabase client with the service-role key. Bypasses RLS.
 *
 * ONLY for trusted server contexts:
 *  - cron route handlers (after CRON_SECRET verification)
 *  - public-by-design endpoints (landing-page lead capture, token reports)
 *
 * Never import this from a client component. The runtime guard below is a
 * backstop; the real protection is that SUPABASE_SERVICE_ROLE_KEY is not
 * exposed to the browser bundle (no NEXT_PUBLIC_ prefix).
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient() must never run in the browser");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env.local (server-only, never NEXT_PUBLIC_)."
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
