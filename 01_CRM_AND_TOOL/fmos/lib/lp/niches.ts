// Niche landing-page registry (Stage 2.1).
//
// Curated, editorial layer for each niche×city LP: display names (EN+KN),
// the data hook, named competitors, pain point, upsell path. The LIVE
// numbers (search volume, top keywords, 4-bucket SERP split) come from
// `market_insights` at render time — see lib/lp/data.ts. This file is the
// fallback + the human-written narrative that the DB does not hold.
//
// Source of truth for the numbers/competitors below:
//   05_FORTUNEMARQ_ONLINE_PRESENCE/_project_files/Niche_Data_Reference_Sheet.md
//
// GATE: only `enabled` niches render. After the Dental LP is approved, flip
// the rest on and flesh out their KN copy + screenshots.

export type Lang = "en" | "kn";

export interface NicheCompetitor {
  /** Public business name as it appears on the SERP. */
  name: string;
  /** Honest, factual gap (from the reference sheet) — never invented. */
  note: string;
}

export interface NicheConfig {
  slug: string;        // URL slug, e.g. "dental-clinics"
  industry: string;    // market_insights.industry key, e.g. "Dental Clinics"
  city: string;        // market_insights.city key, e.g. "Hubli"
  citySlug: string;    // URL slug for the city, e.g. "hubli"
  enabled: boolean;    // gate — only true niches render

  nameEn: string;      // "Dental Clinics"
  nameKn: string;
  singularEn: string;  // "dental clinic" (lowercase, for inline copy)
  customerEn: string;  // "patients" / "members" / "students" / "bookings"
  customerKn: string;
  cityEn: string;      // "Hubli"
  cityKn: string;

  // Fallback live-data (used only if market_insights has no row yet).
  monthlySearches: number;
  topKeywords: { keyword: string; volume: number }[];

  competitors: NicheCompetitor[];
  topCompetitorName: string;
  topCompetitorTraffic: number; // monthly visits the #1 site actually gets

  painEn: string;
  painKn: string;
  upsellPath: string[]; // ["GMB Optimisation", "Google Ads", "SEO", ...]

  // The single data line that opens the page (Aware → FOMO).
  hookEn: string;
  hookKn: string;
}

export const NICHES: NicheConfig[] = [
  {
    slug: "dental-clinics",
    industry: "Dental Clinics",
    city: "Hubli",
    citySlug: "hubli",
    enabled: true,

    nameEn: "Dental Clinics",
    nameKn: "ಡೆಂಟಲ್ ಕ್ಲಿನಿಕ್‌ಗಳು",
    singularEn: "dental clinic",
    customerEn: "patients",
    customerKn: "ರೋಗಿಗಳು",
    cityEn: "Hubli",
    cityKn: "ಹುಬ್ಬಳ್ಳಿ",

    monthlySearches: 3900,
    topKeywords: [
      { keyword: "dental clinic near me", volume: 500 },
      { keyword: "dentist near me", volume: 500 },
      { keyword: "best dentist in hubli", volume: 300 },
      { keyword: "teeth cleaning hubli", volume: 200 },
      { keyword: "dental implants hubli", volume: 150 },
    ],

    competitors: [
      { name: "Vishwavande Dental", note: "Strongest local site — ~1,100 visits/mo, but runs zero paid ads and still captures under a third of demand." },
      { name: "Jayade Dental World", note: "Decent authority but ranks for only a handful of keywords — almost invisible in search." },
      { name: "Shri Sai Dental Care", note: "Website exists but pulls effectively zero organic traffic." },
    ],
    topCompetitorName: "Vishwavande Dental",
    topCompetitorTraffic: 1095,

    painEn: "New-patient acquisition — especially for high-value treatments like implants, whitening and cosmetic dentistry.",
    painKn: "ಹೊಸ ರೋಗಿಗಳ ಸೆಳೆತ — ವಿಶೇಷವಾಗಿ ಇಂಪ್ಲಾಂಟ್‌, ವೈಟನಿಂಗ್‌ ಮತ್ತು ಕಾಸ್ಮೆಟಿಕ್‌ ಡೆಂಟಿಸ್ಟ್ರಿಯಂತಹ ಹೆಚ್ಚು-ಮೌಲ್ಯದ ಚಿಕಿತ್ಸೆಗಳಿಗೆ.",
    upsellPath: ["GMB Optimisation", "Google Ads", "SEO", "Treatment Pages"],

    hookEn: "Every month, 3,900 people in Hubli search for a dentist. Most of them never find you.",
    hookKn: "ಪ್ರತಿ ತಿಂಗಳು ಹುಬ್ಬಳ್ಳಿಯಲ್ಲಿ 3,900 ಜನರು ದಂತವೈದ್ಯರನ್ನು ಹುಡುಕುತ್ತಾರೆ. ಅವರಲ್ಲಿ ಹೆಚ್ಚಿನವರು ನಿಮ್ಮನ್ನು ಎಂದಿಗೂ ಕಂಡುಕೊಳ್ಳುವುದಿಲ್ಲ.",
  },

  // ── Gated until the Dental template is approved ───────────────────────────
  {
    slug: "gyms",
    industry: "Gyms",
    city: "Hubli",
    citySlug: "hubli",
    enabled: false,
    nameEn: "Gyms & Fitness Centres",
    nameKn: "ಜಿಮ್ ಮತ್ತು ಫಿಟ್‌ನೆಸ್ ಕೇಂದ್ರಗಳು",
    singularEn: "gym",
    customerEn: "members",
    customerKn: "ಸದಸ್ಯರು",
    cityEn: "Hubli",
    cityKn: "ಹುಬ್ಬಳ್ಳಿ",
    monthlySearches: 30000,
    topKeywords: [{ keyword: "gym near me", volume: 5000 }],
    competitors: [
      { name: "Xtreme Fitness", note: "Best performer (~2,400 visits/mo) but runs no paid ads — still vulnerable." },
      { name: "Hubli Gymkhana Club", note: "Legacy brand ignoring SEO — ranks for ~9 keywords only." },
      { name: "Sanal Ladies Gym", note: "Almost no online presence — under 100 visits/mo." },
    ],
    topCompetitorName: "Xtreme Fitness",
    topCompetitorTraffic: 2435,
    painEn: "Member acquisition — reducing dependency on word-of-mouth and walk-ins.",
    painKn: "ಸದಸ್ಯರ ಸೆಳೆತ — ಬಾಯಿಮಾತು ಮತ್ತು ವಾಕ್‌-ಇನ್‌ಗಳ ಅವಲಂಬನೆ ಕಡಿಮೆ ಮಾಡುವುದು.",
    upsellPath: ["GMB Optimisation", "Google Ads", "SEO", "Monthly Content"],
    hookEn: "30,000 people search for gyms in Hubli every month — and only 3 gym websites get any of that traffic.",
    hookKn: "ಪ್ರತಿ ತಿಂಗಳು ಹುಬ್ಬಳ್ಳಿಯಲ್ಲಿ 30,000 ಜನರು ಜಿಮ್‌ಗಳನ್ನು ಹುಡುಕುತ್ತಾರೆ — ಆ ಟ್ರಾಫಿಕ್‌ ಪಡೆಯುವುದು ಕೇವಲ 3 ಜಿಮ್‌ ವೆಬ್‌ಸೈಟ್‌ಗಳು ಮಾತ್ರ.",
  },
  {
    slug: "skin-clinics",
    industry: "Skin Clinics",
    city: "Hubli",
    citySlug: "hubli",
    enabled: false,
    nameEn: "Skin Clinics & Dermatology",
    nameKn: "ಚರ್ಮ ಚಿಕಿತ್ಸಾಲಯಗಳು",
    singularEn: "skin clinic",
    customerEn: "patients",
    customerKn: "ರೋಗಿಗಳು",
    cityEn: "Hubli",
    cityKn: "ಹುಬ್ಬಳ್ಳಿ",
    monthlySearches: 7500,
    topKeywords: [
      { keyword: "dermatologist near me", volume: 500 },
      { keyword: "skin specialist near me", volume: 500 },
    ],
    competitors: [
      { name: "Jeevannavar Skin Care", note: "Best in niche — but just 173 visits/mo from a 7,500 market." },
      { name: "G-Square Skin & Aesthetics", note: "Essentially invisible online." },
      { name: "Dr. Kirti Pawar", note: "Website exists but no one finds it — near-zero traffic." },
    ],
    topCompetitorName: "Jeevannavar Skin Care",
    topCompetitorTraffic: 173,
    painEn: "Patient acquisition for high-value cosmetic & aesthetic treatments (laser, acne, anti-ageing).",
    painKn: "ಹೆಚ್ಚು-ಮೌಲ್ಯದ ಕಾಸ್ಮೆಟಿಕ್ ಮತ್ತು ಸೌಂದರ್ಯ ಚಿಕಿತ್ಸೆಗಳಿಗೆ ರೋಗಿಗಳ ಸೆಳೆತ.",
    upsellPath: ["GMB Optimisation", "Meta Ads", "Google Ads", "SEO"],
    hookEn: "7,500 people search for skin clinics in Hubli every month. The top clinic captures just 173 of them.",
    hookKn: "ಪ್ರತಿ ತಿಂಗಳು ಹುಬ್ಬಳ್ಳಿಯಲ್ಲಿ 7,500 ಜನರು ಚರ್ಮ ಚಿಕಿತ್ಸಾಲಯಗಳನ್ನು ಹುಡುಕುತ್ತಾರೆ. ಅಗ್ರ ಕ್ಲಿನಿಕ್‌ ಪಡೆಯುವುದು ಕೇವಲ 173.",
  },
  {
    slug: "jee-neet-coaching",
    industry: "JEE NEET Coaching",
    city: "Hubli",
    citySlug: "hubli",
    enabled: false,
    nameEn: "JEE / NEET Coaching",
    nameKn: "JEE / NEET ತರಬೇತಿ ಕೇಂದ್ರಗಳು",
    singularEn: "coaching institute",
    customerEn: "students",
    customerKn: "ವಿದ್ಯಾರ್ಥಿಗಳು",
    cityEn: "Hubli",
    cityKn: "ಹುಬ್ಬಳ್ಳಿ",
    monthlySearches: 2550,
    topKeywords: [
      { keyword: "jee main", volume: 500 },
      { keyword: "neet coaching near me", volume: 50 },
    ],
    competitors: [
      { name: "Excellent NEET Academy", note: "Only local institute with a real web presence — 261 visits/mo." },
      { name: "Local institutes", note: "Most have no working website — students go to online platforms." },
    ],
    topCompetitorName: "Excellent NEET Academy",
    topCompetitorTraffic: 261,
    painEn: "Batch filling — competing against well-funded national online platforms.",
    painKn: "ಬ್ಯಾಚ್‌ ಭರ್ತಿ — ರಾಷ್ಟ್ರೀಯ ಆನ್‌ಲೈನ್‌ ವೇದಿಕೆಗಳ ವಿರುದ್ಧ ಸ್ಪರ್ಧೆ.",
    upsellPath: ["GMB Optimisation", "Google Ads", "SEO", "Results Content"],
    hookEn: "2,550 students search for JEE/NEET coaching in Hubli every month — and the rest go to Physics Wallah.",
    hookKn: "ಪ್ರತಿ ತಿಂಗಳು ಹುಬ್ಬಳ್ಳಿಯಲ್ಲಿ 2,550 ವಿದ್ಯಾರ್ಥಿಗಳು JEE/NEET ತರಬೇತಿ ಹುಡುಕುತ್ತಾರೆ.",
  },
  {
    slug: "car-rentals",
    industry: "Car Rentals",
    city: "Hubli",
    citySlug: "hubli",
    enabled: false,
    nameEn: "Car Rentals & Cabs",
    nameKn: "ಕಾರ್ ಬಾಡಿಗೆ ಮತ್ತು ಕ್ಯಾಬ್‌ಗಳು",
    singularEn: "car rental",
    customerEn: "bookings",
    customerKn: "ಬುಕಿಂಗ್‌ಗಳು",
    cityEn: "Hubli",
    cityKn: "ಹುಬ್ಬಳ್ಳಿ",
    monthlySearches: 2550,
    topKeywords: [
      { keyword: "taxi cab booking", volume: 500 },
      { keyword: "car rental near me", volume: 50 },
    ],
    competitors: [
      { name: "Raahiz Travels", note: "Dominates organically (~2,000 visits/mo) — but runs zero paid ads." },
      { name: "Queens Car Rental", note: "Good traffic, very thin content base." },
      { name: "Swadeshi Car Rentals", note: "Same size as Queens but only 31 visits/mo — wasted potential." },
    ],
    topCompetitorName: "Raahiz Travels",
    topCompetitorTraffic: 2085,
    painEn: "Consistent direct bookings — reducing dependency on OTA platforms (Ola, Uber, MakeMyTrip).",
    painKn: "ನೇರ ಬುಕಿಂಗ್‌ಗಳ ಸ್ಥಿರತೆ — OTA ವೇದಿಕೆಗಳ ಅವಲಂಬನೆ ಕಡಿಮೆ ಮಾಡುವುದು.",
    upsellPath: ["GMB Optimisation", "Google Ads", "SEO", "Outstation Pages"],
    hookEn: "2,550 people search for car rentals in Hubli every month — and not a single competitor runs ads.",
    hookKn: "ಪ್ರತಿ ತಿಂಗಳು ಹುಬ್ಬಳ್ಳಿಯಲ್ಲಿ 2,550 ಜನರು ಕಾರ್‌ ಬಾಡಿಗೆ ಹುಡುಕುತ್ತಾರೆ — ಒಬ್ಬ ಸ್ಪರ್ಧಿಯೂ ಜಾಹೀರಾತು ಮಾಡುತ್ತಿಲ್ಲ.",
  },
  {
    slug: "computer-training",
    industry: "Computer Training",
    city: "Hubli",
    citySlug: "hubli",
    enabled: false,
    nameEn: "Computer Training Institutes",
    nameKn: "ಕಂಪ್ಯೂಟರ್ ತರಬೇತಿ ಸಂಸ್ಥೆಗಳು",
    singularEn: "training institute",
    customerEn: "students",
    customerKn: "ವಿದ್ಯಾರ್ಥಿಗಳು",
    cityEn: "Hubli",
    cityKn: "ಹುಬ್ಬಳ್ಳಿ",
    monthlySearches: 7500,
    topKeywords: [
      { keyword: "digital marketing classes", volume: 500 },
      { keyword: "computer training institute near me", volume: 300 },
    ],
    competitors: [
      { name: "LCC Groups", note: "Market leader — but 589 visits/mo from 7,500 searches, ranking for ~20 keywords." },
      { name: "KR Computers", note: "Barely indexed — minimal presence." },
      { name: "Savita Soft", note: "Zero domain strength — invisible to Google." },
    ],
    topCompetitorName: "LCC Groups",
    topCompetitorTraffic: 589,
    painEn: "Student enrollment and batch filling — competing against online platforms.",
    painKn: "ವಿದ್ಯಾರ್ಥಿ ದಾಖಲಾತಿ ಮತ್ತು ಬ್ಯಾಚ್‌ ಭರ್ತಿ — ಆನ್‌ಲೈನ್‌ ವೇದಿಕೆಗಳ ವಿರುದ್ಧ ಸ್ಪರ್ಧೆ.",
    upsellPath: ["GMB Optimisation", "Google Ads", "SEO", "Course Landing Pages"],
    hookEn: "7,500 people search for computer courses in Hubli every month. The top institute captures 600.",
    hookKn: "ಪ್ರತಿ ತಿಂಗಳು ಹುಬ್ಬಳ್ಳಿಯಲ್ಲಿ 7,500 ಜನರು ಕಂಪ್ಯೂಟರ್‌ ಕೋರ್ಸ್‌ಗಳನ್ನು ಹುಡುಕುತ್ತಾರೆ.",
  },
];

export function getNiche(slug: string, citySlug: string): NicheConfig | null {
  return (
    NICHES.find(
      (n) => n.slug === slug.toLowerCase() && n.citySlug === citySlug.toLowerCase()
    ) ?? null
  );
}

export function enabledNiches(): NicheConfig[] {
  return NICHES.filter((n) => n.enabled);
}
