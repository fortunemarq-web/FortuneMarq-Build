// Bilingual copy for the redesigned niche LP sections (EN + KN).
// Tokens {city} {singular} {niche} {customer} {volume} are filled at render
// time (see fill() in copy.ts) with the lang-appropriate niche values.

import type { Lang } from "./niches";

export interface LpStep {
  tag: string;
  title: string;
  desc: string;
}

export interface LpSections {
  navBook: string;
  callAria: string;

  hero: {
    h1a: string; // normal part
    h1b: string; // accent (em) part
    sub: string;
    book: string;
    whatsapp: string;
    trust: string;
    statSearches: string;
    statLost: string;
    statReach: string;
    logos: string;
  };

  gap: {
    eyebrow: string;
    heading: string;
    body: string;
    totalLabel: string;
    leakNote: string;
    barGbp: string;
    barDirectories: string;
    barNiche: string;
    barSocial: string;
  };

  build: {
    eyebrow: string;
    heading: string;
    steps: LpStep[];
  };

  responsive: {
    eyebrow: string;
    heading: string;
    body: string;
    tagMobile: string;
    tagTablet: string;
    tagDesktop: string;
  };

  why: {
    eyebrow: string;
    heading: string;
    body: string;
    captionLead: string;
    captionRest: string;
    items: { title: string; desc: string }[];
    outcome: string;
  };

  book: {
    eyebrow: string;
    heading: string;
    body: string;
    whatsapp: string;
    trust: string;
  };

  // Low/no-demand variant (search volume < 1000): lead-the-market angle via Meta ads.
  presence: {
    heroH1a: string;
    heroH1b: string;
    heroSub: string;
    chips: { n: string; l: string }[];
    gapEyebrow: string;
    gapHeading: string;
    gapBody: string;
    points: { t: string; d: string }[];
  };
}

const EN: LpSections = {
  navBook: "Book a call",
  callAria: "Call FortuneMarq",

  hero: {
    h1a: "Be the {singular} ",
    h1b: "{city} finds first.",
    sub: "{volume} people search for a {singular} in {city} every month. We capture that demand — and make sure every lead gets answered.",
    book: "Book a free strategy call",
    whatsapp: "Ask on WhatsApp",
    trust: "Trusted by local businesses across {city}",
    statSearches: "Monthly searches",
    statLost: "Lost to directories",
    statReach: "Within your reach",
    logos: "Certified & partnered with",
  },

  gap: {
    eyebrow: "The gap",
    heading: "Your {customer} are searching. They land somewhere else.",
    body: "Most of {city}'s demand never reaches a real {singular} — it's intercepted by directories like JustDial. That gap is yours to take.",
    totalLabel: "monthly searches in {city}",
    leakNote: "≈ {leak} of them leak to directories — never reaching a real {singular}.",
    barGbp: "Google Business Profile (top 3)",
    barDirectories: "Directories",
    barNiche: "{niche} websites",
    barSocial: "Social & other",
  },

  build: {
    eyebrow: "How it's built",
    heading: "We build your entire system — piece by piece.",
    steps: [
      { tag: "Website", title: "A website built to convert", desc: "A fast, responsive site designed around one job — turning visitors into booked enquiries." },
      { tag: "Google Maps", title: "Rank in the Maps top 3", desc: "We optimise your Google Business Profile so you show up first when people search nearby." },
      { tag: "Paid ads", title: "Ads that bring ready buyers", desc: "Google & Meta campaigns put you in front of people actively looking — and only them." },
      { tag: "CRM", title: "Every lead captured & scored", desc: "Calls, clicks and enquiries land in one place, scored hottest-first so none slip away." },
      { tag: "Automation", title: "Instant replies, clear reporting", desc: "A WhatsApp AI answers in seconds, 24/7, and one dashboard shows exactly what's working." },
    ],
  },

  responsive: {
    eyebrow: "Responsive by default",
    heading: "One site. Flawless on every screen.",
    body: "Phone, tablet or desktop — your website reshapes itself to fit, so every visitor gets a fast, sharp experience. Scroll to see it adapt.",
    tagMobile: "Mobile",
    tagTablet: "Tablet",
    tagDesktop: "Desktop",
  },

  why: {
    eyebrow: "Why choose us",
    heading: "Why local businesses choose FortuneMarq.",
    body: "Not a freelancer juggling tabs. Not an agency that vanishes after launch. One local team running your entire growth system.",
    captionLead: "One team.",
    captionRest: "Your whole growth system.",
    items: [
      { title: "Local, not outsourced", desc: "We know {city}'s market and we're a call away — not a ticket queue overseas." },
      { title: "The whole system, one team", desc: "Website, ads, Maps, CRM and a WhatsApp AI — built to work together, not five vendors to chase." },
      { title: "Built on real data", desc: "Every move starts from real search demand in {city} — not guesswork or vanity metrics." },
      { title: "We make traffic convert", desc: "Leads get answered in seconds, 24/7. We don't just send clicks — we turn them into booked appointments." },
    ],
    outcome: "More booked {customer}",
  },

  book: {
    eyebrow: "Book",
    heading: "See the full data for your {singular}.",
    body: "A free 30-minute strategy call. We'll show you exactly how many {customer} are searching in {city} — and the system that captures and answers them all.",
    whatsapp: "Ask a question on WhatsApp",
    trust: "No obligation · Built on real {city} data",
  },

  presence: {
    heroH1a: "Be the {singular} ",
    heroH1b: "{city} discovers first.",
    heroSub: "Barely anyone in {city} searches for a {singular} yet — they discover one while scrolling Instagram and Facebook. We put you in front of them first, so you become the name everyone already knows.",
    chips: [
      { n: "1st", l: "Be the first they find" },
      { n: "Low", l: "Ad competition today" },
      { n: "100%", l: "Untapped & yours" },
    ],
    gapEyebrow: "The opportunity",
    gapHeading: "No {singular} owns {city} yet. That's your opening.",
    gapBody: "Demand is only just emerging — so whoever builds presence now becomes the default choice when {customer} are ready. We get you in front of them on Instagram & Facebook before your competitors do.",
    points: [
      { t: "Meta ads that create demand", d: "Targeted Instagram & Facebook ads reach {customer} who weren't even searching yet." },
      { t: "First-mover advantage", d: "Become the established name before the market gets crowded." },
      { t: "Cheap, uncontested reach", d: "Low competition means your ads cost less and go further — right now." },
      { t: "The brand they default to", d: "Show up consistently and you're the obvious choice when they're ready to buy." },
    ],
  },
};

const KN: LpSections = {
  navBook: "ಕರೆಯನ್ನು ಬುಕ್ ಮಾಡಿ",
  callAria: "FortuneMarq ಗೆ ಕರೆ ಮಾಡಿ",

  hero: {
    h1a: "{city}ಯಲ್ಲಿ ಜನರು ಮೊದಲು ಹುಡುಕುವ ",
    h1b: "{singular} ನಿಮ್ಮದಾಗಲಿ.",
    sub: "ಪ್ರತಿ ತಿಂಗಳು {city}ಯಲ್ಲಿ {volume} ಜನರು {singular}ಗಾಗಿ ಹುಡುಕುತ್ತಾರೆ. ನಾವು ಆ ಬೇಡಿಕೆಯನ್ನು ಸೆಳೆಯುತ್ತೇವೆ — ಮತ್ತು ಪ್ರತಿಯೊಂದು ಲೀಡ್‌ಗೆ ಉತ್ತರಿಸುವುದನ್ನು ಖಚಿತಪಡಿಸುತ್ತೇವೆ.",
    book: "ಉಚಿತ ಸ್ಟ್ರಾಟಜಿ ಕರೆಯನ್ನು ಬುಕ್ ಮಾಡಿ",
    whatsapp: "WhatsApp ನಲ್ಲಿ ಕೇಳಿ",
    trust: "{city}ಯಾದ್ಯಂತ ಸ್ಥಳೀಯ ವ್ಯವಹಾರಗಳಿಂದ ವಿಶ್ವಾಸಾರ್ಹವಾಗಿದೆ",
    statSearches: "ಮಾಸಿಕ ಹುಡುಕಾಟಗಳು",
    statLost: "ಡೈರೆಕ್ಟರಿಗಳ ಪಾಲಾಗಿದೆ",
    statReach: "ನಿಮ್ಮ ಕೈಗೆಟಕುವಂತಿದೆ",
    logos: "ಇವರಿಂದ ಪ್ರಮಾಣೀಕೃತ ಮತ್ತು ಪಾಲುದಾರಿಕೆ ಪಡೆದಿದೆ",
  },

  gap: {
    eyebrow: "ಅಂತರ",
    heading: "ನಿಮ್ಮ {customer} ಹುಡುಕುತ್ತಿದ್ದಾರೆ. ಆದರೆ ಅವರು ಬೇರೆಡೆಗೆ ಹೋಗುತ್ತಿದ್ದಾರೆ.",
    body: "{city}ಯ ಹೆಚ್ಚಿನ ಬೇಡಿಕೆಯು ನಿಜವಾದ {singular} ಅನ್ನು ತಲುಪುವುದೇ ಇಲ್ಲ — ಅದನ್ನು JustDial ನಂತಹ ಡೈರೆಕ್ಟರಿಗಳು ತಡೆಹಿಡಿಯುತ್ತವೆ. ಆ ಅಂತರವನ್ನು ನಿಮ್ಮದಾಗಿಸಿಕೊಳ್ಳುವ ಅವಕಾಶ ನಿಮ್ಮದು.",
    totalLabel: "{city}ಯಲ್ಲಿ ಮಾಸಿಕ ಹುಡುಕಾಟಗಳು",
    leakNote: "ಇದರಲ್ಲಿ ≈ {leak} ಡೈರೆಕ್ಟರಿಗಳ ಪಾಲಾಗುತ್ತಿವೆ — ನಿಜವಾದ {singular} ಅನ್ನು ತಲುಪುವುದೇ ಇಲ್ಲ.",
    barGbp: "Google Business Profile (ಟಾಪ್ 3)",
    barDirectories: "ಡೈರೆಕ್ಟರಿಗಳು",
    barNiche: "{niche} ವೆಬ್‌ಸೈಟ್‌ಗಳು",
    barSocial: "ಸೋಷಿಯಲ್ ಮತ್ತು ಇತರೆ",
  },

  build: {
    eyebrow: "ಇದನ್ನು ಹೇಗೆ ನಿರ್ಮಿಸಲಾಗಿದೆ",
    heading: "ನಿಮ್ಮ ಸಂಪೂರ್ಣ ಸಿಸ್ಟಮ್ ಅನ್ನು ನಾವು ನಿರ್ಮಿಸುತ್ತೇವೆ — ಹಂತ ಹಂತವಾಗಿ.",
    steps: [
      { tag: "ವೆಬ್‌ಸೈಟ್", title: "ಕನ್ವರ್ಟ್ ಮಾಡಲು ನಿರ್ಮಿಸಲಾದ ವೆಬ್‌ಸೈಟ್", desc: "ವೇಗವಾದ, ರೆಸ್ಪಾನ್ಸಿವ್ ಸೈಟ್ ಅನ್ನು ಒಂದೇ ಗುರಿಗಾಗಿ ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ — ಭೇಟಿ ನೀಡುವವರನ್ನು ಬುಕ್ ಮಾಡಿದ ವಿಚಾರಣೆಗಳಾಗಿ ಪರಿವರ್ತಿಸುವುದು." },
      { tag: "Google Maps", title: "Maps ನಲ್ಲಿ ಟಾಪ್ 3 ರ‍್ಯಾಂಕ್ ಪಡೆಯಿರಿ", desc: "ಹತ್ತಿರದಲ್ಲಿ ಜನರು ಹುಡುಕಿದಾಗ ನೀವು ಮೊದಲು ಕಾಣಿಸಿಕೊಳ್ಳಲು ನಾವು ನಿಮ್ಮ Google Business Profile ಅನ್ನು ಆಪ್ಟಿಮೈಸ್ ಮಾಡುತ್ತೇವೆ." },
      { tag: "ಪಾವತಿಸಿದ ಜಾಹೀರಾತುಗಳು", title: "ಸಿದ್ಧರಿರುವ ಗ್ರಾಹಕರನ್ನು ತರುವ ಜಾಹೀರಾತುಗಳು", desc: "Google ಮತ್ತು Meta ಕ್ಯಾಂಪೇನ್‌ಗಳು ಸಕ್ರಿಯವಾಗಿ ಹುಡುಕುತ್ತಿರುವ ಜನರ ಮುಂದೆ ನಿಮ್ಮನ್ನು ತರುತ್ತವೆ — ಮತ್ತು ಅವರಿಗೆ ಮಾತ್ರ." },
      { tag: "CRM", title: "ಪ್ರತಿ ಲೀಡ್ ಅನ್ನು ಸೆರೆಹಿಡಿಯಲಾಗುತ್ತದೆ ಮತ್ತು ಸ್ಕೋರ್ ಮಾಡಲಾಗುತ್ತದೆ", desc: "ಕರೆಗಳು, ಕ್ಲಿಕ್‌ಗಳು ಮತ್ತು ವಿಚಾರಣೆಗಳು ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ ಸೇರುತ್ತವೆ, ಹೆಚ್ಚು ಆಸಕ್ತಿ ಇರುವವರಿಗೆ ಮೊದಲ ಆದ್ಯತೆ ನೀಡಲಾಗುತ್ತದೆ, ಇದರಿಂದ ಯಾವುದೂ ತಪ್ಪಿಹೋಗುವುದಿಲ್ಲ." },
      { tag: "ಆಟೊಮೇಷನ್", title: "ತ್ವರಿತ ಪ್ರತ್ಯುತ್ತರಗಳು, ಸ್ಪಷ್ಟ ರಿಪೋರ್ಟಿಂಗ್", desc: "WhatsApp AI 24/7 ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಉತ್ತರಿಸುತ್ತದೆ, ಮತ್ತು ಒಂದೇ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ನಿಖರವಾಗಿ ಯಾವುದು ಕೆಲಸ ಮಾಡುತ್ತಿದೆ ಎಂಬುದನ್ನು ತೋರಿಸುತ್ತದೆ." },
    ],
  },

  responsive: {
    eyebrow: "ಡಿಫಾಲ್ಟ್ ಆಗಿ ರೆಸ್ಪಾನ್ಸಿವ್",
    heading: "ಒಂದೇ ಸೈಟ್. ಪ್ರತಿ ಸ್ಕ್ರೀನ್‌ನಲ್ಲೂ ದೋಷರಹಿತ.",
    body: "ಫೋನ್, ಟ್ಯಾಬ್ಲೆಟ್ ಅಥವಾ ಡೆಸ್ಕ್‌ಟಾಪ್ — ನಿಮ್ಮ ವೆಬ್‌ಸೈಟ್ ತಾನೇ ಹೊಂದಿಕೊಳ್ಳುತ್ತದೆ, ಇದರಿಂದ ಪ್ರತಿಯೊಬ್ಬರಿಗೂ ವೇಗವಾದ, ಸ್ಪಷ್ಟವಾದ ಅನುಭವ ಸಿಗುತ್ತದೆ. ಇದು ಹೇಗೆ ಹೊಂದಿಕೊಳ್ಳುತ್ತದೆ ಎಂಬುದನ್ನು ನೋಡಲು ಸ್ಕ್ರಾಲ್ ಮಾಡಿ.",
    tagMobile: "ಮೊಬೈಲ್",
    tagTablet: "ಟ್ಯಾಬ್ಲೆಟ್",
    tagDesktop: "ಡೆಸ್ಕ್‌ಟಾಪ್",
  },

  why: {
    eyebrow: "ನಮ್ಮನ್ನೇ ಏಕೆ ಆರಿಸಬೇಕು",
    heading: "ಸ್ಥಳೀಯ ವ್ಯವಹಾರಗಳು FortuneMarq ಅನ್ನು ಏಕೆ ಆರಿಸುತ್ತವೆ.",
    body: "ಹಲವು ಕೆಲಸಗಳ ನಡುವೆ ಒದ್ದಾಡುವ ಫ್ರೀಲ್ಯಾನ್ಸರ್ ಅಲ್ಲ. ಲಾಂಚ್ ಆದ ಮೇಲೆ ಕಣ್ಮರೆಯಾಗುವ ಏಜೆನ್ಸಿಯೂ ಅಲ್ಲ. ನಿಮ್ಮ ಸಂಪೂರ್ಣ ಬೆಳವಣಿಗೆಯ ಸಿಸ್ಟಮ್ ಅನ್ನು ನಡೆಸುವ ಒಂದೇ ಸ್ಥಳೀಯ ತಂಡ.",
    captionLead: "ಒಂದೇ ತಂಡ.",
    captionRest: "ನಿಮ್ಮ ಸಂಪೂರ್ಣ ಬೆಳವಣಿಗೆಯ ಸಿಸ್ಟಮ್.",
    items: [
      { title: "ಸ್ಥಳೀಯ ತಂಡ, ಹೊರಗುತ್ತಿಗೆಯಲ್ಲ", desc: "ನಮಗೆ {city}ಯ ಮಾರುಕಟ್ಟೆ ತಿಳಿದಿದೆ ಮತ್ತು ನಾವು ಕೇವಲ ಒಂದು ಕರೆಯ ದೂರದಲ್ಲಿದ್ದೇವೆ — ವಿದೇಶದ ಟಿಕೆಟ್ ಕ್ಯೂನಲ್ಲಲ್ಲ." },
      { title: "ಸಂಪೂರ್ಣ ಸಿಸ್ಟಮ್, ಒಂದೇ ತಂಡ", desc: "ವೆಬ್‌ಸೈಟ್, ಆಡ್ಸ್, Maps, CRM ಮತ್ತು WhatsApp AI — ಒಟ್ಟಾಗಿ ಕೆಲಸ ಮಾಡಲು ನಿರ್ಮಿಸಲಾಗಿದೆ, ಐದು ಬೇರೆ ಬೇರೆ ವೆಂಡರ್‌ಗಳ ಹಿಂದೆ ಓಡುವ ಅಗತ್ಯವಿಲ್ಲ." },
      { title: "ನೈಜ ಡೇಟಾದ ಮೇಲೆ ನಿರ್ಮಿಸಲಾಗಿದೆ", desc: "ಪ್ರತಿಯೊಂದು ಹೆಜ್ಜೆಯೂ {city}ಯ ನೈಜ ಹುಡುಕಾಟದ ಬೇಡಿಕೆಯಿಂದ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ — ಊಹೆ ಅಥವಾ ಕೇವಲ ತೋರಿಕೆಯ ಅಂಕಿಅಂಶಗಳ ಆಧಾರದ ಮೇಲಲ್ಲ." },
      { title: "ನಾವು ಟ್ರಾಫಿಕ್ ಅನ್ನು ಕನ್ವರ್ಟ್ ಮಾಡುತ್ತೇವೆ", desc: "24/7 ಲೀಡ್‌ಗಳಿಗೆ ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಉತ್ತರ ಸಿಗುತ್ತದೆ. ನಾವು ಕೇವಲ ಕ್ಲಿಕ್‌ಗಳನ್ನು ಕಳುಹಿಸುವುದಿಲ್ಲ — ಅವುಗಳನ್ನು ಬುಕ್ ಮಾಡಿದ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳಾಗಿ ಪರಿವರ್ತಿಸುತ್ತೇವೆ." },
    ],
    outcome: "ಹೆಚ್ಚು ಬುಕ್ ಮಾಡಿದ {customer}",
  },

  book: {
    eyebrow: "ಬುಕ್ ಮಾಡಿ",
    heading: "ನಿಮ್ಮ {singular}ಗಾಗಿ ಸಂಪೂರ್ಣ ಡೇಟಾವನ್ನು ನೋಡಿ.",
    body: "ಉಚಿತ 30-ನಿಮಿಷಗಳ ಸ್ಟ್ರಾಟಜಿ ಕರೆ. {city}ಯಲ್ಲಿ ಎಷ್ಟು {customer} ಹುಡುಕುತ್ತಿದ್ದಾರೆ — ಮತ್ತು ಅವರೆಲ್ಲರನ್ನೂ ಸೆರೆಹಿಡಿದು ಉತ್ತರಿಸುವ ಸಿಸ್ಟಮ್ ಅನ್ನು ನಾವು ನಿಖರವಾಗಿ ನಿಮಗೆ ತೋರಿಸುತ್ತೇವೆ.",
    whatsapp: "WhatsApp ನಲ್ಲಿ ಪ್ರಶ್ನೆ ಕೇಳಿ",
    trust: "ಯಾವುದೇ ಕಟ್ಟುಪಾಡುಗಳಿಲ್ಲ · {city}ಯ ನೈಜ ಡೇಟಾದ ಆಧಾರದ ಮೇಲೆ ನಿರ್ಮಿಸಲಾಗಿದೆ",
  },

  presence: {
    heroH1a: "{city}ಯಲ್ಲಿ ಜನರು ಮೊದಲು ಕಂಡುಕೊಳ್ಳುವ ",
    heroH1b: "{singular} ನಿಮ್ಮದಾಗಲಿ.",
    heroSub: "{city}ಯಲ್ಲಿ ಇನ್ನೂ ಹೆಚ್ಚಿನ ಜನರು {singular}ಗಾಗಿ ಹುಡುಕುತ್ತಿಲ್ಲ — ಅವರು Instagram ಮತ್ತು Facebook ನಲ್ಲಿ ಸ್ಕ್ರಾಲ್ ಮಾಡುತ್ತಾ ಕಂಡುಕೊಳ್ಳುತ್ತಾರೆ. ನಾವು ನಿಮ್ಮನ್ನು ಮೊದಲು ಅವರ ಮುಂದೆ ತರುತ್ತೇವೆ — ಎಲ್ಲರಿಗೂ ತಿಳಿದಿರುವ ಹೆಸರಾಗಿ.",
    chips: [
      { n: "1st", l: "ಮೊದಲು ಕಾಣಿಸಿಕೊಳ್ಳಿ" },
      { n: "Low", l: "ಈಗ ಕಡಿಮೆ ಸ್ಪರ್ಧೆ" },
      { n: "100%", l: "ನಿಮ್ಮದಾಗಿಸಿಕೊಳ್ಳಿ" },
    ],
    gapEyebrow: "ಅವಕಾಶ",
    gapHeading: "{city}ಯಲ್ಲಿ ಯಾವ {singular} ಇನ್ನೂ ಮುಂಚೂಣಿಯಲ್ಲಿ ಇಲ್ಲ. ಅದೇ ನಿಮ್ಮ ಅವಕಾಶ.",
    gapBody: "ಬೇಡಿಕೆ ಈಗಷ್ಟೇ ಆರಂಭವಾಗುತ್ತಿದೆ — ಆದ್ದರಿಂದ ಈಗ ಪ್ರೆಸೆನ್ಸ್ ಬೆಳೆಸಿಕೊಳ್ಳುವವರು {customer} ಸಿದ್ಧರಾದಾಗ ಮೊದಲ ಆಯ್ಕೆಯಾಗುತ್ತಾರೆ. ನಿಮ್ಮ ಸ್ಪರ್ಧಿಗಳಿಗಿಂತ ಮೊದಲು ನಾವು ನಿಮ್ಮನ್ನು Instagram ಮತ್ತು Facebook ನಲ್ಲಿ ಅವರ ಮುಂದೆ ತರುತ್ತೇವೆ.",
    points: [
      { t: "ಬೇಡಿಕೆ ಸೃಷ್ಟಿಸುವ Meta ಜಾಹೀರಾತುಗಳು", d: "ಟಾರ್ಗೆಟೆಡ್ Instagram ಮತ್ತು Facebook ಜಾಹೀರಾತುಗಳು ಹುಡುಕದ {customer}ಅನ್ನೂ ತಲುಪುತ್ತವೆ." },
      { t: "ಮೊದಲಿಗನ ಲಾಭ", d: "ಮಾರುಕಟ್ಟೆ ತುಂಬುವ ಮೊದಲೇ ಸ್ಥಾಪಿತ ಹೆಸರಾಗಿ." },
      { t: "ಕಡಿಮೆ ವೆಚ್ಚ, ಹೆಚ್ಚು ರೀಚ್", d: "ಕಡಿಮೆ ಸ್ಪರ್ಧೆ ಎಂದರೆ ನಿಮ್ಮ ಜಾಹೀರಾತುಗಳು ಅಗ್ಗ ಮತ್ತು ಹೆಚ್ಚು ದೂರ ತಲುಪುತ್ತವೆ — ಇದೀಗ." },
      { t: "ಜನರು ನಂಬುವ ಬ್ರಾಂಡ್", d: "ನಿರಂತರವಾಗಿ ಕಾಣಿಸಿಕೊಂಡರೆ, ಅವರು ಸಿದ್ಧರಾದಾಗ ನೀವೇ ಸ್ಪಷ್ಟ ಆಯ್ಕೆ." },
    ],
  },
};

export function getLpSections(lang: Lang): LpSections {
  return lang === "kn" ? KN : EN;
}
