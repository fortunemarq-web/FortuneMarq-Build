"use client";

import { toast } from "@/components/ui/toast";

interface SupabaseResult<T> {
  data: T | null;
  error: { message: string } | null;
}

/**
 * Wraps a Supabase mutation so failures are never silent.
 *
 * Returns the data on success, or null on failure (after showing an
 * error toast). Callers must only update optimistic/local state when
 * the result is non-null:
 *
 *   const row = await runMutation("Log call outcome", () =>
 *     supabase.from("outreach_logs").insert(payload).select().single()
 *   );
 *   if (!row) return; // toast already shown, state untouched
 */
export async function runMutation<T>(
  label: string,
  fn: () => PromiseLike<SupabaseResult<T>>
): Promise<T | null> {
  try {
    const { data, error } = await fn();
    if (error) {
      console.error(`[mutation] ${label}:`, error.message);
      toast.error(`${label} failed`, error.message);
      return null;
    }
    return (data ?? ({} as T));
  } catch (err: any) {
    console.error(`[mutation] ${label}:`, err);
    toast.error(`${label} failed`, err?.message ?? "Unexpected error");
    return null;
  }
}

/**
 * Same as runMutation for calls where no row needs to come back —
 * resolves true on success, false on failure (toast already shown).
 */
export async function runMutationOk(
  label: string,
  fn: () => PromiseLike<{ error: { message: string } | null }>
): Promise<boolean> {
  try {
    const { error } = await fn();
    if (error) {
      console.error(`[mutation] ${label}:`, error.message);
      toast.error(`${label} failed`, error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error(`[mutation] ${label}:`, err);
    toast.error(`${label} failed`, err?.message ?? "Unexpected error");
    return false;
  }
}
