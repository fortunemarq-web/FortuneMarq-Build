// Niche landing-page registry (Stage 2.1 → multi-niche × multi-city).
//
// The LP is one template rendered for every {niche}×{city} combo. Niche identity
// (names, singular, customer noun, mock-site screenshots) is city-agnostic and
// lives in NICHE_DEFS; the 9 Karnataka cities live in CITIES. getNiche() merges a
// niche def + a city into the NicheConfig the page consumes. The LIVE numbers
// (search volume, SERP split) come from `market_insights` keyed on industry+city
// (see lib/lp/data.ts) — so the SAME tokenised copy localises per niche AND city.
//
// IMPORTANT: `industry` MUST match the market_insights key EXACTLY (camelCase, no
// spaces) or the page silently falls back to the registry number.

export type Lang = "en" | "kn";

export interface NicheConfig {
  slug: string;        // URL slug, e.g. "dental-clinics"
  industry: string;    // market_insights.industry key, e.g. "DentalClinics"
  city: string;        // market_insights.city key, e.g. "Hubli"
  citySlug: string;    // URL slug for the city, e.g. "hubli"
  enabled: boolean;

  nameEn: string;      // "Dental Clinics"
  nameKn: string;
  singularEn: string;  // "dental clinic" (lowercase, inline copy)
  singularKn?: string; // falls back to singularEn if unset
  customerEn: string;  // "patients" / "members" / "students"
  customerKn: string;
  cityEn: string;      // "Hubli"
  cityKn: string;

  // Responsive-showcase screenshots base in /public/site/lp/img/ →
  // {siteShots}-{mobile,tablet,desktop}.png
  siteShots?: string;

  // Fallback search volume (used only if market_insights has no row).
  monthlySearches: number;
  // Unused in the current UI; kept for the data layer's fallback shape.
  topKeywords: { keyword: string; volume: number }[];
}

interface NicheDef {
  slug: string;
  industry: string;
  nameEn: string;
  nameKn: string;
  singularEn: string;
  singularKn?: string;
  customerEn: string;
  customerKn: string;
  siteShots: string;
  monthlySearches: number;
}

interface CityDef {
  citySlug: string;
  city: string;
  cityEn: string;
  cityKn: string;
}

// 9 Karnataka cities (city = exact market_insights key).
const CITIES: CityDef[] = [
  { citySlug: "hubli", city: "Hubli", cityEn: "Hubli", cityKn: "ಹುಬ್ಬಳ್ಳಿ" },
  { citySlug: "dharwad", city: "Dharwad", cityEn: "Dharwad", cityKn: "ಧಾರವಾಡ" },
  { citySlug: "belagavi", city: "Belagavi", cityEn: "Belagavi", cityKn: "ಬೆಳಗಾವಿ" },
  { citySlug: "mysuru", city: "Mysuru", cityEn: "Mysuru", cityKn: "ಮೈಸೂರು" },
  { citySlug: "mangalore", city: "Mangalore", cityEn: "Mangalore", cityKn: "ಮಂಗಳೂರು" },
  { citySlug: "davangere", city: "Davangere", cityEn: "Davangere", cityKn: "ದಾವಣಗೆರೆ" },
  { citySlug: "ballari", city: "Ballari", cityEn: "Ballari", cityKn: "ಬಳ್ಳಾರಿ" },
  { citySlug: "kalaburagi", city: "Kalaburagi", cityEn: "Kalaburagi", cityKn: "ಕಲಬುರಗಿ" },
  { citySlug: "vijayapura", city: "Vijayapura", cityEn: "Vijayapura", cityKn: "ವಿಜಯಪುರ" },
];

// 13 niches (industry = exact market_insights key).
const NICHE_DEFS: NicheDef[] = [
  { slug: "dental-clinics", industry: "DentalClinics", nameEn: "Dental Clinics", nameKn: "ಡೆಂಟಲ್ ಕ್ಲಿನಿಕ್‌ಗಳು", singularEn: "dental clinic", singularKn: "ದಂತ ಚಿಕಿತ್ಸಾಲಯ", customerEn: "patients", customerKn: "ರೋಗಿಗಳು", siteShots: "dental-site", monthlySearches: 3900 },
  { slug: "gyms", industry: "Gyms", nameEn: "Gyms & Fitness Centres", nameKn: "ಜಿಮ್ ಮತ್ತು ಫಿಟ್‌ನೆಸ್ ಕೇಂದ್ರಗಳು", singularEn: "gym", customerEn: "members", customerKn: "ಸದಸ್ಯರು", siteShots: "gyms-site", monthlySearches: 30000 },
  { slug: "skin-clinics", industry: "SkinClinics", nameEn: "Skin Clinics & Dermatology", nameKn: "ಚರ್ಮ ಚಿಕಿತ್ಸಾಲಯಗಳು", singularEn: "skin clinic", customerEn: "patients", customerKn: "ರೋಗಿಗಳು", siteShots: "skin-clinics-site", monthlySearches: 7500 },
  { slug: "jee-neet-coaching", industry: "JEENEETCoaching", nameEn: "JEE / NEET Coaching", nameKn: "JEE / NEET ತರಬೇತಿ ಕೇಂದ್ರಗಳು", singularEn: "coaching institute", customerEn: "students", customerKn: "ವಿದ್ಯಾರ್ಥಿಗಳು", siteShots: "jee-neet-coaching-site", monthlySearches: 2550 },
  { slug: "car-rentals", industry: "CarRentals", nameEn: "Car Rentals & Cabs", nameKn: "ಕಾರ್ ಬಾಡಿಗೆ ಮತ್ತು ಕ್ಯಾಬ್‌ಗಳು", singularEn: "car rental", customerEn: "customers", customerKn: "ಗ್ರಾಹಕರು", siteShots: "car-rentals-site", monthlySearches: 2550 },
  { slug: "computer-training", industry: "ComputerTraining", nameEn: "Computer Training Institutes", nameKn: "ಕಂಪ್ಯೂಟರ್ ತರಬೇತಿ ಸಂಸ್ಥೆಗಳು", singularEn: "training institute", customerEn: "students", customerKn: "ವಿದ್ಯಾರ್ಥಿಗಳು", siteShots: "computer-training-site", monthlySearches: 7500 },
  { slug: "ielts-coaching", industry: "IELTSCoaching", nameEn: "IELTS Coaching", nameKn: "IELTS ತರಬೇತಿ ಕೇಂದ್ರಗಳು", singularEn: "IELTS institute", customerEn: "students", customerKn: "ವಿದ್ಯಾರ್ಥಿಗಳು", siteShots: "ielts-coaching-site", monthlySearches: 1200 },
  { slug: "interior-designers", industry: "InteriorDesigners", nameEn: "Interior Designers", nameKn: "ಇಂಟೀರಿಯರ್ ಡಿಸೈನರ್‌ಗಳು", singularEn: "interior design studio", customerEn: "clients", customerKn: "ಗ್ರಾಹಕರು", siteShots: "interior-designers-site", monthlySearches: 2400 },
  { slug: "ivf-clinics", industry: "IVFClinics", nameEn: "IVF & Fertility Clinics", nameKn: "IVF ಮತ್ತು ಫರ್ಟಿಲಿಟಿ ಕ್ಲಿನಿಕ್‌ಗಳು", singularEn: "fertility clinic", customerEn: "patients", customerKn: "ರೋಗಿಗಳು", siteShots: "ivf-clinics-site", monthlySearches: 1800 },
  { slug: "modular-kitchens", industry: "ModularKitchens", nameEn: "Modular Kitchens", nameKn: "ಮಾಡ್ಯುಲರ್ ಕಿಚನ್‌ಗಳು", singularEn: "modular kitchen studio", customerEn: "customers", customerKn: "ಗ್ರಾಹಕರು", siteShots: "modular-kitchens-site", monthlySearches: 2100 },
  { slug: "physiotherapy", industry: "Physiotherapy", nameEn: "Physiotherapy Clinics", nameKn: "ಫಿಸಿಯೋಥೆರಪಿ ಕ್ಲಿನಿಕ್‌ಗಳು", singularEn: "physiotherapy clinic", customerEn: "patients", customerKn: "ರೋಗಿಗಳು", siteShots: "physiotherapy-site", monthlySearches: 1500 },
  { slug: "real-estate", industry: "RealEstate", nameEn: "Real Estate & Builders", nameKn: "ರಿಯಲ್ ಎಸ್ಟೇಟ್ ಮತ್ತು ಬಿಲ್ಡರ್‌ಗಳು", singularEn: "real estate brand", customerEn: "buyers", customerKn: "ಗ್ರಾಹಕರು", siteShots: "real-estate-site", monthlySearches: 5000 },
  { slug: "tuition-centres", industry: "TuitionCentres", nameEn: "Tuition Centres", nameKn: "ಟ್ಯೂಷನ್ ಕೇಂದ್ರಗಳು", singularEn: "tuition centre", customerEn: "students", customerKn: "ವಿದ್ಯಾರ್ಥಿಗಳು", siteShots: "tuition-centres-site", monthlySearches: 3000 },
];

// Cross-product → one NicheConfig per niche×city (all enabled).
export const NICHES: NicheConfig[] = NICHE_DEFS.flatMap((n) =>
  CITIES.map((c) => ({
    slug: n.slug,
    industry: n.industry,
    city: c.city,
    citySlug: c.citySlug,
    enabled: true,
    nameEn: n.nameEn,
    nameKn: n.nameKn,
    singularEn: n.singularEn,
    singularKn: n.singularKn,
    customerEn: n.customerEn,
    customerKn: n.customerKn,
    cityEn: c.cityEn,
    cityKn: c.cityKn,
    siteShots: n.siteShots,
    monthlySearches: n.monthlySearches,
    topKeywords: [],
  }))
);

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

/**
 * Best-effort niche/city recovery from a free-text message — e.g. the wa.me
 * prefill "…I saw your page on {nameEn} in {cityEn}…". Returns the
 * market_insights industry + city keys so an inbound WhatsApp lead can be tagged
 * with the LP it came from. null if no niche+city pair is mentioned.
 */
export function matchNicheFromText(text: string | null | undefined): { industry: string; city: string } | null {
  if (!text) return null;
  const t = text.toLowerCase();
  for (const n of NICHES) {
    if (t.includes(n.nameEn.toLowerCase()) && t.includes(n.cityEn.toLowerCase())) {
      return { industry: n.industry, city: n.city };
    }
  }
  return null;
}
