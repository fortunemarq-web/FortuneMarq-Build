#!/usr/bin/env node
/**
 * One-time setup: create + publish the multi-select "Services" WhatsApp Flows
 * (one per language: en / kn / hi) on the FortuneMarq WABA.
 *
 * A Flow is a self-contained ("navigate" / no-endpoint) checkbox form: the lead
 * ticks the services they want and taps Continue; WhatsApp returns the selection
 * to our webhook as an `nfm_reply` (no encryption keys needed for this type).
 *
 * Run:  node scripts/setup_whatsapp_flows.mjs
 * Reads WHATSAPP_API_TOKEN from .env.local. Prints the 3 flow ids to put in
 * Vercel as WHATSAPP_FLOW_ID_EN / _KN / _HI (the bot falls back to the
 * single-select list menu when an id is missing, so this is safe to stage).
 *
 * Re-runnable: pass an existing flow id map via env to skip, or just re-run —
 * it creates fresh flows (delete old drafts in WhatsApp Manager if needed).
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GRAPH = "https://graph.facebook.com/v23.0";
const WABA_ID = "1499408311884474";

function loadToken() {
  if (process.env.WHATSAPP_API_TOKEN) return process.env.WHATSAPP_API_TOKEN;
  const env = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  const line = env.split("\n").find((l) => l.startsWith("WHATSAPP_API_TOKEN="));
  if (!line) throw new Error("WHATSAPP_API_TOKEN not found in .env.local");
  return line.slice("WHATSAPP_API_TOKEN=".length).trim().replace(/^["']|["']$/g, "");
}

// Service options (id → localized checkbox label). Ids match lib/bot/menu.ts Svc keys.
const SERVICES = [
  { id: "grow", en: "Get more customers", kn: "ಹೆಚ್ಚು ಗ್ರಾಹಕರು", hi: "ज़्यादा ग्राहक" },
  { id: "gmb", en: "Google & Maps", kn: "ಗೂಗಲ್ ಮತ್ತು ಮ್ಯಾಪ್ಸ್", hi: "गूगल और मैप्स" },
  { id: "web", en: "Website", kn: "ವೆಬ್‌ಸೈಟ್", hi: "वेबसाइट" },
  { id: "ads", en: "Run ads (Google/Meta)", kn: "ಜಾಹೀರಾತು (Ads)", hi: "विज्ञापन (Ads)" },
  { id: "seo", en: "Rank on Google (SEO)", kn: "SEO – ಗೂಗಲ್ ರ‍್ಯಾಂಕ್", hi: "SEO – गूगल रैंक" },
  { id: "wa", en: "WhatsApp marketing", kn: "WhatsApp ಮಾರ್ಕೆಟಿಂಗ್", hi: "WhatsApp मार्केटिंग" },
  { id: "proof", en: "See your results", kn: "ನಮ್ಮ ಫಲಿತಾಂಶ", hi: "हमारे नतीजे" },
];

const COPY = {
  en: { title: "Services", heading: "Which services interest you?", sub: "Pick as many as you like 👇", label: "Services", footer: "Continue" },
  kn: { title: "ಸೇವೆಗಳು", heading: "ನಿಮಗೆ ಯಾವ ಸೇವೆಗಳು ಆಸಕ್ತಿ?", sub: "ಬೇಕಾದಷ್ಟು ಆಯ್ಕೆಮಾಡಿ 👇", label: "ಸೇವೆಗಳು", footer: "ಮುಂದುವರಿಸಿ" },
  hi: { title: "सेवाएँ", heading: "आपको कौन-सी सेवाएँ चाहिए?", sub: "जितनी चाहें उतनी चुनें 👇", label: "सेवाएँ", footer: "आगे बढ़ें" },
};

function flowJson(lang) {
  const c = COPY[lang];
  return {
    version: "7.0",
    screens: [
      {
        id: "SERVICES",
        title: c.title,
        terminal: true,
        success: true,
        data: {},
        layout: {
          type: "SingleColumnLayout",
          children: [
            { type: "TextHeading", text: c.heading },
            { type: "TextBody", text: c.sub },
            {
              type: "CheckboxGroup",
              name: "services",
              label: c.label,
              required: false,
              "data-source": SERVICES.map((s) => ({ id: s.id, title: s[lang] })),
            },
            {
              type: "Footer",
              label: c.footer,
              "on-click-action": { name: "complete", payload: { services: "${form.services}" } },
            },
          ],
        },
      },
    ],
  };
}

async function createFlow(token, lang) {
  const body = new URLSearchParams({
    name: `FortuneMarq Services (${lang.toUpperCase()})`,
    categories: JSON.stringify(["LEAD_GENERATION"]),
    flow_json: JSON.stringify(flowJson(lang)),
    publish: "true",
  });
  const res = await fetch(`${GRAPH}/${WABA_ID}/flows`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

async function main() {
  const token = loadToken();
  const out = {};
  for (const lang of ["en", "kn", "hi"]) {
    const { ok, json } = await createFlow(token, lang);
    if (ok && json.id) {
      out[lang] = json.id;
      console.log(`✓ ${lang}: flow ${json.id}` + (json.validation_errors?.length ? `  (warnings: ${JSON.stringify(json.validation_errors)})` : ""));
    } else {
      console.error(`✗ ${lang}: FAILED →`, JSON.stringify(json, null, 2));
    }
  }
  console.log("\n=== Add these to Vercel + .env.local ===");
  if (out.en) console.log(`WHATSAPP_FLOW_ID_EN=${out.en}`);
  if (out.kn) console.log(`WHATSAPP_FLOW_ID_KN=${out.kn}`);
  if (out.hi) console.log(`WHATSAPP_FLOW_ID_HI=${out.hi}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
