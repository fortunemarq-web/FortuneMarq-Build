"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { runBackup, type BackupResult } from "@/lib/backup/export";
import { revalidatePath } from "next/cache";

/** Admin-only manual backup trigger (the page is also gated, but verify here too). */
export async function runBackupNow(): Promise<BackupResult> {
  const sb = await createServerClientWithCookies();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if ((profile as { role?: string } | null)?.role !== "admin") return { ok: false, error: "Admins only" };

  const result = await runBackup(new Date().toISOString());
  revalidatePath("/admin/backups");
  return result;
}
