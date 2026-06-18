import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/site/site-footer";
import ShinyText from "@/components/site/shiny-text";
import JsonLd from "@/components/site/json-ld";
import { breadcrumbLd } from "@/lib/site/seo";
import { getAllPosts, formatPostDate } from "@/lib/blog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";

export const metadata: Metadata = {
  title: "Blog | FortuneMarq — Marketing Insights for Hubli Businesses",
  description:
    "Plain-English guides on web design, SEO, Google & Meta Ads, and growing a local business in Hubli — from the FortuneMarq team.",
  robots: "index, follow",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/blog`,
    title: "Blog | FortuneMarq",
    description: "Plain-English guides on growing your business in Hubli.",
    images: [`${SITE_URL}/site/images/og-default.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | FortuneMarq",
    images: [`${SITE_URL}/site/images/og-default.png`],
  },
};

export default function SiteBlog() {
  const posts = getAllPosts();
  return (
    <main>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])} />
      <section className="lg-hero blog-hero">
        <div className="lg-hero-bg">
          <div className="wk-aurora" />
          <div className="wk-grid" />
        </div>
        <div className="lg-hero-inner">
          <span className="lg-kicker">
            <ShinyText text="THE BLOG" color="#42CA80" shineColor="#ffffff" speed={4} delay={1} />
          </span>
          <h1 className="lg-title">
            Insights &amp; <span className="lg-accent">Ideas.</span>
          </h1>
          <p className="lg-sub">No-fluff guides on marketing that actually brings customers — written for business owners, not marketers.</p>
        </div>
      </section>

      <section className="blog-list">
        {posts.length === 0 ? (
          <p className="blog-empty">New articles are on the way — check back soon.</p>
        ) : (
          <div className="blog-grid">
            {posts.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="blog-card">
                <div className="blog-card-media">
                  <Image src={p.image} alt={p.title} width={1200} height={630} className="blog-card-img" />
                </div>
                <div className="blog-card-body">
                  <div className="blog-card-meta">
                    <span className="blog-card-date">{formatPostDate(p.date)}</span>
                    {p.tags[0] && <span className="blog-card-tag">{p.tags[0]}</span>}
                  </div>
                  <h2 className="blog-card-title">{p.title}</h2>
                  <p className="blog-card-desc">{p.description}</p>
                  <span className="blog-card-cta">Read more →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
