// Structured-data (JSON-LD) builders for the marketing site. Pure data — emitted
// server-side via <JsonLd> (components/site/json-ld.tsx). One canonical
// LocalBusiness node (referenced by @id from Service/Breadcrumb) avoids a
// duplicate Organization across pages.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";

const LOGO = `${SITE_URL}/site/images/FORTUNEMARQ-LOGO.webp`;
const BUSINESS_ID = `${SITE_URL}/#localbusiness`;

/** Name / address / phone + geo + hours + socials — single source of truth. */
export const BUSINESS = {
  name: "FortuneMarq",
  url: SITE_URL,
  email: "contact@fortunemarq.com",
  telephone: "+91-9353082656",
  street: "Galaxy Mall First Floor Shop No. 43, J.C Nagar",
  locality: "Hubli",
  region: "Karnataka",
  postalCode: "580020",
  country: "IN",
  geo: { lat: 15.3647, lng: 75.124 },
  sameAs: [
    "https://www.linkedin.com/company/fortunemarq/",
    "https://www.instagram.com/fortunemarq",
  ],
};

/** Canonical LocalBusiness node (home + contact). Carries NAP, geo, hours,
 *  sameAs — supersedes a bare Organization, so don't also emit Organization. */
export function localBusinessLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": BUSINESS_ID,
    name: BUSINESS.name,
    url: BUSINESS.url,
    logo: LOGO,
    image: LOGO,
    email: BUSINESS.email,
    telephone: BUSINESS.telephone,
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.street,
      addressLocality: BUSINESS.locality,
      addressRegion: BUSINESS.region,
      postalCode: BUSINESS.postalCode,
      addressCountry: BUSINESS.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.lat,
      longitude: BUSINESS.geo.lng,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "10:00",
        closes: "19:00",
      },
    ],
    sameAs: BUSINESS.sameAs,
  };
}

/** One Service node per offering, all provided by the LocalBusiness. */
export function servicesLd(services: { name: string; description: string }[]) {
  return services.map((s) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.name,
    description: s.description,
    serviceType: s.name,
    areaServed: { "@type": "City", name: BUSINESS.locality },
    provider: { "@type": "LocalBusiness", "@id": BUSINESS_ID, name: BUSINESS.name },
  }));
}

/** FAQPage from a list of visible Q&A pairs. */
export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

/** BreadcrumbList. Pass the trail as [{name, path}], Home first. */
export function breadcrumbLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${SITE_URL}${t.path}`,
    })),
  };
}
