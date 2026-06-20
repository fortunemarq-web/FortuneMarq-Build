/**
 * E2E DB-assertion fixture.
 *
 * Gives specs a service-role Supabase client so they can verify that a button
 * actually wrote the row it claimed to — the whole point of "verify-the-result"
 * testing instead of trusting a success toast.
 *
 * SAFETY: this module HARD-REFUSES to run against the production project. If the
 * configured Supabase URL contains the prod ref, every import throws. That makes
 * it impossible for an E2E run (which creates/mutates/deletes data) to ever touch
 * production, no matter how the env is wired.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Production project ref — E2E must NEVER point here. */
const PROD_REF = "cnwooodktqwvpzkucskm";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!url || !serviceKey) {
  throw new Error(
    "[e2e/db] Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. " +
      "Did you load .env.staging? Run via `npm run test:e2e` (which loads it)."
  );
}

if (url.includes(PROD_REF)) {
  throw new Error(
    `[e2e/db] REFUSING TO RUN: Supabase URL points at the PRODUCTION project (${PROD_REF}). ` +
      "E2E tests create and delete data — they must only run against a staging project. " +
      "Fix NEXT_PUBLIC_SUPABASE_URL in .env.staging."
  );
}

/** Service-role client for the STAGING project. Bypasses RLS — staging only. */
export const db: SupabaseClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Convenience: fetch a single row or null, throwing on a real query error. */
export async function getOne<T = any>(
  table: string,
  match: Record<string, unknown>
): Promise<T | null> {
  const { data, error } = await db.from(table).select("*").match(match).maybeSingle();
  if (error) throw new Error(`[e2e/db] select ${table} failed: ${error.message}`);
  return (data as T) ?? null;
}

/** Convenience: count rows matching a filter. */
export async function countRows(table: string, match: Record<string, unknown>): Promise<number> {
  const { count, error } = await db
    .from(table)
    .select("*", { count: "exact", head: true })
    .match(match);
  if (error) throw new Error(`[e2e/db] count ${table} failed: ${error.message}`);
  return count ?? 0;
}

/** Best-effort cleanup helper for specs (staging only). */
export async function deleteWhere(table: string, match: Record<string, unknown>): Promise<void> {
  await db.from(table).delete().match(match);
}
