import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GATED_ROUTES, isGatedRoute, prefetchFor } from "@/lib/gated-routes";

describe("gated routes", () => {
  it("matches a gated route and its descendants, not lookalikes", () => {
    expect(isGatedRoute("/studio")).toBe(true);
    expect(isGatedRoute("/studio/abc")).toBe(true);
    expect(isGatedRoute("/dashboard")).toBe(true);
    expect(isGatedRoute("/")).toBe(false);
    expect(isGatedRoute("/pricing")).toBe(false);
    // A public route that merely starts with the same characters must not be
    // gated, which is why the check is `=== route || startsWith(route + "/")`.
    expect(isGatedRoute("/studio-tour")).toBe(false);
    expect(isGatedRoute("/dashboards")).toBe(false);
  });

  it("disables prefetch for gated links, including with a query or hash", () => {
    expect(prefetchFor("/studio")).toBe(false);
    expect(prefetchFor("/studio?template=lead-router")).toBe(false);
    expect(prefetchFor("/dashboard#runs")).toBe(false);
  });

  it("leaves public links on Next's default", () => {
    expect(prefetchFor("/")).toBeUndefined();
    expect(prefetchFor("/features#workflow-builder")).toBeUndefined();
  });

  /**
   * The proxy matcher can't be computed from GATED_ROUTES — Next requires a
   * literal and fails the build otherwise. So a route added to the list but
   * not to the matcher would silently lose its edge gate. This is the guard.
   */
  it("keeps the proxy matcher in step with the list", () => {
    const source = readFileSync("src/proxy.ts", "utf8");
    const block = source.match(/matcher:\s*\[([^\]]*)\]/);
    expect(block, "no matcher array found in src/proxy.ts").not.toBeNull();
    const matcher = [...block![1]!.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(matcher.sort()).toEqual(
      GATED_ROUTES.map((route) => `${route}/:path*`).sort(),
    );
  });
});
