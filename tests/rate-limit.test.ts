import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimit, resetRateLimits } from "@/lib/rate-limit";

afterEach(() => {
  resetRateLimits();
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("allows requests up to the limit", () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("key", { limit: 3, windowMs: 1000 }).ok).toBe(true);
    }
    expect(rateLimit("key", { limit: 3, windowMs: 1000 }).ok).toBe(false);
  });

  it("counts each key separately", () => {
    rateLimit("a", { limit: 1, windowMs: 1000 });
    expect(rateLimit("a", { limit: 1, windowMs: 1000 }).ok).toBe(false);
    expect(rateLimit("b", { limit: 1, windowMs: 1000 }).ok).toBe(true);
  });

  it("reports what's left and when to retry", () => {
    const first = rateLimit("k", { limit: 2, windowMs: 5000 });
    expect(first.remaining).toBe(1);
    rateLimit("k", { limit: 2, windowMs: 5000 });
    const blocked = rateLimit("k", { limit: 2, windowMs: 5000 });
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(5000);
  });

  it("refills once the window passes", () => {
    vi.useFakeTimers();
    expect(rateLimit("w", { limit: 1, windowMs: 1000 }).ok).toBe(true);
    expect(rateLimit("w", { limit: 1, windowMs: 1000 }).ok).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rateLimit("w", { limit: 1, windowMs: 1000 }).ok).toBe(true);
  });
});
