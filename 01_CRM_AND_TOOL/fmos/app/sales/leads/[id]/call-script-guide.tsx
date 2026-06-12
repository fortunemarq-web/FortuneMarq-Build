"use client";

import { useState } from "react";
import { getNicheScript } from "@/lib/niche-scripts";
import { ChevronRight, RotateCcw, CheckCircle2, MessageCircle, Phone, Globe } from "lucide-react";

type Lang = "kannada" | "hindi" | "english";

interface CallScriptGuideProps {
  lead: {
    company_name?: string;
    industry?: string;
    city?: string;
    phone?: string;
    has_website?: boolean;
  };
  marketInsight?: {
    search_volume?: string;
  };
}

type StageId =
  | "intro"
  | "language"
  | "permission"
  | "data_hook"
  | "gap"
  | "pitch"
  | "meeting_ask"
  | "outcome_meeting"
  | "outcome_whatsapp"
  | "outcome_callback"
  | "outcome_not_interested"
  | "outcome_has_agency"
  | "outcome_own_marketing"
  | "outcome_no_budget"
  | "outcome_info"
  | "outcome_no_answer"
  | "outcome_wrong_number";

interface Response {
  label: string;
  next: StageId;
  highlight?: boolean;
}

interface Stage {
  id: StageId;
  step?: number;
  title: string;
  script: string;
  responses: Response[];
  isOutcome?: boolean;
  outcomeType?: "success" | "lost" | "followup" | "neutral";
  whatsappMsg?: string;
  fmosAction?: string;
}

// ── Language-aware script text ───────────────────────────────────────────────

function t(lang: Lang, kn: string, hi: string, en: string): string {
  if (lang === "hindi") return hi;
  if (lang === "english") return en;
  return kn; // kannada (default)
}

function buildStages(
  businessName: string,
  niche: string,
  volume: string,
  hasWebsite: boolean,
  dataHook: string,
  meetingAsk: string,
  objections: {
    not_interested: string;
    has_agency: string;
    no_budget: string;
    callback_later: string;
    doing_own_marketing: string;
  },
  lang: Lang = "kannada"
): Record<StageId, Stage> {
  const nicheLabel = niche || "business";
  const name = businessName || "your business";

  const gapScript = hasWebsite
    ? t(lang,
        `"Nimma website ide — aadre Hubli alli ${volume} jana prathi ${nicheLabel} search maadtaare Google mele. Aa traffic yellige haadtide yaaru padetidaare? Nimma competitors elli idaare, nimdu elli ide — aa data namma hatra ide."`,
        `"Aapka website toh hai — lekin Hubli mein ${volume} log har mahine ${nicheLabel} Google pe search karte hain. Woh traffic kahan ja raha hai? Aapke competitors le rahe hain. Yeh data hamare paas hai."`,
        `"You have a website — but ${volume} people in Hubli search for ${nicheLabel} on Google every month. Where is that traffic going? Your competitors are getting it. We have that data."`
      )
    : t(lang,
        `"Hubli alli ${volume} jana prathi ${nicheLabel} search maadtaare Google mele prathi thumba. Nimma business Google mele illa anta artha — aa entire traffic competitors ge haadtide. Adannu thorisbeku anta call maadidivi."`,
        `"Hubli mein ${volume} log ${nicheLabel} Google pe dhundhte hain. Aapka business Google pe nahi hai — matlab sara traffic competitors ke paas ja raha hai. Isi liye call kiya."`,
        `"${volume} people in Hubli search for ${nicheLabel} on Google every month. Your business isn't on Google — which means all that traffic is going to your competitors. That's why we called."`
      );

  return {
    intro: {
      id: "intro",
      step: 1,
      title: "Introduction",
      script: t(lang,
        `"Hello, nanu Afifa haeltidini, FortuneMarq ninda call maadtidini. ${name} ge call maadtidini — nimma ${nicheLabel} bagge matter ide."`,
        `"Hello, main Afifa bol rahi hun, FortuneMarq se call kar rahi hun. ${name} ke liye call kiya — aapke ${nicheLabel} ke baare mein kuch important hai."`,
        `"Hello, this is Afifa calling from FortuneMarq. I'm calling for ${name} — it's regarding your ${nicheLabel}."`
      ),
      responses: [
        { label: "Owner / Decision maker on line", next: "language", highlight: true },
        { label: "Staff answered — asking to hold", next: "intro" },
        { label: "No answer / Busy", next: "outcome_no_answer" },
        { label: "Wrong number", next: "outcome_wrong_number" },
      ],
    },

    language: {
      id: "language",
      step: 2,
      title: "Language Preference",
      script: `"Nimma jathe Kannada alli maatanaadabeka, Hindi alli, illa English alli?"`,
      responses: [
        { label: "🟢 Kannada (Kanglish)", next: "permission", highlight: true, lang: "kannada" },
        { label: "🔵 Hindi (Hinglish)", next: "permission", highlight: true, lang: "hindi" },
        { label: "⚪ English", next: "permission", lang: "english" },
      ] as any,
    },

    permission: {
      id: "permission",
      step: 3,
      title: "Permission to Speak",
      script: t(lang,
        `"2 nimisha time idya nimge? Thumba important data ide nimma ${nicheLabel} bagge — share maadabekunagide."`,
        `"2 minute ka time hai? Aapke ${nicheLabel} ke baare mein kuch important data hai — share karna chahti hun."`,
        `"Do you have 2 minutes? We have some really important data about your ${nicheLabel} that I'd like to share."`
      ),
      responses: [
        { label: "Yes, go ahead", next: "data_hook", highlight: true },
        { label: "Busy / Call me later", next: "outcome_callback" },
        { label: "Not interested", next: "outcome_not_interested" },
      ],
    },

    data_hook: {
      id: "data_hook",
      step: 4,
      title: "Data Hook",
      script: t(lang,
        `"Navu ond market research maadidivi — ${dataHook}"`,
        `"Humne ek market research ki hai — ${dataHook}"`,
        `"We did a market research — ${dataHook}"`
      ),
      responses: [
        { label: "Curious / Tell me more", next: "gap", highlight: true },
        { label: "Already knew this", next: "gap" },
        { label: "Skeptical / Doesn't believe", next: "gap" },
        { label: "Not interested", next: "outcome_not_interested" },
      ],
    },

    gap: {
      id: "gap",
      step: 5,
      title: "The Gap",
      script: gapScript,
      responses: [
        { label: "Interested / Wants to know more", next: "pitch", highlight: true },
        { label: "Has an agency already", next: "outcome_has_agency" },
        { label: "Doing own marketing", next: "outcome_own_marketing" },
        { label: "Not interested", next: "outcome_not_interested" },
      ],
    },

    pitch: {
      id: "pitch",
      step: 6,
      title: "How We Fit In",
      script: t(lang,
        `"Naavu local ${nicheLabel} ge help maadtivi — customers JustDial bidu neeravaagi nimma business find maadkobeku anta Google mele, direct call barthidhare."`,
        `"Hum local ${nicheLabel} ko help karte hain — customers JustDial chhod ke directly Google pe aapka business dhundhen aur seedha call karein."`,
        `"We help local ${nicheLabel} businesses — so customers find you directly on Google instead of JustDial, and call you directly."`
      ),
      responses: [
        { label: "Sounds good / Interested", next: "meeting_ask", highlight: true },
        { label: "How much does it cost?", next: "outcome_no_budget" },
        { label: "Not sure / Think about it", next: "meeting_ask" },
        { label: "Not interested", next: "outcome_not_interested" },
      ],
    },

    meeting_ask: {
      id: "meeting_ask",
      step: 7,
      title: "Meeting Ask",
      script: t(lang,
        `"${meetingAsk}"`,
        `"Ek 15 minute ki call set kar sakte hain — aapke liye specific data aur plan dikhana chahte hain. Kab convenient rahega?"`,
        `"Can we set up a 15-minute call? We want to show you the specific data and plan for your business. When works for you?"`
      ),
      responses: [
        { label: "Meeting Booked!", next: "outcome_meeting", highlight: true },
        { label: "Send WhatsApp first", next: "outcome_whatsapp" },
        { label: "Call back later", next: "outcome_callback" },
        { label: "Not interested now", next: "outcome_not_interested" },
        { label: "Has agency", next: "outcome_has_agency" },
        { label: "Doing own marketing", next: "outcome_own_marketing" },
        { label: "Budget concern", next: "outcome_no_budget" },
        { label: "Want info / PDF first", next: "outcome_info" },
      ],
    },

    // ── Outcome stages ────────────────────────────────────────────────────────

    outcome_meeting: {
      id: "outcome_meeting",
      title: "Meeting Booked",
      isOutcome: true,
      outcomeType: "success",
      script: t(lang,
        "Excellent! Meeting confirmed. FMOS mele date/time log maadi.",
        "Excellent! Meeting confirm ho gayi. FMOS pe date/time log karo.",
        "Excellent! Meeting confirmed. Log the date/time in FMOS."
      ),
      whatsappMsg: `Hi! Afifa here from FortuneMarq. Thank you for your time — as discussed, our founder Jabeer will call you for a 15-minute session. Looking forward to showing you the data for ${name}. 😊`,
      fmosAction: "Log outcome: Meeting Booked → advance to meeting_booked stage",
      responses: [{ label: "Start a new call", next: "intro" }],
    },

    outcome_whatsapp: {
      id: "outcome_whatsapp",
      title: "WhatsApp Requested",
      isOutcome: true,
      outcomeType: "followup",
      script: t(lang,
        `"Sari — nimma WhatsApp number correct idya? Abhi send maadtini."`,
        `"Theek hai — aapka WhatsApp number sahi hai? Abhi send karta hun."`,
        `"Sure — is your WhatsApp number correct? I'll send it right now."`
      ),
      whatsappMsg: `Hi! Afifa here from FortuneMarq. We spoke just now about the digital marketing opportunity for ${name}. Here's a quick overview of what we discussed. Our founder Jabeer can walk you through the data — shall we schedule a 15-min call? 🙏`,
      fmosAction: "Log outcome: WhatsApp Requested → stage: touch1_sent",
      responses: [{ label: "Sent — start new call", next: "intro" }],
    },

    outcome_callback: {
      id: "outcome_callback",
      title: "Callback Scheduled",
      isOutcome: true,
      outcomeType: "followup",
      script: t(lang,
        `"Sari, yaava time convenient? Naalidu 11am ge call maadali?" → Callback time note maadi, FMOS mele set maadi.`,
        `"Theek hai, kab convenient rahega? Kal 11am ko call kar sakta hun?" → Callback time note karo, FMOS pe set karo.`,
        `"No problem — when's a good time? Can I call tomorrow at 11am?" → Note the time and set follow-up in FMOS.`
      ),
      fmosAction: "Log outcome: Callback Requested → set follow_up_date in FMOS",
      responses: [{ label: "Follow-up set — start new call", next: "intro" }],
    },

    outcome_not_interested: {
      id: "outcome_not_interested",
      title: "Not Interested",
      isOutcome: true,
      outcomeType: "lost",
      script: t(lang,
        `Say: "${objections.not_interested}"`,
        `Say: "Koi baat nahi — ek mahine baad follow up karein? Market data change hota rehta hai."`,
        `Say: "No problem at all — can we follow up in a month? The market data changes and we might have something relevant for you."`
      ),
      fmosAction: "Log outcome: Not Interested → stage stays, add note",
      responses: [
        { label: "They softened — continue to gap", next: "gap" },
        { label: "Confirmed not interested", next: "intro" },
      ],
    },

    outcome_has_agency: {
      id: "outcome_has_agency",
      title: "Has an Agency",
      isOutcome: true,
      outcomeType: "neutral",
      script: t(lang,
        `Say: "${objections.has_agency}"`,
        `Say: "Achha — toh Google pe aapki ranking kahan hai abhi? First page pe hain?"`,
        `Say: "That's great — where is your Google ranking right now? Are you on the first page?"`
      ),
      fmosAction: "Log outcome: Has Agency → add note, schedule revival follow-up",
      responses: [
        { label: "Opened up — continue pitch", next: "pitch" },
        { label: "Firm — log and close", next: "intro" },
      ],
    },

    outcome_own_marketing: {
      id: "outcome_own_marketing",
      title: "Doing Own Marketing",
      isOutcome: true,
      outcomeType: "neutral",
      script: t(lang,
        `Say: "${objections.doing_own_marketing}"`,
        `Say: "Wah — toh in ${volume} searches mein se kitne aapke paas aa rahe hain abhi?"`,
        `Say: "That's great — of those ${volume} searches happening in Hubli, how many are coming to you right now?"`
      ),
      fmosAction: "Log outcome: Own Marketing → add note",
      responses: [
        { label: "Interested now — continue", next: "pitch" },
        { label: "Not moving — log and close", next: "intro" },
      ],
    },

    outcome_no_budget: {
      id: "outcome_no_budget",
      title: "No Budget",
      isOutcome: true,
      outcomeType: "neutral",
      script: t(lang,
        `Say: "${objections.no_budget}"`,
        `Say: "Samajh gaya — chhote packages bhi hain. Sirf information bhej dun WhatsApp pe?"`,
        `Say: "Understood — we have small packages too. Can I just send you the information on WhatsApp?"`
      ),
      fmosAction: "Log outcome: No Budget → add note, offer PDF",
      responses: [
        { label: "Interested in info — send WhatsApp", next: "outcome_whatsapp" },
        { label: "Firm — log and close", next: "intro" },
      ],
    },

    outcome_info: {
      id: "outcome_info",
      title: "Info / PDF Requested",
      isOutcome: true,
      outcomeType: "followup",
      script: t(lang,
        `"Sari — WhatsApp mele ond PDF send maadtini nimge. Nimma number correct idya?"`,
        `"Theek hai — WhatsApp pe ek PDF bhejta hun. Number sahi hai?"`,
        `"Sure — I'll send a PDF on WhatsApp. Is this number correct?"`
      ),
      whatsappMsg: `Hi! Afifa here from FortuneMarq. As promised, here's the information about how we help ${name} grow on Google. Our founder Jabeer can give you a full walkthrough — shall we schedule 15 mins? 🙏`,
      fmosAction: "Log outcome: Info Requested → mark pdf_due, send PDF",
      responses: [{ label: "PDF sent — start new call", next: "intro" }],
    },

    outcome_no_answer: {
      id: "outcome_no_answer",
      title: "No Answer / Busy",
      isOutcome: true,
      outcomeType: "neutral",
      script: "No answer or line busy. Schedule a callback.",
      fmosAction: "Log outcome: No Answer → set follow_up_date +1 day",
      responses: [{ label: "Logged — start new call", next: "intro" }],
    },

    outcome_wrong_number: {
      id: "outcome_wrong_number",
      title: "Wrong Number",
      isOutcome: true,
      outcomeType: "lost",
      script: "Wrong number. Mark this lead as dead or update the phone number.",
      fmosAction: "Log outcome: Wrong Number → mark dead or update phone",
      responses: [{ label: "Logged — start new call", next: "intro" }],
    },
  };
}

const OUTCOME_STYLES: Record<string, string> = {
  success: "border-green-300 bg-green-50",
  lost: "border-red-300 bg-red-50",
  followup: "border-amber-300 bg-amber-50",
  neutral: "border-slate-300 bg-slate-50",
};

const OUTCOME_BADGE: Record<string, string> = {
  success: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  followup: "bg-amber-100 text-amber-800",
  neutral: "bg-slate-100 text-slate-700",
};

const LANG_LABELS: Record<Lang, string> = {
  kannada: "🟢 Kanglish",
  hindi: "🔵 Hinglish",
  english: "⚪ English",
};

export default function CallScriptGuide({ lead, marketInsight }: CallScriptGuideProps) {
  const [currentStageId, setCurrentStageId] = useState<StageId>("intro");
  const [history, setHistory] = useState<StageId[]>([]);
  const [selectedLang, setSelectedLang] = useState<Lang>("kannada");

  const nicheScript = getNicheScript(lead.industry || "");
  const volume =
    nicheScript?.volume ||
    marketInsight?.search_volume ||
    "thousands";

  const buildArgs: [string, string, string, boolean, string, string, any, Lang] = nicheScript
    ? [
        lead.company_name || "",
        nicheScript.niche,
        volume,
        !!lead.has_website,
        nicheScript.dataHook,
        nicheScript.meetingAsk,
        nicheScript.objections,
        selectedLang,
      ]
    : [
        lead.company_name || "",
        lead.industry || "business",
        volume,
        !!lead.has_website,
        `Hubli alli ${volume} jana prathi ${lead.industry || "business"} search maadtaare Google mele.`,
        "15 nimisha call set maadbahudu — nimma business ge specific data thorisi discuss maadabahuda?",
        {
          not_interested: "No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",
          has_agency: "Channagide — nimma Google ranking currently elli ide? First page mele idya?",
          no_budget: "Understand maadtini — small packages ide, just information maatra send maadbahudu?",
          callback_later: "Sari, yaava time convenient? Naalidu 11am ge call maadali?",
          doing_own_marketing: `Channagide — ee ${volume} searches alli eshtu nimge bartide currently?`,
        },
        selectedLang,
      ];

  const stages = buildStages(...buildArgs);
  const stage = stages[currentStageId];

  const go = (next: StageId, lang?: Lang) => {
    // If a language was passed (from the language stage buttons), set it
    if (lang) setSelectedLang(lang);

    if (next === "intro") {
      setHistory([]);
      setCurrentStageId("intro");
      return;
    }
    setHistory((h) => [...h, currentStageId]);
    setCurrentStageId(next);
  };

  const goBack = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrentStageId(prev);
  };

  const TOTAL_STEPS = 7;
  const currentStep = stage.step ?? null;

  return (
    <div className="space-y-4">
      {/* Lead context bar */}
      <div className="flex items-center gap-3 rounded-lg bg-slate-800 px-4 py-2.5 text-sm text-white flex-wrap">
        <Phone className="h-4 w-4 text-green-400 flex-shrink-0" />
        <span className="font-semibold text-green-400">{lead.company_name}</span>
        {lead.industry && (
          <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
            {nicheScript?.niche || lead.industry}
          </span>
        )}
        {volume && (
          <span className="rounded-full bg-indigo-700 px-2 py-0.5 text-xs text-indigo-200">
            {volume} searches/mo
          </span>
        )}
        {lead.has_website !== undefined && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              lead.has_website
                ? "bg-blue-700 text-blue-200"
                : "bg-orange-700 text-orange-200"
            }`}
          >
            {lead.has_website ? "Has Website" : "No Website"}
          </span>
        )}
        {/* Language badge — only show once language is confirmed (past intro) */}
        {currentStageId !== "intro" && currentStageId !== "language" && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-slate-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            <Globe className="h-3 w-3" />
            {LANG_LABELS[selectedLang]}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {currentStep && (
        <div className="flex items-center gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i + 1 < currentStep
                  ? "bg-green-500"
                  : i + 1 === currentStep
                  ? "bg-indigo-500"
                  : "bg-slate-200"
              }`}
            />
          ))}
          <span className="ml-2 text-xs text-slate-500 whitespace-nowrap">
            Stage {currentStep}/{TOTAL_STEPS}
          </span>
        </div>
      )}

      {/* Stage card */}
      <div
        className={`rounded-xl border-2 p-5 ${
          stage.isOutcome
            ? OUTCOME_STYLES[stage.outcomeType || "neutral"]
            : "border-indigo-200 bg-white"
        }`}
      >
        {/* Stage header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {stage.step && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {stage.step}
              </span>
            )}
            {stage.isOutcome && (
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                  OUTCOME_BADGE[stage.outcomeType || "neutral"]
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                Outcome
              </span>
            )}
            <h3 className="text-base font-bold text-slate-900">{stage.title}</h3>
          </div>
          {history.length > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              <RotateCcw className="h-3 w-3" />
              Back
            </button>
          )}
        </div>

        {/* Script text */}
        <div className="rounded-lg bg-slate-900 p-4 mb-4">
          <p className="font-mono text-sm leading-relaxed text-green-300 whitespace-pre-wrap">
            {stage.script}
          </p>
        </div>

        {/* WhatsApp message (for outcomes) */}
        {stage.whatsappMsg && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold uppercase text-emerald-700">
                WhatsApp Message to Send
              </span>
            </div>
            <p className="text-sm text-emerald-800 leading-relaxed">{stage.whatsappMsg}</p>
            <a
              href={`https://wa.me/91${lead.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(stage.whatsappMsg)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              <MessageCircle className="h-3 w-3" />
              Open in WhatsApp
            </a>
          </div>
        )}

        {/* FMOS action */}
        {stage.fmosAction && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-bold uppercase text-blue-700 mb-1">FMOS Action</p>
            <p className="text-sm text-blue-800">{stage.fmosAction}</p>
          </div>
        )}

        {/* Response buttons */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {stage.isOutcome ? "What to do next" : "Customer said..."}
          </p>
          <div className="flex flex-col gap-2">
            {stage.responses.map((r, i) => (
              <button
                key={i}
                onClick={() => go(r.next, (r as any).lang)}
                className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-left transition-colors ${
                  r.highlight
                    ? "border-2 border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{r.label}</span>
                <ChevronRight className="h-4 w-4 flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={() => {
          setHistory([]);
          setCurrentStageId("intro");
        }}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
      >
        <RotateCcw className="h-3 w-3" />
        Reset call script
      </button>
    </div>
  );
}
