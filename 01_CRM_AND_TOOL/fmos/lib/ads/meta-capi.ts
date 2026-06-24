import crypto from "crypto";

/**
 * Meta Conversions API (server-side conversions).
 * Fires a high-intent server event (meeting booked / deal won) keyed by the
 * stored fbclid, so Meta can attribute + optimize for real outcomes — more
 * robust than the browser Pixel alone (ad-blockers, ITP, lost sessions).
 *
 * Activates the moment META_CAPI_TOKEN is set in the env (the Pixel id reuses the
 * already-configured NEXT_PUBLIC_META_PIXEL_ID). Until then sendMetaCapi() is a
 * no-op that reports "no_token" — nothing breaks.
 */

export interface AdConversionInput {
  event_name: "meeting" | "won";
  occurred_at: string; // ISO
  gclid: string | null;
  fbclid: string | null;
  value: number | null;
  currency: string;
  email?: string | null;
  phone?: string | null;
}

export type SendResult = { status: "sent" | "skipped" | "no_token" | "no_setup" | "failed"; response?: string };

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";
// meeting = mid-funnel qualified lead → "Schedule"; won = closed → "Purchase".
const META_EVENT: Record<AdConversionInput["event_name"], string> = { meeting: "Schedule", won: "Purchase" };

const sha256 = (v: string) => crypto.createHash("sha256").update(v).digest("hex");
const normEmail = (e?: string | null) => (e ? e.trim().toLowerCase() : "");
const normPhone = (p?: string | null) => {
  if (!p) return "";
  let d = p.replace(/\D/g, "");
  if (d.length === 10) d = "91" + d; // assume India when no country code
  return d;
};

/** Pure builder — Meta CAPI request body. Exported for unit testing. */
export function buildMetaPayload(c: AdConversionInput, eventSourceUrl: string) {
  const user_data: Record<string, unknown> = {};
  const em = normEmail(c.email);
  if (em) user_data.em = [sha256(em)];
  const ph = normPhone(c.phone);
  if (ph) user_data.ph = [sha256(ph)];
  // fbc carries the click id in Meta's expected shape: fb.1.<unix_ms>.<fbclid>
  if (c.fbclid) user_data.fbc = `fb.1.${new Date(c.occurred_at).getTime()}.${c.fbclid}`;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: META_EVENT[c.event_name],
        event_time: Math.floor(new Date(c.occurred_at).getTime() / 1000),
        action_source: "website",
        event_source_url: eventSourceUrl,
        user_data,
        custom_data: c.value != null ? { value: c.value, currency: c.currency } : {},
      },
    ],
  };
  if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;
  return payload;
}

export async function sendMetaCapi(c: AdConversionInput, eventSourceUrl: string): Promise<SendResult> {
  if (!c.fbclid) return { status: "skipped", response: "no fbclid" };
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return { status: "no_token" };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixel}/events?access_token=${encodeURIComponent(token)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildMetaPayload(c, eventSourceUrl)) }
    );
    const text = await res.text();
    return res.ok ? { status: "sent", response: text.slice(0, 500) } : { status: "failed", response: `${res.status} ${text.slice(0, 400)}` };
  } catch (e) {
    return { status: "failed", response: e instanceof Error ? e.message : "fetch error" };
  }
}
