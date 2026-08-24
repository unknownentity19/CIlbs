import type { NextRequest } from "next/server";
import { getSession } from "@/auth";
import { hasAuth } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { persistWorkflow, workflowSchema } from "@/app/studio/workflow-store";

/**
 * Save endpoint used when the tab is closing.
 *
 * A `"use server"` action cannot be invoked from `navigator.sendBeacon` or a
 * `keepalive` fetch — those need a real URL — and those are the only two calls
 * a browser will still deliver after the page goes away. So the unload path
 * posts here instead, with the same validation and the same write as the
 * action, and the session comes from the request's own cookies.
 */

export async function POST(request: NextRequest) {
  if (!hasAuth()) return new Response(null, { status: 503 });

  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return new Response(null, { status: 401 });

  const limited = rateLimit(`workflow-save:${userId}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!limited.ok) return new Response(null, { status: 429 });

  let body: unknown;
  try {
    // sendBeacon sends a Blob, so the content-type may not be JSON; parse the
    // text ourselves rather than trusting request.json()'s content sniffing.
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }

  const parsed = workflowSchema.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 422 });

  try {
    const savedAt = await persistWorkflow(userId, parsed.data);
    return Response.json({ ok: true, savedAt: savedAt.getTime() });
  } catch (error) {
    console.error("beacon save failed", error);
    return new Response(null, { status: 500 });
  }
}
