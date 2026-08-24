import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { hasAuth } from "@/lib/env";

/**
 * Auth.js endpoints: /api/auth/session, /csrf, /signin, /callback, /signout.
 *
 * Guarded because `SessionProvider` polls `/api/auth/session` on every page
 * load: with no `AUTH_SECRET` configured, Auth.js answers that with a 500, so
 * an unconfigured deployment would log an error for every visitor. Reporting
 * "no session" is the honest answer instead — the site works signed out.
 */

export async function GET(request: NextRequest) {
  if (!hasAuth()) return Response.json(null, { status: 200 });
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  if (!hasAuth()) {
    return Response.json(
      { error: "Authentication is not configured on this deployment." },
      { status: 503 },
    );
  }
  return handlers.POST(request);
}
