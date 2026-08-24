/**
 * Single source of truth for site-wide config used in metadata,
 * OG images, sitemap, and robots.
 *
 * Override `NEXT_PUBLIC_SITE_URL` at deploy time (e.g. on Vercel) so
 * absolute URLs resolve correctly. Defaults to a sensible value for
 * local development.
 */

export const SITE = {
  name: "Cilbs",
  shortDescription: "Build AI workflows visually.",
  description:
    "Cilbs is a visual builder for AI workflows. Design, run, and debug automations, agents, and integrations from a single canvas.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"),
  twitter: "@cilbslabs",
  themeColor: "#ffffff",
  themeColorDark: "#09090b",
  ogImage: "/opengraph-image",
} as const;
