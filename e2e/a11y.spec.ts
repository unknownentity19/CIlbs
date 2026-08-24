import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Automated accessibility checks.
 *
 * Axe catches the mechanical failures — contrast, missing labels, broken
 * landmark structure, non-unique ids — which is most of what regresses when
 * markup changes. It can't judge whether the page makes sense to navigate, so
 * this is a floor, not a guarantee.
 */

// No /studio here — it's behind the gate, so an unauthenticated run would
// only ever measure the sign-in page. The editor's own axe check lives in
// studio.spec.ts, which runs with a session.
const PAGES = ["/", "/product", "/pricing", "/docs", "/privacy", "/security"];

for (const path of PAGES) {
  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    // Scroll reveals animate opacity, and axe samples computed colour: mid-fade
    // it reads every muted colour as far lighter than it ships. Reduced motion
    // is honoured by the CSS (reveals render fully visible), so this measures
    // the real palette instead of a frame of the transition.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    // The studio's canvas needs a beat to mount before the tree is stable.
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(
      blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`),
    ).toEqual([]);
  });
}

/**
 * The site is light only. There is no theme toggle and no dark palette, so the
 * risk isn't a bad dark theme — it's a visitor whose system asks for dark
 * getting one anyway. This checks what such a visitor actually sees;
 * `tests/light-only.test.ts` checks the source that would cause it.
 */
test.describe("with a system that prefers dark", () => {
  test.use({ colorScheme: "dark" });

  for (const path of ["/", "/pricing", "/signin"]) {
    test(`${path} still renders light`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const paint = await page.evaluate(() => {
        const html = document.documentElement;
        return {
          background: getComputedStyle(document.body).backgroundColor,
          foreground: getComputedStyle(document.body).color,
          colorScheme: getComputedStyle(html).colorScheme,
          darkClass: html.classList.contains("dark"),
        };
      });

      expect(paint.background).toBe("rgb(255, 255, 255)");
      // Near-black on white, not the inverse.
      expect(paint.foreground).toBe("rgb(9, 9, 11)");
      // Pinned so form controls and scrollbars stay light too.
      expect(paint.colorScheme).toBe("light");
      expect(paint.darkClass).toBe(false);
    });
  }

  test("passes the same accessibility bar under a dark system", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(
      blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`),
    ).toEqual([]);
  });
});
