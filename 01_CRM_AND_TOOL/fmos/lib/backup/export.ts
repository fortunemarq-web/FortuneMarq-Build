import { createAdminClient } from "@/lib/supabase-admin";

// 6.9 — application-level data export. A business-continuity safety net on top of
// Supabase's own PITR: snapshots the core business tables to a private Storage
// bucket as one JSON file per run, and prunes snapshots older than RETENTION_DAYS.

export const BACKUP_BUCKET = "backups";
const RETENTION_DAYS = 30;

// The tables whose loss would actually hurt. (activity_events/audit are covered by
// Supabase PITR and are large — intentionally excluded to keep snapshots lean.)
const TABLES = ["leads", "clients", "invoices", "proposals", "market_insights", "profiles"] as const;

async function fetchAll(sb: any, table: string): Promise<any[]> {
  const rows: any[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await sb.from(table).select("*").range(from, from + size - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < size) break;
  }
  return rows;
}

export interface BackupResult {
  ok: boolean;
  file?: string;
  bytes?: number;
  counts?: Record<string, number>;
  pruned?: number;
  error?: string;
}

/** Run a full export. Used by the daily cron and the "Run backup now" admin action. */
export async function runBackup(dateIso: string): Promise<BackupResult> {
  try {
    const sb = createAdminClient() as any;
    const date = dateIso.slice(0, 10); // YYYY-MM-DD (caller passes a real timestamp)

    const counts: Record<string, number> = {};
    const tables: Record<string, any[]> = {};
    for (const t of TABLES) {
      const rows = await fetchAll(sb, t);
      tables[t] = rows;
      counts[t] = rows.length;
    }

    const payload = JSON.stringify({ generated_at: dateIso, retention_days: RETENTION_DAYS, counts, tables });
    const bytes = Buffer.byteLength(payload, "utf8");
    const file = `fmos-backup-${date}.json`;

    const up = await sb.storage.from(BACKUP_BUCKET).upload(file, payload, {
      contentType: "application/json",
      upsert: true,
    });
    if (up.error) throw new Error(`upload: ${up.error.message}`);

    // prune snapshots older than retention
    let pruned = 0;
    const { data: list } = await sb.storage.from(BACKUP_BUCKET).list("", { limit: 1000 });
    if (list) {
      const cutoff = Date.now() - RETENTION_DAYS * 86400000;
      const stale = (list as any[])
        .filter((f) => f.name?.startsWith("fmos-backup-") && f.created_at && new Date(f.created_at).getTime() < cutoff)
        .map((f) => f.name);
      if (stale.length) {
        await sb.storage.from(BACKUP_BUCKET).remove(stale);
        pruned = stale.length;
      }
    }

    return { ok: true, file, bytes, counts, pruned };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
