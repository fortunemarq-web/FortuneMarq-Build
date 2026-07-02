import { createServerClientWithCookies } from "@/lib/supabase-server";

export const STAFF_ROLES = ["admin", "telecaller", "strategist", "pm", "staff"] as const;

/** Current caller's profile role, or null if unauthenticated / no profile (e.g. a client-portal user). */
export async function getCallerRole(): Promise<string | null> {
  const sb = await createServerClientWithCookies();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return (data as { role?: string } | null)?.role ?? null;
}

export const isStaff = (role: string | null) => !!role && (STAFF_ROLES as readonly string[]).includes(role);
