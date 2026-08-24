import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { INLINE_SCRIPT_HASHES } from "@/lib/inline-scripts";

/**
 * Edge gate for authenticated routes. (Next 16 renamed `middleware` to
 * `proxy`.)
 *
 * This only checks that a session cookie is *present* — it deliberately does
 * not verify it, because doing so would mean pulling the database and bcrypt
 * into the edge runtime. Verification happens where it counts: the dashboard
 * page and every server action call `getSession()` / `requireUser()`. So this
 * is a cheap redirect for the common case, not the security boundary.
 */

const PROTECTED = ["/dashboard", "/studio"];

/** Auth.js v5 cookie names; the `__Secure-` prefix is used over HTTPS. */
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

/**
 * Strict CSP for the authenticated routes. These already render per-request,
 * so they can carry a fresh nonce — which lets the policy drop
 * `'unsafe-inline'` entirely. Next reads the nonce off the request header and
 * stamps it onto its own scripts.
 */
function strictCsp(nonce: string) {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    // React uses eval in development to rebuild server stacks in the browser.
    // The layout's two inline snippets are allowed by hash. A nonce can't
    // reach them: the root layout is shared with the static marketing pages,
    // and reading the per-request nonce there would make the whole site
    // render dynamically. 'strict-dynamic' ignores host sources like 'self'
    // for scripts but leaves hashes in force, so both mechanisms coexist.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${INLINE_SCRIPT_HASHES.join(" ")}${isDev ? " 'unsafe-eval'" : ""}`,
    // Deliberately no nonce here. A nonce (or hash) makes CSP *ignore* the
    // 'unsafe-inline' beside it, which blocked every server-rendered
    // `style="..."` attribute — including the ones that position nodes on the
    // studio canvas, so the first paint of a saved workflow came out
    // unstyled. Inline styles are a far smaller risk than inline scripts,
    // and React plus Tailwind emit too many to enumerate.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // No `upgrade-insecure-requests`: every resource here is same-origin and
    // relative, so there is no mixed content for it to fix, and HSTS already
    // forces HTTPS on the real domain. Meanwhile Safari applies it to
    // plain-HTTP origins too — rewriting every asset request to https://,
    // where it fails on TLS. That leaves no JavaScript loaded and the whole
    // app dead in Safari against any local build. Chromium ignores it for
    // localhost, so the breakage is invisible unless you test in Safari.
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (!hasSession) {
    const signin = new URL("/signin", request.url);
    signin.searchParams.set("next", pathname);
    return NextResponse.redirect(signin);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = strictCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/studio/:path*"],
};
