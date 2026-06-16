"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { createMeetingEvent, rescheduleMeetingEvent, cancelMeetingEvent } from "@/lib/google/calendar";
import { sendOutcomeWhatsApp } from "@/actions/outcome-wa-send";
import { sendWhatsAppTemplate, toWaNumber } from "@/lib/whatsapp/send";
import { buildComponents } from "@/lib/whatsapp/params";

const IST = "Asia/Kolkata";
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { timeZone: IST, weekday: "short", day: "numeric", month: "short" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: true });
}

// ─── Book ────────────────────────────────────────────────────────────────────

export interface BookMeetingResult {
  ok: boolean;
  meetLink?: string;
  calendarLink?: string;
  calEventId?: string;
  error?: string;
}

export async function bookMeeting(opts: {
  leadId: string;
  startIso: string;
  lang?: string;
}): Promise<BookMeetingResult> {
  const supabase = createAdminClient();
  const { data: lead } = await (supabase.from("leads") as any)
    .select("id, company_name, phone, industry, city, contact_person, pitch_type, wa_opt_out")
    .eq("id", opts.leadId)
    .single();

  if (!lead) return { ok: false, error: "Lead not found" };

  const company = lead.company_name || "Client";
  const lang = opts.lang || "en";

  // 1. Create Google Calendar event + Meet link
  const calResult = await createMeetingEvent({
    title: `Meeting — ${company} (${lead.industry || ""}, ${lead.city || ""})`,
    startIso: opts.startIso,
    durationMinutes: 60,
    description: `FMOS lead meeting.\nIndustry: ${lead.industry}\nCity: ${lead.city}\nContact: ${lead.contact_person || "—"}`,
  });

  const meetLink = calResult.meetLink || "";
  const calEventId = calResult.eventId || "";
  const startIso = calResult.startIso || opts.startIso;
  const endIso = calResult.endIso || "";

  // 2. Write meetLink + cal event id back to the lead
  await (supabase.from("leads") as any)
    .update({
      meeting_link: meetLink,
      follow_up_date: startIso,
      // store cal event id for reschedule/cancel — reuse meeting_notes prefix if no dedicated col
      meeting_notes: calEventId ? `[gcal:${calEventId}]` : undefined,
    })
    .eq("id", opts.leadId);

  // 3. Send meeting_confirmation WhatsApp
  await sendOutcomeWhatsApp({
    leadId: opts.leadId,
    outcome: "INTERESTED_BOOK",
    followUpDate: startIso,
    meetLink,
    lang,
  });

  // 4. Schedule 1h reminder
  await scheduleReminder({
    leadId: opts.leadId,
    phone: lead.phone,
    templateName: "meeting_reminder_1h",
    params: [company, fmtDate(startIso), fmtTime(startIso), meetLink],
    lang,
    meetingStart: startIso,
    offsetMinutes: -60,
  });

  // 5. Schedule 15m reminder
  await scheduleReminder({
    leadId: opts.leadId,
    phone: lead.phone,
    templateName: "meeting_reminder_15m",
    params: [company, fmtTime(startIso), meetLink],
    lang,
    meetingStart: startIso,
    offsetMinutes: -15,
  });

  if (!calResult.ok) {
    // Calendar failed but we still sent WA — return partial ok
    return {
      ok: true,
      meetLink: "",
      calendarLink: "",
      calEventId: "",
      error: `Calendar: ${calResult.error} (WhatsApp confirmation still sent)`,
    };
  }

  return { ok: true, meetLink, calendarLink: calResult.calendarLink, calEventId };
}

// ─── Reschedule ──────────────────────────────────────────────────────────────

export interface RescheduleMeetingResult {
  ok: boolean;
  meetLink?: string;
  error?: string;
}

export async function rescheduleMeeting(opts: {
  leadId: string;
  newStartIso: string;
  lang?: string;
}): Promise<RescheduleMeetingResult> {
  const supabase = createAdminClient();
  const { data: lead } = await (supabase.from("leads") as any)
    .select("id, company_name, phone, meeting_notes, wa_opt_out, pitch_type")
    .eq("id", opts.leadId)
    .single();

  if (!lead) return { ok: false, error: "Lead not found" };

  const lang = opts.lang || "en";
  const company = lead.company_name || "Client";

  // Extract stored cal event id from meeting_notes prefix
  const calEventIdMatch = String(lead.meeting_notes || "").match(/\[gcal:([^\]]+)\]/);
  const calEventId = calEventIdMatch?.[1];

  let meetLink = "";

  if (calEventId) {
    const r = await rescheduleMeetingEvent({ eventId: calEventId, startIso: opts.newStartIso });
    meetLink = r.meetLink || "";
    if (!r.ok) console.error("[reschedule] calendar update failed:", r.error);
  }

  // Update lead
  await (supabase.from("leads") as any)
    .update({ follow_up_date: opts.newStartIso, meeting_link: meetLink || undefined })
    .eq("id", opts.leadId);

  // Cancel old reminders and reschedule
  await (supabase as any).from("scheduled_messages")
    .update({ status: "cancelled" })
    .eq("lead_id", opts.leadId)
    .in("template_name", ["meeting_reminder_1h", "meeting_reminder_15m"]);

  await scheduleReminder({
    leadId: opts.leadId,
    phone: lead.phone,
    templateName: "meeting_reminder_1h",
    params: [company, fmtDate(opts.newStartIso), fmtTime(opts.newStartIso), meetLink],
    lang,
    meetingStart: opts.newStartIso,
    offsetMinutes: -60,
  });

  await scheduleReminder({
    leadId: opts.leadId,
    phone: lead.phone,
    templateName: "meeting_reminder_15m",
    params: [company, fmtTime(opts.newStartIso), meetLink],
    lang,
    meetingStart: opts.newStartIso,
    offsetMinutes: -15,
  });

  // Send rescheduled confirmation
  const phone = lead.phone;
  if (phone && toWaNumber(phone)) {
    const cfg = {
      audience: "lead" as const,
      template: "meeting_confirmation",
      lang,
      params: [company, fmtDate(opts.newStartIso), fmtTime(opts.newStartIso), meetLink],
    };
    const components = buildComponents(cfg, lead);
    await sendWhatsAppTemplate(phone, "meeting_confirmation", {
      language: lang,
      components: components.length ? components : undefined,
      leadId: opts.leadId,
    });
  }

  return { ok: true, meetLink };
}

// ─── No-show ─────────────────────────────────────────────────────────────────

export interface NoShowResult {
  ok: boolean;
  error?: string;
}

export async function handleNoShow(opts: {
  leadId: string;
  lang?: string;
}): Promise<NoShowResult> {
  const supabase = createAdminClient();
  const { data: lead } = await (supabase.from("leads") as any)
    .select("id, company_name, phone, meeting_notes, wa_opt_out, outreach_stage, tags")
    .eq("id", opts.leadId)
    .single();

  if (!lead) return { ok: false, error: "Lead not found" };

  const lang = opts.lang || "en";
  const company = lead.company_name || "Client";

  // Cancel calendar event
  const calEventIdMatch = String(lead.meeting_notes || "").match(/\[gcal:([^\]]+)\]/);
  const calEventId = calEventIdMatch?.[1];
  if (calEventId) {
    await cancelMeetingEvent(calEventId).catch(() => null);
  }

  // Tag as no_show, move back to follow_up_due
  const existingTags: string[] = Array.isArray(lead.tags) ? lead.tags : [];
  await (supabase.from("leads") as any)
    .update({
      outreach_stage: "follow_up_due",
      tags: [...new Set([...existingTags, "no_show"])],
      last_outcome: "NO_SHOW",
    })
    .eq("id", opts.leadId);

  // Cancel pending reminders
  await (supabase as any).from("scheduled_messages")
    .update({ status: "cancelled" })
    .eq("lead_id", opts.leadId)
    .in("template_name", ["meeting_reminder_1h", "meeting_reminder_15m"]);

  // Send meeting_noshow template
  const phone = lead.phone;
  if (phone && toWaNumber(phone)) {
    const cfg = {
      audience: "lead" as const,
      template: "meeting_noshow",
      lang,
      params: [company],
    };
    const components = buildComponents(cfg, lead);
    await sendWhatsAppTemplate(phone, "meeting_noshow", {
      language: lang,
      components: components.length ? components : undefined,
      leadId: opts.leadId,
    });
  }

  return { ok: true };
}

// ─── Shared: schedule a reminder ─────────────────────────────────────────────

async function scheduleReminder(opts: {
  leadId: string;
  phone: string;
  templateName: string;
  params: string[];
  lang: string;
  meetingStart: string;
  offsetMinutes: number; // negative = before
}) {
  const fireAt = new Date(new Date(opts.meetingStart).getTime() + opts.offsetMinutes * 60 * 1000);
  if (fireAt <= new Date()) return; // already past — skip

  const supabase = createAdminClient() as any;
  await supabase.from("scheduled_messages").upsert(
    {
      lead_id: opts.leadId,
      phone: opts.phone,
      template_name: opts.templateName,
      params: opts.params,
      lang: opts.lang,
      fire_at: fireAt.toISOString(),
      status: "pending",
    },
    { onConflict: "lead_id,template_name" }
  );
}
