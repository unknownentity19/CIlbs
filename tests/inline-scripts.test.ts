import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  GFX_LITE_SCRIPT,
  INLINE_SCRIPT_HASHES,
  THEME_SCRIPT,
} from "@/lib/inline-scripts";

/**
 * A stale hash is invisible in development (where the strict policy adds
 * 'unsafe-eval' and the pages under it are easy to skip) but blocks the
 * snippet in production — which is how the theme flash and the touch-hardware
 * guard silently stopped working on /dashboard and /studio. This pins them.
 */
const csp = (source: string) =>
  `'sha256-${createHash("sha256").update(source, "utf8").digest("base64")}'`;

describe("inline script hashes", () => {
  it("matches the CSP source for each snippet", () => {
    expect(INLINE_SCRIPT_HASHES).toEqual([
      csp(GFX_LITE_SCRIPT),
      csp(THEME_SCRIPT),
    ]);
  });

  it("keeps the snippets free of characters that break an inline script", () => {
    for (const source of [GFX_LITE_SCRIPT, THEME_SCRIPT]) {
      expect(source).not.toContain("</script");
      expect(source).not.toContain("\n");
    }
  });
});
