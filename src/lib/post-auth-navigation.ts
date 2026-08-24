/**
 * Where to go after a successful sign-in or sign-up, and how to get there.
 *
 * `goAfterAuth` is a full document navigation on purpose, not `router.push`.
 *
 * Signing in changes what every server component renders, and a client-side
 * navigation can reuse cached route entries from before the session existed.
 * When the destination is a gated route whose entry was cached as "redirect to
 * /signin", `router.push` replays that redirect without asking the server —
 * so a visitor who had just signed in was sent straight back to the sign-in
 * form, and signing in again did the same thing, forever.
 *
 * Links to gated routes no longer prefetch (see src/lib/gated-routes.ts), and
 * measured on its own that change is enough to fix the loop. This is the
 * second line of defence, for a tab poisoned by a path that one doesn't cover
 * — the visitor signed in on another tab, or a link added later that slips
 * through. A document load discards the whole client cache, which is the only
 * guaranteed way to clear it: "The client cache is cleared on page refresh"
 * (node_modules/next/dist/docs/01-app/04-glossary.md). Measured on its own,
 * it also fixes the loop, so the two are independent.
 *
 * `router.refresh()` is not a substitute. It "clears the Client Cache for the
 * current route" (node_modules/next/dist/docs/01-app/03-api-reference/
 * 04-functions/use-router.md) — the sign-in page, not the destination. Tried
 * and measured: refresh-then-push still landed back on /signin, and only
 * became reliable with an arbitrary sleep in between, which is a race, not a
 * fix.
 *
 * The cost is one extra document request on a once-per-session action, and it
 * buys a first paint that already knows about the session.
 */

/** A relative destination, or "/dashboard" if the value can't be trusted. */
export function safeDestination(
  value: string | null | undefined,
  fallback = "/dashboard",
): string {
  // Must be same-origin and path-absolute: "//evil.com" is a protocol-relative
  // URL the browser would happily treat as another host, and "https://evil.com"
  // needs no explanation.
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}

export function goAfterAuth(destination: string): void {
  window.location.assign(safeDestination(destination));
}
