import { after } from "next/server";
import type { NextRequest } from "next/server";
import { desc, lt } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { eventLog } from "@/db/schema";
import { hasDatabase } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Collector for the reports that src/lib/telemetry.ts sends.
 *
 * This exists so error visibility costs nothing: reports land in Postgres,
 * which outlives a serverless log line and is queryable with the tooling
 * already in the repo. Point `NEXT_PUBLIC_TELEMETRY_URL` at a vendor instead
 * whenever that becomes worth it.
 */

/** Newest rows to keep. A free database is small; this bounds the table. */
const KEEP = 500;

const payloadSchema = z.object({
  kind: z.enum(["error", "event"]).default("error"),
  message: z.string().max(2000).optional(),
  name: z.string().max(200).optional(),
  stack: z.string().max(8000).optional(),
  release: z.string().max(120).optional(),
  at: z.string().max(40).optional(),
  digest: z.string().max(120).optional(),
  boundary: z.string().max(60).optional(),
  path: z.string().max(500).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  // Reports are unauthenticated by necessity — a crash can happen before a
  // session exists — so the endpoint is capped per client instead.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = rateLimit(`telemetry:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!limited.ok) {
    return new Response(null, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)) },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 400 });
  const report = parsed.data;

  const line = {
    kind: report.kind,
    message: report.message ?? report.name ?? "(no message)",
    release: report.release ?? null,
    context: {
      name: report.name,
      stack: report.stack,
      digest: report.digest,
      boundary: report.boundary,
      path: report.path,
      properties: report.properties,
      ip,
      userAgent: request.headers.get("user-agent")?.slice(0, 300),
    },
  };

  if (!hasDatabase()) {
    // No database yet: the platform's log stream is the fallback sink.
    console.error("[telemetry]", JSON.stringify(line));
    return new Response(null, { status: 202 });
  }

  // Answer immediately; write after the response so a slow database never
  // becomes the visitor's problem.
  after(async () => {
    try {
      const db = getDb();
      await db.insert(eventLog).values(line);
      // Trim occasionally rather than on every insert.
      if (Math.random() < 0.05) {
        const [cutoff] = await db
          .select({ createdAt: eventLog.createdAt })
          .from(eventLog)
          .orderBy(desc(eventLog.createdAt))
          .offset(KEEP)
          .limit(1);
        if (cutoff) {
          await db.delete(eventLog).where(lt(eventLog.createdAt, cutoff.createdAt));
        }
      }
    } catch (error) {
      console.error("[telemetry] could not record report", error);
    }
  });

  return new Response(null, { status: 202 });
}
