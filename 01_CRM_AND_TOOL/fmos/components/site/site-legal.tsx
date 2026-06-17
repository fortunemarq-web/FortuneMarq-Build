import { Fragment } from "react";
import SiteFooter from "@/components/site/site-footer";
import ShinyText from "@/components/site/shiny-text";

// Shared clean-prose layout for the legal pages (Privacy / Terms). Content is
// passed as structured blocks so each page stays just data. Dark theme, readable
// measure, numbered sections.

export type LegalBlock =
  | { p: string; lead?: string }
  | { list: string[] }
  | { contact: { label: string; value: string; href?: string }[] };

export interface LegalSection {
  kicker: string; // "01 // INTRODUCTION"
  title: string;
  blocks: LegalBlock[];
}

export interface LegalContent {
  kicker: string;
  title: React.ReactNode;
  sub: string;
  updated: string;
  sections: LegalSection[];
}

function Block({ b }: { b: LegalBlock }) {
  if ("list" in b) {
    return (
      <ul className="lg-list">
        {b.list.map((li, i) => (
          <li key={i}>{li}</li>
        ))}
      </ul>
    );
  }
  if ("contact" in b) {
    return (
      <div className="lg-contact">
        {b.contact.map((c, i) => (
          <span key={i}>
            <span className="lg-lead">{c.label}:</span>{" "}
            {c.href ? <a href={c.href}>{c.value}</a> : c.value}
          </span>
        ))}
      </div>
    );
  }
  return (
    <p>
      {b.lead && <span className="lg-lead">{b.lead}</span>}
      {b.lead ? " " : ""}
      {b.p}
    </p>
  );
}

export default function SiteLegal({ content }: { content: LegalContent }) {
  return (
    <main>
      <section className="lg-hero">
        <div className="lg-hero-bg">
          <div className="wk-aurora" />
          <div className="wk-grid" />
        </div>
        <div className="lg-hero-inner">
          <span className="lg-kicker">
            <ShinyText text={content.kicker} color="#42CA80" shineColor="#ffffff" speed={4} delay={1} />
          </span>
          <h1 className="lg-title">{content.title}</h1>
          <p className="lg-sub">{content.sub}</p>
          <span className="lg-updated">Last Updated: {content.updated}</span>
        </div>
      </section>

      <div className="lg-body">
        {content.sections.map((s, i) => (
          <section className="lg-section" key={i}>
            <span className="lg-sec-kicker">{s.kicker}</span>
            <h2 className="lg-sec-title">{s.title}</h2>
            {s.blocks.map((b, j) => (
              <Fragment key={j}>
                <Block b={b} />
              </Fragment>
            ))}
          </section>
        ))}
      </div>

      <SiteFooter />
    </main>
  );
}
