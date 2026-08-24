import { describe, expect, it } from "vitest";
import { safeDestination } from "@/lib/post-auth-navigation";

describe("safeDestination", () => {
  it("keeps a relative path", () => {
    expect(safeDestination("/studio")).toBe("/studio");
    expect(safeDestination("/studio?template=lead-router")).toBe(
      "/studio?template=lead-router",
    );
  });

  it("refuses anything that could leave the origin", () => {
    // `//evil.com` is protocol-relative: the browser reads it as another host.
    expect(safeDestination("//evil.com")).toBe("/dashboard");
    expect(safeDestination("https://evil.com")).toBe("/dashboard");
    expect(safeDestination("javascript:alert(1)")).toBe("/dashboard");
    expect(safeDestination("evil.com")).toBe("/dashboard");
  });

  it("falls back when there is nothing to go on", () => {
    expect(safeDestination(null)).toBe("/dashboard");
    expect(safeDestination("")).toBe("/dashboard");
    expect(safeDestination(undefined, "/studio")).toBe("/studio");
  });
});
