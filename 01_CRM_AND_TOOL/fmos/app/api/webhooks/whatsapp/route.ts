import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase-admin";
import { processInboundLead, normalizePhone } from "@/lib/inbound/capture";
import { sendWhatsAppText, sendWhatsAppButtons, sendWhatsAppTemplate } from "@/lib/whatsapp/send";
import { sendAdminAlert } from "@/lib/whatsapp/admin-alert";
import { runBot } from "@/lib/bot/engine";
import { handleQualityWebhook } from "@/lib/whatsapp/quality";
import { AUTO_REPLIES, resolveButtonAction, fillTemplate } from "@/lib/whatsapp/auto-replies";
import { sendLeadReport } from "@/actions/direct-report";
import {
  handleMenuTap,
  isMenuReplyId,
  isMenuTrigger,
  sendLanguagePicker,
  sendServicesFlow,
  handleServicesFlowResponse,
  handleDiscoveryReply,
  getLeadLang,
} from "@/lib/bot/menu";

/**
 * PHASE F STAGE 1 — WhatsApp Cloud API webhook.
 *
 *   GET  /api/webhooks/whatsapp — Meta verification handshake
 *   POST /api/webhooks/whatsapp — message + status events (signature-verified)
 *
 * Flow per inbound message:
 *   UNKNOWN number → processInboundLead() (channel 'ctwa' when a referral
 *   payload is present — ad id/headline mapped for automatic ad attribution)
 *   → optional auto-greeting (app_settings.whatsapp_auto_greeting, default ON).
 *   KNOWN number → whatsapp_logs + activity_events + inbound_events + notify
 *   the assigned exec.
 *   Button replies → tag lead (tapped_book_meeting / tapped_tell_me_more),
 *   bump to top of follow-up queue, notify assignee, send mapped auto-reply.
 *
 * Service-role DB access — public-by-design path, auth = HMAC signature.
 */

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || secret.startsWith("PLACEHOLDER")) return false; // fail closed
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const received = signatureHeader.slice(7);
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifySignature(rawBody, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Always 200 after this point — Meta retries non-200s and disables flaky webhooks.
  try {
    for (const entry of body?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        // 6.4 — quality/limit downgrades arrive on their own change fields.
        if (
          change?.field === "phone_number_quality_update" ||
          change?.field === "messaging_limit_update" ||
          change?.field === "account_update"
        ) {
          await handleQualityWebhook(change.value ?? {}).catch((e) =>
            console.error("[webhooks/whatsapp] quality handler:", e)
          );
          continue;
        }
        if (change?.field !== "messages") continue;
        const value = change.value ?? {};
        for (const message of value.messages ?? []) {
          await handleInboundMessage(message, value);
        }
        for (const status of value.statuses ?? []) {
          await handleStatusUpdate(status);
        }
      }
    }
  } catch (e) {
    console.error("[webhooks/whatsapp] processing error:", e);
  }

  return NextResponse.json({ ok: true });
}

/** Delivery receipts → stamp whatsapp_logs.delivery_status by wa_message_id. */
async function handleStatusUpdate(status: any) {
  if (!status?.id || !status?.status) return;
  const supabase = createAdminClient() as any;
  const update: Record<string, unknown> = { delivery_status: status.status };
  // On a delivery failure, record WHY (Meta error code + reason) so failures are
  // diagnosable instead of a bare "failed".
  if (status.status === "failed" && Array.isArray(status.errors) && status.errors.length) {
    const e = status.errors[0];
    update.delivery_error = `${e?.code}: ${e?.title ?? ""}${e?.error_data?.details ? ` — ${e.error_data.details}` : ""}`.slice(0, 400);
    console.error("[whatsapp/status] delivery failed", status.id, update.delivery_error);
  }
  await supabase.from("whatsapp_logs").update(update).eq("wa_message_id", status.id);
}

/** "STOP"/"UNSUBSCRIBE"/"OPT OUT" (alone) → opt the lead out of WhatsApp. */
function isStopKeyword(text: string): boolean {
  return /^\s*(stop|unsubscribe|opt[\s-]?out|stop promotions)\s*\.?\s*$/i.test(text || "");
}

/** "START"/"SUBSCRIBE"/"OPT IN" (alone) → re-enable WhatsApp for the lead. */
function isStartKeyword(text: string): boolean {
  return /^\s*(start|subscribe|opt[\s-]?in)\s*\.?\s*$/i.test(text || "");
}

function extractText(message: any): string {
  switch (message?.type) {
    case "text":
      return message.text?.body ?? "";
    case "button": // template quick-reply taps arrive as type 'button'
      return message.button?.text ?? "";
    case "interactive":
      return (
        message.interactive?.button_reply?.title ??
        message.interactive?.list_reply?.title ??
        ""
      );
    case "image":
    case "video":
    case "audio":
    case "document":
    case "sticker":
      return message[message.type]?.caption
        ? `[${message.type}] ${message[message.type].caption}`
        : `[${message.type}]`;
    case "location":
      return "[location]";
    case "contacts":
      return "[contact card]";
    default:
      return `[${message?.type ?? "unknown"}]`;
  }
}

async function handleInboundMessage(message: any, value: any) {
  const supabase = createAdminClient() as any;
  const waMessageId: string | undefined = message?.id;
  const from: string = message?.from ?? ""; // e.g. "917975918980"
  const phone10 = normalizePhone(from);
  if (!phone10) return;

  // Idempotency — Meta retries webhooks; skip messages we've already seen.
  if (waMessageId) {
    const { data: seen } = await supabase
      .from("inbound_events")
      .select("id")
      .eq("external_id", waMessageId)
      .limit(1)
      .maybeSingle();
    if (seen) return;
  }

  const profileName: string | undefined = value?.contacts?.[0]?.profile?.name;
  const text = extractText(message);
  const referral = message?.referral; // present when chat started from a CTWA ad
  const buttonReply =
    message?.type === "interactive" && message?.interactive?.type === "button_reply"
      ? message.interactive.button_reply
      : message?.type === "button"
        ? { id: message.button?.payload, title: message.button?.text }
        : null;

  // Interactive reply id (button OR list row) — used to route guided-menu taps.
  const interactiveId: string | null =
    message?.type === "interactive"
      ? (message.interactive?.button_reply?.id ?? message.interactive?.list_reply?.id ?? null)
      : message?.type === "button"
        ? (message.button?.payload ?? null)
        : null;

  // Completed Flow (multi-select services checklist) → arrives as an nfm_reply.
  const flowReply =
    message?.type === "interactive" && message?.interactive?.type === "nfm_reply"
      ? message.interactive.nfm_reply
      : null;

  // Find an existing lead by phone suffix
  const { data: lead } = await supabase
    .from("leads")
    .select("id, company_name, contact_person, phone, city, assigned_sales_exec, tags, follow_up_date, wa_lang, wa_stage, wa_about")
    .like("phone", `%${phone10}`)
    .limit(1)
    .maybeSingle();

  // ── UNKNOWN number → inbound capture pipeline ────────────────────────
  if (!lead) {
    const isCtwa = !!referral;
    const result = await processInboundLead({
      channel: isCtwa ? "ctwa" : "whatsapp",
      external_id: waMessageId,
      contact_person: profileName,
      phone: from,
      message: text,
      // CTWA referral → automatic ad attribution
      campaign_external_id: referral?.source_id ? String(referral.source_id) : undefined,
      campaign_name: referral?.headline || referral?.source_url || undefined,
      utm: isCtwa ? { source: "meta", medium: "ctwa" } : undefined,
      raw: { message, contacts: value?.contacts, metadata: value?.metadata },
    });

    // Auto-greeting (session message — lead just messaged us, window is open).
    // The greeting IS the language picker: pick English/Kannada/Hindi by tapping,
    // then the guided menu opens in that language.
    if (result.status === "created" && result.leadId) {
      const { data: setting } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "whatsapp_auto_greeting")
        .maybeSingle();
      const enabled = setting?.value?.enabled !== false; // default ON
      if (enabled) {
        await sendLanguagePicker(from, result.leadId);
      }
    }

    // Button tap from a number we don't know yet (rare) — still apply the action
    if (buttonReply && result.leadId) {
      await applyButtonAction(buttonReply, result.leadId, from, waMessageId);
    }
    return;
  }

  // ── KNOWN lead ───────────────────────────────────────────────────────
  // Log the webhook hit (pipeline does this for new leads; mirror it here)
  await supabase.from("inbound_events").insert({
    channel: referral ? "ctwa" : "whatsapp",
    external_id: waMessageId ?? null,
    payload: { message, contacts: value?.contacts, metadata: value?.metadata },
    status: "processed",
    lead_id: lead.id,
  });

  // Log the message itself
  await supabase.from("whatsapp_logs").insert({
    lead_id: lead.id,
    message_sent: text.slice(0, 4000),
    direction: "inbound",
    message_type: message?.type ?? "text",
    wa_message_id: waMessageId ?? null,
    phone: from,
  });

  // Timeline event
  await supabase.from("activity_events").insert({
    entity_type: "lead",
    entity_id: lead.id,
    event_type: "whatsapp_inbound",
    title: buttonReply ? `Tapped "${buttonReply.title}" on WhatsApp` : "WhatsApp message received",
    body: text || null,
    metadata: { wa_message_id: waMessageId, type: message?.type, referral: referral ?? null },
  });

  // last_inbound_at powers 6.3 active-inbound-thread suppression (no proactive
  // outbound while the customer is mid-conversation with us).
  await supabase
    .from("leads")
    .update({ last_activity_at: new Date().toISOString(), last_inbound_at: new Date().toISOString() })
    .eq("id", lead.id);

  // ── Guided menu tap (m:* button/list ids) → route to the multilingual menu ──
  // Language pick, service detail, slot booking, talk-to-a-person all live here.
  if (isMenuReplyId(interactiveId)) {
    await handleMenuTap({ leadId: lead.id, phone: from, id: interactiveId as string });
    return;
  }

  // ── Completed services Flow (checkbox multi-select) → tag + next step ──
  if (flowReply?.response_json) {
    let services: string[] = [];
    try {
      const parsed = JSON.parse(flowReply.response_json);
      const raw = parsed?.services;
      services = Array.isArray(raw) ? raw : typeof raw === "string" ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("[webhook] flow response parse:", e);
    }
    await handleServicesFlowResponse({ leadId: lead.id, phone: from, serviceIds: services });
    return;
  }

  // Re-opt-in: "START" (and common variants) → clear the opt-out flag.
  if (isStartKeyword(text)) {
    await supabase.from("leads").update({ wa_opt_out: false }).eq("id", lead.id);
    await supabase.from("activity_events").insert({
      entity_type: "lead",
      entity_id: lead.id,
      event_type: "whatsapp_opt_in",
      title: "Opted back in to WhatsApp (START)",
      body: text || null,
      metadata: { wa_message_id: waMessageId ?? null },
    });
    await sendWhatsAppText(from, "You're subscribed again. Welcome back! — FortuneMarq", { leadId: lead.id });
    return;
  }

  // Opt-out: "STOP" (and common variants) → suppress all future WhatsApp sends.
  // isOptedOut() reads leads.wa_opt_out, so this is honored everywhere we send.
  if (isStopKeyword(text)) {
    await supabase.from("leads").update({ wa_opt_out: true }).eq("id", lead.id);
    await supabase.from("activity_events").insert({
      entity_type: "lead",
      entity_id: lead.id,
      event_type: "whatsapp_opt_out",
      title: "Opted out of WhatsApp (STOP)",
      body: text || null,
      metadata: { wa_message_id: waMessageId ?? null },
    });
    // Confirmation is allowed — the inbound message just reopened the 24h window.
    await sendWhatsAppText(
      from,
      "You've been unsubscribed and won't receive further messages from FortuneMarq. Reply START anytime to opt back in.",
      { leadId: lead.id }
    );
    return;
  }

  if (buttonReply) {
    await applyButtonAction(buttonReply, lead.id, from, waMessageId, lead);
    return;
  }

  // ── Mid-discovery? Treat this message as the business name / "about" answer ──
  // (If they ignore the question and ask something, handleDiscoveryReply returns
  // false and we fall through to the menu / AI — "continue generally".)
  if (lead.wa_stage === "await_name" || lead.wa_stage === "await_about") {
    const consumed = await handleDiscoveryReply({ leadId: lead.id, phone: from, text, lang: lead.wa_lang });
    if (consumed) return;
  }

  // ── Plain greeting / "menu" → surface the guided menu (pick language first) ──
  // Lets a customer re-open the tap menu any time by sending "hi"/"menu".
  if (isMenuTrigger(text)) {
    const lang = await getLeadLang(lead.id);
    if (lang) await sendServicesFlow(from, lead.id, lang);
    else await sendLanguagePicker(from, lead.id);
    return;
  }

  // ── Bot — primary free-text handler ─────────────────────────────────────
  // runBot() respects WHATSAPP_SEND_MODE (test-number gate), bot_paused
  // (human takeover), and all guardrails. It logs both turns to bot_threads.
  // It replies in the lead's chosen language (wa_lang). If it can't handle
  // (bot paused / test-mode blocked) we fall through to the static exec
  // notification below so no message is ever silently lost.
  const botResult = await runBot({
    leadId: lead.id,
    phone: from,
    userText: text,
    channel: "whatsapp",
    waMessageId,
    lang: lead.wa_lang || undefined,
    business: { name: lead.company_name, about: lead.wa_about, city: lead.city },
  }).catch((e) => {
    console.error("[webhook] runBot error:", e);
    return { handled: false };
  });

  // Notify assigned exec regardless — they can see every inbound message
  // whether the bot handled it or not.
  if (lead.assigned_sales_exec) {
    const botTag = botResult.handled ? " [bot replied]" : "";
    await supabase.from("notifications").insert({
      user_id: lead.assigned_sales_exec,
      type: "lead_status_changed",
      title: `WhatsApp reply${botTag}`,
      body: `${lead.company_name}: "${text.slice(0, 140)}"`,
      link: `/admin/leads/${lead.id}`,
      entity_type: "lead",
      entity_id: lead.id,
    });
  }

  // Agreement confirmation — "Yes, confirmed"
  if (/yes,?\s*confirmed/i.test(text)) {
    // Find the most recent sent/pending agreement for this lead
    const { data: agreement } = await (supabase as any)
      .from("agreements")
      .select("id, lead_id, status")
      .eq("lead_id", lead.id)
      .in("status", ["sent", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (agreement) {
      // Mark agreement confirmed (status CHECK allows only pending/confirmed/cancelled).
      await (supabase as any)
        .from("agreements")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", agreement.id);

      // Move lead to won
      await (supabase as any)
        .from("leads")
        .update({ outreach_stage: "won", status: "active", last_activity_at: new Date().toISOString() })
        .eq("id", lead.id);

      // Send agreement_welcome to the lead
      const contactName = lead.contact_person || lead.company_name || "there";
      await sendWhatsAppTemplate(from, "agreement_welcome", {
        language: "en",
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: contactName }],
          },
        ],
        leadId: lead.id,
      }).catch(() => null);

      // Admin alert
      await sendAdminAlert(
        "Agreement Signed",
        `${lead.company_name}${lead.city ? ` · ${lead.city}` : ""} confirmed via WhatsApp. Deal won — issue advance invoice now.`
      ).catch(() => null);
    }

    // Notify all admins in-app
    const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
    for (const admin of admins ?? []) {
      await supabase.from("notifications").insert({
        user_id: admin.id,
        type: "deal_closed",
        title: "Agreement confirmed on WhatsApp",
        body: `${lead.company_name} replied "${text.slice(0, 100)}"${agreement ? " — marked Won" : ""}`,
        link: `/admin/leads/${lead.id}`,
        entity_type: "lead",
        entity_id: lead.id,
      });
    }
  }
}

/**
 * Button tap → tag lead + bump to top of follow-up queue + notify assignee
 * + send the mapped auto-reply (session message).
 */
async function applyButtonAction(
  buttonReply: { id?: string; title?: string },
  leadId: string,
  phone: string,
  waMessageId?: string,
  leadRow?: any
) {
  const supabase = createAdminClient() as any;
  const action = resolveButtonAction(buttonReply.id || buttonReply.title || "");
  if (!action) return;

  const lead =
    leadRow ??
    (
      await supabase
        .from("leads")
        .select("id, company_name, contact_person, city, assigned_sales_exec, tags")
        .eq("id", leadId)
        .maybeSingle()
    ).data;
  if (!lead) return;

  const updates: Record<string, unknown> = { last_activity_at: new Date().toISOString() };

  if (action.tag) {
    const tags: string[] = Array.isArray(lead.tags) ? lead.tags : [];
    updates.tags = Array.from(new Set([...tags, "report_engaged", action.tag]));
  }
  if (action.priorityQueue) {
    // Now = top of the queue (cockpit sorts by scheduled callback time;
    // report_engaged leads always surface first)
    updates.follow_up_date = new Date().toISOString();
  } else if (action.followUpDays) {
    updates.follow_up_date = new Date(
      Date.now() + action.followUpDays * 24 * 60 * 60 * 1000
    ).toISOString();
  }

  const { error: updateError } = await supabase.from("leads").update(updates).eq("id", leadId);
  if (updateError) console.error("[webhooks/whatsapp] button update failed:", updateError);

  await supabase.from("activity_events").insert({
    entity_type: "lead",
    entity_id: leadId,
    event_type: "whatsapp_button_tap",
    title: `Tapped "${action.label}"`,
    body: null,
    metadata: { button: buttonReply, tag: action.tag ?? null, wa_message_id: waMessageId ?? null },
  });

  // Notify assignee (or all admins if unassigned)
  const notif = {
    type: "follow_up_due" as const,
    title: action.tag === "tapped_book_meeting" ? "🔥 Lead wants a meeting!" : `Lead tapped "${action.label}"`,
    body: `${lead.company_name} tapped "${action.label}" on WhatsApp — bumped to top of the queue.`,
    link: `/admin/leads/${leadId}`,
    entity_type: "lead",
    entity_id: leadId,
  };
  if (lead.assigned_sales_exec) {
    await supabase.from("notifications").insert({ user_id: lead.assigned_sales_exec, ...notif });
  } else {
    const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
    for (const admin of admins ?? []) {
      await supabase.from("notifications").insert({ user_id: admin.id, ...notif });
    }
  }

  // Auto-reply (session message — the tap just reopened the 24h window)
  if (action.autoReply) {
    const reply = AUTO_REPLIES[action.autoReply];
    const messageBody = fillTemplate(reply.message, {
      businessName: lead.company_name || "your business",
      city: lead.city || "Hubli",
      landingPageLink: process.env.WHATSAPP_LP_FALLBACK_URL || "https://fortunemarq.com",
    });
    if (reply.buttons.length > 0) {
      await sendWhatsAppButtons(phone, messageBody, [...reply.buttons], { leadId });
    } else {
      await sendWhatsAppText(phone, messageBody, { leadId });
    }
  }

  // "ಕನ್ನಡ ವರದಿ" tap → send the lead their report in Kannada (cover + PDF).
  if (action.sendReportLang) {
    const { data: full } = await supabase
      .from("leads")
      .select("id, company_name, phone, industry, city, has_website, serp_ranked")
      .eq("id", leadId)
      .maybeSingle();
    if (full?.phone) {
      try {
        const res = await sendLeadReport(full, action.sendReportLang);
        if (!res.ok) console.error("[webhooks/whatsapp] Kannada report send:", res.message);
      } catch (e) {
        console.error("[webhooks/whatsapp] sendLeadReport failed:", e);
      }
    }
  }
}
