/**
 * The routes behind the auth gate, in one place.
 *
 * Two consumers have to agree about this list, and when they drifted the app
 * broke in a way that looked like a broken login:
 *
 *   - `proxy.ts` redirects these routes to /signin when no session cookie is
 *     present.
 *   - Links pointing at them must not be prefetched.
 *
 * That second rule is the non-obvious one. `<Link>` prefetches by default, and
 * a prefetch is a real request that the edge gate answers — so a signed-out
 * visitor's browser asks for /studio, receives the redirect to /signin, and
 * caches *that* as the route's entry. The entry outlives signing in, because
 * only a full document load clears the client cache (see "Client Cache" in
 * node_modules/next/dist/docs/01-app/04-glossary.md). The visitor then signs
 * in, clicks Studio, and the router replays the cached redirect without ever
 * asking the server: straight back to /signin, for as long as the tab lives.
 *
 * Prefetching a gated route was never useful anyway — signed out it fetches a
 * redirect, and these pages are `force-dynamic`, so there is no static payload
 * to warm.
 */

export const GATED_ROUTES = ["/dashboard", "/studio"] as const;

/** Path only — `href` may carry a query string or hash. */
function pathOf(href: string): string {
  return href.split(/[?#]/, 1)[0] ?? href;
}

export function isGatedRoute(pathname: string): boolean {
  return GATED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * The `prefetch` prop for a link to `href`: `false` for gated routes,
 * `undefined` (Next's default) for everything else.
 *
 * Deliberately not conditional on whether the visitor is signed in. The worst
 * offenders — the home page's two CTAs and the footer link that sits on every
 * page — render in server components, which cannot read the session without
 * opting the whole marketing site into dynamic rendering.
 */
export function prefetchFor(href: string): false | undefined {
  return isGatedRoute(pathOf(href)) ? false : undefined;
}
