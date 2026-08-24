import { expect, test } from "@playwright/test";

/**
 * The mobile studio is a different interface, not a narrower one: the palette,
 * inspector, and run log live in a bottom sheet behind a tab bar. This covers
 * that path, since it's the one that historically broke on real hardware.
 */

test.describe("studio on a phone", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile layout only");

  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => void dialog.accept());

    await page.goto("/studio");
    await page.evaluate(() =>
      window.localStorage.removeItem("cilbs.studio.workflow.v1"),
    );
    await page.reload();
    await expect(page.locator('[data-hydrated="true"]')).toBeVisible();

    // Same reason as the desktop spec: the account's saved workflow persists
    // between runs, so start from a template. On a phone the templates live
    // in the bottom sheet.
    await page.getByRole("button", { name: /^Add$/ }).click();
    await page
      .getByTestId("studio-sheet")
      .getByRole("button", { name: "Lead router" })
      .click();
    await expect(page.getByText(/Saved (in this browser|to your account)/)).toBeVisible({
      timeout: 20_000,
    });
  });

  // The desktop rails stay mounted (hidden by CSS) at this width, so every
  // assertion is scoped to the sheet to avoid matching their copies.
  const sheetOf = (page: import("@playwright/test").Page) =>
    page.getByTestId("studio-sheet");

  test("adds a node through the bottom sheet", async ({ page }) => {
    await expect(page.getByLabel("Workflow canvas")).toBeVisible();

    await page.getByRole("button", { name: /^Add$/ }).click();
    const sheet = sheetOf(page);
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Add a node")).toBeVisible();

    await sheet.getByRole("button", { name: /HTTP Request/ }).click();
    // Choosing a node closes the sheet and selects the new node.
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("button", { name: /^Edit$/ })).toBeVisible();
  });

  test("shows the run log in the sheet after a run", async ({ page }) => {
    await page.getByRole("button", { name: /^Run$/ }).click();
    // Running on a phone opens the sheet on the run tab by itself.
    const sheet = sheetOf(page);
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText(/\d+ ran/)).toBeVisible({ timeout: 20_000 });
  });

  test("surfaces issues in the sheet", async ({ page }) => {
    await page.getByRole("button", { name: /^Add$/ }).click();
    await sheetOf(page).getByRole("button", { name: /HTTP Request/ }).click();

    await page.getByRole("button", { name: /Run log/ }).click();
    const sheet = sheetOf(page);
    await sheet.getByRole("button", { name: /Issues/ }).click();
    await expect(sheet.getByText(/never runs/i)).toBeVisible();
  });
});
