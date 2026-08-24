import "server-only";

/**
 * Best-effort in-process rate limiting.
 *
 * Honest about what it is: the counters live in the instance's memory, so a
 * serverless deployment enforces the limit per warm instance rather than
 * globally, and a cold start resets it. That is still worth having — it turns
 * an unbounded loop into a slow one, and combined with bcrypt's cost it makes
 * credential stuffing impractical. Swap in a Redis or Postgres counter if this
 * ever needs to be exact.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Drop expired buckets occasionally so the map can't grow without bound. */
function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
};

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  existing.count += 1;
  const ok = existing.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - existing.count),
    retryAfterMs: ok ? 0 : existing.resetAt - now,
  };
}

/** Test seam: clears every bucket. */
export function resetRateLimits() {
  buckets.clear();
}
