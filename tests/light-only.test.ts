import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/**
 * The site is light only: no toggle, no dark palette, no stored preference.
 *
 * The failure mode this guards is quiet. Tailwind ships a built-in `dark:`
 * variant driven by `prefers-color-scheme`, and this project no longer
 * redefines it to a class. So one `dark:` utility added back — copied in with
 * a component, most likely — would take effect for every visitor whose system
 * is set to dark, and for nobody else. Whoever added it would not see it.
 *
 * The e2e suite checks the rendered page stays light; this checks the source,
 * which is where a single stray utility hides.
 */

const grep = (pattern: string, ...paths: string[]) => {
  try {
    return execFileSync("grep", ["-rn", pattern, ...paths], {
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return []; // grep exits 1 when there are no matches
  }
};

describe("light only", () => {
  it("has no dark: utilities in the source", () => {
    expect(
      grep("dark:", "src", "--include=*.tsx", "--include=*.ts", "--include=*.css"),
    ).toEqual([]);
  });

  it("has no dark palette or class-based dark variant in the stylesheet", () => {
    expect(grep("^\\.dark", "src/app/globals.css")).toEqual([]);
    expect(grep("custom-variant dark", "src/app/globals.css")).toEqual([]);
  });

  it("pins color-scheme so the browser keeps its own chrome light", () => {
    expect(grep("color-scheme: light", "src/app/globals.css")).not.toEqual([]);
  });

  it("keeps no theme switching machinery", () => {
    expect(
      grep("useTheme\\|toggleTheme\\|ThemeProvider", "src", "--include=*.tsx"),
    ).toEqual([]);
  });
});
