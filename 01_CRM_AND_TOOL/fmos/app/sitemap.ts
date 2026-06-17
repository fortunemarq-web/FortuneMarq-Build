import type { MetadataRoute } from "next";

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
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
    { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms-of-service", priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
