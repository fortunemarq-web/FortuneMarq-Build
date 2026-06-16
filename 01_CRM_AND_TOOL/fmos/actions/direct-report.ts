"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { sendWhatsAppTemplate, toWaNumber } from "@/lib/whatsapp/send";
import { buildComponents, leadScriptType, type WaTemplateConfig } from "@/lib/whatsapp/params";
import { slugify, chooseReport, type LeadType, type ReportAssetRow } from "@/lib/whatsapp/report-lookup";
import { isOptedOut } from "@/lib/whatsapp/recipients";
import { leadStageUpdate } from "@/lib/pipeline";

/**
 * Stage-3 Niche Curiosity Batch-Send.
 *
 * Throttled opener blast: filter by city + niche, auto-pick the A/B/C/D report
 * template, attach the matching market-intel PDF as the template's document header
 * (resolved from report_assets), honor opt-out, dedupe by stage, enforce a daily
 * rate cap, set curiosity_sent, and log (via send.ts) to whatsapp_logs.
 *
 * SERVER-ONLY. Inert until report_assets is seeded and WhatsApp creds are set.
 */

const ELIGIBLE_STAGES = ["touch1_pending", "new"]; // plus null/empty
const DEFAULT_DAILY_CAP = 50;
const SEND_SPACING_MS = 300;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface BlastInput {
  city: string;
  niche: string; // human niche, as stored in leads.industry
  leadType?: LeadType; // optional: restrict to one A/B/C/D type
  lang?: "en" | "kn"; // default "en"
  dailyCap?: number; // default 50
  perRunCap?: number; // optional extra cap for this run
  bodyParams?: string[]; // optional template body params (default: header-only)
  dryRun?: boolean; // count only, no sends, no stage writes
  testPhone?: string; // send ONE to this number to verify the PDF — no dedupe, no stage write
}

export interface BlastResult {
  ok: boolean;
  dryRun: boolean;
  test: boolean;
  matched: number;
  eligible: number;
  optedOut: number;
  withReport: number;
  noReport: number;
  sent: number;
  failed: number;
  capRemaining: number | null;
  message?: string;
  errors: string[];
}

function templateFor(leadType: string): string {
  return `direct_report_type_${String(leadType).toLowerCase()}`;
}

function emptyResult(over: Partial<BlastResult>): BlastResult {
  return {
    ok: false, dryRun: false, test: false, matched: 0, eligible: 0, optedOut: 0,
    withReport: 0, noReport: 0, sent: 0, failed: 0, capRemaining: null, errors: [],
    ...over,
  };
}

export async function runDirectReport(input: BlastInput): Promise<BlastResult> {
  const supabase = createAdminClient() as any;
  const lang = input.lang || "en";
  const slug = slugify(input.niche);
  const errors: string[] = [];

  if (!input.city || !input.niche) {
    return emptyResult({ message: "City and niche are required." });
  }

  // 1. Load the report library for this city + language, narrowed by slug match.
  const { data: allAssets, error: assetErr } = await supabase
    .from("report_assets")
    .select("*")
    .eq("city", input.city)
    .eq("lang", lang);
  if (assetErr) return emptyResult({ message: `Could not load report library: ${assetErr.message}` });

  const assets: ReportAssetRow[] = (allAssets || []).filter(
    (a: any) => slugify(a.niche_slug) === slug
  );
  if (assets.length === 0) {
    return emptyResult({
      message: `No report found for ${input.niche} / ${input.city} / ${lang}. Seed the report library first.`,
    });
  }

  // 2. Test-send path — verify the PDF attaches before any real blast.
  if (input.testPhone) {
    const to = toWaNumber(input.testPhone);
    if (!to) return emptyResult({ test: true, message: "Invalid test phone number." });
    const chosen = chooseReport(assets, input.leadType || "A") || assets[0];
    const cfg: WaTemplateConfig = {
      audience: "lead",
      headerDocument: { link: chosen.public_url, filename: chosen.filename },
      params: input.bodyParams,
    };
    const components = buildComponents(cfg, {});
    const r = await sendWhatsAppTemplate(to, templateFor(chosen.lead_type), {
      language: lang,
      components: components.length ? components : undefined,
    });
    return emptyResult({
      test: true,
      ok: r.success,
      sent: r.success ? 1 : 0,
      failed: r.success ? 0 : 1,
      message: r.success
        ? `Test report (${chosen.filename}) sent to ${to}.`
        : `Test send failed: ${r.error}`,
      errors: r.success ? [] : [r.error || "send failed"],
    });
  }

  // 3. Daily rate cap — count today's outbound direct_report_* sends.
  const cap = input.dailyCap ?? DEFAULT_DAILY_CAP;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const { count: sentToday } = await supabase
    .from("whatsapp_logs")
    .select("*", { count: "exact", head: true })
    .eq("direction", "outbound")
    .like("message_sent", "[template:direct_report%")
    .gte("sent_at", since.toISOString());
  let capRemaining = Math.max(0, cap - (sentToday || 0));
  if (input.perRunCap != null) capRemaining = Math.min(capRemaining, input.perRunCap);

  // 4. Candidate leads in the city; filter the rest in JS (slug match etc.).
  const { data: cityLeads, error: leadErr } = await supabase
    .from("leads")
    .select("*")
    .eq("city", input.city);
  if (leadErr) return emptyResult({ message: `Could not load leads: ${leadErr.message}` });

  let matched = 0;
  let optedOut = 0;
  let eligible = 0;
  let withReport = 0;
  let noReport = 0;
  let sent = 0;
  let failed = 0;

  const sendable: { lead: any; asset: ReportAssetRow }[] = [];

  for (const lead of cityLeads || []) {
    if (slugify(lead.industry || "") !== slug) continue;
    if (!toWaNumber(lead.phone || "")) continue;
    matched++;

    if (isOptedOut(lead)) {
      optedOut++;
      continue;
    }
    const stage = lead.outreach_stage;
    if (stage && !ELIGIBLE_STAGES.includes(stage)) continue; // dedupe: already progressed
    eligible++;

    const derived = leadScriptType(lead) as LeadType;
    const asset = chooseReport(assets, derived);
    if (!asset) {
      noReport++;
      continue;
    }
    if (input.leadType && asset.lead_type !== input.leadType) continue; // type filter
    withReport++;
    sendable.push({ lead, asset });
  }

  if (input.dryRun) {
    return {
      ok: true, dryRun: true, test: false, matched, eligible, optedOut, withReport, noReport,
      sent: 0, failed: 0, capRemaining,
      message: `${withReport} ready to send (cap allows ${capRemaining} today).`,
      errors: [],
    };
  }

  // 5. Send, respecting the cap.
  for (const { lead, asset } of sendable) {
    if (sent >= capRemaining) break;
    const cfg: WaTemplateConfig = {
      audience: "lead",
      headerDocument: { link: asset.public_url, filename: asset.filename },
      params: input.bodyParams,
    };
    const components = buildComponents(cfg, lead);
    const r = await sendWhatsAppTemplate(lead.phone, templateFor(asset.lead_type), {
      language: lang,
      components: components.length ? components : undefined,
      leadId: lead.id,
    });
    if (r.success) {
      sent++;
      const { error: stageErr } = await supabase
        .from("leads")
        .update(leadStageUpdate("curiosity_sent"))
        .eq("id", lead.id);
      if (stageErr) errors.push(`${lead.company_name || lead.id}: stage ${stageErr.message}`);
    } else {
      failed++;
      errors.push(`${lead.company_name || lead.id}: ${r.error}`);
    }
    await sleep(SEND_SPACING_MS);
  }

  const cappedNote = withReport > capRemaining ? ` (${withReport - capRemaining} held by daily cap)` : "";
  return {
    ok: true, dryRun: false, test: false, matched, eligible, optedOut, withReport, noReport,
    sent, failed, capRemaining: Math.max(0, capRemaining - sent),
    message: `Sent ${sent}, ${failed} failed${cappedNote}.`,
    errors: errors.slice(0, 25),
  };
}
