import { NextRequest, NextResponse } from "next/server";
import { processInboundLead, CHANNEL_LABELS, InboundLeadInput } from "@/lib/inbound/capture";

/**
 * PHASE F — universal inbound webhook.
 *   POST /api/inbound/lp                — normalized JSON (own properties)
 *   POST /api/inbound/google_lead_form  — Google Ads lead form payload (native shape)
 *   POST /api/inbound/meta_lead_ad      — normalized now; Graph adapter in Stage 1
 *   POST /api/inbound/test              — dry-channel for end-to-end testing
 *
 * Auth: INBOUND_WEBHOOK_SECRET via Authorization: Bearer, x-webhook-key
 * header, ?key= query param, or google_key in the body (Google's native field).
 */

function verifyKey(req: NextRequest, body: any): boolean {
  const secret = process.env.INBOUND_WEBHOOK_SECRET;
  if (!secret) return false; // fail closed
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  if (req.headers.get("x-webhook-key") === secret) return true;
  if (new URL(req.url).searchParams.get("key") === secret) return true;
  if (body && body.google_key === secret) return true;
  return false;
}

/** Google Ads lead form webhook → normalized input */
function adaptGoogleLeadForm(body: any): Partial<InboundLeadInput> {
  const cols: Record<string, string> = {};
  (body.user_column_data || []).forEach((c: any) => {
    cols[(c.column_id || c.column_name || "").toUpperCase()] = c.string_value;
  });
  return {
    external_id: body.lead_id,
    contact_person: cols["FULL_NAME"] || [cols["FIRST_NAME"], cols["LAST_NAME"]].filter(Boolean).join(" ") || undefined,
    company_name: cols["COMPANY_NAME"] || undefined,
    phone: cols["PHONE_NUMBER"] || "",
    email: cols["EMAIL"] || undefined,
    city: cols["CITY"] || undefined,
    campaign_external_id: body.campaign_id ? String(body.campaign_id) : undefined,
    gclid: body.gcl_id || undefined,
    utm: { source: "google", medium: "lead_form" },
  };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;

  if (!CHANNEL_LABELS[channel] && channel !== "test") {
    return NextResponse.json({ error: `Unknown channel '${channel}'` }, { status: 404 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!verifyKey(req, body)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const normalized: InboundLeadInput =
    channel === "google_lead_form"
      ? ({ channel, ...adaptGoogleLeadForm(body), raw: body } as InboundLeadInput)
      : ({
          channel: channel === "test" ? "manual" : channel,
          external_id: body.external_id,
          company_name: body.company_name,
          contact_person: body.contact_person || body.name,
          email: body.email,
          phone: body.phone || "",
          industry: body.industry || body.niche,
          city: body.city,
          message: body.message,
          utm: body.utm,
          gclid: body.gclid,
          fbclid: body.fbclid,
          landing_page: body.landing_page,
          referrer_url: body.referrer_url,
          campaign_external_id: body.campaign_external_id,
          campaign_name: body.campaign_name,
          adset_name: body.adset_name,
          ad_name: body.ad_name,
          raw: body,
        } as InboundLeadInput);

  const result = await processInboundLead(normalized);
  return NextResponse.json(result, { status: result.success ? 200 : 422 });
}

/** Webhook validation handshake (Google sends a GET to verify the URL) */
export async function GET() {
  return NextResponse.json({ ok: true, service: "fmos-inbound" });
}
