"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";

// ─── Directory / aggregator domains ─────────────────────────────────────────
// Results whose domain matches one of these are classified as "directories".
const DIRECTORY_DOMAINS = new Set([
  "justdial.com",
  "sulekha.com",
  "indiamart.com",
  "tradeindia.com",
  "yellowpages.in",
  "yellowpages.com",
  "yelp.com",
  "practo.com",
  "lybrate.com",
  "docsapp.in",
  "1mg.com",
  "apollo247.com",
  "zocdoc.com",
  "magicbricks.com",
  "99acres.com",
  "housing.com",
  "commonfloor.com",
  "proptiger.com",
  "olx.in",
  "quikr.com",
  "carwale.com",
  "cardekho.com",
  "gaana.com",
  "shiksha.com",
  "collegedunia.com",
  "collegesearch.in",
  "urbanclap.com",
  "urbancompany.com",
  "meesho.com",
  "amazon.in",
  "flipkart.com",
  "snapdeal.com",
  "naukri.com",
  "indeed.com",
  "internshala.com",
  "zomato.com",
  "swiggy.com",
  "dunzo.com",
  "burrp.com",
  "dineout.co.in",
  "tripadvisor.com",
  "tripadvisor.in",
  "makemytrip.com",
  "goibibo.com",
  "booking.com",
  "expedia.com",
  "weddingwire.in",
  "wedmegood.com",
  "shaadi.com",
  "babajob.com",
  "expertmarket.in",
]);

// ─── Social / other domains ──────────────────────────────────────────────────
const SOCIAL_DOMAINS = new Set([
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "youtube.com",
  "pinterest.com",
  "reddit.com",
  "quora.com",
  "medium.com",
  "blogger.com",
  "wordpress.com",
  "tumblr.com",
  "wikipedia.org",
  "wikihow.com",
]);

// ─── GMB / local pack indicators ────────────────────────────────────────────
// SearchAPI returns local pack results separately; we detect by result type.
const GMB_TYPES = new Set(["local_results", "local_pack", "maps_results"]);

export interface SerpBucket {
  gmb: number;        // Google Maps / Local Pack %
  directories: number;
  realSites: number;
  socialOther: number;
}

export interface SerpCompetitorInsight {
  buckets: SerpBucket;
  topResults: { title: string; url: string; bucket: string }[];
  query: string;
  scannedAt: string;
  totalResults: number;
}

export interface SerpScanResult {
  ok: boolean;
  industry: string;
  city: string;
  insight?: SerpCompetitorInsight;
  error?: string;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function classifyResult(
  url: string,
  resultType?: string
): "gmb" | "directory" | "realSite" | "socialOther" {
  if (resultType && GMB_TYPES.has(resultType)) return "gmb";
  const domain = extractDomain(url);
  if (!domain) return "socialOther";
  if (SOCIAL_DOMAINS.has(domain)) return "socialOther";
  if (DIRECTORY_DOMAINS.has(domain)) return "directory";
  return "realSite";
}

export async function runSerpScan(
  industry: string,
  city: string
): Promise<SerpScanResult> {
  const apiKey = process.env.SEARCHAPI_IO_KEY;
  if (!apiKey) {
    return { ok: false, industry, city, error: "SEARCHAPI_IO_KEY not set" };
  }

  const query = `${industry} in ${city}`;
  const params = new URLSearchParams({
    engine: "google",
    q: query,
    location: `${city}, Karnataka, India`,
    hl: "en",
    gl: "in",
    api_key: apiKey,
    num: "10",
  });

  let raw: Record<string, unknown>;
  try {
    const res = await fetch(`https://www.searchapi.io/api/v1/search?${params.toString()}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, industry, city, error: `SearchAPI ${res.status}: ${body.slice(0, 200)}` };
    }
    raw = await res.json() as Record<string, unknown>;
  } catch (e) {
    return { ok: false, industry, city, error: `Fetch failed: ${String(e)}` };
  }

  // Collect results across organic + local_results blocks
  type RawResult = { title?: string; link?: string; type?: string };
  const collected: { title: string; url: string; type?: string }[] = [];

  // Local pack (maps) results
  const localResults = raw.local_results as RawResult[] | undefined;
  if (Array.isArray(localResults)) {
    for (const r of localResults) {
      if (r.link || r.title) {
        collected.push({ title: r.title || "", url: r.link || "", type: "local_results" });
      }
    }
  }

  // Organic results
  const organicResults = raw.organic_results as RawResult[] | undefined;
  if (Array.isArray(organicResults)) {
    for (const r of organicResults) {
      if (r.link) {
        collected.push({ title: r.title || "", url: r.link, type: r.type });
      }
    }
  }

  const total = collected.length;
  if (total === 0) {
    return { ok: false, industry, city, error: "No results returned by SearchAPI" };
  }

  const counts = { gmb: 0, directory: 0, realSite: 0, socialOther: 0 };
  const topResults: { title: string; url: string; bucket: string }[] = [];

  for (const r of collected) {
    const bucket = classifyResult(r.url, r.type);
    counts[bucket]++;
    topResults.push({ title: r.title, url: r.url, bucket });
  }

  const pct = (n: number) => Math.round((n / total) * 100);

  const insight: SerpCompetitorInsight = {
    buckets: {
      gmb: pct(counts.gmb),
      directories: pct(counts.directory),
      realSites: pct(counts.realSite),
      socialOther: pct(counts.socialOther),
    },
    topResults: topResults.slice(0, 10),
    query,
    scannedAt: new Date().toISOString(),
    totalResults: total,
  };

  // Persist to market_insights.competitor_insights
  const supabase = await createServerClientWithCookies();
  const { error: dbErr } = await (supabase.from("market_insights") as any)
    .update({ competitor_insights: insight })
    .eq("industry", industry)
    .eq("city", city);

  if (dbErr) {
    return { ok: false, industry, city, error: `DB write failed: ${dbErr.message}`, insight };
  }

  // Update leads.serp_ranked based on whether real sites dominate (>= 20%)
  // Also ensure pitch_type is correct for non-low-volume leads in this niche×city
  // (SERP scan doesn't change pitch_type — that's set by keyword ingest)

  return { ok: true, industry, city, insight };
}
