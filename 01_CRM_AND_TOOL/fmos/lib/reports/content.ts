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
    reportTitle: "ವಿಸಿಬಿಲಿಟಿ ಇಂಟೆಲಿಜೆನ್ಸ್ ರಿಪೋರ್ಟ್",
    tagline: "ನೀವು ರ್ಯಾಂಕ್ ಆಗಿದ್ದೀರಿ — ಆ ಸ್ಥಾನವನ್ನು ರಕ್ಷಿಸಿ ಮತ್ತು ಬೆಳೆಸಿ.",
    sectionDemand: "{city}ಯಲ್ಲಿ ಮಾರ್ಕೆಟ್ ಬೇಡಿಕೆ",
    sectionCompetitor: "ನಿಮ್ಮ ಗ್ರಾಹಕರಿಗಾಗಿ ಸ್ಪರ್ಧಿಸುತ್ತಿರುವವರು",
    sectionOpportunity: "ನಿಮ್ಮ ಅವಕಾಶ",
    sectionWhyUs: "FortuneMarq ನಿಮ್ಮ ರ್ಯಾಂಕಿಂಗ್ ಹೇಗೆ ರಕ್ಷಿಸುತ್ತದೆ",
    ctaHeading: "ಮುಂದೆ ಇರಲು ಸಿದ್ಧರಿದ್ದೀರಾ?",
    ctaBody: "ನಿಮ್ಮ ರ್ಯಾಂಕಿಂಗ್ ಒಂದು ಆಸ್ತಿ. ಅದನ್ನು ರಕ್ಷಿಸಿ, ಬೆಳೆಸಿ ಮತ್ತು ಪ್ರತಿ ಭೇಟಿಗಾರನ್ನು ಗ್ರಾಹಕರಾಗಿ ಪರಿವರ್ತಿಸಿ.",
    footer: "{company} ಗಾಗಿ FortuneMarq — ಡಿಜಿಟಲ್ ಗ್ರೋತ್ ಏಜೆನ್ಸಿ, ಹುಬ್ಬಳ್ಳಿ ಅವರಿಂದ ತಯಾರಿಸಲಾಗಿದೆ.",
    labelVolume: "{city}ಯಲ್ಲಿ {industry}ಗೆ ಮಾಸಿಕ ಹುಡುಕಾಟಗಳು",
    labelGmb: "Google Maps / ಲೋಕಲ್ ಪ್ಯಾಕ್",
    labelDirs: "ಡೈರೆಕ್ಟರಿಗಳು ಮತ್ತು ಅಗ್ರಿಗೇಟರ್‌ಗಳು",
    labelSites: "ನಿಜವಾದ ಸ್ಪರ್ಧಿ ವೆಬ್‌ಸೈಟ್‌ಗಳು",
    labelOther: "ಸೋಶಿಯಲ್ ಮತ್ತು ಇತರೆ",
    labelTopKeywords: "ಮುಖ್ಯ ಕೀವರ್ಡ್‌ಗಳು (ಸರ್ಚ್ ವಾಲ್ಯೂಮ್ ಪ್ರಕಾರ)",
    labelPreparedFor: "ಇವರಿಗಾಗಿ ತಯಾರಿಸಲಾಗಿದೆ",
    labelPreparedBy: "ತಯಾರಿಸಿದವರು",
    labelConfidential: "ಗೌಪ್ಯ — ಸ್ವೀಕರಿಸಿದವರ ಉಪಯೋಗಕ್ಕೆ ಮಾತ್ರ",
  },
  B: {
    reportTitle: "ವೆಬ್‌ಸೈಟ್ ಪರ್ಫಾರ್ಮೆನ್ಸ್ ರಿಪೋರ್ಟ್",
    tagline: "ನಿಮ್ಮ ವೆಬ್‌ಸೈಟ್ ಇದೆ. ಸ್ಪರ್ಧಿಗಳು ಅದನ್ನು ಮೀರಿ ರ್ಯಾಂಕ್ ಆಗುತ್ತಿದ್ದಾರೆ.",
    sectionDemand: "{city}ಯಲ್ಲಿ ಮಾರ್ಕೆಟ್ ಬೇಡಿಕೆ",
    sectionCompetitor: "ಸ್ಪರ್ಧಾತ್ಮಕ ಪರಿಸ್ಥಿತಿ",
    sectionOpportunity: "ನೀವು ತಪ್ಪಿಸಿಕೊಳ್ಳುತ್ತಿರುವುದು",
    sectionWhyUs: "FortuneMarq ನಿಮ್ಮನ್ನು ರ್ಯಾಂಕ್ ಮಾಡಿಸುವ ರೀತಿ",
    ctaHeading: "ನಿಮ್ಮ ವೆಬ್‌ಸೈಟ್ ರ್ಯಾಂಕ್ ಆಗಬಹುದು.",
    ctaBody: "ರ್ಯಾಂಕ್ ಆಗದ ವೆಬ್‌ಸೈಟ್ ಅದೃಶ್ಯ. {city}ಯಲ್ಲಿ {industry}ಗಾಗಿ ಸಾಬೀತಾದ SEO ತಂತ್ರದಿಂದ ಅದನ್ನು ಬದಲಾಯಿಸೋಣ.",
    footer: "{company} ಗಾಗಿ FortuneMarq — ಡಿಜಿಟಲ್ ಗ್ರೋತ್ ಏಜೆನ್ಸಿ, ಹುಬ್ಬಳ್ಳಿ ಅವರಿಂದ ತಯಾರಿಸಲಾಗಿದೆ.",
    labelVolume: "{city}ಯಲ್ಲಿ {industry}ಗೆ ಮಾಸಿಕ ಹುಡುಕಾಟಗಳು",
    labelGmb: "Google Maps / ಲೋಕಲ್ ಪ್ಯಾಕ್",
    labelDirs: "ಡೈರೆಕ್ಟರಿಗಳು ಮತ್ತು ಅಗ್ರಿಗೇಟರ್‌ಗಳು",
    labelSites: "ನಿಜವಾದ ಸ್ಪರ್ಧಿ ವೆಬ್‌ಸೈಟ್‌ಗಳು",
    labelOther: "ಸೋಶಿಯಲ್ ಮತ್ತು ಇತರೆ",
    labelTopKeywords: "ಮುಖ್ಯ ಕೀವರ್ಡ್‌ಗಳು (ಸರ್ಚ್ ವಾಲ್ಯೂಮ್ ಪ್ರಕಾರ)",
    labelPreparedFor: "ಇವರಿಗಾಗಿ ತಯಾರಿಸಲಾಗಿದೆ",
    labelPreparedBy: "ತಯಾರಿಸಿದವರು",
    labelConfidential: "ಗೌಪ್ಯ — ಸ್ವೀಕರಿಸಿದವರ ಉಪಯೋಗಕ್ಕೆ ಮಾತ್ರ",
  },
  C: {
    reportTitle: "ಮಾರ್ಕೆಟ್ ಅವಕಾಶ ರಿಪೋರ್ಟ್",
    tagline: "ಗ್ರಾಹಕರು {city}ಯಲ್ಲಿ {industry} ಹುಡುಕುತ್ತಿದ್ದಾರೆ. ಅವರು ನಿಮ್ಮನ್ನು ಕಂಡುಕೊಳ್ಳುತ್ತಿಲ್ಲ.",
    sectionDemand: "{city}ಯಲ್ಲಿ ಮಾರ್ಕೆಟ್ ಬೇಡಿಕೆ",
    sectionCompetitor: "ನಿಮ್ಮ ಗ್ರಾಹಕರನ್ನು ಯಾರು ಸೆಳೆಯುತ್ತಿದ್ದಾರೆ",
    sectionOpportunity: "ನೀವು ತುಂಬಬಹುದಾದ ಖಾಲಿ ಜಾಗ",
    sectionWhyUs: "FortuneMarq ನಿಮ್ಮನ್ನು Google ನಕ್ಷೆಯಲ್ಲಿ ತರುವ ರೀತಿ",
    ctaHeading: "ನಿಮ್ಮ ಗ್ರಾಹಕರು ಹುಡುಕುತ್ತಿದ್ದಾರೆ. ಅವರು ನಿಮ್ಮನ್ನು ಕಂಡುಕೊಳ್ಳಲಿ.",
    ctaBody: "Google Maps ಲಿಸ್ಟಿಂಗ್, ವೆಬ್‌ಸೈಟ್, ರ್ಯಾಂಕಿಂಗ್ — ಪ್ರತಿಯೊಂದು ಸ್ಥಳೀಯ ವ್ಯಾಪಾರಕ್ಕೂ ಅಗತ್ಯವಾದ ಅಡಿಪಾಯ. ನಾವು ಅದನ್ನು ತ್ವರಿತವಾಗಿ ನಿರ್ಮಿಸುತ್ತೇವೆ.",
    footer: "{company} ಗಾಗಿ FortuneMarq — ಡಿಜಿಟಲ್ ಗ್ರೋತ್ ಏಜೆನ್ಸಿ, ಹುಬ್ಬಳ್ಳಿ ಅವರಿಂದ ತಯಾರಿಸಲಾಗಿದೆ.",
    labelVolume: "{city}ಯಲ್ಲಿ {industry}ಗೆ ಮಾಸಿಕ ಹುಡುಕಾಟಗಳು",
    labelGmb: "Google Maps / ಲೋಕಲ್ ಪ್ಯಾಕ್",
    labelDirs: "ಡೈರೆಕ್ಟರಿಗಳು ಮತ್ತು ಅಗ್ರಿಗೇಟರ್‌ಗಳು",
    labelSites: "ನಿಜವಾದ ಸ್ಪರ್ಧಿ ವೆಬ್‌ಸೈಟ್‌ಗಳು",
    labelOther: "ಸೋಶಿಯಲ್ ಮತ್ತು ಇತರೆ",
    labelTopKeywords: "ಮುಖ್ಯ ಕೀವರ್ಡ್‌ಗಳು (ಸರ್ಚ್ ವಾಲ್ಯೂಮ್ ಪ್ರಕಾರ)",
    labelPreparedFor: "ಇವರಿಗಾಗಿ ತಯಾರಿಸಲಾಗಿದೆ",
    labelPreparedBy: "ತಯಾರಿಸಿದವರು",
    labelConfidential: "ಗೌಪ್ಯ — ಸ್ವೀಕರಿಸಿದವರ ಉಪಯೋಗಕ್ಕೆ ಮಾತ್ರ",
  },
  D: {
    reportTitle: "ನಿಶ್ ಮಾರ್ಕೆಟ್ ರಿಪೋರ್ಟ್",
    tagline: "ಕಡಿಮೆ ಸರ್ಚ್ ವಾಲ್ಯೂಮ್ ಎಂದರೆ ಕಡಿಮೆ ಸ್ಪರ್ಧೆ — ಮತ್ತು ಮುಂಚಿನ ಪ್ರಯೋಜನ.",
    sectionDemand: "{city}ಯಲ್ಲಿ ಮಾರ್ಕೆಟ್ ಬೇಡಿಕೆ",
    sectionCompetitor: "ಸ್ಪರ್ಧಾತ್ಮಕ ಪರಿಸ್ಥಿತಿ",
    sectionOpportunity: "ಕಡಿಮೆ ವಾಲ್ಯೂಮ್ ಏಕೆ ಅನುಕೂಲ",
    sectionWhyUs: "FortuneMarq ನಿಮ್ಮ ನಿಶ್ ಅನ್ನು ಹೇಗೆ ಸ್ವಾಧೀನಪಡಿಸಿಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ",
    ctaHeading: "ಸ್ಪರ್ಧೆ ಬರುವ ಮೊದಲೇ ನಿಮ್ಮ ನಿಶ್ ಅನ್ನು ಸ್ವಾಧೀನಪಡಿಸಿಕೊಳ್ಳಿ.",
    ctaBody: "ಈಗ ಕಡಿಮೆ ಸರ್ಚ್ ವಾಲ್ಯೂಮ್ ಎಂದರೆ ಕಡಿಮೆ ಸ್ಪರ್ಧೆ. ಮಾರ್ಕೆಟ್ ಬೆಳೆದಂತೆ ಡಿಜಿಟಲ್ ಉಪಸ್ಥಿತಿ ಸ್ಥಾಪಿಸಿದ ವ್ಯಾಪಾರಗಳು ಅದನ್ನು ಸ್ವಾಧೀನಪಡಿಸಿಕೊಳ್ಳುತ್ತವೆ.",
    footer: "{company} ಗಾಗಿ FortuneMarq — ಡಿಜಿಟಲ್ ಗ್ರೋತ್ ಏಜೆನ್ಸಿ, ಹುಬ್ಬಳ್ಳಿ ಅವರಿಂದ ತಯಾರಿಸಲಾಗಿದೆ.",
    labelVolume: "{city}ಯಲ್ಲಿ {industry}ಗೆ ಮಾಸಿಕ ಹುಡುಕಾಟಗಳು",
    labelGmb: "Google Maps / ಲೋಕಲ್ ಪ್ಯಾಕ್",
    labelDirs: "ಡೈರೆಕ್ಟರಿಗಳು ಮತ್ತು ಅಗ್ರಿಗೇಟರ್‌ಗಳು",
    labelSites: "ನಿಜವಾದ ಸ್ಪರ್ಧಿ ವೆಬ್‌ಸೈಟ್‌ಗಳು",
    labelOther: "ಸೋಶಿಯಲ್ ಮತ್ತು ಇತರೆ",
    labelTopKeywords: "ಮುಖ್ಯ ಕೀವರ್ಡ್‌ಗಳು (ಸರ್ಚ್ ವಾಲ್ಯೂಮ್ ಪ್ರಕಾರ)",
    labelPreparedFor: "ಇವರಿಗಾಗಿ ತಯಾರಿಸಲಾಗಿದೆ",
    labelPreparedBy: "ತಯಾರಿಸಿದವರು",
    labelConfidential: "ಗೌಪ್ಯ — ಸ್ವೀಕರಿಸಿದವರ ಉಪಯೋಗಕ್ಕೆ ಮಾತ್ರ",
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
