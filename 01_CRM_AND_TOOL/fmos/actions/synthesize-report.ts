"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { callAnthropic } from "@/lib/anthropic";

export interface SynthesizeResult {
  ok: boolean;
  summary?: string;
  error?: string;
}

/**
 * Draft an AI client-facing performance summary for a monthly/weekly report.
 * Pulls real client + project context and asks the model to summarise it. The
 * result is a draft the admin reviews/edits before publishing — never auto-sent.
 */
export async function synthesizeReportSummary(
  clientId: string,
  reportMonth: string,
  reportType: string
): Promise<SynthesizeResult> {
  if (!clientId) return { ok: false, error: "Missing client" };
  const supabase = await createServerClientWithCookies();

  const { data: client } = await supabase
    .from("clients")
    .select("business_name, niche, city, services, monthly_value, health_score, start_date, package_tier")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) return { ok: false, error: "Client not found" };

  const { data: projects } = await supabase
    .from("projects")
    .select("name, service_type, status, delivery_stage, completion_percentage")
    .eq("client_id", clientId)
    .limit(10);

  const context = { client, projects: projects || [], reportMonth, reportType };

  const system =
    "You are a senior account manager at FortuneMarq, a digital marketing agency in Hubli, India. " +
    "Write a concise, warm, client-facing performance summary for a client report. " +
    "120–180 words of plain prose — no markdown headers, no bullet points. " +
    "Cover progress made, concrete wins, and clear next steps. Use ONLY the data provided; " +
    "never invent specific metrics or numbers that aren't given.";
  const user =
    `Write the ${reportType} performance summary for ${reportMonth} for this client. ` +
    `Here is the available context as JSON:\n${JSON.stringify(context, null, 2)}`;

  const text = await callAnthropic(system, user, "client_report_summary", 450);
  if (!text || text.startsWith("AI Error")) {
    return { ok: false, error: text || "AI returned no content" };
  }
  return { ok: true, summary: text.trim() };
}
