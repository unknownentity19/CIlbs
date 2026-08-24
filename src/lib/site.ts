/**
 * Single source of truth for site-wide config used in metadata,
 * OG images, sitemap, and robots.
 *
 * Override `NEXT_PUBLIC_SITE_URL` at deploy time (e.g. on Vercel) so
 * absolute URLs resolve correctly. Defaults to a sensible value for
 * local development.
 */

/**
 * An environment variable's value, or undefined when it is missing *or empty*.
 *
 * The distinction matters: `??` only falls through on null and undefined, so a
 * variable created in a dashboard but left blank arrives as `""` and sails
 * past the fallback. That took a production build down with
 * `new URL("")` — an empty variable is a normal state and has to behave like
 * an absent one.
 */
function value(raw: string | undefined) {
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

/** First candidate that parses as a URL. Never returns something `new URL()`
 * will throw on, whatever the environment contains. */
function firstValidUrl(...candidates: (string | undefined)[]) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return new URL(candidate).origin;
    } catch {
      // Malformed too — a typo'd variable shouldn't break the build either.
    }
  }
  return "http://localhost:3000";
}

const vercelUrl = value(process.env.VERCEL_URL);

export const SITE = {
  name: "Cilbs",
  shortDescription: "Build AI workflows visually.",
  description:
    "Cilbs is a visual builder for AI workflows. Design, run, and debug automations, agents, and integrations from a single canvas.",
  url: firstValidUrl(
    value(process.env.NEXT_PUBLIC_SITE_URL),
    vercelUrl && `https://${vercelUrl}`,
  ),
  twitter: "@cilbslabs",
  themeColor: "#ffffff",
  ogImage: "/opengraph-image",
} as const;

export { firstValidUrl, value as envValue };
