/**
 * Vendor-neutral error + event reporting.
 *
 * There is no SDK behind this on purpose: the app posts a small JSON payload
 * to whatever endpoint the deployment configures, so swapping in Sentry,
 * Highlight, or a homegrown collector is a URL change rather than a refactor.
 * With no endpoint configured it logs in development and does nothing in
 * production — never throwing, because reporting must not become the failure.
 *
 *   NEXT_PUBLIC_TELEMETRY_URL  browser-side reports (errors, events)
 *   TELEMETRY_URL              server-side reports (uncaught request errors)
 */

type Payload = Record<string, unknown>;

/**
 * With nothing configured, reports go to this app's own collector at
 * /api/telemetry, which records them in Postgres. Setting either variable
 * points them at an external service instead.
 */
const BUILT_IN_ENDPOINT = "/api/telemetry";
const CLIENT_ENDPOINT = process.env.NEXT_PUBLIC_TELEMETRY_URL ?? BUILT_IN_ENDPOINT;
const SERVER_ENDPOINT = process.env.TELEMETRY_URL;

const isServer = typeof window === "undefined";
const isDev = process.env.NODE_ENV === "development";

function endpoint() {
  if (!isServer) return CLIENT_ENDPOINT;
  // On the server a relative URL has nothing to resolve against, so the
  // built-in collector is skipped there: `onRequestError` already runs inside
  // the app and logs through the same shape.
  return SERVER_ENDPOINT ?? process.env.NEXT_PUBLIC_TELEMETRY_URL;
}

async function send(kind: "error" | "event", body: Payload) {
  const url = endpoint();
  if (!url) {
    if (isDev) console.warn(`[telemetry:${kind}]`, body);
    return;
  }
  const payload = JSON.stringify({
    kind,
    at: new Date().toISOString(),
    release: process.env.NEXT_PUBLIC_RELEASE ?? "dev",
    ...body,
  });

  try {
    // `sendBeacon` survives a page that is unloading, which is exactly when a
    // fatal client error tends to fire.
    if (!isServer && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
    }
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  } catch {
    // A telemetry outage must never surface to the user.
  }
}

/** Report an error with optional context (route, digest, component). */
export function reportError(error: unknown, context: Payload = {}) {
  const normalised =
    error instanceof Error
      ? { message: error.message, name: error.name, stack: error.stack }
      : { message: String(error) };
  void send("error", { ...normalised, ...context });
}

/** Report a product event. Keep the payload free of personal data. */
export function trackEvent(name: string, properties: Payload = {}) {
  void send("event", { name, properties });
}
