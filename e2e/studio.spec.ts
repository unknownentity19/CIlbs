import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * The studio is the one page a unit test can't cover meaningfully: it's all
 * pointer input, canvas geometry, and simulated runs.
 */

test.describe("studio", () => {
  // These drive the desktop rails (palette on the left, inspector and panels on
  // the right). Below `lg` those move into a bottom sheet, which has its own
  // spec in studio-mobile.spec.ts.
  test.skip(({ isMobile }) => !!isMobile, "desktop layout only");

  test.beforeEach(async ({ page }) => {
    await page.goto("/studio");
    // Start from a known graph rather than whatever the last run left behind.
    await page.evaluate(() =>
      window.localStorage.removeItem("cilbs.studio.workflow.v1"),
    );
    await page.reload();
    await expect(page.locator('[data-hydrated="true"]')).toBeVisible();
  });

  test("loads a template and simulates a run", async ({ page }) => {
    await expect(page.getByLabel("Workflow canvas")).toBeVisible();
    await expect(page.getByLabel("Workflow name")).toHaveValue(/Lead router/i);

    await page.getByRole("button", { name: /^Run$/ }).click();
    // The log reports how many steps ran once the simulation finishes.
    await expect(page.getByText(/\d+ ran/)).toBeVisible({ timeout: 20_000 });
  });

  test("adding a node is undoable", async ({ page }) => {
    const counts = page.getByText(/nodes ·/);
    const before = await counts.textContent();

    await page.getByTitle("Click to add, or drag onto the canvas").first().click();
    await expect(counts).not.toHaveText(before ?? "");

    await page.getByLabel("Undo (⌘Z)").click();
    await expect(counts).toHaveText(before ?? "");
  });

  test("flags a graph problem in the issues panel", async ({ page }) => {
    // An action node with nothing wired into it can never run. (A *trigger*
    // with no inbound edge is fine, which is why this picks HTTP Request.)
    await page.getByRole("button", { name: /HTTP Request/ }).first().click();
    await page.getByRole("button", { name: /Issues/ }).click();
    await expect(page.getByText(/never runs/i)).toBeVisible();
  });

  test("has no serious accessibility violations", async ({ page }) => {
    // Moved here from the public sweep when the editor went behind the gate.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
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

  test("keyboard shortcuts dialog opens", async ({ page }) => {
    await page.getByLabel("Keyboard shortcuts (?)").click();
    await expect(page.getByRole("dialog")).toContainText("Keyboard shortcuts");
  });
});
