"use server";

import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { createAdminClient } from "@/lib/supabase-admin";
import { registerFonts } from "@/lib/reports/fonts";
import { ReportDocument } from "@/lib/reports/template";
import { getCopy } from "@/lib/reports/content";
import type { ReportType, ReportLang } from "@/lib/reports/content";
import type { SerpCompetitorInsight } from "@/actions/serp-scan";

export interface GenerateReportResult {
  ok: boolean;
  generated: { type: ReportType; lang: ReportLang; url: string }[];
  errors: string[];
}

const TYPES: ReportType[] = ["A", "B", "C", "D"];
const LANGS: ReportLang[] = ["en", "kn"];
const BUCKET = "market-reports";

export async function generateReportsForNiche(
  industry: string,
  city: string,
  langs: ReportLang[] = LANGS
): Promise<GenerateReportResult> {
  registerFonts();

  const admin = createAdminClient();

  // Fetch market_insights row (admin client — works headless, e.g. batch route)
  const { data: mi, error: miErr } = await (admin.from("market_insights") as any)
    .select("general_insights, competitor_insights, search_volume")
    .eq("industry", industry)
    .eq("city", city)
    .single();

  if (miErr || !mi) {
    return {
      ok: false,
      generated: [],
      errors: [`market_insights not found for ${industry} / ${city}: ${miErr?.message ?? "no row"}`],
    };
  }

  const gi = mi.general_insights as {
    monthlySearchDemand?: number;
    topKeywords?: { keyword: string; volume: number }[];
    avgCpcLow?: number;
    avgCpcHigh?: number;
    isLowVolume?: boolean;
  } | null;

  const reportData = {
    city,
    industry,
    company: "Your Business",
    monthlySearchDemand: gi?.monthlySearchDemand ?? Number(mi.search_volume ?? 0),
    topKeywords: gi?.topKeywords ?? [],
    avgCpcLow: gi?.avgCpcLow ?? 0,
    avgCpcHigh: gi?.avgCpcHigh ?? 0,
    isLowVolume: gi?.isLowVolume ?? false,
    competitor_insights: mi.competitor_insights as SerpCompetitorInsight | null,
  };

  // Ensure bucket exists (no-op if already there)
  await admin.storage.createBucket(BUCKET, { public: true }).catch(() => null);

  const generated: { type: ReportType; lang: ReportLang; url: string }[] = [];
  const errors: string[] = [];

  for (const type of TYPES) {
    for (const lang of langs) {
      try {
        const copy = getCopy(type, lang);
        const element = React.createElement(ReportDocument, {
          data: { ...reportData, type, lang, copy },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const buffer = await renderToBuffer(element as any);

        const filename = `${city}_${industry}_Type${type}_${lang}.pdf`
          .replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${city}/${industry}/${filename}`;

        const { error: uploadErr } = await admin.storage
          .from(BUCKET)
          .upload(storagePath, buffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (uploadErr) {
          errors.push(`Upload ${type}/${lang}: ${uploadErr.message}`);
          continue;
        }

        const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
        const publicUrl = urlData.publicUrl;

        // Upsert report_assets (table not in generated types yet — cast)
        const { error: assetErr } = await (admin.from as any)("report_assets")
          .upsert(
            {
              city,
              niche_slug: industry,
              lead_type: type,
              lang,
              filename,
              public_url: publicUrl,
            },
            { onConflict: "city,niche_slug,lead_type,lang" }
          );

        if (assetErr) {
          errors.push(`report_assets ${type}/${lang}: ${assetErr.message}`);
        } else {
          generated.push({ type, lang, url: publicUrl });
        }
      } catch (e) {
        errors.push(`Render ${type}/${lang}: ${String(e)}`);
      }
    }
  }

  return { ok: errors.length === 0, generated, errors };
}
