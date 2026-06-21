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
      "ನಿರಂತರ SEO maintenance ಜೊತೆಗೆ ನಿಮ್ಮ Google Ranking ಅನ್ನು ಕಾಪಾಡಿಕೊಳ್ಳಿ",
      "ಈಗ ಬರುತ್ತಿರುವ Traffic ಅನ್ನು ಇನ್ನಷ್ಟು Bookings ಮತ್ತು Appointments ಆಗಿ ಬದಲಾಯಿಸಿ",
      "Competitors ಏನು ಮಾಡುತ್ತಿದ್ದಾರೆ ಎಂದು ಗಮನಿಸಿ, ಅವರು ನಿಮ್ಮನ್ನು ಹಿಂದಿಕ್ಕುವ ಮುನ್ನವೇ ಎಚ್ಚೆತ್ತುಕೊಳ್ಳಿ",
      "ನೀವು ಇನ್ನೂ Rank ಆಗದೇ ಇರುವ ಹೊಸ Keywords ಗಳಿಗೂ Expand ಆಗಿ",
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
      "Technical SEO audit ಮತ್ತು ಸರಿಪಡಿಸುವಿಕೆ — ನಿಮ್ಮ Website ಅನ್ನು ಹಿಂದಕ್ಕೆ ಎಳೆಯುತ್ತಿರುವ ಪ್ರಾಬ್ಲಮ್ಸ್ ಬಗೆಹರಿಸುತ್ತೇವೆ",
      "{city} ನಲ್ಲಿ ಹುಡುಕಿದಾಗ ನಿಮ್ಮ Website ಕಾಣಿಸುವಂತೆ ಮಾಡಲು Local keyword targeting",
      "Map-pack ಟ್ರಾಫಿಕ್ ಪಡೆಯಲು Google My Business optimisation",
      "ಪಾರದರ್ಶಕ ರಿಪೋರ್ಟ್‌ನೊಂದಿಗೆ ಪ್ರತಿ ತಿಂಗಳ Rank tracking",
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
      "Google Maps listing — ನಿಮ್ಮ ಹತ್ತಿರದಲ್ಲಿ Search ಮಾಡುವ Customers ಗೆ ಸುಲಭವಾಗಿ ಸಿಗಿ",
      "Local search ಗೆ ತಕ್ಕಂತೆ Optimise ಮಾಡಲಾದ Professional Website ಕೇವಲ 7 ದಿನಗಳಲ್ಲಿ",
      "ನಿಮ್ಮ ಮುಖ್ಯವಾದ Keywords ಗಳಿಗಾಗಿ page 1 ನಲ್ಲಿ Rank ಆಗುವುದನ್ನು ಶುರುಮಾಡಿ",
      "Customers ತಕ್ಷಣ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಲು WhatsApp Business ಸೆಟಪ್",
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
      "Competitors ಎಚ್ಚೆತ್ತುಕೊಳ್ಳುವ ಮುನ್ನವೇ, ಈಗಲೇ ನಿಮ್ಮ Google Presence ಅನ್ನು ಸೆಟ್ ಮಾಡಿ",
      "ಕಡಿಮೆ Competition ಎಂದರೆ ಫಾಸ್ಟ್ Ranking — ಕೆಲವೇ ವಾರಗಳಲ್ಲಿ ಕಣ್ಣಿಗೆ ಕಾಣುವಂತಹ Result",
      "ಮಾರ್ಕೆಟ್ ಇನ್ನೂ ಓಪನ್ ಇರುವಾಗಲೇ ನಿಮ್ಮ Niche ನಲ್ಲಿ ನಿಮ್ಮ Brand ಅನ್ನು ಬೆಳೆಸಿಕೊಳ್ಳಿ",
      "ಮುಂದಿನ ವರ್ಷಗಳಲ್ಲಿ Search Volume ಬೆಳೆದಂತೆ, ನಿಮ್ಮ Business ಅನ್ನು ದೊಡ್ಡದು ಮಾಡಲು ರೆಡಿಯಾಗಿ",
    ],
  },
};

const OPPORTUNITY_TEXT: Record<ReportType, Record<"en" | "kn", string>> = {
  A: {
    en: "You've already done the hard work of ranking. The risk now is standing still — competitors are investing in SEO every month. Protecting and expanding your ranking is far cheaper than rebuilding it after losing position.",
    kn: "ಟಾಪ್‌ಗೆ ಬರುವ ಕಷ್ಟದ ಕೆಲಸವನ್ನು ನೀವು ಈಗಾಗಲೇ ಮಾಡಿದ್ದೀರಿ. ಈಗ ಸುಮ್ಮನೆ ಕೂತರೆ ಅದೇ ದೊಡ್ಡ Risk — ಯಾಕೆಂದರೆ ನಿಮ್ಮ Competitors ಪ್ರತಿ ತಿಂಗಳು SEO ಮೇಲೆ Invest ಮಾಡುತ್ತಿದ್ದಾರೆ. ಒಮ್ಮೆ ನಿಮ್ಮ ಸ್ಥಾನ ಕಳೆದುಕೊಂಡು ಮತ್ತೆ ಅದನ್ನು ಪಡೆಯುವುದಕ್ಕಿಂತ, ಈಗಿರುವ ಸ್ಥಾನವನ್ನು ಉಳಿಸಿಕೊಂಡು ಬೆಳೆಸಿಕೊಳ್ಳುವುದು ತುಂಬಾ ಸುಲಭ ಮತ್ತು ಅಗ್ಗ.",
  },
  B: {
    en: "Your website exists but is invisible in search. Every month without ranking, you are paying to maintain an asset that generates no organic leads. The competitors who do rank are capturing customers who would otherwise have found you.",
    kn: "ನಿಮ್ಮ Website ಇದೆ, ಆದರೆ Search ಮಾಡಿದಾಗ ಅದು ಎಲ್ಲಿಯೂ ಕಾಣುತ್ತಿಲ್ಲ. Ranking ಇಲ್ಲದೆ, ಯಾವುದೇ Leads ತಂದುಕೊಡದ Website ಗೆ ನೀವು ಪ್ರತಿ ತಿಂಗಳು ಸುಮ್ಮನೆ ಹಣ ಕಟ್ಟುತ್ತಿದ್ದೀರಿ ಅಷ್ಟೇ. ನಿಮಗಿಂತ ಮುಂದೆ Rank ಆಗುತ್ತಿರುವವರು, ನಿಮಗೆ ಸಿಗಬೇಕಿದ್ದ Customers ಅನ್ನು ತಮ್ಮತ್ತ ಸೆಳೆಯುತ್ತಿದ್ದಾರೆ.",
  },
  C: {
    en: "Customers searching for your service cannot find you — they go to whoever appears first on Google. Without a website or Maps listing, you are invisible to the largest customer-discovery channel that exists. Every day this continues is leads going to your competitors.",
    kn: "ನಿಮ್ಮ ಸೇವೆಗಾಗಿ Search ಮಾಡುವ Customers ಗೆ ನೀವು ಸಿಗುತ್ತಿಲ್ಲ — ಬದಲಾಗಿ Google ನಲ್ಲಿ ಯಾರು ಮೊದಲು ಕಾಣುತ್ತಾರೋ ಅವರ ಬಳಿ ಹೋಗುತ್ತಿದ್ದಾರೆ. Website ಅಥವಾ Maps listing ಇಲ್ಲದಿದ್ದರೆ, Customers ಹುಡುಕುವ ಅತಿದೊಡ್ಡ ಜಾಗದಲ್ಲಿ ನೀವು ಯಾರಿಗೂ ಕಾಣುವುದಿಲ್ಲ. ಇದು ಹೀಗೆ ಮುಂದುವರಿದರೆ, ಪ್ರತಿದಿನ ನಿಮ್ಮ Customers ನಿಮ್ಮ Competitors ಪಾಲಾಗುತ್ತಾರೆ.",
  },
  D: {
    en: "Low search volume now means low competition. Businesses that establish a strong digital presence early — Google Maps, website, ranking — capture the market as it grows. This is the cheapest time to become the market leader in this niche.",
    kn: "ಈಗ Search ಕಡಿಮೆ ಇದೆ ಎಂದರೆ, Competition ಕೂಡ ಕಡಿಮೆ ಇದೆ ಎಂದರ್ಥ. ಯಾರು ಬೇಗನೆ ತಮ್ಮ Digital Presence (Google Maps, Website, Ranking) ಅನ್ನು ಸ್ಟ್ರಾಂಗ್ ಆಗಿ ಕಟ್ಟಿಕೊಳ್ಳುತ್ತಾರೋ, ಅವರು ಮುಂದೆ ಮಾರ್ಕೆಟ್ ಬೆಳೆದಾಗ ಅದರ ಪೂರ್ಣ ಲಾಭ ಪಡೆಯುತ್ತಾರೆ. ಈ Niche ನಲ್ಲಿ Market Leader ಆಗಲು ಇದಕ್ಕಿಂತ ಕಮ್ಮಿ ಖರ್ಚಿನ ಸಮಯ ಇನ್ನೊಂದಿಲ್ಲ.",
  },
};

const UI: Record<"en" | "kn", { searchesPerMonth: string; avgCpc: string; perClick: string; marketStatus: string; active: string; niche: string }> = {
  en: { searchesPerMonth: "searches / month", avgCpc: "Avg. CPC (top of page)", perClick: "per click (Google Ads estimate)", marketStatus: "Market status", active: "Active", niche: "Niche" },
  kn: { searchesPerMonth: "searches / ತಿಂಗಳಿಗೆ", avgCpc: "ಸರಾಸರಿ CPC (page ನ ಟಾಪ್)", perClick: "ಪ್ರತಿ click ಗೆ (Google Ads ಅಂದಾಜು)", marketStatus: "Market Status", active: "Active", niche: "Niche (ಸೀಮಿತ ಮಾರ್ಕೆಟ್)" },
};

export function ReportDocument({ data }: { data: ReportData }) {
  const accentColor = TYPE_COLOR[data.type];
  const fontFamily = data.lang === "kn" ? "NotoKannada" : "Inter";
  const S = makeStyles(accentColor, fontFamily);
  const c = data.copy;
  const ui = UI[data.lang];
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
                <Text style={S.statSub}>{ui.searchesPerMonth}</Text>
              </View>
              {data.avgCpcLow > 0 && (
                <View style={S.statCard}>
                  <Text style={S.statLabel}>{ui.avgCpc}</Text>
                  <Text style={S.statValue}>Rs {data.avgCpcLow}–{data.avgCpcHigh}</Text>
                  <Text style={S.statSub}>{ui.perClick}</Text>
                </View>
              )}
              <View style={S.statCard}>
                <Text style={S.statLabel}>{ui.marketStatus}</Text>
                <Text style={S.statValue}>{data.isLowVolume ? ui.niche : ui.active}</Text>
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
