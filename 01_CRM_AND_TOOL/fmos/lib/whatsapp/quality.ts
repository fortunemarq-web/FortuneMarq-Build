import { createAdminClient } from "@/lib/supabase-admin";
import { sendAdminAlert } from "@/lib/whatsapp/admin-alert";

/**
 * 6.4 — Meta messaging quality + tier observability.
 *
 * Two entry points:
 *   - fetchMessagingHealth(): GET the phone-number node for quality_rating +
 *     messaging tier (poll path, called by the daily cron).
 *   - recordAndAlertHealth(): compare against the last-known values stored in
 *     app_settings and fire an admin_alert when quality DROPS or the tier changes.
 *     Used by both the cron and the webhook's phone_number_quality_update handler.
 */

const GRAPH_VERSION = "v23.0";

export type QualityRating = "GREEN" | "YELLOW" | "RED" | "UNKNOWN";

const QUALITY_RANK: Record<QualityRating, number> = {
  GREEN: 3,
  YELLOW: 2,
  RED: 1,
  UNKNOWN: 0,
};

export interface MessagingHealth {
  quality: QualityRating;
  tier: string | null; // e.g. "TIER_1K", "TIER_10K", "TIER_100K", "TIER_UNLIMITED"
}

function normalizeQuality(raw: any): QualityRating {
  const v = String(raw || "").toUpperCase();
  return v === "GREEN" || v === "YELLOW" || v === "RED" ? (v as QualityRating) : "UNKNOWN";
}

/** Poll the Graph API for the WABA phone number's current quality + tier. */
export async function fetchMessagingHealth(): Promise<MessagingHealth | null> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId || token.startsWith("PLACEHOLDER")) return null;

  try {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}?fields=quality_rating,messaging_limit_tier&access_token=${token}`;
    const res = await fetch(url);
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[whatsapp/quality] fetch error:", json?.error?.message || res.status);
      return null;
    }
    return {
      quality: normalizeQuality(json.quality_rating),
      tier: json.messaging_limit_tier ?? null,
    };
  } catch (e) {
    console.error("[whatsapp/quality] network error:", e);
    return null;
  }
}

/**
 * Persist the latest health snapshot and alert on a meaningful change.
 * Returns what (if anything) was alerted.
 */
export async function recordAndAlertHealth(
  current: MessagingHealth
): Promise<{ alerted: boolean; reason?: "quality_drop" | "tier_change" }> {
  const supabase = createAdminClient() as any;

  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "whatsapp_messaging_health")
    .maybeSingle();

  const prev = data?.value as { quality?: QualityRating; tier?: string | null } | undefined;
  const prevQuality = normalizeQuality(prev?.quality);
  const prevTier = prev?.tier ?? null;

  // Persist the new snapshot regardless.
  await supabase.from("app_settings").upsert(
    {
      key: "whatsapp_messaging_health",
      value: { quality: current.quality, tier: current.tier, checked_at: new Date().toISOString() },
    },
    { onConflict: "key" }
  );

  // First-ever read — nothing to compare against.
  if (!prev) return { alerted: false };

  // Quality dropped (e.g. GREEN→YELLOW, YELLOW→RED).
  if (QUALITY_RANK[current.quality] < QUALITY_RANK[prevQuality]) {
    await sendAdminAlert(
      "WhatsApp quality dropped",
      `Quality rating fell ${prevQuality} → ${current.quality}. Review template content + opt-outs; pause non-essential sends if it worsens.`
    ).catch(() => {});
    return { alerted: true, reason: "quality_drop" };
  }

  // Tier changed (up or down — both worth knowing; a downgrade tightens the daily limit).
  if (current.tier && current.tier !== prevTier) {
    await sendAdminAlert(
      "WhatsApp messaging tier changed",
      `Messaging tier moved ${prevTier ?? "unknown"} → ${current.tier}.`
    ).catch(() => {});
    return { alerted: true, reason: "tier_change" };
  }

  return { alerted: false };
}

/**
 * Webhook fast-path: Meta sends phone_number_quality_update with the new rating
 * inline. Record + alert without a Graph round-trip.
 */
export async function handleQualityWebhook(value: any): Promise<void> {
  // Meta payloads vary across the quality/limit update events; try common shapes.
  const rating = normalizeQuality(
    value?.current_quality_rating ?? value?.quality_rating ?? value?.event
  );
  const tier = value?.current_limit ?? value?.messaging_limit_tier ?? null;
  await recordAndAlertHealth({ quality: rating, tier });
}
