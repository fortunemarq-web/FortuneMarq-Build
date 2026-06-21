// Static copy for each report type in EN + KN.
// {city}, {industry}, {volume}, {company} are replaced at render time.

export type ReportLang = "en" | "kn";
export type ReportType = "A" | "B" | "C" | "D";

export interface ReportCopy {
  reportTitle: string;
  tagline: string;
  sectionDemand: string;
  sectionCompetitor: string;
  sectionOpportunity: string;
  sectionWhyUs: string;
  ctaHeading: string;
  ctaBody: string;
  footer: string;
  labelVolume: string;
  labelGmb: string;
  labelDirs: string;
  labelSites: string;
  labelOther: string;
  labelTopKeywords: string;
  labelPreparedFor: string;
  labelPreparedBy: string;
  labelConfidential: string;
}

const EN: Record<ReportType, ReportCopy> = {
  A: {
    reportTitle: "Visibility Intelligence Report",
    tagline: "You're ranking — here's how to protect and grow that position.",
    sectionDemand: "Market Demand in {city}",
    sectionCompetitor: "Who's Competing for Your Customers",
    sectionOpportunity: "Your Opportunity",
    sectionWhyUs: "How FortuneMarq Protects Your Ranking",
    ctaHeading: "Ready to stay ahead?",
    ctaBody: "Your ranking is an asset. We help you defend it, grow it, and turn every visitor into a paying customer.",
    footer: "Prepared exclusively for {company} by FortuneMarq — Digital Growth Agency, Hubli.",
    labelVolume: "Monthly searches for {industry} in {city}",
    labelGmb: "Google Maps / Local Pack",
    labelDirs: "Directories & Aggregators",
    labelSites: "Real Competitor Websites",
    labelOther: "Social & Other",
    labelTopKeywords: "Top Keywords (by search volume)",
    labelPreparedFor: "Prepared for",
    labelPreparedBy: "Prepared by",
    labelConfidential: "Confidential — for recipient use only",
  },
  B: {
    reportTitle: "Website Performance Report",
    tagline: "You have a website. Your competitors are outranking it.",
    sectionDemand: "Market Demand in {city}",
    sectionCompetitor: "The Competitive Landscape",
    sectionOpportunity: "What You're Missing",
    sectionWhyUs: "How FortuneMarq Gets You Ranking",
    ctaHeading: "Your website can rank — here's how.",
    ctaBody: "A website that doesn't rank is invisible. We'll change that with a proven SEO strategy built for {industry} in {city}.",
    footer: "Prepared exclusively for {company} by FortuneMarq — Digital Growth Agency, Hubli.",
    labelVolume: "Monthly searches for {industry} in {city}",
    labelGmb: "Google Maps / Local Pack",
    labelDirs: "Directories & Aggregators",
    labelSites: "Real Competitor Websites",
    labelOther: "Social & Other",
    labelTopKeywords: "Top Keywords (by search volume)",
    labelPreparedFor: "Prepared for",
    labelPreparedBy: "Prepared by",
    labelConfidential: "Confidential — for recipient use only",
  },
  C: {
    reportTitle: "Market Opportunity Report",
    tagline: "Customers are searching for {industry} in {city}. They're not finding you.",
    sectionDemand: "Market Demand in {city}",
    sectionCompetitor: "Who's Capturing Your Customers",
    sectionOpportunity: "The Gap You Can Fill",
    sectionWhyUs: "How FortuneMarq Puts You on the Map",
    ctaHeading: "Your customers are searching. Let's make sure they find you.",
    ctaBody: "A Google presence — Maps listing, website, ranking — is the foundation every local business needs. We build it fast.",
    footer: "Prepared exclusively for {company} by FortuneMarq — Digital Growth Agency, Hubli.",
    labelVolume: "Monthly searches for {industry} in {city}",
    labelGmb: "Google Maps / Local Pack",
    labelDirs: "Directories & Aggregators",
    labelSites: "Real Competitor Websites",
    labelOther: "Social & Other",
    labelTopKeywords: "Top Keywords (by search volume)",
    labelPreparedFor: "Prepared for",
    labelPreparedBy: "Prepared by",
    labelConfidential: "Confidential — for recipient use only",
  },
  D: {
    reportTitle: "Niche Market Report",
    tagline: "Low search volume means low competition — and a head-start advantage.",
    sectionDemand: "Market Demand in {city}",
    sectionCompetitor: "The Competitive Landscape",
    sectionOpportunity: "Why Low Volume is an Advantage",
    sectionWhyUs: "How FortuneMarq Helps You Own Your Niche",
    ctaHeading: "Own your niche before competition arrives.",
    ctaBody: "Low search volume now means low competition. Businesses that establish their digital presence early capture the market as it grows.",
    footer: "Prepared exclusively for {company} by FortuneMarq — Digital Growth Agency, Hubli.",
    labelVolume: "Monthly searches for {industry} in {city}",
    labelGmb: "Google Maps / Local Pack",
    labelDirs: "Directories & Aggregators",
    labelSites: "Real Competitor Websites",
    labelOther: "Social & Other",
    labelTopKeywords: "Top Keywords (by search volume)",
    labelPreparedFor: "Prepared for",
    labelPreparedBy: "Prepared by",
    labelConfidential: "Confidential — for recipient use only",
  },
};

const KN: Record<ReportType, ReportCopy> = {
  A: {
    reportTitle: "Visibility Intelligence Report",
    tagline: "ನೀವು Ranking ನಲ್ಲಿದ್ದೀರಿ — ಆ ಸ್ಥಾನವನ್ನು ಉಳಿಸಿಕೊಂಡು ಇನ್ನಷ್ಟು ಬೆಳೆಯುವುದು ಹೇಗೆ ಅಂತ ಇಲ್ಲಿದೆ.",
    sectionDemand: "{city} ನಲ್ಲಿ Market Demand",
    sectionCompetitor: "ನಿಮ್ಮ Customers ಗಾಗಿ ಬೇರೆ ಯಾರು Competition ಕೊಡುತ್ತಿದ್ದಾರೆ",
    sectionOpportunity: "ನಿಮಗಿರುವ Opportunity",
    sectionWhyUs: "ನಿಮ್ಮ Ranking ಅನ್ನು FortuneMarq ಹೇಗೆ ಕಾಪಾಡುತ್ತದೆ",
    ctaHeading: "ಯಾವಾಗಲೂ ಮುಂದಿರಲು ನೀವು ರೆಡಿನಾ?",
    ctaBody: "ನಿಮ್ಮ Ranking ನಿಮ್ಮ ದೊಡ್ಡ ಆಸ್ತಿ. ಅದನ್ನು ಕಾಪಾಡಿಕೊಳ್ಳಲು, ಬೆಳೆಸಲು ಮತ್ತು ಪ್ರತಿಯೊಬ್ಬ Visitor ಅನ್ನು ನಿಮ್ಮ Customer ಆಗಿ ಮಾಡಲು ನಾವು ಸಹಾಯ ಮಾಡುತ್ತೇವೆ.",
    footer: "{company} ಗಾಗಿ ವಿಶೇಷವಾಗಿ ಮಾಡಲಾಗಿದೆ, by FortuneMarq — Digital Growth Agency, Hubli.",
    labelVolume: "{city} ನಲ್ಲಿ {industry} ಗಾಗಿ ಪ್ರತಿ ತಿಂಗಳ Searches",
    labelGmb: "Google Maps / Local Pack",
    labelDirs: "Directories & Aggregators",
    labelSites: "ನಿಮ್ಮ Competitor Websites",
    labelOther: "Social Media & ಇತರೆ",
    labelTopKeywords: "Top Keywords (ಹೆಚ್ಚು Search ಆಗುವ ಪದಗಳು)",
    labelPreparedFor: "ಇವರಿಗಾಗಿ ರೆಡಿ ಮಾಡಲಾಗಿದೆ",
    labelPreparedBy: "ರೆಡಿ ಮಾಡಿದವರು",
    labelConfidential: "Confidential — ನಿಮಗೆ ಮಾತ್ರ",
  },
  B: {
    reportTitle: "Website Performance Report",
    tagline: "ನಿಮ್ಮ ಬಳಿ Website ಇದೆ, ಆದರೆ ನಿಮ್ಮ Competitors ನಿಮಗಿಂತ ಮುಂದೆ Rank ಆಗುತ್ತಿದ್ದಾರೆ.",
    sectionDemand: "{city} ನಲ್ಲಿ Market Demand",
    sectionCompetitor: "ಈಗಿನ Competition ಪರಿಸ್ಥಿತಿ",
    sectionOpportunity: "ನೀವು ಏನು ಕಳೆದುಕೊಳ್ಳುತ್ತಿದ್ದೀರಿ",
    sectionWhyUs: "ನಿಮಗೆ Ranking ತಂದುಕೊಡಲು FortuneMarq ಹೇಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ",
    ctaHeading: "ನಿಮ್ಮ Website ಕೂಡ Rank ಆಗಬಹುದು — ಅದು ಹೇಗೆ ಅಂತ ಇಲ್ಲಿದೆ.",
    ctaBody: "Rank ಆಗದ Website ಇದ್ದರೂ ಒಂದೇ, ಇಲ್ಲದಿದ್ದರೂ ಒಂದೇ. {city} ಯಲ್ಲಿನ {industry} ಗಾಗಿಯೇ ಮಾಡಲಾದ ನಮ್ಮ ಖಚಿತ SEO Strategy ಮೂಲಕ ನಾವು ಅದನ್ನು ಬದಲಾಯಿಸುತ್ತೇವೆ.",
    footer: "{company} ಗಾಗಿ ವಿಶೇಷವಾಗಿ ಮಾಡಲಾಗಿದೆ, by FortuneMarq — Digital Growth Agency, Hubli.",
    labelVolume: "{city} ನಲ್ಲಿ {industry} ಗಾಗಿ ಪ್ರತಿ ತಿಂಗಳ Searches",
    labelGmb: "Google Maps / Local Pack",
    labelDirs: "Directories & Aggregators",
    labelSites: "ನಿಮ್ಮ Competitor Websites",
    labelOther: "Social Media & ಇತರೆ",
    labelTopKeywords: "Top Keywords (ಹೆಚ್ಚು Search ಆಗುವ ಪದಗಳು)",
    labelPreparedFor: "ಇವರಿಗಾಗಿ ರೆಡಿ ಮಾಡಲಾಗಿದೆ",
    labelPreparedBy: "ರೆಡಿ ಮಾಡಿದವರು",
    labelConfidential: "Confidential — ನಿಮಗೆ ಮಾತ್ರ",
  },
  C: {
    reportTitle: "Market Opportunity Report",
    tagline: "Customers {city} ನಲ್ಲಿ {industry} ಗಾಗಿ Search ಮಾಡುತ್ತಿದ್ದಾರೆ. ಆದರೆ ಅವರಿಗೆ ನೀವು ಸಿಗುತ್ತಿಲ್ಲ.",
    sectionDemand: "{city} ನಲ್ಲಿ Market Demand",
    sectionCompetitor: "ನಿಮ್ಮ Customers ಅನ್ನು ಯಾರು ಸೆಳೆಯುತ್ತಿದ್ದಾರೆ",
    sectionOpportunity: "ನೀವು ತುಂಬಬಹುದಾದ ಅಂತರ",
    sectionWhyUs: "FortuneMarq ನಿಮ್ಮನ್ನು Map ನಲ್ಲಿ ಹೇಗೆ ತರುತ್ತದೆ",
    ctaHeading: "ನಿಮ್ಮ Customers search ಮಾಡುತ್ತಿದ್ದಾರೆ. ಅವರಿಗೆ ನೀವು ಸಿಗುವ ಹಾಗೆ ಮಾಡೋಣ ಬನ್ನಿ.",
    ctaBody: "Google ನಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುವುದು — Maps listing, Website ಮತ್ತು Ranking — ಇದು ಪ್ರತಿಯೊಂದು Local Business ಗೆ ಬೇಕಾದ ಬುನಾದಿ. ನಾವು ಅದನ್ನು ಫಾಸ್ಟ್ ಆಗಿ ಮಾಡಿಕೊಡುತ್ತೇವೆ.",
    footer: "{company} ಗಾಗಿ ವಿಶೇಷವಾಗಿ ಮಾಡಲಾಗಿದೆ, by FortuneMarq — Digital Growth Agency, Hubli.",
    labelVolume: "{city} ನಲ್ಲಿ {industry} ಗಾಗಿ ಪ್ರತಿ ತಿಂಗಳ Searches",
    labelGmb: "Google Maps / Local Pack",
    labelDirs: "Directories & Aggregators",
    labelSites: "ನಿಮ್ಮ Competitor Websites",
    labelOther: "Social Media & ಇತರೆ",
    labelTopKeywords: "Top Keywords (ಹೆಚ್ಚು Search ಆಗುವ ಪದಗಳು)",
    labelPreparedFor: "ಇವರಿಗಾಗಿ ರೆಡಿ ಮಾಡಲಾಗಿದೆ",
    labelPreparedBy: "ರೆಡಿ ಮಾಡಿದವರು",
    labelConfidential: "Confidential — ನಿಮಗೆ ಮಾತ್ರ",
  },
  D: {
    reportTitle: "Niche Market Report",
    tagline: "ಕಡಿಮೆ Search Volume ಅಂದರೆ ಕಡಿಮೆ Competition — ಇದು ನಿಮಗೆ ಬೇಗನೆ ಮುನ್ನಡೆ ಸಾಧಿಸಲು ಸಿಕ್ಕಿರುವ ಅವಕಾಶ.",
    sectionDemand: "{city} ನಲ್ಲಿ Market Demand",
    sectionCompetitor: "ಈಗಿನ Competition ಪರಿಸ್ಥಿತಿ",
    sectionOpportunity: "ಕಡಿಮೆ Search Volume ನಿಮಗೆ ಹೇಗೆ ಲಾಭ",
    sectionWhyUs: "ನಿಮ್ಮ Niche ನಲ್ಲಿ ನಾಯಕರಾಗಲು FortuneMarq ಹೇಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ",
    ctaHeading: "Competition ಶುರುವಾಗುವ ಮುನ್ನವೇ ನಿಮ್ಮ Niche ಅನ್ನು ನಿಮ್ಮದಾಗಿಸಿಕೊಳ್ಳಿ.",
    ctaBody: "ಈಗ Search Volume ಕಡಿಮೆ ಇದೆ ಎಂದರೆ Competition ಕೂಡ ಕಡಿಮೆ ಇದೆ ಎಂದರ್ಥ. ಯಾರು ಬೇಗ ತಮ್ಮ Digital Presence ಅನ್ನು ಕಟ್ಟಿಕೊಳ್ಳುತ್ತಾರೋ, ಅವರು ಮುಂದೆ ಮಾರ್ಕೆಟ್ ಬೆಳೆದಾಗ ಅದರ ಪೂರ್ಣ ಲಾಭ ಪಡೆಯುತ್ತಾರೆ.",
    footer: "{company} ಗಾಗಿ ವಿಶೇಷವಾಗಿ ಮಾಡಲಾಗಿದೆ, by FortuneMarq — Digital Growth Agency, Hubli.",
    labelVolume: "{city} ನಲ್ಲಿ {industry} ಗಾಗಿ ಪ್ರತಿ ತಿಂಗಳ Searches",
    labelGmb: "Google Maps / Local Pack",
    labelDirs: "Directories & Aggregators",
    labelSites: "ನಿಮ್ಮ Competitor Websites",
    labelOther: "Social Media & ಇತರೆ",
    labelTopKeywords: "Top Keywords (ಹೆಚ್ಚು Search ಆಗುವ ಪದಗಳು)",
    labelPreparedFor: "ಇವರಿಗಾಗಿ ರೆಡಿ ಮಾಡಲಾಗಿದೆ",
    labelPreparedBy: "ರೆಡಿ ಮಾಡಿದವರು",
    labelConfidential: "Confidential — ನಿಮಗೆ ಮಾತ್ರ",
  },
};

export function getCopy(type: ReportType, lang: ReportLang): ReportCopy {
  return lang === "kn" ? KN[type] : EN[type];
}

export function fillTokens(
  text: string,
  vars: { city: string; industry: string; volume: string; company: string }
): string {
  return text
    .replace(/{city}/g, vars.city)
    .replace(/{industry}/g, vars.industry)
    .replace(/{volume}/g, vars.volume)
    .replace(/{company}/g, vars.company);
}

// Type → accent colour
export const TYPE_COLOR: Record<ReportType, string> = {
  A: "#1E7A4F", // brand-deep green
  B: "#1D4ED8", // blue
  C: "#7C3AED", // purple
  D: "#B45309", // amber
};

export const TYPE_LABEL: Record<ReportType, string> = {
  A: "Type 1 — Visibility",
  B: "Type 3 — Website Performance",
  C: "Type 2 — Market Opportunity",
  D: "Type 4 — Niche Market",
};
