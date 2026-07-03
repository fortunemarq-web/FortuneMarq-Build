import "./web-design.css";
import type { Metadata } from "next";
import WebDesignExperience from "@/components/site/web-design/web-design-experience";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";

export const metadata: Metadata = {
  title: "Website Design & Development in Hubli | FortuneMarq",
  description:
    "We engineer fast, search-ready websites that turn visitors into customers. Pixel-perfect design, bulletproof code, Core Web Vitals green. Websites from ₹8,000 — FortuneMarq, Hubli.",
  keywords:
    "website design Hubli, website development Hubli, web design Karnataka, Next.js websites, fast websites, high-converting website, FortuneMarq",
  alternates: { canonical: `${SITE_URL}/web-design` },
  openGraph: {
    title: "Websites that sell while you sleep | FortuneMarq",
    description:
      "Pixel-perfect design meets bulletproof code. Fast, search-ready websites that turn scrollers into customers. From ₹8,000.",
    url: `${SITE_URL}/web-design`,
    type: "website",
    images: [{ url: "/site/images/og-default.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Websites that sell while you sleep | FortuneMarq",
    description: "Fast, search-ready, high-converting websites. Design that makes people ask who built it.",
  },
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Website Design & Development",
  provider: { "@type": "Organization", name: "FortuneMarq", url: SITE_URL },
  areaServed: "Hubli-Dharwad, Karnataka, India",
  description:
    "High-converting website design and development — fast, SEO-built, hand-coded on the modern web stack.",
  offers: { "@type": "Offer", priceCurrency: "INR", price: "8000", description: "Professional website, from ₹8,000 one-time" },
};

export default function WebDesignPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <WebDesignExperience />
    </main>
  );
}
