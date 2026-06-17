"use server";

/**
 * 4.6 — monthly_report_ready auto-send.
 *
 * Call after a client report is published. Ensures the report has a magic-link
 * token (the new-report form historically didn't set one, so the public link
 * was dead), then sends monthly_report_ready to the client with the public URL.
 *
 * Send is gated by WHATSAPP_SEND_MODE via the template layer.
 */

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { sendMonthlyReportReady } from "@/lib/whatsapp/delivery-sends";
import { nanoid } from "nanoid";

const APP_URL = () =>
  (process.env.NEXT_PUBLIC_APP_URL || "https://fmos.fortunemarq.com").replace(/\/$/, "");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthLabel(reportMonth: string | null): string {
  if (!reportMonth) return "your latest";
  // report_month stored as "YYYY-MM-01"
  const m = reportMonth.match(/^(\d{4})-(\d{2})/);
  if (!m) return "your latest";
  const idx = parseInt(m[2], 10) - 1;
  return MONTHS[idx] ? `${MONTHS[idx]} ${m[1]}` : "your latest";
}

export interface NotifyReportResult {
  ok: boolean;
  url?: string;
  skipped?: "no_phone" | "not_published";
  error?: string;
}

export async function notifyReportReady(reportId: string): Promise<NotifyReportResult> {
  const supabase = (await createServerClientWithCookies()) as any;

  const { data: report, error } = await supabase
    .from("client_reports")
    .select("id, client_id, report_month, is_published, magic_link_token")
    .eq("id", reportId)
    .maybeSingle();

  if (error || !report) return { ok: false, error: error?.message ?? "Report not found." };
  if (!report.is_published) return { ok: false, skipped: "not_published" };

  // Ensure a magic-link token exists (32 chars — within the public route's 16–128 guard).
  let token: string = report.magic_link_token;
  if (!token) {
    token = nanoid(32);
    const { error: tokErr } = await supabase
      .from("client_reports")
      .update({ magic_link_token: token })
      .eq("id", reportId);
    if (tokErr) return { ok: false, error: `Couldn't set report link: ${tokErr.message}` };
  }

  // Resolve client contact.
  const { data: client } = await supabase
    .from("clients")
    .select("business_name, owner_name, phone")
    .eq("id", report.client_id)
    .maybeSingle();

  const phone = client?.phone ?? null;
  const contactName = client?.owner_name || client?.business_name || "there";
  if (!phone) return { ok: false, skipped: "no_phone" };

  const url = `${APP_URL()}/client/report/${token}`;
  const res = await sendMonthlyReportReady(phone, contactName, monthLabel(report.report_month), url).catch(
    (e) => {
      console.error("[notify-report-ready] send failed:", e);
      return { success: false, error: String(e) } as { success: boolean; error?: string };
    }
  );

  if (!res.success) return { ok: false, url, error: res.error ?? "WhatsApp send failed." };
  return { ok: true, url };
}
