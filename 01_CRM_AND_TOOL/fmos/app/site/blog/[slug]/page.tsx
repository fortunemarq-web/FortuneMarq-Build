import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import SiteFooter from "@/components/site/site-footer";
import ShinyText from "@/components/site/shiny-text";
import JsonLd from "@/components/site/json-ld";
import { breadcrumbLd } from "@/lib/site/seo";
import { getPost, getPostSlugs, formatPostDate } from "@/lib/blog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";

const absUrl = (p: string) => (p.startsWith("http") ? p : `${SITE_URL}${p}`);

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post Not Found | FortuneMarq", robots: "noindex, follow" };
  return {
    title: `${post.title} | FortuneMarq`,
    description: post.description,
    robots: "index, follow",
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url: `${SITE_URL}/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      images: [absUrl(post.image)],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description, images: [absUrl(post.image)] },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    image: absUrl(post.image),
    author: { "@type": "Organization", name: post.author || "FortuneMarq" },
    publisher: {
      "@type": "Organization",
      name: "FortuneMarq",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/site/images/FORTUNEMARQ-LOGO.webp` },
    },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <main>
      <JsonLd
        data={[
          articleLd,
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <article className="post">
        <section className="lg-hero post-hero">
          <div className="lg-hero-bg">
            <div className="wk-aurora" />
            <div className="wk-grid" />
          </div>
          <div className="lg-hero-inner">
            <Link href="/blog" className="post-back">
              ← All articles
            </Link>
            <span className="lg-kicker">
              <ShinyText text={post.tags[0] ? post.tags[0].toUpperCase() : "ARTICLE"} color="#42CA80" shineColor="#ffffff" speed={4} delay={1} />
            </span>
            <h1 className="lg-title post-title">{post.title}</h1>
            <div className="post-meta">
              <span>{formatPostDate(post.date)}</span>
              <span className="post-meta-dot">•</span>
              <span>{post.author}</span>
            </div>
          </div>
        </section>

        <div className="post-body">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        <div className="post-foot">
          <p className="post-foot-kicker">Ready to put this into action?</p>
          <Link href="/contact#book" className="fm-footer-cta-btn">
            Book a Strategy Call <span>→</span>
          </Link>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
