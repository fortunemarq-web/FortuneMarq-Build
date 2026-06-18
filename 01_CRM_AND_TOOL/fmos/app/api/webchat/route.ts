import { NextRequest, NextResponse } from "next/server";
import { generateBotReply } from "@/lib/bot/engine";

// Website chat endpoint. Same brain as the WhatsApp bot (lib/bot/engine.ts), but
// it returns the reply text to the browser and never sends WhatsApp. Anonymous
// (no leadId) — so generateBotReply skips DB mutations; lead capture happens in
// the widget via the website inbound pipeline (actions/site-book.ts). All KB +
// guardrail + escalation behaviour is identical to WhatsApp.

export const runtime = "nodejs";

const MAX_MESSAGE = 1000;
const MAX_HISTORY = 20;
const MAX_TURN = 2000;

type Turn = { role: "user" | "assistant"; content: string };

function sanitizeHistory(raw: unknown): Turn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t): t is Turn =>
      !!t &&
      typeof t === "object" &&
      (((t as Turn).role === "user") || ((t as Turn).role === "assistant")) &&
      typeof (t as Turn).content === "string"
    )
    .slice(-MAX_HISTORY)
    .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_TURN) }));
}

export async function POST(req: NextRequest) {
  let body: { message?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: "Message too long." }, { status: 413 });
  }

  try {
    const r = await generateBotReply({
      userText: message,
      history: sanitizeHistory(body.history),
      channel: "web",
      // no leadId — anonymous visitor; capture happens via the widget lead form.
      // generateBotReply therefore skips all DB writes AND the admin escalation
      // alert (it only returns escalate:true so the widget shows the handoff).
    });
    return NextResponse.json({
      reply: r.reply,
      escalate: r.escalate,
      bookingIntent: r.bookingIntent,
    });
  } catch (e) {
    console.error("[webchat] error:", e);
    // Never expose internals; give a safe, on-brand fallback.
    return NextResponse.json(
      {
        reply:
          "Sorry — I hit a snag. You can WhatsApp us and a human will jump in right away.",
        escalate: true,
        bookingIntent: false,
      },
      { status: 200 }
    );
  }
}
