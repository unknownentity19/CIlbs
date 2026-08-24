import { expect, test as setup } from "@playwright/test";
import { existsSync, mkdirSync } from "node:fs";

/**
 * Signs in once and saves the session for the studio specs.
 *
 * The editor is behind the gate now, so those specs need a real account. This
 * runs as a Playwright dependency project: one sign-in, reused by every test
 * that follows, instead of a login inside each one.
 *
 * The address is fixed rather than unique per run so repeated runs reuse the
 * same account — the second run signs in instead of creating a duplicate.
 */

export const STATE_PATH = "e2e/.auth/user.json";
const EMAIL = "e2e@cilbs.com";
const PASSWORD = "e2e-test-password-not-a-secret";

setup("create a session", async ({ page }) => {
  mkdirSync("e2e/.auth", { recursive: true });

  await page.goto("/signup");
  await page.getByLabel("Full name").fill("E2E Runner");
  await page.getByLabel(/^(Work )?email$/i).fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /Create free account/i }).click();

  // Either the account is created and we land on the dashboard, or sign-up
  // declines — because the account exists from an earlier run, or because the
  // sign-up rate limit has been reached by repeated runs from this address.
  // Both end the same way: sign in with the credentials instead.
  const landed = await page
    .waitForURL(/\/dashboard/, { timeout: 15_000 })
    .then(() => true)
    .catch(() => false);

  if (!landed) {
    await page.goto("/signin");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: /^Sign in$/ }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
  }

  // Prove the session actually opens the gated editor before saving it.
  await page.goto("/studio");
  await expect(page.getByLabel("Workflow canvas")).toBeVisible({
    timeout: 20_000,
  });

  await page.context().storageState({ path: STATE_PATH });
  expect(existsSync(STATE_PATH)).toBe(true);
});
