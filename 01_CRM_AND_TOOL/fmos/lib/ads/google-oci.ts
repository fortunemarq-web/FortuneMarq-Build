import type { AdConversionInput, SendResult } from "./meta-capi";

/**
 * Google Ads Offline Conversion Import (OCI) keyed by gclid.
 *
 * STATUS: structurally complete but INACTIVE until the Google Ads account exists
 * and these env vars are set (returns "no_setup" otherwise — never throws):
 *   GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET,
 *   GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID,
 *   GOOGLE_ADS_CONVERSION_ACTION_MEETING, GOOGLE_ADS_CONVERSION_ACTION_WON
 *   (optional: GOOGLE_ADS_LOGIN_CUSTOMER_ID for MCC, GOOGLE_ADS_API_VERSION)
 *
 * The developer token needs Google approval (can take days), so until launch the
 * interim path is GA4 → Google Ads conversion import (no code). Once the token +
 * OAuth refresh token exist, set the env vars and this activates with no code change.
 */

const API_VERSION = process.env.GOOGLE_ADS_API_VERSION || "v17";

function config() {
  const c = {
    devToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    clientId: process.env.GOOGLE_ADS_CLIENT_ID,
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID?.replace(/-/g, ""),
    loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, ""),
    actionMeeting: process.env.GOOGLE_ADS_CONVERSION_ACTION_MEETING,
    actionWon: process.env.GOOGLE_ADS_CONVERSION_ACTION_WON,
  };
  const ready = !!(c.devToken && c.clientId && c.clientSecret && c.refreshToken && c.customerId && c.actionMeeting);
  return { ...c, ready };
}

/** Google wants "yyyy-mm-dd HH:MM:SS+05:30" (with timezone). We operate in IST. */
function gAdsDateTime(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")} ${g("hour")}:${g("minute")}:${g("second")}+05:30`;
}

function actionResource(cfg: ReturnType<typeof config>, event: AdConversionInput["event_name"]): string {
  const raw = (event === "won" ? cfg.actionWon : cfg.actionMeeting) || "";
  // Accept either a full resource name or a bare numeric id.
  return raw.startsWith("customers/") ? raw : `customers/${cfg.customerId}/conversionActions/${raw}`;
}

async function accessToken(cfg: ReturnType<typeof config>): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId!,
      client_secret: cfg.clientSecret!,
      refresh_token: cfg.refreshToken!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`oauth ${res.status} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).access_token as string;
}

export async function uploadGoogleOci(c: AdConversionInput): Promise<SendResult> {
  if (!c.gclid) return { status: "skipped", response: "no gclid" };
  const cfg = config();
  if (!cfg.ready) return { status: "no_setup" };

  try {
    const token = await accessToken(cfg);
    const conversion: Record<string, unknown> = {
      gclid: c.gclid,
      conversionAction: actionResource(cfg, c.event_name),
      conversionDateTime: gAdsDateTime(c.occurred_at),
    };
    if (c.value != null) {
      conversion.conversionValue = c.value;
      conversion.currencyCode = c.currency;
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "developer-token": cfg.devToken!,
      "Content-Type": "application/json",
    };
    if (cfg.loginCustomerId) headers["login-customer-id"] = cfg.loginCustomerId;

    const res = await fetch(
      `https://googleads.googleapis.com/${API_VERSION}/customers/${cfg.customerId}:uploadClickConversions`,
      { method: "POST", headers, body: JSON.stringify({ conversions: [conversion], partialFailure: true }) }
    );
    const text = await res.text();
    if (!res.ok) return { status: "failed", response: `${res.status} ${text.slice(0, 400)}` };
    // partialFailureError surfaces per-conversion rejections even on HTTP 200.
    const json = JSON.parse(text || "{}");
    if (json.partialFailureError) return { status: "failed", response: JSON.stringify(json.partialFailureError).slice(0, 400) };
    return { status: "sent", response: text.slice(0, 400) };
  } catch (e) {
    return { status: "failed", response: e instanceof Error ? e.message : "upload error" };
  }
}
