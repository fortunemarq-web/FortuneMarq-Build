import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  ReportCopy,
  ReportType,
  ReportLang,
  TYPE_COLOR,
  TYPE_LABEL,
  fillTokens,
} from "./content";
import type { SerpCompetitorInsight } from "@/actions/serp-scan";

export interface ReportData {
  city: string;
  industry: string;
  type: ReportType;
  lang: ReportLang;
  company: string; // "Your Business" for generic / actual name at send time
  monthlySearchDemand: number;
  topKeywords: { keyword: string; volume: number }[];
  avgCpcLow: number;
  avgCpcHigh: number;
  isLowVolume: boolean;
  competitor_insights: SerpCompetitorInsight | null;
  copy: ReportCopy;
}

function makeStyles(accentColor: string, fontFamily: string) {
  return StyleSheet.create({
    page: {
      fontFamily,
      fontSize: 9,
      color: "#1e293b",
      backgroundColor: "#ffffff",
      paddingTop: 0,
      paddingBottom: 40,
      paddingHorizontal: 0,
    },
    // ── Cover band ──
    coverBand: {
      backgroundColor: accentColor,
      paddingHorizontal: 40,
      paddingTop: 48,
      paddingBottom: 32,
    },
    coverLabel: {
      fontSize: 8,
      fontWeight: 700,
      color: "rgba(255,255,255,0.7)",
      letterSpacing: 2,
      textTransform: "uppercase",
      marginBottom: 10,
    },
    coverTitle: {
      fontSize: 26,
      fontWeight: 700,
      color: "#ffffff",
      lineHeight: 1.25,
      marginBottom: 10,
    },
    coverTagline: {
      fontSize: 11,
      color: "rgba(255,255,255,0.85)",
      lineHeight: 1.5,
      marginBottom: 24,
    },
    coverMeta: {
      flexDirection: "row",
      gap: 32,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.25)",
      paddingTop: 16,
    },
    coverMetaItem: {
      flex: 1,
    },
    coverMetaLabel: {
      fontSize: 7,
      color: "rgba(255,255,255,0.6)",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 3,
    },
    coverMetaValue: {
      fontSize: 10,
      color: "#ffffff",
      fontWeight: 700,
    },
    // ── Body ──
    body: {
      paddingHorizontal: 40,
      paddingTop: 32,
    },
    section: {
      marginBottom: 28,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 700,
      color: accentColor,
      marginBottom: 12,
      borderBottomWidth: 1.5,
      borderBottomColor: accentColor,
      paddingBottom: 6,
    },
    // ── Stat grid ──
    statGrid: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: "#f8fafc",
      borderRadius: 6,
      padding: 12,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    statLabel: {
      fontSize: 7,
      color: "#64748b",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 18,
      fontWeight: 700,
      color: accentColor,
    },
    statSub: {
      fontSize: 7,
      color: "#94a3b8",
      marginTop: 2,
    },
    // ── SERP bar ──
    serpRow: {
      flexDirection: "row",
      height: 10,
      borderRadius: 5,
      overflow: "hidden",
      marginBottom: 8,
    },
    serpLegend: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    serpLegendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    serpDot: {
      width: 8,
      height: 8,
      borderRadius: 2,
    },
    serpLegendText: {
      fontSize: 8,
      color: "#475569",
    },
    // ── Keywords ──
    kwGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    kwChip: {
      backgroundColor: "#f1f5f9",
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      flexDirection: "row",
      gap: 4,
    },
    kwText: {
      fontSize: 8,
      color: "#334155",
    },
    kwVol: {
      fontSize: 7,
      color: "#94a3b8",
    },
    // ── Opportunity box ──
    opportunityBox: {
      backgroundColor: "#f0fdf4",
      borderRadius: 6,
      padding: 14,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    opportunityText: {
      fontSize: 9,
      color: "#166534",
      lineHeight: 1.6,
    },
    // ── Why Us bullets ──
    bullet: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 6,
    },
    bulletDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: accentColor,
      marginTop: 3,
    },
    bulletText: {
      flex: 1,
      fontSize: 9,
      color: "#334155",
      lineHeight: 1.5,
    },
    // ── CTA band ──
    ctaBand: {
      backgroundColor: accentColor,
      marginHorizontal: 40,
      borderRadius: 8,
      padding: 20,
      marginTop: 8,
      marginBottom: 24,
    },
    ctaHeading: {
      fontSize: 13,
      fontWeight: 700,
      color: "#ffffff",
      marginBottom: 6,
    },
    ctaBody: {
      fontSize: 9,
      color: "rgba(255,255,255,0.85)",
      lineHeight: 1.6,
    },
    // ── Footer ──
    footer: {
      position: "absolute",
      bottom: 16,
      left: 40,
      right: 40,
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 0.5,
      borderTopColor: "#e2e8f0",
      paddingTop: 8,
    },
    footerText: {
      fontSize: 7,
      color: "#94a3b8",
    },
  });
}

const SERP_COLORS = {
  gmb: "#3B82F6",
  directories: "#F59E0B",
  realSites: "#1E7A4F",
  socialOther: "#94A3B8",
};

const WHY_US_BULLETS: Record<ReportType, Record<"en" | "kn", string[]>> = {
  A: {
    en: [
      "Protect your Google ranking with continuous SEO maintenance",
      "Convert more of your existing ranking traffic into booked appointments",
      "Track competitor movement and respond before they overtake you",
      "Expand to additional keywords you're not ranking for yet",
    ],
    kn: [
      "ನಿರಂತರ SEO ನಿರ್ವಹಣೆಯಿಂದ ನಿಮ್ಮ Google ರ್ಯಾಂಕಿಂಗ್ ರಕ್ಷಿಸಿ",
      "ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ ರ್ಯಾಂಕಿಂಗ್ ಟ್ರಾಫಿಕ್ ಅನ್ನು ಹೆಚ್ಚಿನ ಅಪಾಯಿಂಟ್ಮೆಂಟ್‌ಗಳಾಗಿ ಪರಿವರ್ತಿಸಿ",
      "ಸ್ಪರ್ಧಿಗಳ ಚಲನೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಮತ್ತು ಅವರು ಮೀರುವ ಮೊದಲೇ ಪ್ರತಿಕ್ರಿಯಿಸಿ",
      "ನೀವು ಇನ್ನೂ ರ್ಯಾಂಕ್ ಆಗದ ಹೆಚ್ಚುವರಿ ಕೀವರ್ಡ್‌ಗಳಿಗೆ ವಿಸ್ತರಿಸಿ",
    ],
  },
  B: {
    en: [
      "Technical SEO audit and fix — resolve what's holding your site back",
      "Local keyword targeting so you rank for searches in " + "{city}",
      "Google My Business optimisation to capture map-pack traffic",
      "Monthly rank tracking with transparent reporting",
    ],
    kn: [
      "ತಾಂತ್ರಿಕ SEO ಆಡಿಟ್ ಮತ್ತು ಫಿಕ್ಸ್ — ನಿಮ್ಮ ಸೈಟ್ ಅನ್ನು ಹಿಡಿದಿರುವುದನ್ನು ಸರಿಪಡಿಸಿ",
      "ಲೋಕಲ್ ಕೀವರ್ಡ್ ಟಾರ್ಗೆಟಿಂಗ್ — {city}ಯಲ್ಲಿ ಹುಡುಕಾಟಗಳಿಗೆ ರ್ಯಾಂಕ್ ಆಗಿ",
      "ಮ್ಯಾಪ್-ಪ್ಯಾಕ್ ಟ್ರಾಫಿಕ್ ಪಡೆಯಲು Google My Business ಆಪ್ಟಿಮೈಸೇಶನ್",
      "ಪಾರದರ್ಶಕ ವರದಿಯೊಂದಿಗೆ ಮಾಸಿಕ ರ್ಯಾಂಕ್ ಟ್ರ್ಯಾಕಿಂಗ್",
    ],
  },
  C: {
    en: [
      "Google Maps listing — get found by customers searching near you",
      "Professional website in 7 days, optimised for local search",
      "Start ranking on page 1 for your most important keywords",
      "WhatsApp Business setup so leads can reach you instantly",
    ],
    kn: [
      "Google Maps ಲಿಸ್ಟಿಂಗ್ — ಹತ್ತಿರ ಹುಡುಕುತ್ತಿರುವ ಗ್ರಾಹಕರಿಗೆ ಕಂಡುಬನ್ನಿ",
      "7 ದಿನಗಳಲ್ಲಿ ಲೋಕಲ್ ಸರ್ಚ್‌ಗೆ ಆಪ್ಟಿಮೈಸ್ ಮಾಡಿದ ವೃತ್ತಿಪರ ವೆಬ್‌ಸೈಟ್",
      "ನಿಮ್ಮ ಮುಖ್ಯ ಕೀವರ್ಡ್‌ಗಳಿಗೆ ಪೇಜ್ 1 ರಲ್ಲಿ ರ್ಯಾಂಕ್ ಆಗಲು ಪ್ರಾರಂಭಿಸಿ",
      "ಲೀಡ್‌ಗಳು ತಕ್ಷಣ ನಿಮ್ಮನ್ನು ತಲುಪಲು WhatsApp Business ಸೆಟಪ್",
    ],
  },
  D: {
    en: [
      "Establish your Google presence now, before competitors catch on",
      "Low competition means faster ranking — visible results in weeks",
      "Build brand authority in your niche while the market is open",
      "Ready to scale as search volume grows in coming years",
    ],
    kn: [
      "ಸ್ಪರ್ಧಿಗಳು ಗಮನಿಸುವ ಮೊದಲೇ ನಿಮ್ಮ Google ಉಪಸ್ಥಿತಿ ಸ್ಥಾಪಿಸಿ",
      "ಕಡಿಮೆ ಸ್ಪರ್ಧೆ ಎಂದರೆ ವೇಗದ ರ್ಯಾಂಕಿಂಗ್ — ವಾರಗಳಲ್ಲಿ ಗೋಚರ ಫಲಿತಾಂಶಗಳು",
      "ಮಾರ್ಕೆಟ್ ತೆರೆದಿರುವಾಗ ನಿಮ್ಮ ನಿಶ್‌ನಲ್ಲಿ ಬ್ರ್ಯಾಂಡ್ ಅಧಿಕಾರ ನಿರ್ಮಿಸಿ",
      "ಮುಂದಿನ ವರ್ಷಗಳಲ್ಲಿ ಸರ್ಚ್ ವಾಲ್ಯೂಮ್ ಬೆಳೆದಂತೆ ಸ್ಕೇಲ್ ಮಾಡಲು ಸಿದ್ಧ",
    ],
  },
};

const OPPORTUNITY_TEXT: Record<ReportType, Record<"en" | "kn", string>> = {
  A: {
    en: "You've already done the hard work of ranking. The risk now is standing still — competitors are investing in SEO every month. Protecting and expanding your ranking is far cheaper than rebuilding it after losing position.",
    kn: "ನೀವು ರ್ಯಾಂಕ್ ಆಗುವ ಕಠಿಣ ಕೆಲಸ ಈಗಾಗಲೇ ಮಾಡಿದ್ದೀರಿ. ಈಗ ಅಪಾಯವೆಂದರೆ ನಿಂತಿರುವುದು — ಸ್ಪರ್ಧಿಗಳು ಪ್ರತಿ ತಿಂಗಳು SEO ಯಲ್ಲಿ ಹೂಡಿಕೆ ಮಾಡುತ್ತಿದ್ದಾರೆ. ನಿಮ್ಮ ರ್ಯಾಂಕಿಂಗ್ ರಕ್ಷಿಸಿ ಮತ್ತು ವಿಸ್ತರಿಸುವುದು ಸ್ಥಾನ ಕಳೆದ ನಂತರ ಮರುನಿರ್ಮಿಸುವುದಕ್ಕಿಂತ ಹೆಚ್ಚು ಅಗ್ಗ.",
  },
  B: {
    en: "Your website exists but is invisible in search. Every month without ranking, you are paying to maintain an asset that generates no organic leads. The competitors who do rank are capturing customers who would otherwise have found you.",
    kn: "ನಿಮ್ಮ ವೆಬ್‌ಸೈಟ್ ಇದೆ ಆದರೆ ಸರ್ಚ್‌ನಲ್ಲಿ ಅದೃಶ್ಯ. ರ್ಯಾಂಕ್ ಇಲ್ಲದ ಪ್ರತಿ ತಿಂಗಳು, ಯಾವುದೇ ಆರ್ಗಾನಿಕ್ ಲೀಡ್ ಉತ್ಪಾದಿಸದ ಆಸ್ತಿಯನ್ನು ನಿರ್ವಹಿಸಲು ನೀವು ಪಾವತಿಸುತ್ತಿದ್ದೀರಿ. ರ್ಯಾಂಕ್ ಆಗುವ ಸ್ಪರ್ಧಿಗಳು ಇಲ್ಲದಿದ್ದರೆ ನಿಮ್ಮನ್ನು ಕಂಡುಕೊಳ್ಳುತ್ತಿದ್ದ ಗ್ರಾಹಕರನ್ನು ಸೆಳೆಯುತ್ತಿದ್ದಾರೆ.",
  },
  C: {
    en: "Customers searching for your service cannot find you — they go to whoever appears first on Google. Without a website or Maps listing, you are invisible to the largest customer-discovery channel that exists. Every day this continues is leads going to your competitors.",
    kn: "ನಿಮ್ಮ ಸೇವೆ ಹುಡುಕುತ್ತಿರುವ ಗ್ರಾಹಕರು ನಿಮ್ಮನ್ನು ಕಂಡುಕೊಳ್ಳಲಾಗುತ್ತಿಲ್ಲ — ಅವರು Google ನಲ್ಲಿ ಮೊದಲು ಕಾಣಿಸುವವರ ಬಳಿ ಹೋಗುತ್ತಾರೆ. ವೆಬ್‌ಸೈಟ್ ಅಥವಾ Maps ಲಿಸ್ಟಿಂಗ್ ಇಲ್ಲದೆ, ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ ಅತಿದೊಡ್ಡ ಗ್ರಾಹಕ-ಶೋಧನೆ ಚಾನಲ್‌ನಲ್ಲಿ ನೀವು ಅದೃಶ್ಯ. ಪ್ರತಿ ದಿನ ಮುಂದುವರೆದರೆ ಲೀಡ್‌ಗಳು ನಿಮ್ಮ ಸ್ಪರ್ಧಿಗಳ ಬಳಿ ಹೋಗುತ್ತವೆ.",
  },
  D: {
    en: "Low search volume now means low competition. Businesses that establish a strong digital presence early — Google Maps, website, ranking — capture the market as it grows. This is the cheapest time to become the market leader in this niche.",
    kn: "ಈಗ ಕಡಿಮೆ ಸರ್ಚ್ ವಾಲ್ಯೂಮ್ ಎಂದರೆ ಕಡಿಮೆ ಸ್ಪರ್ಧೆ. Google Maps, ವೆಬ್‌ಸೈಟ್, ರ್ಯಾಂಕಿಂಗ್ — ಬಲವಾದ ಡಿಜಿಟಲ್ ಉಪಸ್ಥಿತಿ ಮೊದಲೇ ಸ್ಥಾಪಿಸುವ ವ್ಯಾಪಾರಗಳು ಮಾರ್ಕೆಟ್ ಬೆಳೆದಂತೆ ಅದನ್ನು ಸ್ವಾಧೀನಪಡಿಸಿಕೊಳ್ಳುತ್ತವೆ. ಈ ನಿಶ್‌ನಲ್ಲಿ ಮಾರ್ಕೆಟ್ ಲೀಡರ್ ಆಗಲು ಇದು ಅಗ್ಗದ ಸಮಯ.",
  },
};

export function ReportDocument({ data }: { data: ReportData }) {
  const accentColor = TYPE_COLOR[data.type];
  const fontFamily = data.lang === "kn" ? "NotoKannada" : "Inter";
  const S = makeStyles(accentColor, fontFamily);
  const c = data.copy;
  const vars = {
    city: data.city,
    industry: data.industry,
    volume: data.monthlySearchDemand.toLocaleString("en-IN"),
    company: data.company,
  };
  const fill = (t: string) => fillTokens(t, vars);
  const ci = data.competitor_insights;
  const bullets = WHY_US_BULLETS[data.type][data.lang];
  const opportunityText = OPPORTUNITY_TEXT[data.type][data.lang];

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Cover */}
        <View style={S.coverBand}>
          <Text style={S.coverLabel}>{TYPE_LABEL[data.type]}</Text>
          <Text style={S.coverTitle}>{c.reportTitle}</Text>
          <Text style={S.coverTagline}>{fill(c.tagline)}</Text>
          <View style={S.coverMeta}>
            <View style={S.coverMetaItem}>
              <Text style={S.coverMetaLabel}>{c.labelPreparedFor}</Text>
              <Text style={S.coverMetaValue}>{data.company}</Text>
            </View>
            <View style={S.coverMetaItem}>
              <Text style={S.coverMetaLabel}>{c.labelPreparedBy}</Text>
              <Text style={S.coverMetaValue}>FortuneMarq</Text>
            </View>
            <View style={S.coverMetaItem}>
              <Text style={S.coverMetaLabel}>{data.city} · {data.industry}</Text>
              <Text style={S.coverMetaValue}>{new Date().toLocaleDateString("en-IN")}</Text>
            </View>
          </View>
        </View>

        <View style={S.body}>
          {/* Section 1 — Demand */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>{fill(c.sectionDemand)}</Text>
            <View style={S.statGrid}>
              <View style={S.statCard}>
                <Text style={S.statLabel}>{fill(c.labelVolume)}</Text>
                <Text style={S.statValue}>{data.monthlySearchDemand.toLocaleString("en-IN")}</Text>
                <Text style={S.statSub}>searches / month</Text>
              </View>
              {data.avgCpcLow > 0 && (
                <View style={S.statCard}>
                  <Text style={S.statLabel}>Avg. CPC (top of page)</Text>
                  <Text style={S.statValue}>₹{data.avgCpcLow}–{data.avgCpcHigh}</Text>
                  <Text style={S.statSub}>per click (Google Ads estimate)</Text>
                </View>
              )}
              <View style={S.statCard}>
                <Text style={S.statLabel}>Market status</Text>
                <Text style={S.statValue}>{data.isLowVolume ? "Niche" : "Active"}</Text>
                <Text style={S.statSub}>{data.isLowVolume ? "< 1,000 / mo" : "> 1,000 / mo"}</Text>
              </View>
            </View>

            {/* Top keywords */}
            {data.topKeywords.length > 0 && (
              <>
                <Text style={{ ...S.statLabel, marginBottom: 6 }}>{c.labelTopKeywords}</Text>
                <View style={S.kwGrid}>
                  {data.topKeywords.slice(0, 12).map((kw, i) => (
                    <View key={i} style={S.kwChip}>
                      <Text style={S.kwText}>{kw.keyword}</Text>
                      <Text style={S.kwVol}>{kw.volume.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Section 2 — Competitor landscape (only if SERP data available) */}
          {ci && (
            <View style={S.section}>
              <Text style={S.sectionTitle}>{fill(c.sectionCompetitor)}</Text>
              {/* Stacked bar */}
              <View style={S.serpRow}>
                {ci.buckets.gmb > 0 && (
                  <View style={{ backgroundColor: SERP_COLORS.gmb, width: `${ci.buckets.gmb}%` }} />
                )}
                {ci.buckets.directories > 0 && (
                  <View style={{ backgroundColor: SERP_COLORS.directories, width: `${ci.buckets.directories}%` }} />
                )}
                {ci.buckets.realSites > 0 && (
                  <View style={{ backgroundColor: SERP_COLORS.realSites, width: `${ci.buckets.realSites}%` }} />
                )}
                {ci.buckets.socialOther > 0 && (
                  <View style={{ backgroundColor: SERP_COLORS.socialOther, width: `${ci.buckets.socialOther}%` }} />
                )}
              </View>
              <View style={S.serpLegend}>
                {[
                  { label: `${c.labelGmb} — ${ci.buckets.gmb}%`, color: SERP_COLORS.gmb },
                  { label: `${c.labelDirs} — ${ci.buckets.directories}%`, color: SERP_COLORS.directories },
                  { label: `${c.labelSites} — ${ci.buckets.realSites}%`, color: SERP_COLORS.realSites },
                  { label: `${c.labelOther} — ${ci.buckets.socialOther}%`, color: SERP_COLORS.socialOther },
                ].map((item, i) => (
                  <View key={i} style={S.serpLegendItem}>
                    <View style={{ ...S.serpDot, backgroundColor: item.color }} />
                    <Text style={S.serpLegendText}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Section 3 — Opportunity */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>{fill(c.sectionOpportunity)}</Text>
            <View style={S.opportunityBox}>
              <Text style={S.opportunityText}>{opportunityText}</Text>
            </View>
          </View>

          {/* Section 4 — Why FortuneMarq */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>{fill(c.sectionWhyUs)}</Text>
            {bullets.map((b, i) => (
              <View key={i} style={S.bullet}>
                <View style={S.bulletDot} />
                <Text style={S.bulletText}>{fill(b)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View style={S.ctaBand}>
          <Text style={S.ctaHeading}>{fill(c.ctaHeading)}</Text>
          <Text style={S.ctaBody}>{fill(c.ctaBody)}</Text>
        </View>

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>{fill(c.footer)}</Text>
          <Text style={S.footerText}>{c.labelConfidential}</Text>
        </View>
      </Page>
    </Document>
  );
}
