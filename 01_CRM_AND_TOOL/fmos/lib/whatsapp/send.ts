import { createAdminClient } from "@/lib/supabase-admin";
import { getLeadGuardState } from "@/lib/whatsapp/suppression";
import { checkThrottle, alertDailyCapOnce } from "@/lib/whatsapp/throttle";
import { filterAllowlist } from "@/lib/whatsapp/guards";

/**
 * PHASE F STAGE 1 — WhatsApp Cloud API sending library.
 * SERVER-SIDE ONLY (uses WHATSAPP_API_TOKEN). Never import from client components.
 *
 * Send types:
 *  - sendWhatsAppText        — session message (only valid inside the 24h customer window)
 *  - sendWhatsAppTemplate    — approved template (business-initiated, opens a window)
 *  - sendWhatsAppButtons     — interactive quick-reply buttons (session message)
 *  - sendWhatsAppDocument    — PDF/document by link or uploaded media id
 *  - uploadWhatsAppMedia     — upload a file buffer to Meta, returns media id
 *
 * 6.4 — every send funnels through preflight(): opt-out suppression (lead-keyed),
 * active-inbound-thread suppression (proactive sends only), and the system-wide
 * throttle (daily cap + per-minute rate). This is the ONE choke point — all five
 * send functions call it before touching the Graph API.
 *
 * Every successful send is logged to whatsapp_logs (direction='outbound').
 */

const GRAPH_VERSION = "v23.0";

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  /** Set when a send was deliberately blocked rather than attempted. */
  suppressed?: "opted_out" | "active_inbound" | "daily_cap" | "rate_limit";
}

/** Shared guard flags accepted by every public send function. */
export interface GuardOpts {
  /** Proactive automated send (direct report, outcome blast) — subject to
   *  active-inbound-thread suppression. Reactive replies omit this. */
  proactive?: boolean;
  /** Skip the opt-out check (admin/staff alerts; opt-out confirmation message). */
  bypassOptOut?: boolean;
  /** Skip the throttle (critical admin alerts, incl. the cap-reached alert itself). */
  bypassThrottle?: boolean;
}

/**
 * THE CHOKE POINT. Returns a SendResult to short-circuit with when a send must be
 * blocked, or null when it's clear to proceed.
 */
async function preflight(opts: {
  leadId?: string | null;
  proactive?: boolean;
  bypassOptOut?: boolean;
  bypassThrottle?: boolean;
}): Promise<SendResult | null> {
  // 1. Opt-out + active-inbound suppression (only when we know the lead).
  if (opts.leadId && !opts.bypassOptOut) {
    const guard = await getLeadGuardState(opts.leadId);
    if (guard.optedOut) {
      return { success: false, suppressed: "opted_out", error: "Lead has opted out of WhatsApp" };
    }
    if (opts.proactive && guard.activeInbound) {
      return { success: false, suppressed: "active_inbound", error: "Lead is in an active inbound thread" };
    }
  }

  // 2. System-wide throttle (daily cap then per-minute rate).
  if (!opts.bypassThrottle) {
    const verdict = await checkThrottle();
    if (!verdict.allowed) {
      if (verdict.reason === "daily_cap") {
        await alertDailyCapOnce(verdict.count ?? 0, verdict.limit ?? 0);
      }
      return { success: false, suppressed: verdict.reason, error: `Throttled: ${verdict.reason}` };
    }
  }

  return null;
}

function credentials(): { token: string; phoneNumberId: string } | null {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId || token.startsWith("PLACEHOLDER")) return null;
  return { token, phoneNumberId };
}

/**
 * SEND MODE GUARD — WHATSAPP_SEND_MODE=test redirects every outbound message to
 * WHATSAPP_TEST_RECIPIENTS (comma-separated) instead of the real recipient.
 * The original phone + template are recorded in the log so nothing is silently lost.
 * When WHATSAPP_SEND_MODE is absent or "live", sends go to the real number.
 */
export function resolveRecipients(realPhone: string): { phones: string[]; testMode: boolean } {
  const mode = process.env.WHATSAPP_SEND_MODE?.trim().toLowerCase();
  let phones: string[];
  let testMode = false;
  if (mode === "test") {
    const raw = process.env.WHATSAPP_TEST_RECIPIENTS || "";
    const tp = raw.split(",").map((p) => p.trim()).filter(Boolean);
    if (tp.length > 0) {
      phones = tp;
      testMode = true;
    } else {
      // Test mode but NO test recipients configured → fail closed (drop), never
      // silently fall through to the real number. The allowlist would also catch
      // this, but defence in depth.
      console.warn("[whatsapp/send] WHATSAPP_SEND_MODE=test but WHATSAPP_TEST_RECIPIENTS is empty — dropping send.");
      phones = [];
      testMode = true;
    }
  } else {
    phones = [realPhone];
  }

  // HARD ALLOWLIST (belt-and-suspenders) — the final recipient guard. Runs in
  // BOTH test and live mode and drops anything not on WHATSAPP_ALLOWLIST until
  // WHATSAPP_LAUNCH=1. Guarantees no stray number is messaged pre-launch even if
  // SEND_MODE / TEST_RECIPIENTS are misconfigured. Every drop is logged.
  const { allowed, dropped } = filterAllowlist(phones);
  for (const d of dropped) {
    console.warn(
      `[whatsapp/send] BLOCKED off-allowlist recipient ${d} (intended for ${realPhone}). ` +
        `Set WHATSAPP_ALLOWLIST or WHATSAPP_LAUNCH=1 to permit.`
    );
  }
  return { phones: allowed, testMode };
}

/** Indian default: 10 digits → 91XXXXXXXXXX. Accepts +91/0 prefixed input. */
export function toWaNumber(phone: string): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits.length > 10 ? digits : null;
}

async function graphPost(path: string, body: unknown): Promise<SendResult> {
  const creds = credentials();
  if (!creds) return { success: false, error: "WhatsApp API credentials not configured" };
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.error?.message || `Graph API ${res.status}`;
      console.error("[whatsapp/send] Graph error:", msg);
      return { success: false, error: msg };
    }
    return { success: true, messageId: json?.messages?.[0]?.id };
  } catch (e: any) {
    console.error("[whatsapp/send] network error:", e);
    return { success: false, error: e?.message || "Network error" };
  }
}

async function logOutbound(opts: {
  leadId?: string | null;
  phone: string;
  message: string;
  messageType: string;
  waMessageId?: string;
  sentBy?: string | null;
  templateId?: string | null;
}) {
  try {
    const supabase = createAdminClient() as any;
    await supabase.from("whatsapp_logs").insert({
      lead_id: opts.leadId ?? null,
      message_sent: opts.message.slice(0, 4000),
      direction: "outbound",
      message_type: opts.messageType,
      wa_message_id: opts.waMessageId ?? null,
      phone: opts.phone,
      sent_by: opts.sentBy ?? null,
      template_id: opts.templateId ?? null,
    });
  } catch (e) {
    console.error("[whatsapp/send] log failed:", e);
  }
}

/** Plain text — only valid within the 24h window after the customer's last message. */
export async function sendWhatsAppText(
  phone: string,
  body: string,
  opts?: { leadId?: string | null; sentBy?: string | null } & GuardOpts
): Promise<SendResult> {
  const creds = credentials();
  const rawTo = toWaNumber(phone);
  if (!rawTo) return { success: false, error: "Invalid phone number" };
  if (!creds) return { success: false, error: "WhatsApp API credentials not configured" };
  const blocked = await preflight({ leadId: opts?.leadId, proactive: opts?.proactive, bypassOptOut: opts?.bypassOptOut, bypassThrottle: opts?.bypassThrottle });
  if (blocked) return blocked;
  // SEND-MODE GUARD — in test mode every recipient is redirected to WHATSAPP_TEST_RECIPIENTS.
  const { phones, testMode } = resolveRecipients(rawTo);
  const logNote = testMode ? `[TEST→${rawTo}] ` : "";
  let last: SendResult = { success: false, error: "No recipients" };
  for (const to of phones) {
    last = await graphPost(`${creds.phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: true, body },
    });
    if (last.success)
      await logOutbound({ ...opts, phone: rawTo, message: `${logNote}${body}`, messageType: "text", waMessageId: last.messageId });
  }
  return last;
}

/** Approved template send (business-initiated). components per Graph API spec. */
export async function sendWhatsAppTemplate(
  phone: string,
  templateName: string,
  opts?: {
    language?: string;
    components?: unknown[];
    leadId?: string | null;
    sentBy?: string | null;
  } & GuardOpts
): Promise<SendResult> {
  const creds = credentials();
  const rawTo = toWaNumber(phone);
  if (!rawTo) return { success: false, error: "Invalid phone number" };
  if (!creds) return { success: false, error: "WhatsApp API credentials not configured" };

  const blocked = await preflight({ leadId: opts?.leadId, proactive: opts?.proactive, bypassOptOut: opts?.bypassOptOut, bypassThrottle: opts?.bypassThrottle });
  if (blocked) return blocked;

  const { phones, testMode } = resolveRecipients(rawTo);
  const logNote = testMode ? `[TEST→${rawTo}] ` : "";
  let last: SendResult = { success: false, error: "No recipients" };

  for (const to of phones) {
    last = await graphPost(`${creds.phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: opts?.language || "en" },
        ...(opts?.components ? { components: opts.components } : {}),
      },
    });
    if (last.success)
      await logOutbound({
        leadId: opts?.leadId,
        sentBy: opts?.sentBy,
        phone: rawTo,
        message: `${logNote}[template:${templateName}]`,
        messageType: "template",
        waMessageId: last.messageId,
        templateId: templateName,
      });
  }
  return last;
}

/** Interactive quick-reply buttons — session message (24h window). Max 3 buttons. */
export async function sendWhatsAppButtons(
  phone: string,
  body: string,
  buttons: { id: string; title: string }[],
  opts?: { leadId?: string | null; sentBy?: string | null } & GuardOpts
): Promise<SendResult> {
  const creds = credentials();
  const rawTo = toWaNumber(phone);
  if (!rawTo) return { success: false, error: "Invalid phone number" };
  if (!creds) return { success: false, error: "WhatsApp API credentials not configured" };
  const blocked = await preflight({ leadId: opts?.leadId, proactive: opts?.proactive, bypassOptOut: opts?.bypassOptOut, bypassThrottle: opts?.bypassThrottle });
  if (blocked) return blocked;
  // SEND-MODE GUARD — in test mode every recipient is redirected to WHATSAPP_TEST_RECIPIENTS.
  const { phones, testMode } = resolveRecipients(rawTo);
  const logNote = testMode ? `[TEST→${rawTo}] ` : "";
  let last: SendResult = { success: false, error: "No recipients" };
  for (const to of phones) {
    last = await graphPost(`${creds.phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: body },
        action: {
          buttons: buttons.slice(0, 3).map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title.slice(0, 20) },
          })),
        },
      },
    });
    if (last.success)
      await logOutbound({ ...opts, phone: rawTo, message: `${logNote}${body}`, messageType: "interactive", waMessageId: last.messageId });
  }
  return last;
}

/** Interactive list menu — session message (24h window). Up to 10 rows total
 *  across sections. Tapping a row sends back its `id` as an interactive
 *  list_reply (handled in the webhook). Used by the guided multilingual menu. */
export async function sendWhatsAppList(
  phone: string,
  menu: {
    body: string;
    button: string;
    header?: string;
    footer?: string;
    sections: { title?: string; rows: { id: string; title: string; description?: string }[] }[];
  },
  opts?: { leadId?: string | null; sentBy?: string | null } & GuardOpts
): Promise<SendResult> {
  const creds = credentials();
  const rawTo = toWaNumber(phone);
  if (!rawTo) return { success: false, error: "Invalid phone number" };
  if (!creds) return { success: false, error: "WhatsApp API credentials not configured" };
  const blocked = await preflight({ leadId: opts?.leadId, proactive: opts?.proactive, bypassOptOut: opts?.bypassOptOut, bypassThrottle: opts?.bypassThrottle });
  if (blocked) return blocked;
  // SEND-MODE GUARD — in test mode every recipient is redirected to WHATSAPP_TEST_RECIPIENTS.
  const { phones, testMode } = resolveRecipients(rawTo);
  const logNote = testMode ? `[TEST→${rawTo}] ` : "";
  const sections = menu.sections.map((s) => ({
    ...(s.title ? { title: s.title.slice(0, 24) } : {}),
    rows: s.rows.slice(0, 10).map((r) => ({
      id: r.id.slice(0, 200),
      title: r.title.slice(0, 24),
      ...(r.description ? { description: r.description.slice(0, 72) } : {}),
    })),
  }));
  let last: SendResult = { success: false, error: "No recipients" };
  for (const to of phones) {
    last = await graphPost(`${creds.phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        ...(menu.header ? { header: { type: "text", text: menu.header.slice(0, 60) } } : {}),
        body: { text: menu.body.slice(0, 1024) },
        ...(menu.footer ? { footer: { text: menu.footer.slice(0, 60) } } : {}),
        action: { button: menu.button.slice(0, 20), sections },
      },
    });
    if (last.success)
      await logOutbound({ ...opts, phone: rawTo, message: `${logNote}${menu.body}`, messageType: "interactive", waMessageId: last.messageId });
  }
  return last;
}

/** Interactive Flow message — opens a multi-screen form (e.g. the multi-select
 *  services checklist). The flow must already be published; its completion comes
 *  back to the webhook as an `nfm_reply`. Session message (24h window). */
export async function sendWhatsAppFlow(
  phone: string,
  flow: { flowId: string; cta: string; body: string; screen?: string; flowToken?: string; header?: string; footer?: string },
  opts?: { leadId?: string | null; sentBy?: string | null } & GuardOpts
): Promise<SendResult> {
  const creds = credentials();
  const rawTo = toWaNumber(phone);
  if (!rawTo) return { success: false, error: "Invalid phone number" };
  if (!creds) return { success: false, error: "WhatsApp API credentials not configured" };
  const blocked = await preflight({ leadId: opts?.leadId, proactive: opts?.proactive, bypassOptOut: opts?.bypassOptOut, bypassThrottle: opts?.bypassThrottle });
  if (blocked) return blocked;
  // SEND-MODE GUARD — in test mode every recipient is redirected to WHATSAPP_TEST_RECIPIENTS.
  const { phones, testMode } = resolveRecipients(rawTo);
  const logNote = testMode ? `[TEST→${rawTo}] ` : "";
  let last: SendResult = { success: false, error: "No recipients" };
  for (const to of phones) {
    last = await graphPost(`${creds.phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "flow",
        ...(flow.header ? { header: { type: "text", text: flow.header.slice(0, 60) } } : {}),
        body: { text: flow.body.slice(0, 1024) },
        ...(flow.footer ? { footer: { text: flow.footer.slice(0, 60) } } : {}),
        action: {
          name: "flow",
          parameters: {
            flow_message_version: "3",
            flow_token: flow.flowToken || "svc",
            flow_id: flow.flowId,
            flow_cta: flow.cta.slice(0, 30),
            flow_action: "navigate",
            flow_action_payload: { screen: flow.screen || "SERVICES" },
          },
        },
      },
    });
    if (last.success)
      await logOutbound({ ...opts, phone: rawTo, message: `${logNote}${flow.body}`, messageType: "interactive", waMessageId: last.messageId });
  }
  return last;
}

/** Document (PDF etc.) by public link OR previously-uploaded media id. */
export async function sendWhatsAppDocument(
  phone: string,
  doc: { link?: string; mediaId?: string; filename: string; caption?: string },
  opts?: { leadId?: string | null; sentBy?: string | null } & GuardOpts
): Promise<SendResult> {
  const creds = credentials();
  const rawTo = toWaNumber(phone);
  if (!rawTo) return { success: false, error: "Invalid phone number" };
  if (!creds) return { success: false, error: "WhatsApp API credentials not configured" };
  if (!doc.link && !doc.mediaId) return { success: false, error: "Document needs a link or mediaId" };
  const blocked = await preflight({ leadId: opts?.leadId, proactive: opts?.proactive, bypassOptOut: opts?.bypassOptOut, bypassThrottle: opts?.bypassThrottle });
  if (blocked) return blocked;
  // SEND-MODE GUARD — in test mode every recipient is redirected to WHATSAPP_TEST_RECIPIENTS.
  const { phones, testMode } = resolveRecipients(rawTo);
  const logNote = testMode ? `[TEST→${rawTo}] ` : "";
  const baseMsg = doc.caption ? `[document:${doc.filename}] ${doc.caption}` : `[document:${doc.filename}]`;
  let last: SendResult = { success: false, error: "No recipients" };
  for (const to of phones) {
    last = await graphPost(`${creds.phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      to,
      type: "document",
      document: {
        ...(doc.mediaId ? { id: doc.mediaId } : { link: doc.link }),
        filename: doc.filename,
        ...(doc.caption ? { caption: doc.caption } : {}),
      },
    });
    if (last.success)
      await logOutbound({
        ...opts,
        phone: rawTo,
        message: `${logNote}${baseMsg}`,
        messageType: "document",
        waMessageId: last.messageId,
      });
  }
  return last;
}

/** Upload a file to Meta's media endpoint → media id (use for PDF report sends). */
export async function uploadWhatsAppMedia(
  file: Buffer | Uint8Array,
  mimeType: string,
  filename: string
): Promise<{ success: boolean; mediaId?: string; error?: string }> {
  const creds = credentials();
  if (!creds) return { success: false, error: "WhatsApp API credentials not configured" };
  try {
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("type", mimeType);
    form.append("file", new Blob([file as BlobPart], { type: mimeType }), filename);
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${creds.phoneNumberId}/media`,
      { method: "POST", headers: { Authorization: `Bearer ${creds.token}` }, body: form }
    );
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json?.error?.message || `Graph API ${res.status}` };
    return { success: true, mediaId: json.id };
  } catch (e: any) {
    return { success: false, error: e?.message || "Upload failed" };
  }
}
