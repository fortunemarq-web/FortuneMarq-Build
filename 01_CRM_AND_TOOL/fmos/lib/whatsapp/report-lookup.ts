/**
 * Market-intel report lookup helpers for the Stage-3 Curiosity Batch-Send.
 * SERVER-safe pure functions (no side effects, no imports).
 *
 * PDFs are named `City_Niche_TypeN_Variant[_KN].pdf`, e.g.
 *   Hubli_DentalClinics_Type3_HasWebsite_KN.pdf
 * Type token → A/B/C/D script type (note: Type# is NOT the letter order):
 *   Type1 Visibility → A · Type2 NoWebsite → C · Type3 HasWebsite → B · Type4 LowVolume → D
 */

export type LeadType = "A" | "B" | "C" | "D";

/** Normalize a niche string both sides of the match: lowercase, alphanumeric only. */
export function slugify(s: string): string {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export const TYPE_TOKEN_TO_LEAD_TYPE: Record<string, LeadType> = {
  Type1: "A", // Visibility (SERP ranked)
  Type2: "C", // NoWebsite
  Type3: "B", // HasWebsite (not ranked)
  Type4: "D", // LowVolume
};

export interface ParsedReport {
  city: string;
  niche_slug: string; // raw token from filename, e.g. "DentalClinics"
  lead_type: LeadType;
  lang: "en" | "kn";
  filename: string;
}

/** Parse a report PDF filename into its registry fields. Returns null if it doesn't fit. */
export function parseReportFilename(filename: string): ParsedReport | null {
  const base = filename.replace(/\.pdf$/i, "");
  const parts = base.split("_");
  if (parts.length < 3) return null;
  const typeToken = parts[2];
  const lead_type = TYPE_TOKEN_TO_LEAD_TYPE[typeToken];
  if (!lead_type) return null;
  const lang: "en" | "kn" = /^kn$/i.test(parts[parts.length - 1]) ? "kn" : "en";
  return { city: parts[0], niche_slug: parts[1], lead_type, lang, filename };
}

export interface ReportAssetRow {
  lead_type: LeadType | string;
  public_url: string;
  filename: string;
  niche_slug: string;
}

/**
 * Choose the report for a lead given all assets registered for its (city, niche, lang).
 * Low-volume niches (IVF, Physiotherapy …) only have a Type4/D report — when that's the
 * ONLY type available, every lead gets it regardless of derived type. Otherwise the
 * lead's derived A/B/C/D type is used; if no matching asset exists, returns null
 * (we never send the wrong report).
 */
export function chooseReport(assets: ReportAssetRow[], derivedType: LeadType): ReportAssetRow | null {
  if (!assets || assets.length === 0) return null;
  const types = new Set(assets.map((a) => a.lead_type));
  if (types.size === 1 && types.has("D")) {
    return assets.find((a) => a.lead_type === "D") || null;
  }
  return assets.find((a) => a.lead_type === derivedType) || null;
}
