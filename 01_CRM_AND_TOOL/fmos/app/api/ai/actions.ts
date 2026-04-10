"use server";

import { callOpenRouter } from "@/lib/openrouter";
import { getNicheScript } from "@/lib/niche-scripts";

/**
 * Returns the pre-built Kanglish telecaller script for the lead's niche.
 * Falls back to AI generation only if no pre-built script exists.
 */
export async function suggestCallOpener(niche: string, businessName: string, city: string) {
  const script = getNicheScript(niche);

  if (script) {
    return `📋 ${script.niche.toUpperCase()} — HUBLI SCRIPT\n\n${script.mainScript}\n\n---\n💡 DATA HOOK: "${script.dataHook}"\n🎯 MEETING ASK: "${script.meetingAsk}"`;
  }

  // Fallback to AI for niches not in our library
  const systemPrompt = `You are a telecaller script writer for a digital marketing agency in India.
Write short, natural Kanglish (Kannada + English) call scripts for local business owners in Hubli, Karnataka.`;
  const userPrompt = `Write a 7-step cold call script for a ${niche} business called "${businessName}" in ${city}.
Include: introduction, language check, permission, data hook, curiosity gap, soft pitch, meeting ask. Format as STEP 1 through STEP 7.`;
  return await callOpenRouter(systemPrompt, userPrompt, "script_suggester");
}

/**
 * Returns pre-built objection responses from the niche script.
 * Falls back to AI if niche not found.
 */
export async function handleObjection(niche: string, city: string, objectionText: string) {
  const script = getNicheScript(niche);

  if (script) {
    const lower = objectionText.toLowerCase();
    let matched = "";

    if (lower.includes("not interested") || lower.includes("interest illa")) {
      matched = `"${script.objections.not_interested}"`;
    } else if (lower.includes("agency") || lower.includes("already have")) {
      matched = `"${script.objections.has_agency}"`;
    } else if (lower.includes("budget") || lower.includes("money") || lower.includes("expensive")) {
      matched = `"${script.objections.no_budget}"`;
    } else if (lower.includes("busy") || lower.includes("call back") || lower.includes("later")) {
      matched = `"${script.objections.callback_later}"`;
    } else if (lower.includes("ourselves") || lower.includes("own") || lower.includes("doing it")) {
      matched = `"${script.objections.doing_own_marketing}"`;
    }

    return `📌 SCRIPT RESPONSES — ${script.niche}${matched ? `\n\n✅ BEST MATCH:\n${matched}` : ""}\n\n---\nALL OBJECTION RESPONSES:\n\n1. Not Interested:\n"${script.objections.not_interested}"\n\n2. Has Agency:\n"${script.objections.has_agency}"\n\n3. No Budget:\n"${script.objections.no_budget}"\n\n4. Call Back Later:\n"${script.objections.callback_later}"\n\n5. Doing Own Marketing:\n"${script.objections.doing_own_marketing}"`;
  }

  // Fallback to AI
  const systemPrompt = `You are a sales coach for a digital marketing agency in India. Give short, confident objection responses in Kanglish. 1-2 sentences max each.`;
  const userPrompt = `${niche} owner in ${city} said: "${objectionText}". Give 3 responses numbered 1, 2, 3.`;
  return await callOpenRouter(systemPrompt, userPrompt, "objection_handler");
}

/**
 * Morning brief — AI generated (personalised per day).
 */
export async function generateDailyBrief(data: {
  userName: string;
  followUpCount: number;
  freshLeadCount: number;
  warmLeads: { name: string; niche: string }[];
  callsYesterday: number;
  bestNiche: string;
}) {
  const systemPrompt = `You are a motivating sales team assistant for a digital marketing agency in India.
Write a short energetic morning brief for a telecaller. Be encouraging and specific. Max 4 sentences. Write in English.`;
  const userPrompt = `Today's data for ${data.userName}:
- Follow-ups due: ${data.followUpCount}
- Fresh leads to call: ${data.freshLeadCount}
- Warm leads: ${data.warmLeads.map((l) => `${l.name} (${l.niche})`).join(", ") || "none"}
- Calls yesterday: ${data.callsYesterday}
- Best niche: ${data.bestNiche}
Write their morning brief.`;
  return await callOpenRouter(systemPrompt, userPrompt, "morning_brief");
}

/**
 * Weekly agency report — AI generated.
 */
export async function generateWeeklyAgencyReport(json_data: any) {
  const systemPrompt = `You are a business analyst writing a weekly report for a digital marketing agency owner in India. Be concise and insightful.`;
  const userPrompt = `Last week's data:\n${JSON.stringify(json_data, null, 2)}\n\nWrite a 3-paragraph summary: performance, what worked, 2 recommendations.`;
  return await callOpenRouter(systemPrompt, userPrompt, "weekly_report", 1000);
}
