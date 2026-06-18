/**
 * Guided multilingual WhatsApp menu — English / Kannada / Hindi.
 *
 * A tap-driven layer in FRONT of the AI bot so non-English speakers can navigate
 * by tapping instead of typing. Navigation is STATELESS: every button/list row
 * carries a self-describing id (prefix "m:"), so we route purely on the tapped id
 * and never need to store a menu position. The only thing we persist is the
 * chosen language (leads.wa_lang), so later AI free-text replies stay in-language.
 *
 * Entry points used by the webhook:
 *   sendLanguagePicker(phone, leadId)  — greeting + 3 language buttons (first contact / "menu")
 *   sendMainMenu(phone, leadId, lang)  — the services list menu
 *   handleMenuTap({ leadId, phone, id })— route a tapped "m:*" id to the next message
 *   isMenuReplyId(id) / isMenuTrigger(text) — detection helpers for the webhook
 *
 * Copy is intentionally concise (better on WhatsApp) and mirrors the locked KB
 * pricing. The owner speaks all three languages and can refine wording later.
 */

import { createAdminClient } from "@/lib/supabase-admin";
import { sendWhatsAppText, sendWhatsAppButtons, sendWhatsAppList, sendWhatsAppFlow } from "@/lib/whatsapp/send";
import { sendAdminAlert } from "@/lib/whatsapp/admin-alert";
import { bookMeeting } from "@/actions/book-meeting";

export type Lang = "en" | "kn" | "hi";
const LANGS: Lang[] = ["en", "kn", "hi"];
function asLang(v: unknown): Lang {
  return LANGS.includes(v as Lang) ? (v as Lang) : "en";
}

const IST = "Asia/Kolkata";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// ─── Detection helpers (used by the webhook) ───────────────────────────────────

export function isMenuReplyId(id: string | null | undefined): boolean {
  return typeof id === "string" && id.startsWith("m:");
}

/** Short greetings / "menu" keywords that should surface the menu (en/kn/hi). */
export function isMenuTrigger(text: string): boolean {
  const t = (text || "").trim().toLowerCase();
  if (!t || t.length > 24) return false;
  return /^(hi+|hey+|hello+|hii+|hai|menu|options?|start|begin|namaste|namaskara?|namaskar|ನಮಸ್ಕಾರ|ಮೆನು|मेन्यू|नमस्ते|नमस्कार|शुरू|hi fortunemarq)\b/i.test(t);
}

// ─── Slot generation (server-side, IST-correct) ────────────────────────────────

function genSlots(): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const hours = [11, 16, 18]; // 11am, 4pm, 6pm IST
  const nowMs = Date.now();
  for (let day = 1; day <= 6 && out.length < 6; day++) {
    const istDay = new Date(nowMs + IST_OFFSET_MS);
    istDay.setUTCDate(istDay.getUTCDate() + day);
    if (istDay.getUTCDay() === 0) continue; // skip Sunday (IST)
    const istMidnightUtc = Date.UTC(istDay.getUTCFullYear(), istDay.getUTCMonth(), istDay.getUTCDate());
    for (const h of hours) {
      const slotMs = istMidnightUtc - IST_OFFSET_MS + h * 60 * 60 * 1000;
      if (slotMs < nowMs) continue;
      out.push({
        iso: new Date(slotMs).toISOString(),
        label: new Date(slotMs).toLocaleString("en-IN", {
          timeZone: IST, weekday: "short", day: "numeric", month: "short",
          hour: "numeric", minute: "2-digit", hour12: true,
        }),
      });
      if (out.length >= 6) break;
    }
  }
  return out;
}

// ─── Language persistence ──────────────────────────────────────────────────────

export async function getLeadLang(leadId: string): Promise<Lang | null> {
  const supabase = createAdminClient() as any;
  const { data } = await supabase.from("leads").select("wa_lang").eq("id", leadId).maybeSingle();
  const v = data?.wa_lang;
  return v && LANGS.includes(v) ? (v as Lang) : null;
}

async function setLeadLang(leadId: string, lang: Lang): Promise<void> {
  const supabase = createAdminClient() as any;
  await supabase.from("leads").update({ wa_lang: lang }).eq("id", leadId);
}

// ─── Service keys ──────────────────────────────────────────────────────────────

type Svc = "grow" | "gmb" | "web" | "ads" | "seo" | "wa" | "proof";
const SVC_ORDER: Svc[] = ["grow", "gmb", "web", "ads", "seo", "wa", "proof"];

interface Copy {
  menuBody: string;
  menuButton: string;
  rowTitle: Record<Svc | "book" | "human", string>;
  rowDesc: Record<Svc | "book" | "human", string>;
  svc: Record<Svc, string>;
  btnBook: string;
  btnMain: string;
  bookPrompt: string;
  bookButton: string;
  bookSection: string;
  booked: (label: string, link?: string) => string;
  bookFail: string;
  human: string;
  flowBody: string;
  flowCta: string;
  flowPicked: (names: string) => string;
  flowNothing: string;
}

// Shown BEFORE a language is chosen — all three scripts so anyone can read it.
const PICK_LANG_BODY =
  "👋 Welcome to FortuneMarq — marketing that brings you more customers.\n\n" +
  "Please choose your language:\n" +
  "ಮುಂದುವರಿಯಲು ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ\n" +
  "आगे बढ़ने के लिए अपनी भाषा चुनें 👇";

const T: Record<Lang, Copy> = {
  // ─────────────────────────── ENGLISH ───────────────────────────
  en: {
    menuBody: "How can we help your business grow? Tap below to choose 👇",
    menuButton: "View options",
    rowTitle: {
      grow: "Get more customers", gmb: "Google & Maps", web: "Website",
      ads: "Run ads", seo: "Rank on Google (SEO)", wa: "WhatsApp marketing",
      proof: "See our results", book: "📞 Book a free call", human: "🙋 Talk to a person",
    },
    rowDesc: {
      grow: "How we bring you more leads", gmb: "Get found on Google — ₹3,500/mo",
      web: "A site that wins customers", ads: "Google / Instagram / Facebook",
      seo: "Long-term Google ranking", wa: "Auto follow-up with every lead",
      proof: "Real results from real clients", book: "15 min with founder Jabeer",
      human: "Chat with our team",
    },
    svc: {
      grow: "Thousands of people in Hubli search Google every month for businesses like yours — but most go to directories like JustDial instead of you. We build a complete system (Google profile, website, ads, follow-up) so those customers find YOU directly. The best first step is a free call where Jabeer shows you the real numbers for your business.",
      gmb: "Your Google Business Profile puts you on Google Maps and local search — the #1 way customers find local businesses. It's where most of our clients start. ₹3,500/month. Want Jabeer to show you how it works for your business?",
      web: "We build fast, modern websites that turn visitors into customers — your own 24/7 salesperson. Landing page ₹5,000–8,000, full website ₹8,000–20,000 (one-time). Our own site is the proof.",
      ads: "Google and Instagram/Facebook ads put you in front of ready-to-buy customers fast. Management is ₹4,500 setup + ₹2,500/month — you pay Google/Meta for the ad spend directly. Want to see what's realistic for your budget?",
      seo: "SEO ranks you on Google over time so customers find you without paying for every click. From ₹7,000/month. It builds steadily — Jabeer can show you the opportunity for your niche.",
      wa: "WhatsApp marketing automatically follows up with every lead so none slip away — just like this chat. ₹5,000 setup + ₹2,500/month. Want to see it in action for your business?",
      proof: "We'd love to show you real results from businesses like yours. The fastest way is a quick free call where Jabeer walks you through the actual numbers — no pressure, just data.",
    },
    btnBook: "📞 Book a free call",
    btnMain: "« Main menu",
    bookPrompt: "Great! Pick a time and I'll book your free 15-minute call with Jabeer 👇",
    bookButton: "Pick a time",
    bookSection: "Available times",
    booked: (label, link) =>
      `✅ Done! Your free call with Jabeer is booked for ${label}.` +
      (link ? `\n\nJoin here: ${link}` : "") +
      `\n\nHe'll see you then. Anything else I can help with?`,
    bookFail: "I couldn't lock that slot just now — Jabeer will message you shortly to confirm a time. 🙏",
    human: "Sure! 🙏 Jabeer or someone from our team will message you here shortly. Meanwhile, is there anything I can help you with?",
    flowBody: "Welcome to FortuneMarq! 👋\n\nTap below to tell us which services you're interested in — you can pick more than one. (Or just type your question anytime.)",
    flowCta: "Choose services",
    flowPicked: (names) => `Great — you're interested in: ${names}. 🙌\n\nThe best next step is a free 15-minute call with Jabeer, where he shows you the real numbers for your business 👇`,
    flowNothing: "No problem! When you're ready, a quick free call with Jabeer is the fastest way to find the right fit for your business. 👇",
  },

  // ─────────────────────────── KANNADA ───────────────────────────
  kn: {
    menuBody: "ನಿಮ್ಮ ವ್ಯಾಪಾರ ಬೆಳೆಯಲು ನಾವು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು? ಆಯ್ಕೆಮಾಡಲು ಕೆಳಗೆ ಒತ್ತಿ 👇",
    menuButton: "ಆಯ್ಕೆಗಳು",
    rowTitle: {
      grow: "ಹೆಚ್ಚು ಗ್ರಾಹಕರು", gmb: "ಗೂಗಲ್ & ಮ್ಯಾಪ್ಸ್", web: "ವೆಬ್‌ಸೈಟ್",
      ads: "ಜಾಹೀರಾತು (Ads)", seo: "SEO ಗೂಗಲ್ ರ‍್ಯಾಂಕ್", wa: "WhatsApp ಮಾರ್ಕೆಟಿಂಗ್",
      proof: "ನಮ್ಮ ಫಲಿತಾಂಶ", book: "📞 ಉಚಿತ ಕರೆ ಬುಕ್", human: "🙋 ವ್ಯಕ್ತಿಯೊಂದಿಗೆ ಮಾತು",
    },
    rowDesc: {
      grow: "ಹೆಚ್ಚು ಲೀಡ್ಸ್ ಹೇಗೆ ತರುತ್ತೇವೆ", gmb: "ಗೂಗಲ್‌ನಲ್ಲಿ ಕಾಣಿಸಿ — ₹3,500/ತಿಂಗಳು",
      web: "ಗ್ರಾಹಕರನ್ನು ಗೆಲ್ಲುವ ಸೈಟ್", ads: "ಗೂಗಲ್ / ಇನ್ಸ್ಟಾ / ಫೇಸ್‌ಬುಕ್",
      seo: "ದೀರ್ಘಾವಧಿ ಗೂಗಲ್ ರ‍್ಯಾಂಕ್", wa: "ಪ್ರತಿ ಲೀಡ್‌ಗೆ ಸ್ವಯಂ ಫಾಲೋಅಪ್",
      proof: "ನೈಜ ಗ್ರಾಹಕರ ನೈಜ ಫಲಿತಾಂಶ", book: "ಜಬೀರ್ ಜೊತೆ 15 ನಿಮಿಷ",
      human: "ನಮ್ಮ ತಂಡದೊಂದಿಗೆ ಮಾತನಾಡಿ",
    },
    svc: {
      grow: "ಹುಬ್ಬಳ್ಳಿಯಲ್ಲಿ ಪ್ರತಿ ತಿಂಗಳು ಸಾವಿರಾರು ಜನ ನಿಮ್ಮಂತಹ ವ್ಯಾಪಾರಗಳಿಗಾಗಿ ಗೂಗಲ್‌ನಲ್ಲಿ ಹುಡುಕುತ್ತಾರೆ — ಆದರೆ ಹೆಚ್ಚಿನವರು ನಿಮ್ಮ ಬದಲು JustDial ನಂತಹ ಡೈರೆಕ್ಟರಿಗಳಿಗೆ ಹೋಗುತ್ತಾರೆ. ಆ ಗ್ರಾಹಕರು ನೇರವಾಗಿ ನಿಮ್ಮನ್ನು ತಲುಪುವಂತೆ ನಾವು ಸಂಪೂರ್ಣ ವ್ಯವಸ್ಥೆ (ಗೂಗಲ್ ಪ್ರೊಫೈಲ್, ವೆಬ್‌ಸೈಟ್, ಜಾಹೀರಾತು, ಫಾಲೋಅಪ್) ನಿರ್ಮಿಸುತ್ತೇವೆ. ಮೊದಲ ಹೆಜ್ಜೆ — ಜಬೀರ್ ನಿಮ್ಮ ವ್ಯಾಪಾರದ ನೈಜ ಅಂಕಿಅಂಶಗಳನ್ನು ತೋರಿಸುವ ಉಚಿತ ಕರೆ.",
      gmb: "ನಿಮ್ಮ ಗೂಗಲ್ ಬಿಸಿನೆಸ್ ಪ್ರೊಫೈಲ್ ನಿಮ್ಮನ್ನು ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ಮತ್ತು ಸ್ಥಳೀಯ ಹುಡುಕಾಟದಲ್ಲಿ ತೋರಿಸುತ್ತದೆ — ಸ್ಥಳೀಯ ಗ್ರಾಹಕರು ನಿಮ್ಮನ್ನು ಹುಡುಕುವ #1 ದಾರಿ. ಹೆಚ್ಚಿನ ಗ್ರಾಹಕರು ಇಲ್ಲಿಂದಲೇ ಪ್ರಾರಂಭಿಸುತ್ತಾರೆ. ₹3,500/ತಿಂಗಳು. ಇದು ನಿಮ್ಮ ವ್ಯಾಪಾರಕ್ಕೆ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ ಎಂದು ಜಬೀರ್ ತೋರಿಸಲಿ?",
      web: "ಭೇಟಿ ನೀಡುವವರನ್ನು ಗ್ರಾಹಕರನ್ನಾಗಿ ಪರಿವರ್ತಿಸುವ ವೇಗದ, ಆಧುನಿಕ ವೆಬ್‌ಸೈಟ್‌ಗಳನ್ನು ನಾವು ನಿರ್ಮಿಸುತ್ತೇವೆ — ನಿಮ್ಮ ಸ್ವಂತ 24/7 ಮಾರಾಟಗಾರ. ಲ್ಯಾಂಡಿಂಗ್ ಪೇಜ್ ₹5,000–8,000, ಪೂರ್ಣ ವೆಬ್‌ಸೈಟ್ ₹8,000–20,000 (ಒಂದು ಬಾರಿ). ನಮ್ಮ ಸ್ವಂತ ಸೈಟ್‌ೇ ಸಾಕ್ಷಿ.",
      ads: "ಗೂಗಲ್ ಮತ್ತು ಇನ್ಸ್ಟಾಗ್ರಾಮ್/ಫೇಸ್‌ಬುಕ್ ಜಾಹೀರಾತುಗಳು ಖರೀದಿಗೆ ಸಿದ್ಧವಿರುವ ಗ್ರಾಹಕರ ಮುಂದೆ ನಿಮ್ಮನ್ನು ಬೇಗ ತರುತ್ತವೆ. ನಿರ್ವಹಣೆ ₹4,500 ಸೆಟಪ್ + ₹2,500/ತಿಂಗಳು — ಜಾಹೀರಾತು ಖರ್ಚನ್ನು ನೀವು ನೇರವಾಗಿ ಗೂಗಲ್/ಮೆಟಾಗೆ ಪಾವತಿಸುತ್ತೀರಿ. ನಿಮ್ಮ ಬಜೆಟ್‌ಗೆ ಏನು ಸಾಧ್ಯ ಎಂದು ನೋಡೋಣವೇ?",
      seo: "SEO ನಿಮ್ಮನ್ನು ಕಾಲಕ್ರಮೇಣ ಗೂಗಲ್‌ನಲ್ಲಿ ರ‍್ಯಾಂಕ್ ಮಾಡುತ್ತದೆ — ಪ್ರತಿ ಕ್ಲಿಕ್‌ಗೆ ಪಾವತಿಸದೆ ಗ್ರಾಹಕರು ನಿಮ್ಮನ್ನು ಹುಡುಕುತ್ತಾರೆ. ₹7,000/ತಿಂಗಳಿಂದ. ಇದು ಸ್ಥಿರವಾಗಿ ಬೆಳೆಯುತ್ತದೆ — ನಿಮ್ಮ ಕ್ಷೇತ್ರದ ಅವಕಾಶವನ್ನು ಜಬೀರ್ ತೋರಿಸಬಲ್ಲರು.",
      wa: "WhatsApp ಮಾರ್ಕೆಟಿಂಗ್ ಪ್ರತಿ ಲೀಡ್‌ಗೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಫಾಲೋಅಪ್ ಮಾಡುತ್ತದೆ — ಈ ಚಾಟ್‌ನಂತೆಯೇ — ಯಾವುದೂ ತಪ್ಪಿಹೋಗದಂತೆ. ₹5,000 ಸೆಟಪ್ + ₹2,500/ತಿಂಗಳು. ನಿಮ್ಮ ವ್ಯಾಪಾರಕ್ಕೆ ಇದನ್ನು ನೋಡೋಣವೇ?",
      proof: "ನಿಮ್ಮಂತಹ ವ್ಯಾಪಾರಗಳ ನೈಜ ಫಲಿತಾಂಶಗಳನ್ನು ತೋರಿಸಲು ನಮಗೆ ಸಂತೋಷ. ಅತ್ಯಂತ ವೇಗದ ದಾರಿ — ಜಬೀರ್ ನಿಜವಾದ ಅಂಕಿಅಂಶಗಳನ್ನು ವಿವರಿಸುವ ಒಂದು ಸಣ್ಣ ಉಚಿತ ಕರೆ. ಒತ್ತಡವಿಲ್ಲ, ಕೇವಲ ಡೇಟಾ.",
    },
    btnBook: "📞 ಉಚಿತ ಕರೆ ಬುಕ್",
    btnMain: "« ಮುಖ್ಯ ಮೆನು",
    bookPrompt: "ಒಳ್ಳೆಯದು! ಸಮಯ ಆಯ್ಕೆಮಾಡಿ, ಜಬೀರ್ ಜೊತೆ ನಿಮ್ಮ ಉಚಿತ 15 ನಿಮಿಷದ ಕರೆ ಬುಕ್ ಮಾಡುತ್ತೇನೆ 👇",
    bookButton: "ಸಮಯ ಆಯ್ಕೆಮಾಡಿ",
    bookSection: "ಲಭ್ಯ ಸಮಯಗಳು",
    booked: (label, link) =>
      `✅ ಆಯಿತು! ಜಬೀರ್ ಜೊತೆ ನಿಮ್ಮ ಉಚಿತ ಕರೆ ${label} ಕ್ಕೆ ಬುಕ್ ಆಗಿದೆ.` +
      (link ? `\n\nಇಲ್ಲಿ ಸೇರಿ: ${link}` : "") +
      `\n\nಆ ಸಮಯಕ್ಕೆ ಭೇಟಿಯಾಗೋಣ. ಬೇರೆ ಏನಾದರೂ ಸಹಾಯ ಬೇಕೇ?`,
    bookFail: "ಆ ಸ್ಲಾಟ್ ಅನ್ನು ಈಗ ಲಾಕ್ ಮಾಡಲಾಗಲಿಲ್ಲ — ಜಬೀರ್ ಶೀಘ್ರದಲ್ಲೇ ಸಮಯ ಖಚಿತಪಡಿಸಲು ನಿಮಗೆ ಸಂದೇಶ ಕಳುಹಿಸುತ್ತಾರೆ. 🙏",
    human: "ಖಂಡಿತ! 🙏 ಜಬೀರ್ ಅಥವಾ ನಮ್ಮ ತಂಡದವರು ಶೀಘ್ರದಲ್ಲೇ ಇಲ್ಲಿ ನಿಮಗೆ ಸಂದೇಶ ಕಳುಹಿಸುತ್ತಾರೆ. ಅಷ್ಟರಲ್ಲಿ ನಾನು ಏನಾದರೂ ಸಹಾಯ ಮಾಡಬಹುದೇ?",
    flowBody: "FortuneMarq ಗೆ ಸ್ವಾಗತ! 👋\n\nನಿಮಗೆ ಯಾವ ಸೇವೆಗಳು ಆಸಕ್ತಿ ಎಂದು ತಿಳಿಸಲು ಕೆಳಗೆ ಒತ್ತಿ — ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ಆಯ್ಕೆಮಾಡಬಹುದು. (ಅಥವಾ ಯಾವಾಗ ಬೇಕಾದರೂ ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ.)",
    flowCta: "ಸೇವೆಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    flowPicked: (names) => `ಒಳ್ಳೆಯದು — ನಿಮಗೆ ಆಸಕ್ತಿ ಇರುವುದು: ${names}. 🙌\n\nಮುಂದಿನ ಉತ್ತಮ ಹೆಜ್ಜೆ — ಜಬೀರ್ ಜೊತೆ ಉಚಿತ 15 ನಿಮಿಷದ ಕರೆ; ಅವರು ನಿಮ್ಮ ವ್ಯಾಪಾರದ ನೈಜ ಅಂಕಿಅಂಶಗಳನ್ನು ತೋರಿಸುತ್ತಾರೆ 👇`,
    flowNothing: "ಪರವಾಗಿಲ್ಲ! ನೀವು ಸಿದ್ಧರಾದಾಗ, ಜಬೀರ್ ಜೊತೆ ಒಂದು ಸಣ್ಣ ಉಚಿತ ಕರೆ ನಿಮ್ಮ ವ್ಯಾಪಾರಕ್ಕೆ ಸರಿಯಾದ ಸೇವೆ ಕಂಡುಹಿಡಿಯಲು ಅತ್ಯಂತ ವೇಗದ ದಾರಿ. 👇",
  },

  // ─────────────────────────── HINDI ───────────────────────────
  hi: {
    menuBody: "आपके व्यापार को बढ़ाने में हम कैसे मदद कर सकते हैं? चुनने के लिए नीचे टैप करें 👇",
    menuButton: "विकल्प देखें",
    rowTitle: {
      grow: "ज़्यादा ग्राहक", gmb: "गूगल और मैप्स", web: "वेबसाइट",
      ads: "विज्ञापन (Ads)", seo: "SEO गूगल रैंक", wa: "WhatsApp मार्केटिंग",
      proof: "हमारे नतीजे", book: "📞 फ्री कॉल बुक करें", human: "🙋 किसी व्यक्ति से बात",
    },
    rowDesc: {
      grow: "हम कैसे ज़्यादा लीड लाते हैं", gmb: "गूगल पर दिखें — ₹3,500/माह",
      web: "ग्राहक जीतने वाली साइट", ads: "गूगल / इंस्टा / फेसबुक",
      seo: "लंबी अवधि की गूगल रैंक", wa: "हर लीड का ऑटो फॉलो-अप",
      proof: "असली ग्राहकों के असली नतीजे", book: "जबीर के साथ 15 मिनट",
      human: "हमारी टीम से बात करें",
    },
    svc: {
      grow: "हुबली में हर महीने हज़ारों लोग आपके जैसे व्यापारों के लिए गूगल पर खोजते हैं — पर ज़्यादातर आपके बजाय JustDial जैसी डायरेक्ट्री पर चले जाते हैं। हम एक पूरा सिस्टम (गूगल प्रोफाइल, वेबसाइट, विज्ञापन, फॉलो-अप) बनाते हैं ताकि वे ग्राहक सीधे आप तक पहुँचें। पहला कदम — जबीर के साथ एक फ्री कॉल, जिसमें वे आपके व्यापार के असली आँकड़े दिखाते हैं।",
      gmb: "आपकी गूगल बिज़नेस प्रोफाइल आपको गूगल मैप्स और लोकल सर्च में दिखाती है — लोकल ग्राहक आपको ढूँढने का #1 तरीका। ज़्यादातर ग्राहक यहीं से शुरू करते हैं। ₹3,500/माह। क्या जबीर आपको दिखाएँ कि यह आपके व्यापार के लिए कैसे काम करता है?",
      web: "हम तेज़, आधुनिक वेबसाइट बनाते हैं जो विज़िटर को ग्राहक में बदलती हैं — आपका अपना 24/7 सेल्समैन। लैंडिंग पेज ₹5,000–8,000, पूरी वेबसाइट ₹8,000–20,000 (एक बार)। हमारी अपनी साइट ही सबूत है।",
      ads: "गूगल और इंस्टाग्राम/फेसबुक विज्ञापन आपको खरीदने के लिए तैयार ग्राहकों के सामने जल्दी लाते हैं। मैनेजमेंट ₹4,500 सेटअप + ₹2,500/माह — विज्ञापन का खर्च आप सीधे गूगल/मेटा को देते हैं। क्या देखें आपके बजट में क्या संभव है?",
      seo: "SEO समय के साथ आपको गूगल पर रैंक करता है ताकि ग्राहक हर क्लिक का भुगतान किए बिना आपको ढूँढें। ₹7,000/माह से। यह धीरे-धीरे बढ़ता है — जबीर आपके क्षेत्र का अवसर दिखा सकते हैं।",
      wa: "WhatsApp मार्केटिंग हर लीड का अपने-आप फॉलो-अप करती है ताकि कोई छूटे नहीं — बिल्कुल इस चैट की तरह। ₹5,000 सेटअप + ₹2,500/माह। क्या इसे आपके व्यापार के लिए चलाकर देखें?",
      proof: "हमें आपके जैसे व्यापारों के असली नतीजे दिखाने में खुशी होगी। सबसे तेज़ तरीका — जबीर के साथ एक छोटी फ्री कॉल जिसमें वे असली आँकड़े समझाते हैं। कोई दबाव नहीं, सिर्फ़ डेटा।",
    },
    btnBook: "📞 फ्री कॉल बुक करें",
    btnMain: "« मुख्य मेन्यू",
    bookPrompt: "बढ़िया! समय चुनें, मैं जबीर के साथ आपकी फ्री 15-मिनट कॉल बुक कर देता हूँ 👇",
    bookButton: "समय चुनें",
    bookSection: "उपलब्ध समय",
    booked: (label, link) =>
      `✅ हो गया! जबीर के साथ आपकी फ्री कॉल ${label} के लिए बुक हो गई है।` +
      (link ? `\n\nयहाँ जुड़ें: ${link}` : "") +
      `\n\nवे उस समय मिलेंगे। और कोई मदद चाहिए?`,
    bookFail: "मैं वह स्लॉट अभी लॉक नहीं कर सका — जबीर जल्द ही समय कन्फर्म करने के लिए आपको मैसेज करेंगे। 🙏",
    human: "ज़रूर! 🙏 जबीर या हमारी टीम का कोई व्यक्ति जल्द ही यहाँ आपको मैसेज करेगा। तब तक, क्या मैं किसी चीज़ में आपकी मदद कर सकता हूँ?",
    flowBody: "FortuneMarq में आपका स्वागत है! 👋\n\nनीचे टैप करके बताएँ कि आपको कौन-सी सेवाएँ चाहिए — आप एक से ज़्यादा चुन सकते हैं। (या कभी भी अपना सवाल टाइप करें।)",
    flowCta: "सेवाएँ चुनें",
    flowPicked: (names) => `बढ़िया — आपकी रुचि है: ${names}. 🙌\n\nअगला सबसे अच्छा कदम — जबीर के साथ फ्री 15-मिनट कॉल, जिसमें वे आपके व्यापार के असली आँकड़े दिखाते हैं 👇`,
    flowNothing: "कोई बात नहीं! जब आप तैयार हों, जबीर के साथ एक छोटी फ्री कॉल आपके व्यापार के लिए सही सेवा चुनने का सबसे तेज़ तरीका है। 👇",
  },
};

// ─── Outbound builders ─────────────────────────────────────────────────────────

/** First-contact greeting + 3 language buttons. */
export async function sendLanguagePicker(phone: string, leadId: string): Promise<void> {
  await sendWhatsAppButtons(
    phone,
    PICK_LANG_BODY,
    [
      { id: "m:lang:en", title: "English" },
      { id: "m:lang:kn", title: "ಕನ್ನಡ" },
      { id: "m:lang:hi", title: "हिंदी" },
    ],
    { leadId }
  );
}

/** The services list menu, in the chosen language. */
export async function sendMainMenu(phone: string, leadId: string, lang: Lang): Promise<void> {
  const t = T[lang];
  const rows = [
    ...SVC_ORDER.map((s) => ({ id: `m:svc:${s}`, title: t.rowTitle[s], description: t.rowDesc[s] })),
    { id: "m:book", title: t.rowTitle.book, description: t.rowDesc.book },
    { id: "m:human", title: t.rowTitle.human, description: t.rowDesc.human },
  ];
  await sendWhatsAppList(
    phone,
    { body: t.menuBody, button: t.menuButton, sections: [{ rows }] },
    { leadId }
  );
}

function flowIdFor(lang: Lang): string | undefined {
  return process.env[`WHATSAPP_FLOW_ID_${lang.toUpperCase()}`] || undefined;
}

/** Multi-select services experience: the published WhatsApp Flow (checkboxes)
 *  when configured (WHATSAPP_FLOW_ID_<LANG>), else a graceful fallback to the
 *  single-select list menu so the bot keeps working until the flows are set. */
export async function sendServicesFlow(phone: string, leadId: string, lang: Lang): Promise<void> {
  const flowId = flowIdFor(lang);
  if (!flowId) {
    await sendMainMenu(phone, leadId, lang);
    return;
  }
  const t = T[lang];
  await sendWhatsAppFlow(
    phone,
    { flowId, cta: t.flowCta, body: t.flowBody, screen: "SERVICES", flowToken: `svc:${leadId}` },
    { leadId }
  );
}

/** Handle a completed services Flow (nfm_reply): tag the chosen services on the
 *  lead (visible to the team) and reply (in-language) with the next step. */
export async function handleServicesFlowResponse(opts: { leadId: string; phone: string; serviceIds: string[] }): Promise<void> {
  const { leadId, phone, serviceIds } = opts;
  const lang = (await getLeadLang(leadId)) ?? "en";
  const t = T[lang];
  const valid = serviceIds.filter((s): s is Svc => SVC_ORDER.includes(s as Svc));

  if (valid.length) {
    const supabase = createAdminClient() as any;
    const { data: lead } = await supabase.from("leads").select("tags").eq("id", leadId).maybeSingle();
    const existing: string[] = Array.isArray(lead?.tags) ? lead.tags : [];
    const tags = Array.from(new Set([...existing, "wa_services_selected", ...valid.map((s) => `wants_${s}`)]));
    await supabase.from("leads").update({ tags }).eq("id", leadId);
    await supabase.from("activity_events").insert({
      entity_type: "lead",
      entity_id: leadId,
      event_type: "whatsapp_services_selected",
      title: "Selected services on WhatsApp",
      body: valid.map((s) => T.en.rowTitle[s]).join(", "),
      metadata: { services: valid },
    });
  }

  if (!valid.length) {
    await sendWhatsAppButtons(phone, t.flowNothing, [
      { id: "m:book", title: t.btnBook },
      { id: "m:human", title: t.rowTitle.human },
    ], { leadId });
    return;
  }
  const names = valid.map((s) => t.rowTitle[s]).join(", ");
  await sendWhatsAppButtons(phone, t.flowPicked(names), [
    { id: "m:book", title: t.btnBook },
    { id: "m:human", title: t.rowTitle.human },
    { id: "m:main", title: t.btnMain },
  ], { leadId });
}

async function sendServiceDetail(phone: string, leadId: string, lang: Lang, svc: Svc): Promise<void> {
  const t = T[lang];
  await sendWhatsAppButtons(
    phone,
    t.svc[svc],
    [
      { id: "m:book", title: t.btnBook },
      { id: "m:main", title: t.btnMain },
    ],
    { leadId }
  );
}

async function sendSlotPicker(phone: string, leadId: string, lang: Lang): Promise<void> {
  const t = T[lang];
  const slots = genSlots();
  if (slots.length === 0) {
    // No upcoming slots → fall back to a human handoff path.
    await sendWhatsAppText(phone, t.bookFail, { leadId });
    return;
  }
  await sendWhatsAppList(
    phone,
    {
      body: t.bookPrompt,
      button: t.bookButton,
      sections: [{ title: t.bookSection, rows: slots.map((s) => ({ id: `m:slot:${s.iso}`, title: s.label })) }],
    },
    { leadId }
  );
}

async function doBooking(phone: string, leadId: string, lang: Lang, iso: string): Promise<void> {
  const t = T[lang];
  let label = iso;
  try {
    label = new Date(iso).toLocaleString("en-IN", {
      timeZone: IST, weekday: "short", day: "numeric", month: "short",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  } catch { /* keep iso */ }

  const result = await bookMeeting({ leadId, startIso: iso }).catch(() => null);
  if (result?.ok) {
    await sendWhatsAppText(phone, t.booked(label, result.meetLink), { leadId });
  } else {
    await sendWhatsAppText(phone, t.bookFail, { leadId });
    await sendAdminAlert(
      "Bot booking needs confirmation",
      `A lead picked ${label} via the WhatsApp menu but auto-booking failed — please confirm a time.`
    ).catch(() => null);
  }
}

async function doHumanHandoff(phone: string, leadId: string, lang: Lang): Promise<void> {
  const supabase = createAdminClient() as any;
  // Pause the bot so the AI doesn't keep replying once a human is requested.
  await supabase.from("leads").update({ bot_paused: true }).eq("id", leadId);
  await sendWhatsAppText(phone, T[lang].human, { leadId });
  // Notify the team (assigned exec if any, else all admins) + a WhatsApp admin ping.
  const { data: lead } = await supabase
    .from("leads").select("company_name, city, assigned_sales_exec").eq("id", leadId).maybeSingle();
  const notif = {
    type: "follow_up_due" as const,
    title: "🙋 Lead wants to talk to a person",
    body: `${lead?.company_name || "A lead"} asked for a human on WhatsApp — bot paused.`,
    link: `/admin/leads/${leadId}`,
    entity_type: "lead",
    entity_id: leadId,
  };
  if (lead?.assigned_sales_exec) {
    await supabase.from("notifications").insert({ user_id: lead.assigned_sales_exec, ...notif });
  } else {
    const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
    for (const a of admins ?? []) await supabase.from("notifications").insert({ user_id: a.id, ...notif });
  }
  await sendAdminAlert(
    "Talk-to-a-person request",
    `${lead?.company_name || "A lead"}${lead?.city ? ` · ${lead.city}` : ""} asked to speak with someone on WhatsApp. Bot is paused — jump in.`
  ).catch(() => null);
}

/**
 * Route a tapped "m:*" id to the next message. Returns true when handled.
 * Stateless: the id carries everything we need; language comes from the id
 * (m:lang:*) or the lead's stored wa_lang (default English).
 */
export async function handleMenuTap(opts: { leadId: string; phone: string; id: string }): Promise<boolean> {
  const { leadId, phone, id } = opts;

  if (id.startsWith("m:lang:")) {
    const lang = asLang(id.slice("m:lang:".length));
    await setLeadLang(leadId, lang);
    await sendServicesFlow(phone, leadId, lang);
    return true;
  }

  const lang = (await getLeadLang(leadId)) ?? "en";

  if (id === "m:main") {
    await sendServicesFlow(phone, leadId, lang);
    return true;
  }
  if (id.startsWith("m:svc:")) {
    const svc = id.slice("m:svc:".length) as Svc;
    if (SVC_ORDER.includes(svc)) {
      await sendServiceDetail(phone, leadId, lang, svc);
      return true;
    }
  }
  if (id === "m:book") {
    await sendSlotPicker(phone, leadId, lang);
    return true;
  }
  if (id.startsWith("m:slot:")) {
    await doBooking(phone, leadId, lang, id.slice("m:slot:".length));
    return true;
  }
  if (id === "m:human") {
    await doHumanHandoff(phone, leadId, lang);
    return true;
  }
  return false;
}
