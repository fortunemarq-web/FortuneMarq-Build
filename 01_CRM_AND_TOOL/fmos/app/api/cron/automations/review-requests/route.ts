import { createAdminClient } from "@/lib/supabase-admin";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withHeartbeat } from "@/lib/cron-heartbeat";

export const POST = withHeartbeat("review-requests", postHandler);

import { type NextRequest, NextResponse } from "next/server";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/send";

/**
 * 4.8 — Review + referral flywheel.
 *
 * Once a client has been delivered to for a while, asks ONCE for a Google review
 * (`review_request`) and, a bit later, a referral (`referral_request`). Each ask
 * is logged to review_requests(kind) so a client is never double-asked. The asks
 * compound the agency's own growth: reviews lift the GMB ranking, referrals are
 * the cheapest leads.
 *
 * GATED ON THE LINKS — does nothing until these are set (the agency's own URLs):
 *   FORTUNEMARQ_REVIEW_URL    — Google review link  ({{3}} in review_request)
 *   FORTUNEMARQ_REFERRAL_URL  — referral/contact link ({{3}} in referral_request)
 * If only the review URL is set, only review asks go out. `?dry=1` previews
 * candidates without sending. Every send still passes through the WhatsApp choke
 * point (throttle + allowlist).
 */

async function postHandler(req: NextRequest) {
  const denied = verifyCronSecret(req);
  if (denied) return denied;

  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const supabase = createAdminClient();

  const reviewUrl = process.env.FORTUNEMARQ_REVIEW_URL || "";
  const referralUrl = process.env.FORTUNEMARQ_REFERRAL_URL || "";
  const reviewAfter = Number(process.env.REVIEW_AFTER_DAYS) || 21;
  const referralAfter = Number(process.env.REFERRAL_AFTER_DAYS) || 45;
  const batch = Number(process.env.REVIEW_BATCH) || 25;

  try {
    // Delivered-to clients (past onboarding) with a phone.
    const { data: clients, error } = await (supabase.from("clients") as any)
      .select("id, business_name, owner_name, phone, start_date, status")
      .neq("status", "onboarding")
      .not("phone", "is", null)
      .limit(500);
    if (error) throw error;

    // Who's already been asked (dedup, per kind).
    const { data: asks } = await supabase.from("review_requests").select("client_id, kind");
    const asked = new Set((asks || []).map((a: any) => `${a.client_id}:${a.kind || "review"}`));

    const now = Date.now();
    const reviewCutoff = now - reviewAfter * 86400000;
    const referralCutoff = now - referralAfter * 86400000;

    const reviewTargets: any[] = [];
    const referralTargets: any[] = [];
    for (const c of (clients || []) as any[]) {
      const since = c.start_date ? new Date(c.start_date).getTime() : null;
      if (since == null) continue;
      if (reviewUrl && since < reviewCutoff && !asked.has(`${c.id}:review`)) reviewTargets.push(c);
      if (referralUrl && since < referralCutoff && !asked.has(`${c.id}:referral`)) referralTargets.push(c);
    }

    if (dry) {
      return NextResponse.json({
        success: true,
        mode: "dry-run",
        review_url_set: !!reviewUrl,
        referral_url_set: !!referralUrl,
        review_candidates: reviewTargets.length,
        referral_candidates: referralTargets.length,
        sample: [
          ...reviewTargets.slice(0, 3).map((c) => ({ kind: "review", business: c.business_name })),
          ...referralTargets.slice(0, 3).map((c) => ({ kind: "referral", business: c.business_name })),
        ],
      });
    }

    const send = async (c: any, template: string, link: string, kind: string): Promise<boolean> => {
      const components = [
        {
          type: "body",
          parameters: [
            { type: "text", text: c.owner_name || c.business_name || "there" },
            { type: "text", text: c.business_name || "your business" },
            { type: "text", text: link },
          ],
        },
      ];
      const r = await sendWhatsAppTemplate(c.phone, template, { language: "en", components });
      if (r.success) {
        await supabase.from("review_requests").insert({ client_id: c.id, kind, method: "whatsapp" });
        return true;
      }
      return false;
    };

    let reviewsSent = 0;
    let referralsSent = 0;
    let skipped = 0;
    for (const c of reviewTargets.slice(0, batch)) {
      (await send(c, process.env.REVIEW_TEMPLATE || "review_request", reviewUrl, "review")) ? reviewsSent++ : skipped++;
    }
    for (const c of referralTargets.slice(0, batch)) {
      (await send(c, "referral_request", referralUrl, "referral")) ? referralsSent++ : skipped++;
    }

    return NextResponse.json({ success: true, reviewsSent, referralsSent, skipped });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// Vercel/GitHub cron invokes via GET; same handler, same secret check.
export { POST as GET };
