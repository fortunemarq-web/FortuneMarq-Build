import type { MetadataRoute } from "next";

// Robots policy. The public marketing pages are indexable; the private FMOS app
// surface (admin/sales/CRM/API/landing pages) is kept out of search. Points
// crawlers at the sitemap on the real domain.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/sales",
          "/api",
          "/strategist",
          "/manager",
          "/telecaller",
          "/client",
          "/tasks",
          "/projects",
          "/lp",
          "/login",
          "/site", // internal path behind the host-split; clean URLs are canonical
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
