import { describe, expect, it } from "vitest";
import { envValue, firstValidUrl } from "@/lib/site";

/**
 * A production build died on `new URL("")` because `??` only falls through on
 * a *missing* variable, and a dashboard field that exists but was left blank
 * arrives as an empty string. These lock that behaviour down.
 */

describe("envValue", () => {
  it("treats missing, empty, and whitespace as absent", () => {
    expect(envValue(undefined)).toBeUndefined();
    expect(envValue("")).toBeUndefined();
    expect(envValue("   ")).toBeUndefined();
  });

  it("keeps a real value, trimmed", () => {
    expect(envValue(" https://cilbs.com ")).toBe("https://cilbs.com");
  });
});

describe("firstValidUrl", () => {
  it("uses the first candidate that parses", () => {
    expect(firstValidUrl("https://cilbs.com")).toBe("https://cilbs.com");
  });

  it("skips blanks and falls through to the next candidate", () => {
    expect(firstValidUrl("", "https://preview.example.com")).toBe(
      "https://preview.example.com",
    );
  });

  it("skips a malformed value rather than throwing", () => {
    // A typo'd variable shouldn't take a deployment down either.
    expect(firstValidUrl("cilbs.com", "https://cilbs.com")).toBe(
      "https://cilbs.com",
    );
  });

  it("falls back to localhost when nothing usable is set", () => {
    expect(firstValidUrl(undefined, "", "  ")).toBe("http://localhost:3000");
  });

  it("never returns something new URL() rejects", () => {
    for (const input of ["", "   ", "not a url", "://broken", undefined]) {
      expect(() => new URL(firstValidUrl(input))).not.toThrow();
    }
  });
});
