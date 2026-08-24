import type { NextConfig } from "next";

/**
 * Baseline Content-Security-Policy for the statically prerendered pages.
 *
 * The strictest form of CSP uses a per-request nonce, but Next can only attach
 * one when a page renders dynamically — applying it everywhere would turn this
 * whole static site into server-rendered-on-demand for no benefit on pages
 * that take no input. So the marketing pages get this policy, which still
 * closes clickjacking (`frame-ancestors`), base-tag injection, plugin
 * embedding, and form exfiltration, and `src/proxy.ts` swaps in a strict
 * nonce-based policy for the authenticated routes, which are dynamic anyway.
 *
 * `'unsafe-inline'` is here because the App Router inlines its own bootstrap
 * and flight-payload scripts on every page; it is the cost of staying static.
 */
const isDev = process.env.NODE_ENV === "development";

const BASELINE_CSP = [
  "default-src 'self'",
  // `unsafe-eval` in development only: React uses eval there to rebuild
  // callstacks across environments, and without it the dev overlay reports an
  // error on every page. React never uses eval in a production build.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // Dev also needs the HMR socket; production stays same-origin only.
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  // Strip console.* (except warn/error) from production bundles to trim JS.
  compiler: {
    removeConsole: { exclude: ["error", "warn"] },
  },

  // Tree-shake icon/animation barrels so only the symbols actually used end
  // up in each route's bundle. `lucide-react` is optimized by Next by
  // default; `framer-motion` and `cmdk` are added here because the studio
  // and a few interior pages still pull them in.
  experimental: {
    optimizePackageImports: ["framer-motion", "cmdk"],
  },

  // Cilbs ships only its own assets — keep image config closed by default.
  images: {
    remotePatterns: [],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: BASELINE_CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
