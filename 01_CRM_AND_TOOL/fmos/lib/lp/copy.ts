// Bilingual section copy for the niche LPs (EN + KN).
// {niche} {city} {customer} {volume} {leak} {topName} {topTraffic}
// {visitors} {enquiries} are interpolated at render time.

import type { Lang } from "@/lib/lp/niches";

export interface LpCopy {
  // chrome
  navBookCta: string;
  navWhatsapp: string;
  exclusivity: string;
  langLabel: string;

  // hero (Aware)
  heroEyebrow: string;
  heroSubhead: string;
  heroBook: string;
  heroWhatsapp: string;
  heroTrust: string;

  // FOMO
  fomoEyebrow: string;
  fomoHeading: string;
  fomoLeakLabel: string;
  fomoBody: string;
  splitGmb: string;
  splitDirectories: string;
  splitRealSites: string;
  splitSocial: string;
  splitCaption: string;

  // preview / proof
  previewEyebrow: string;
  previewHeading: string;
  previewBody: string;
  previewAdLabel: string;
  previewGmbLabel: string;
  previewConvLabel: string;
  previewSample: string;
  proofLink: string;

  // projection
  projEyebrow: string;
  projHeading: string;
  projDisclaimer: string;
  projReached: string;
  projVisitors: string;
  projEnquiries: string;

  // differentiation
  diffEyebrow: string;
  diffHeading: string;
  diffTypical: string;
  diffUs: string;
  diffRows: { typical: string; us: string }[];

  // how we'd start (upsell path)
  pathEyebrow: string;
  pathHeading: string;
  pathBody: string;

  // CTA
  ctaHeading: string;
  ctaBody: string;
  ctaBook: string;
  ctaWhatsapp: string;

  // form
  formHeading: string;
  formSub: string;
  formBusiness: string;
  formName: string;
  formPhone: string;
  formEmail: string;
  formSubmit: string;
  formBooking: string;
  formPickTime: string;
  formConfirm: string;
  formSuccessTitle: string;
  formSuccessBody: string;
  formBookedTitle: string;
  formBookedBody: string;
  formAnother: string;
  formPrivacy: string;

  footerTagline: string;
}

const EN: LpCopy = {
  navBookCta: "Book a meeting",
  navWhatsapp: "WhatsApp",
  exclusivity: "Hubli market data",
  langLabel: "ಕನ್ನಡ",

  heroEyebrow: "Data-led growth for {niche} in {city}",
  heroSubhead:
    "We don't sell “branding”. We start with the real search data for your market in {city} — then build the system that turns those searches into {customer}.",
  heroBook: "Book a free strategy call",
  heroWhatsapp: "Ask on WhatsApp",
  heroTrust: "Built on real {city} search data · No fabricated results",

  fomoEyebrow: "What's happening right now",
  fomoHeading: "Your customers are searching. They're landing somewhere else.",
  fomoLeakLabel: "searches/month leaking to directories",
  fomoBody:
    "Of the {volume} monthly searches for {niche} in {city}, roughly {leak} go straight to directories like JustDial and Sulekha — not to a real business. {topName}, the strongest local site, still captures only about {topTraffic} visits a month. That gap is yours to take.",
  splitGmb: "Google Maps / Local Pack",
  splitDirectories: "Directories & aggregators",
  splitRealSites: "Real business websites",
  splitSocial: "Social & other",
  splitCaption: "How {city}'s monthly demand for {niche} splits across page one of Google.",

  previewEyebrow: "What we'd build",
  previewHeading: "The system that catches that demand",
  previewBody:
    "A Google Ad at the moment of intent, a Maps listing that earns the call, and a page built to convert — working together, tracked end to end.",
  previewAdLabel: "Google Ad — shown the moment they search",
  previewGmbLabel: "Maps listing — optimised to win the call",
  previewConvLabel: "Conversion page — built to book, not just browse",
  previewSample: "Illustrative — sample layout, not a client result",
  proofLink: "See real client results on request →",

  projEyebrow: "Projected for you",
  projHeading: "What capturing your market could look like",
  projDisclaimer:
    "Illustrative projection from {city} search data — a realistic, conservative scenario, not a guarantee.",
  projReached: "searches/month within reach",
  projVisitors: "potential monthly visitors",
  projEnquiries: "potential monthly enquiries",

  diffEyebrow: "Why we're different",
  diffHeading: "Most agencies guess. We start with your data.",
  diffTypical: "Typical agency",
  diffUs: "FortuneMarq",
  diffRows: [
    { typical: "Sells “branding” and vague reach", us: "Builds a system that books {customer}" },
    { typical: "Same plan for every client", us: "Plan built from your niche's real search data" },
    { typical: "Reports you can't act on", us: "One owner, one number to call, clear results" },
    { typical: "Locks you into long contracts", us: "Starts small — GMB first, earn the next step" },
  ],

  pathEyebrow: "How we'd start",
  pathHeading: "Step by step — earn the next move",
  pathBody:
    "We don't ask for a big commitment up front. We start where the return is fastest and expand only once it's working.",

  ctaHeading: "See the full data for your {niche} business",
  ctaBody:
    "Book a free strategy call and we'll walk you through your market — the searches, the gaps, and exactly how to capture them.",
  ctaBook: "Book a free strategy call",
  ctaWhatsapp: "Ask a question on WhatsApp",

  formHeading: "Book your free strategy call",
  formSub: "15 minutes. Your market data, your gaps, your plan — no obligation.",
  formBusiness: "Business name",
  formName: "Your name",
  formPhone: "Phone (WhatsApp)",
  formEmail: "Email (optional)",
  formSubmit: "Request my call",
  formBooking: "Pick a time that suits you",
  formPickTime: "Choose a slot",
  formConfirm: "Confirm booking",
  formSuccessTitle: "Got it!",
  formSuccessBody: "Our {city} strategist will reach out shortly to lock in your call.",
  formBookedTitle: "You're booked!",
  formBookedBody: "A Google Meet invite is on its way to your WhatsApp. See you there.",
  formAnother: "Submit another response",
  formPrivacy: "We use your details only to prepare and confirm your call.",

  footerTagline: "Marketing that pays you back.",
};

const KN: LpCopy = {
  navBookCta: "ಮೀಟಿಂಗ್ ಬುಕ್ ಮಾಡಿ",
  navWhatsapp: "ವಾಟ್ಸಾಪ್",
  exclusivity: "ಹುಬ್ಬಳ್ಳಿ ಮಾರುಕಟ್ಟೆ ಡೇಟಾ",
  langLabel: "English",

  heroEyebrow: "{city}ಯಲ್ಲಿ {niche}ಗಾಗಿ ಡೇಟಾ-ಆಧಾರಿತ ಬೆಳವಣಿಗೆ",
  heroSubhead:
    "ನಾವು “ಬ್ರಾಂಡಿಂಗ್” ಮಾರಾಟ ಮಾಡುವುದಿಲ್ಲ. {city}ಯಲ್ಲಿ ನಿಮ್ಮ ಮಾರುಕಟ್ಟೆಯ ನಿಜವಾದ ಸರ್ಚ್ ಡೇಟಾದಿಂದ ಪ್ರಾರಂಭಿಸಿ — ಆ ಸರ್ಚ್‌ಗಳನ್ನು {customer}ಆಗಿ ಪರಿವರ್ತಿಸುವ ವ್ಯವಸ್ಥೆಯನ್ನು ನಿರ್ಮಿಸುತ್ತೇವೆ.",
  heroBook: "ಉಚಿತ ಸ್ಟ್ರಾಟಜಿ ಕರೆ ಬುಕ್ ಮಾಡಿ",
  heroWhatsapp: "ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಕೇಳಿ",
  heroTrust: "ನಿಜವಾದ {city} ಸರ್ಚ್ ಡೇಟಾ ಆಧಾರಿತ · ಸುಳ್ಳು ಫಲಿತಾಂಶಗಳಿಲ್ಲ",

  fomoEyebrow: "ಇದೀಗ ಏನಾಗುತ್ತಿದೆ",
  fomoHeading: "ನಿಮ್ಮ ಗ್ರಾಹಕರು ಹುಡುಕುತ್ತಿದ್ದಾರೆ. ಆದರೆ ಬೇರೆಲ್ಲೋ ತಲುಪುತ್ತಿದ್ದಾರೆ.",
  fomoLeakLabel: "ಪ್ರತಿ ತಿಂಗಳು ಡೈರೆಕ್ಟರಿಗಳಿಗೆ ಸೋರಿಕೆಯಾಗುವ ಸರ್ಚ್‌ಗಳು",
  fomoBody:
    "{city}ಯಲ್ಲಿ {niche}ಗಾಗಿ ತಿಂಗಳಿಗೆ {volume} ಸರ್ಚ್‌ಗಳಲ್ಲಿ, ಸುಮಾರು {leak} ನೇರವಾಗಿ JustDial, Sulekhaನಂತಹ ಡೈರೆಕ್ಟರಿಗಳಿಗೆ ಹೋಗುತ್ತವೆ — ನಿಜವಾದ ವ್ಯಾಪಾರಕ್ಕೆ ಅಲ್ಲ. ಅತ್ಯಂತ ಪ್ರಬಲ ಸ್ಥಳೀಯ ಸೈಟ್ {topName} ಸಹ ತಿಂಗಳಿಗೆ ಸುಮಾರು {topTraffic} ಭೇಟಿಗಳನ್ನು ಮಾತ್ರ ಪಡೆಯುತ್ತದೆ. ಆ ಅಂತರ ನಿಮ್ಮದಾಗಿಸಿಕೊಳ್ಳಬಹುದು.",
  splitGmb: "ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ / ಲೋಕಲ್ ಪ್ಯಾಕ್",
  splitDirectories: "ಡೈರೆಕ್ಟರಿಗಳು ಮತ್ತು ಅಗ್ರಿಗೇಟರ್‌ಗಳು",
  splitRealSites: "ನಿಜವಾದ ವ್ಯಾಪಾರ ವೆಬ್‌ಸೈಟ್‌ಗಳು",
  splitSocial: "ಸೋಶಿಯಲ್ ಮತ್ತು ಇತರೆ",
  splitCaption: "ಗೂಗಲ್‌ನ ಮೊದಲ ಪುಟದಲ್ಲಿ {city}ಯ {niche} ಬೇಡಿಕೆ ಹೇಗೆ ಹಂಚಿಹೋಗುತ್ತದೆ.",

  previewEyebrow: "ನಾವು ಏನು ನಿರ್ಮಿಸುತ್ತೇವೆ",
  previewHeading: "ಆ ಬೇಡಿಕೆಯನ್ನು ಹಿಡಿಯುವ ವ್ಯವಸ್ಥೆ",
  previewBody:
    "ಹುಡುಕುವ ಕ್ಷಣದಲ್ಲೇ ಗೂಗಲ್ ಜಾಹೀರಾತು, ಕರೆ ಗಳಿಸುವ ಮ್ಯಾಪ್ಸ್ ಲಿಸ್ಟಿಂಗ್, ಮತ್ತು ಪರಿವರ್ತಿಸಲು ನಿರ್ಮಿಸಿದ ಪುಟ — ಎಲ್ಲವೂ ಒಟ್ಟಿಗೆ, ಪೂರ್ಣ ಟ್ರ್ಯಾಕಿಂಗ್‌ನೊಂದಿಗೆ.",
  previewAdLabel: "ಗೂಗಲ್ ಜಾಹೀರಾತು — ಹುಡುಕಿದ ಕ್ಷಣ ಕಾಣಿಸುತ್ತದೆ",
  previewGmbLabel: "ಮ್ಯಾಪ್ಸ್ ಲಿಸ್ಟಿಂಗ್ — ಕರೆ ಗೆಲ್ಲಲು ಆಪ್ಟಿಮೈಸ್ ಮಾಡಲಾಗಿದೆ",
  previewConvLabel: "ಕನ್ವರ್ಷನ್ ಪುಟ — ಬುಕ್ ಮಾಡಲು ನಿರ್ಮಿಸಲಾಗಿದೆ",
  previewSample: "ಉದಾಹರಣೆಗಾಗಿ — ಮಾದರಿ ವಿನ್ಯಾಸ, ಗ್ರಾಹಕ ಫಲಿತಾಂಶವಲ್ಲ",
  proofLink: "ವಿನಂತಿಯ ಮೇರೆಗೆ ನಿಜವಾದ ಗ್ರಾಹಕ ಫಲಿತಾಂಶಗಳನ್ನು ನೋಡಿ →",

  projEyebrow: "ನಿಮಗಾಗಿ ಅಂದಾಜು",
  projHeading: "ನಿಮ್ಮ ಮಾರುಕಟ್ಟೆಯನ್ನು ಹಿಡಿದರೆ ಹೇಗಿರಬಹುದು",
  projDisclaimer:
    "{city} ಸರ್ಚ್ ಡೇಟಾದಿಂದ ಅಂದಾಜು — ವಾಸ್ತವಿಕ, ಸಂಪ್ರದಾಯಶೀಲ ಸನ್ನಿವೇಶ, ಗ್ಯಾರಂಟಿ ಅಲ್ಲ.",
  projReached: "ತಿಂಗಳಿಗೆ ತಲುಪಬಹುದಾದ ಸರ್ಚ್‌ಗಳು",
  projVisitors: "ಸಂಭಾವ್ಯ ಮಾಸಿಕ ಭೇಟಿಗಾರರು",
  projEnquiries: "ಸಂಭಾವ್ಯ ಮಾಸಿಕ ವಿಚಾರಣೆಗಳು",

  diffEyebrow: "ನಾವು ಏಕೆ ಭಿನ್ನ",
  diffHeading: "ಹೆಚ್ಚಿನ ಏಜೆನ್ಸಿಗಳು ಊಹಿಸುತ್ತವೆ. ನಾವು ನಿಮ್ಮ ಡೇಟಾದಿಂದ ಪ್ರಾರಂಭಿಸುತ್ತೇವೆ.",
  diffTypical: "ಸಾಮಾನ್ಯ ಏಜೆನ್ಸಿ",
  diffUs: "FortuneMarq",
  diffRows: [
    { typical: "“ಬ್ರಾಂಡಿಂಗ್” ಮತ್ತು ಅಸ್ಪಷ್ಟ ರೀಚ್ ಮಾರಾಟ", us: "{customer}ಬುಕ್ ಮಾಡುವ ವ್ಯವಸ್ಥೆ ನಿರ್ಮಿಸುತ್ತದೆ" },
    { typical: "ಎಲ್ಲ ಗ್ರಾಹಕರಿಗೂ ಒಂದೇ ಯೋಜನೆ", us: "ನಿಮ್ಮ ನಿಚ್‌ನ ನಿಜ ಸರ್ಚ್ ಡೇಟಾದಿಂದ ಯೋಜನೆ" },
    { typical: "ಕ್ರಮ ಕೈಗೊಳ್ಳಲಾಗದ ವರದಿಗಳು", us: "ಒಬ್ಬ ಮಾಲೀಕ, ಒಂದು ಕರೆ, ಸ್ಪಷ್ಟ ಫಲಿತಾಂಶ" },
    { typical: "ದೀರ್ಘ ಒಪ್ಪಂದಗಳಲ್ಲಿ ಬಂಧಿಸುತ್ತದೆ", us: "ಸಣ್ಣದಾಗಿ ಪ್ರಾರಂಭ — ಮೊದಲು GMB" },
  ],

  pathEyebrow: "ನಾವು ಹೇಗೆ ಪ್ರಾರಂಭಿಸುತ್ತೇವೆ",
  pathHeading: "ಹಂತ ಹಂತವಾಗಿ — ಮುಂದಿನ ಹೆಜ್ಜೆ ಗಳಿಸಿ",
  pathBody:
    "ಮೊದಲೇ ದೊಡ್ಡ ಬದ್ಧತೆ ಕೇಳುವುದಿಲ್ಲ. ವೇಗವಾಗಿ ಫಲ ನೀಡುವಲ್ಲಿ ಪ್ರಾರಂಭಿಸಿ, ಕೆಲಸ ಮಾಡಿದ ಮೇಲೆ ಮಾತ್ರ ವಿಸ್ತರಿಸುತ್ತೇವೆ.",

  ctaHeading: "ನಿಮ್ಮ {niche} ವ್ಯಾಪಾರಕ್ಕಾಗಿ ಪೂರ್ಣ ಡೇಟಾ ನೋಡಿ",
  ctaBody:
    "ಉಚಿತ ಸ್ಟ್ರಾಟಜಿ ಕರೆ ಬುಕ್ ಮಾಡಿ — ನಿಮ್ಮ ಮಾರುಕಟ್ಟೆ, ಸರ್ಚ್‌ಗಳು, ಅಂತರಗಳು ಮತ್ತು ಅವುಗಳನ್ನು ಹಿಡಿಯುವ ಮಾರ್ಗವನ್ನು ತೋರಿಸುತ್ತೇವೆ.",
  ctaBook: "ಉಚಿತ ಸ್ಟ್ರಾಟಜಿ ಕರೆ ಬುಕ್ ಮಾಡಿ",
  ctaWhatsapp: "ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಪ್ರಶ್ನೆ ಕೇಳಿ",

  formHeading: "ನಿಮ್ಮ ಉಚಿತ ಸ್ಟ್ರಾಟಜಿ ಕರೆ ಬುಕ್ ಮಾಡಿ",
  formSub: "15 ನಿಮಿಷ. ನಿಮ್ಮ ಮಾರುಕಟ್ಟೆ ಡೇಟಾ, ಅಂತರಗಳು, ಯೋಜನೆ — ಯಾವುದೇ ಬಾಧ್ಯತೆ ಇಲ್ಲ.",
  formBusiness: "ವ್ಯಾಪಾರದ ಹೆಸರು",
  formName: "ನಿಮ್ಮ ಹೆಸರು",
  formPhone: "ಫೋನ್ (ವಾಟ್ಸಾಪ್)",
  formEmail: "ಇಮೇಲ್ (ಐಚ್ಛಿಕ)",
  formSubmit: "ನನ್ನ ಕರೆ ವಿನಂತಿಸಿ",
  formBooking: "ನಿಮಗೆ ಸೂಕ್ತ ಸಮಯ ಆಯ್ಕೆಮಾಡಿ",
  formPickTime: "ಸಮಯ ಆಯ್ಕೆಮಾಡಿ",
  formConfirm: "ಬುಕಿಂಗ್ ದೃಢೀಕರಿಸಿ",
  formSuccessTitle: "ಸಿಕ್ಕಿತು!",
  formSuccessBody: "ನಮ್ಮ {city} ಸ್ಟ್ರಾಟಜಿಸ್ಟ್ ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮ ಕರೆಯನ್ನು ನಿಗದಿಪಡಿಸಲು ಸಂಪರ್ಕಿಸುತ್ತಾರೆ.",
  formBookedTitle: "ಬುಕ್ ಆಗಿದೆ!",
  formBookedBody: "ಗೂಗಲ್ ಮೀಟ್ ಆಹ್ವಾನ ನಿಮ್ಮ ವಾಟ್ಸಾಪ್‌ಗೆ ಬರುತ್ತಿದೆ. ಅಲ್ಲಿ ಭೇಟಿಯಾಗೋಣ.",
  formAnother: "ಮತ್ತೊಂದು ಪ್ರತಿಕ್ರಿಯೆ ಸಲ್ಲಿಸಿ",
  formPrivacy: "ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಕರೆ ಸಿದ್ಧಪಡಿಸಲು ಮತ್ತು ದೃಢೀಕರಿಸಲು ಮಾತ್ರ ಬಳಸುತ್ತೇವೆ.",

  footerTagline: "ನಿಮಗೆ ಮರಳಿ ನೀಡುವ ಮಾರ್ಕೆಟಿಂಗ್.",
};

export function getLpCopy(lang: Lang): LpCopy {
  return lang === "kn" ? KN : EN;
}

/** Replace {tokens} in a copy string. */
export function fill(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}
