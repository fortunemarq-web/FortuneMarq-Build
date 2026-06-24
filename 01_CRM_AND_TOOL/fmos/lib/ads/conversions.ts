import type { SupabaseClient } from "@supabase/supabase-js";
import { sendMetaCapi, type AdConversionInput, type SendResult } from "./meta-capi";
import { uploadGoogleOci } from "./google-oci";

/**
 * Offline ad-conversion sync. Two phases per run:
 *  1. ENQUEUE — leads that hit a milestone (meeting booked / won) AND arrived from
 *     a paid click (gclid/fbclid on attribution) get a pending ad_conversions row.
 *  2. UPLOAD  — pending rows are sent to Meta CAPI (fbclid) + Google OCI (gclid).
 *
 * Idempotent + retryable: unique(lead_id,event_name) prevents double-enqueue;
 * a row stays `pending` on no_token/no_setup (auto-sends once configured) and on
 * transient failure (up to MAX_ATTEMPTS), and becomes terminal on success/skip.
 */

const MAX_ATTEMPTS = 5;
const SRC_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";

export interface SyncSummary {
  enqueued: number;
  meta: { sent: number; skipped: number; pending: number; failed: number };
  google: { sent: number; skipped: number; pending: number; failed: number };
}

// Decide the new per-platform status. `undefined` = leave pending (retry later).
function resolve(r: SendResult, attempts: number): { status?: string; sent: boolean } {
  if (r.status === "sent") return { status: "sent", sent: true };
  if (r.status === "skipped") return { status: "skipped", sent: false };
  if (r.status === "no_token" || r.status === "no_setup") return { status: undefined, sent: false };
  return attempts + 1 >= MAX_ATTEMPTS ? { status: "failed", sent: false } : { status: undefined, sent: false };
}

export async function syncAdConversions(supabase: SupabaseClient): Promise<SyncSummary> {
  const sum: SyncSummary = {
    enqueued: 0,
    meta: { sent: 0, skipped: 0, pending: 0, failed: 0 },
    google: { sent: 0, skipped: 0, pending: 0, failed: 0 },
  };

  // ── 1. ENQUEUE ───────────────────────────────────────────────
  const { data: attr } = await supabase
    .from("lead_source_attribution")
    .select("lead_id, gclid, fbclid, leads!inner(meeting_booked_at, outreach_stage, last_activity_at)")
    .or("gclid.not.is.null,fbclid.not.is.null")
    .limit(1000);

  const toEnqueue: Record<string, unknown>[] = [];
  for (const a of (attr ?? []) as any[]) {
    const L = a.leads;
    if (!L) continue;
    const base = { lead_id: a.lead_id, gclid: a.gclid, fbclid: a.fbclid, currency: "INR" };
    if (L.meeting_booked_at) toEnqueue.push({ ...base, event_name: "meeting", occurred_at: L.meeting_booked_at });
    if (L.outreach_stage === "won") toEnqueue.push({ ...base, event_name: "won", occurred_at: L.last_activity_at ?? new Date().toISOString() });
  }
  if (toEnqueue.length) {
    const { error } = await supabase
      .from("ad_conversions")
      .upsert(toEnqueue, { onConflict: "lead_id,event_name", ignoreDuplicates: true });
    if (!error) sum.enqueued = toEnqueue.length; // upper bound (existing rows are no-ops)
  }

  // ── 2. UPLOAD ────────────────────────────────────────────────
  const { data: pending } = await supabase
    .from("ad_conversions")
    .select("*, leads!inner(email, phone)")
    .or("meta_status.eq.pending,google_status.eq.pending")
    .limit(200);

  for (const row of (pending ?? []) as any[]) {
    const input: AdConversionInput = {
      event_name: row.event_name,
      occurred_at: row.occurred_at,
      gclid: row.gclid,
      fbclid: row.fbclid,
      value: row.value,
      currency: row.currency,
      email: row.leads?.email,
      phone: row.leads?.phone,
    };
    const patch: Record<string, unknown> = { attempts: (row.attempts ?? 0) + 1 };

    if (row.meta_status === "pending") {
      const r = await sendMetaCapi(input, SRC_URL);
      const next = resolve(r, row.attempts ?? 0);
      patch.meta_response = r.response ?? r.status;
      if (next.status) patch.meta_status = next.status;
      if (next.sent) patch.meta_sent_at = new Date().toISOString();
      sum.meta[(next.status as keyof SyncSummary["meta"]) ?? "pending"]++;
    }
    if (row.google_status === "pending") {
      const r = await uploadGoogleOci(input);
      const next = resolve(r, row.attempts ?? 0);
      patch.google_response = r.response ?? r.status;
      if (next.status) patch.google_status = next.status;
      if (next.sent) patch.google_sent_at = new Date().toISOString();
      sum.google[(next.status as keyof SyncSummary["google"]) ?? "pending"]++;
    }

    await supabase.from("ad_conversions").update(patch).eq("id", row.id);
  }

  return sum;
}
