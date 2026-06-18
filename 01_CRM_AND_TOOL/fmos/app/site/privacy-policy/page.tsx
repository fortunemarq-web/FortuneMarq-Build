import type { Metadata } from "next";
import SiteLegal, { type LegalContent } from "@/components/site/site-legal";
import JsonLd from "@/components/site/json-ld";
import { breadcrumbLd } from "@/lib/site/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";

export const metadata: Metadata = {
  title: "Privacy Policy | FortuneMarq",
  description: "How FortuneMarq Media & Marketing collects, uses, and protects your personal information.",
  robots: "index, follow",
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/privacy-policy`,
    title: "Privacy Policy | FortuneMarq",
    description: "How FortuneMarq Media & Marketing collects, uses, and protects your personal information.",
    images: [`${SITE_URL}/site/images/og-default.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | FortuneMarq",
    images: [`${SITE_URL}/site/images/og-default.png`],
  },
};

const CONTENT: LegalContent = {
  kicker: "PRIVACY POLICY",
  title: (
    <>
      Your Privacy <span className="lg-accent">Matters.</span>
    </>
  ),
  sub: "Transparency in how we collect, use, and protect your information.",
  updated: "June 2026",
  sections: [
    {
      kicker: "01 // INTRODUCTION",
      title: "Our Commitment to Privacy.",
      blocks: [
        {
          p: 'At FortuneMarq Media & Marketing ("we," "our," or "us"), we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.',
        },
      ],
    },
    {
      kicker: "02 // INFORMATION WE COLLECT",
      title: "What We Collect.",
      blocks: [
        { p: "When you contact us or use our services, we may collect:", lead: "Personal Information:" },
        {
          list: [
            "Name, email address, phone number, and company information",
            "Information you provide in contact forms, project inquiries, or communications",
            "Payment and billing information (processed securely through third-party providers)",
          ],
        },
        {
          p: "We may collect technical information such as IP address, browser type, device information, and website usage data through cookies and similar technologies.",
          lead: "Automatically Collected Information:",
        },
      ],
    },
    {
      kicker: "03 // HOW WE USE INFORMATION",
      title: "How We Use It.",
      blocks: [
        { p: "We use your information to:" },
        {
          list: [
            "Provide, maintain, and improve our services",
            "Respond to your inquiries and communicate with you",
            "Process transactions and send related information",
            "Send marketing communications (with your consent)",
            "Analyze website usage and improve user experience",
            "Comply with legal obligations",
          ],
        },
      ],
    },
    {
      kicker: "04 // INFORMATION SHARING",
      title: "We Don't Sell Your Data.",
      blocks: [
        { p: "We do not sell, trade, or rent your personal information to third parties. We may share information only:" },
        {
          list: [
            "With service providers who assist in our operations (under strict confidentiality agreements)",
            "When required by law or to protect our rights",
            "In connection with a business transfer (with notice)",
          ],
        },
      ],
    },
    {
      kicker: "05 // DATA SECURITY",
      title: "How We Protect You.",
      blocks: [
        {
          p: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.",
        },
      ],
    },
    {
      kicker: "06 // YOUR RIGHTS",
      title: "Your Rights.",
      blocks: [
        { p: "You have the right to:" },
        {
          list: [
            "Access and receive a copy of your personal data",
            "Request correction of inaccurate data",
            "Request deletion of your personal data",
            "Object to processing of your personal data",
            "Withdraw consent at any time",
          ],
        },
        { p: "To exercise these rights, contact us at contact@fortunemarq.com" },
      ],
    },
    {
      kicker: "07 // COOKIES",
      title: "Cookie Policy.",
      blocks: [
        {
          p: "We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookies through your browser settings. Note that disabling cookies may affect website functionality.",
        },
      ],
    },
    {
      kicker: "08 // THIRD-PARTY LINKS",
      title: "External Links.",
      blocks: [
        {
          p: "Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.",
        },
      ],
    },
    {
      kicker: "09 // CHILDREN'S PRIVACY",
      title: "Age Restrictions.",
      blocks: [
        {
          p: "Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.",
        },
      ],
    },
    {
      kicker: "10 // CHANGES TO POLICY",
      title: "Policy Updates.",
      blocks: [
        {
          p: 'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of our services after changes constitutes acceptance of the updated policy.',
        },
      ],
    },
    {
      kicker: "11 // GRIEVANCE OFFICER",
      title: "Data Grievance Officer.",
      blocks: [
        {
          p: "In accordance with India's Digital Personal Data Protection Act, 2023, you may raise any concern or complaint about how we handle your personal data with our Grievance Officer:",
        },
        {
          contact: [
            { label: "Name", value: "Sayed Jabeer" },
            { label: "Email", value: "sayedjabeer@fortunemarq.com", href: "mailto:sayedjabeer@fortunemarq.com" },
          ],
        },
        {
          p: "We will acknowledge and address grievances within the timelines prescribed under applicable law.",
        },
      ],
    },
    {
      kicker: "12 // CONTACT US",
      title: "Questions? Get in Touch.",
      blocks: [
        { p: "If you have questions about this Privacy Policy or our data practices, please contact us:" },
        {
          contact: [
            { label: "Email", value: "contact@fortunemarq.com", href: "mailto:contact@fortunemarq.com" },
            { label: "Phone", value: "9353082656", href: "tel:+919353082656" },
            { label: "Address", value: "Galaxy Mall First Floor Shop No. 43, J.C Nagar, Hubli - 580020" },
          ],
        },
      ],
    },
  ],
};

export default function PrivacyPolicy() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Privacy Policy", path: "/privacy-policy" }])} />
      <SiteLegal content={CONTENT} />
    </>
  );
}
