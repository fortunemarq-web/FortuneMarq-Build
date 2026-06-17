import type { Metadata } from "next";
import SiteLegal, { type LegalContent } from "@/components/site/site-legal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";

export const metadata: Metadata = {
  title: "Terms of Service | FortuneMarq",
  description: "The legal framework that governs the working relationship between you and FortuneMarq Media.",
  robots: "index, follow",
  alternates: { canonical: `${SITE_URL}/terms-of-service` },
};

const CONTENT: LegalContent = {
  kicker: "TERMS OF SERVICE",
  title: (
    <>
      Clear Terms. <span className="lg-accent">Fair Partnership.</span>
    </>
  ),
  sub: "The legal framework that governs our working relationship.",
  updated: "January 2025",
  sections: [
    {
      kicker: "01 // AGREEMENT TO TERMS",
      title: "Acceptance of Terms.",
      blocks: [
        {
          p: 'By accessing or using FortuneMarq Media\'s ("we," "our," or "us") website and services, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our services.',
        },
        {
          p: "We reserve the right to modify these Terms at any time. Your continued use of our services after changes constitutes acceptance of the updated Terms.",
        },
      ],
    },
    {
      kicker: "02 // SERVICES DESCRIPTION",
      title: "What We Provide.",
      blocks: [
        {
          p: "FortuneMarq Media provides digital marketing, web development, SEO, CRM implementation, and related consulting services. We reserve the right to modify, suspend, or discontinue any service at any time without prior notice.",
        },
        {
          p: 'All services are provided on an "as-is" and "as-available" basis. We do not guarantee specific results, outcomes, or performance metrics.',
        },
      ],
    },
    {
      kicker: "03 // CLIENT OBLIGATIONS",
      title: "Your Responsibilities.",
      blocks: [
        { p: "As a client, you agree to:" },
        {
          list: [
            "Provide accurate, complete, and timely information necessary for service delivery",
            "Make timely payments as agreed in your service agreement",
            "Comply with all applicable laws and regulations",
            "Not use our services for any illegal, fraudulent, or harmful purposes",
            "Maintain confidentiality of any proprietary information shared during engagement",
          ],
        },
      ],
    },
    {
      kicker: "04 // PAYMENT TERMS",
      title: "Payment Obligations.",
      blocks: [
        { p: "All fees are specified in your service agreement. Fees are due as per the payment schedule agreed upon.", lead: "Fees:" },
        {
          p: "Late payments may incur interest charges and may result in suspension of services until payment is received.",
          lead: "Late Payments:",
        },
        { p: "Refund policies are outlined in individual service agreements. Generally, fees for completed work are non-refundable.", lead: "Refunds:" },
      ],
    },
    {
      kicker: "05 // INTELLECTUAL PROPERTY",
      title: "Ownership Rights.",
      blocks: [
        { p: "You retain ownership of all content, data, and materials you provide to us.", lead: "Client Content:" },
        { p: "Upon full payment, you receive ownership rights to custom work created specifically for you. We retain rights to:", lead: "Our Work:" },
        {
          list: [
            "Pre-existing tools, methodologies, and frameworks",
            "Portfolio usage rights for marketing purposes",
            "General knowledge and expertise gained during engagement",
          ],
        },
      ],
    },
    {
      kicker: "06 // MARKET EXCLUSIVITY",
      title: "Our Commitment.",
      blocks: [
        {
          p: "We commit to Market Exclusivity—we will not work with your direct competitors during our engagement and for a reasonable period after termination, as specified in your service agreement.",
        },
        {
          p: "This exclusivity applies to businesses operating in the same market segment and targeting the same customer base. We reserve the right to work with businesses in different industries or non-competing market segments.",
        },
      ],
    },
    {
      kicker: "07 // CONFIDENTIALITY",
      title: "Protecting Your Information.",
      blocks: [
        { p: "We maintain strict confidentiality regarding your business information, strategies, and data. We will not disclose confidential information to third parties except:" },
        {
          list: [
            "With your explicit written consent",
            "When required by law or legal process",
            "To our service providers under strict confidentiality agreements",
          ],
        },
      ],
    },
    {
      kicker: "08 // WARRANTIES & DISCLAIMERS",
      title: "Service Warranties.",
      blocks: [
        {
          p: "While we work diligently to achieve your goals, we do not guarantee specific results, rankings, traffic increases, or revenue outcomes. Digital marketing results depend on numerous factors beyond our control.",
          lead: "No Guarantees:",
        },
        { p: "We commit to providing services with professional competence and in accordance with industry best practices.", lead: "Best Efforts:" },
        {
          p: "We are not responsible for the performance, availability, or policies of third-party platforms (Google, Meta, etc.) used in service delivery.",
          lead: "Third-Party Services:",
        },
      ],
    },
    {
      kicker: "09 // LIMITATION OF LIABILITY",
      title: "Liability Limitations.",
      blocks: [
        {
          p: "To the maximum extent permitted by law, FortuneMarq Media's total liability for any claims arising from our services shall not exceed the total fees paid by you in the 12 months preceding the claim.",
        },
        {
          p: "We are not liable for indirect, incidental, consequential, or punitive damages, including lost profits, lost revenue, or business interruption.",
        },
      ],
    },
    {
      kicker: "10 // TERMINATION",
      title: "Ending the Agreement.",
      blocks: [
        { p: "You may terminate services with written notice as specified in your service agreement. Payment obligations for work completed remain due.", lead: "By You:" },
        { p: "We may terminate services for non-payment, breach of terms, or if continuation would violate our Market Exclusivity commitment.", lead: "By Us:" },
        { p: "Upon termination, you retain rights to deliverables for which payment has been made. Confidentiality obligations continue.", lead: "Post-Termination:" },
      ],
    },
    {
      kicker: "11 // DISPUTE RESOLUTION",
      title: "Resolving Disputes.",
      blocks: [
        { p: "We commit to resolving disputes through good faith negotiation.", lead: "Good Faith:" },
        {
          p: "These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Hubli, Karnataka.",
          lead: "Governing Law:",
        },
        { p: "Before pursuing legal action, parties agree to attempt mediation through a mutually agreed mediator.", lead: "Mediation:" },
      ],
    },
    {
      kicker: "12 // FORCE MAJEURE",
      title: "Unforeseen Circumstances.",
      blocks: [
        {
          p: "We are not liable for delays or failures in performance resulting from circumstances beyond our reasonable control, including natural disasters, pandemics, government actions, or third-party service failures.",
        },
      ],
    },
    {
      kicker: "13 // SEVERABILITY",
      title: "Valid Provisions.",
      blocks: [
        {
          p: "If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.",
        },
      ],
    },
    {
      kicker: "14 // ENTIRE AGREEMENT",
      title: "Complete Agreement.",
      blocks: [
        {
          p: "These Terms, together with your specific service agreement, constitute the entire agreement between you and FortuneMarq Media regarding the subject matter herein.",
        },
      ],
    },
    {
      kicker: "15 // CONTACT INFORMATION",
      title: "Questions? Get in Touch.",
      blocks: [
        { p: "If you have questions about these Terms of Service, please contact us:" },
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

export default function TermsOfService() {
  return <SiteLegal content={CONTENT} />;
}
