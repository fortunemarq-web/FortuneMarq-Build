import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { enabledNiches } from "@/lib/lp/niches";

// Marketing-site sitemap. URLs use the real domain and match each page's
// canonical (root-domain paths — the deferred host-split maps fortunemarq.com →
// marketing). The pages are currently staged under /site in this app; when the
// host-split lands these become the public URLs. Bump lastModified on content
// changes. Excludes the private FMOS app routes (see robots.ts).

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-06-18");
  const routes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" },
    { path: "/services", priority: 0.9, changeFrequency: "monthly" },
    { path: "/work", priority: 0.8, changeFrequency: "monthly" },
    { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
    { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms-of-service", priority: 0.3, changeFrequency: "yearly" },
  ];

  const staticEntries: MetadataRoute.Sitemap = routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Blog posts — each new .md file shows up here automatically with its own date.
  const postEntries: MetadataRoute.Sitemap = getAllPosts().map((p) => {
    const d = new Date(p.date);
    return {
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: isNaN(d.getTime()) ? lastModified : d,
      changeFrequency: "monthly",
      priority: 0.6,
    };
  });

  // Niche × city landing pages — every enabled combo (13 niches × 9 cities).
  // The EN path is canonical; the ?lang=kn variant is declared via per-page
  // alternates, so it's not a separate sitemap entry.
  const lpModified = new Date("2026-06-24");
  const lpEntries: MetadataRoute.Sitemap = enabledNiches().map((n) => ({
    url: `${SITE_URL}/lp/${n.slug}/${n.citySlug}`,
    lastModified: lpModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticEntries, ...postEntries, ...lpEntries];
}
