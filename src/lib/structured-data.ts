import { SITE } from "@/lib/site";

/**
 * JSON-LD builders.
 *
 * Structured data is how a search engine or an assistant learns that this is a
 * software product rather than a blog: it drives the sitelinks, the pricing
 * rich result, and the FAQ accordion. Rendered as a `<script type=
 * "application/ld+json">` by the pages that own each entity.
 */

/** Escapes the one character that could break out of a script tag. */
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/logo-512.png`,
    description: SITE.description,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "security",
        email: "security@cilbs.com",
        url: `${SITE.url}/security`,
      },
      {
        "@type": "ContactPoint",
        contactType: "privacy",
        email: "privacy@cilbs.com",
        url: `${SITE.url}/privacy`,
      },
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    publisher: { "@id": `${SITE.url}/#organization` },
  };
}

export function softwareSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    url: SITE.url,
    description: SITE.description,
    featureList: [
      "Visual workflow canvas",
      "AI agents as workflow steps",
      "Branching and conditional logic",
      "Simulated runs with step-level output",
    ],
  };
}

/** FAQPage for the pricing questions already on the page. */
export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
