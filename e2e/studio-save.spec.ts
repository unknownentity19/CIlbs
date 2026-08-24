import { expect, test } from "@playwright/test";

/**
 * Losing work is the worst thing an editor can do, so these cover the exits:
 * saving explicitly, being warned before an in-app navigation, and being
 * warned before the tab itself goes away.
 */

/** "Saved in this browser" without an account, "Saved to your account" with
 * one. These tests care that it saved, not where. */
const SAVED = /Saved (in this browser|to your account)/;

test.describe("studio saving", () => {
  test.skip(({ isMobile }) => !!isMobile, "desktop rails only");

  test.beforeEach(async ({ page }) => {
    await page.goto("/studio");
    await page.evaluate(() =>
      window.localStorage.removeItem("cilbs.studio.workflow.v1"),
    );
    await page.reload();
    await expect(page.getByLabel("Workflow canvas")).toBeVisible();
    // Wait for the real workflow to land; before this the canvas is the empty
    // seed, and any baseline read from it is wrong.
    await expect(page.locator('[data-hydrated="true"]')).toBeVisible();
  });

  test("an edit marks the draft unsaved, and saving clears it", async ({
    page,
  }) => {
    // Autosave settles the freshly loaded template first.
    await expect(page.getByText(SAVED)).toBeVisible();

    await page.getByRole("button", { name: /HTTP Request/ }).first().click();
    await expect(page.getByText("Unsaved changes")).toBeVisible();

    await page.getByRole("button", { name: "Save workflow" }).click();
    await expect(page.getByText(SAVED)).toBeVisible();
  });

  test("⌘S saves instead of exporting a file", async ({ page }) => {
    await page.getByRole("button", { name: /HTTP Request/ }).first().click();
    await expect(page.getByText("Unsaved changes")).toBeVisible();

    let downloadStarted = false;
    page.on("download", () => {
      downloadStarted = true;
    });

    await page.keyboard.press("ControlOrMeta+s");
    await expect(page.getByText(SAVED)).toBeVisible();
    expect(downloadStarted).toBe(false);
  });

  test("leaving the page with unsaved work asks first", async ({ page }) => {
    await page.getByRole("button", { name: /HTTP Request/ }).first().click();
    await expect(page.getByText("Unsaved changes")).toBeVisible();

    // Dismissing the confirm keeps the visitor where they are.
    page.once("dialog", (dialog) => {
      expect(dialog.type()).toBe("confirm");
      expect(dialog.message()).toMatch(/unsaved/i);
      void dialog.dismiss();
    });
    await page.getByRole("link", { name: "Home" }).first().click();
    await expect(page).toHaveURL(/\/studio/);
    await expect(page.getByLabel("Workflow canvas")).toBeVisible();

    // Accepting it lets the navigation through.
    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("link", { name: "Home" }).first().click();
    await expect(page).toHaveURL(/\/$|\/\?/);
  });

  test("a saved draft navigates away without a prompt", async ({ page }) => {
    await page.getByRole("button", { name: /HTTP Request/ }).first().click();
    await page.getByRole("button", { name: "Save workflow" }).click();
    await expect(page.getByText(SAVED)).toBeVisible();

    let asked = false;
    page.on("dialog", (dialog) => {
      asked = true;
      void dialog.accept();
    });
    await page.getByRole("link", { name: "Home" }).first().click();
    await expect(page).toHaveURL(/\/$|\/\?/);
    expect(asked).toBe(false);
  });

  test("closing the tab with unsaved work triggers the browser warning", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /HTTP Request/ }).first().click();
    await expect(page.getByText("Unsaved changes")).toBeVisible();

    // Browsers only honour beforeunload after a real interaction, which the
    // clicks above provide. Playwright surfaces it as a dialog on close.
    let warned = false;
    page.on("dialog", (dialog) => {
      if (dialog.type() === "beforeunload") warned = true;
      void dialog.accept();
    });
    await page.close({ runBeforeUnload: true });
    // Give the dialog a beat to arrive before asserting.
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(warned).toBe(true);
  });

  test("a saved draft closes without the browser warning", async ({ page }) => {
    await page.getByRole("button", { name: /HTTP Request/ }).first().click();
    await page.getByRole("button", { name: "Save workflow" }).click();
    await expect(page.getByText(SAVED)).toBeVisible();

    let warned = false;
    page.on("dialog", (dialog) => {
      if (dialog.type() === "beforeunload") warned = true;
      void dialog.accept();
    });
    await page.close({ runBeforeUnload: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    // No listener is attached while the draft is clean, which also keeps the
    // page eligible for the back/forward cache.
    expect(warned).toBe(false);
  });

  test("the draft survives a reload", async ({ page }) => {
    await page.getByRole("button", { name: /HTTP Request/ }).first().click();
    await page.getByRole("button", { name: "Save workflow" }).click();
    await expect(page.getByText(SAVED)).toBeVisible();

    const before = await page.getByText(/nodes ·/).textContent();
    await page.reload();
    await expect(page.getByText(/nodes ·/)).toHaveText(before ?? "");
  });
});
