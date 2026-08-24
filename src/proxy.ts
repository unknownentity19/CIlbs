import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
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
