import { createServerClientWithCookies } from "@/lib/supabase-server";
import { Megaphone } from "lucide-react";
import DirectReportClient from "./direct-report-client";

export const metadata = {
  title: "Direct Report | FortuneMarq Admin",
  description: "Send market-intel PDF reports to a niche + city, by lead type.",
};

export default async function DirectReportPage() {
  const supabase = await createServerClientWithCookies();

  // The report library defines which (city, niche, lang) combos can be sent.
  const { data: assets } = await (supabase.from("report_assets" as any) as any)
    .select("city, niche_slug, lang");
  const rows = (assets || []) as { city: string; niche_slug: string; lang: string }[];

  const cities = Array.from(new Set(rows.map((r) => r.city))).sort();
  const langs = Array.from(new Set(rows.map((r) => r.lang))).sort();
  const nicheByCity: Record<string, string[]> = {};
  for (const r of rows) {
    (nicheByCity[r.city] ||= []);
    if (!nicheByCity[r.city].includes(r.niche_slug)) nicheByCity[r.city].push(r.niche_slug);
  }
  Object.values(nicheByCity).forEach((a) => a.sort());

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-brand-deep text-white shadow-sm">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Direct Report</h1>
            <p className="text-slate-500 text-sm">
              Send market-intel report (PDF) to a niche + city, by lead type.
            </p>
          </div>
        </div>

        <DirectReportClient
          cities={cities}
          nicheByCity={nicheByCity}
          langs={langs.length ? langs : ["en"]}
          hasLibrary={rows.length > 0}
        />
      </div>
    </div>
  );
}
