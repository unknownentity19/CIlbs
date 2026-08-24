import { expect, test } from "@playwright/test";

/**
 * The account flow, end to end, against a real Postgres.
 *
 * Skipped unless E2E_WITH_DB=1, because it needs a configured database and
 * session secret — the default suite deliberately runs with neither, to prove
 * the site still works unconfigured. Bring one up with:
 *
 *   node scripts/dev-postgres.mjs start
 *   DATABASE_URL=... npm run db:migrate
 *   DATABASE_URL=... AUTH_SECRET=... npm run start -- --port 3100
 *   E2E_WITH_DB=1 E2E_BASE_URL=http://127.0.0.1:3100 npx playwright test e2e/auth-db.spec.ts
 */

test.describe("accounts", () => {
  // Order matters here: the account created by the first test is what the
  // other two sign in as and try to re-register.
  test.describe.configure({ mode: "serial" });

  test.skip(process.env.E2E_WITH_DB !== "1", "needs a configured database");
  test.skip(({ isMobile }) => !!isMobile, "desktop layout only");

  // A fresh address per run keeps repeat runs independent.
  const stamp = Date.now();
  const email = `ada+${stamp}@cilbs.com`;
  const password = "correct horse battery staple";

  test("sign up, sign out, sign back in", async ({ page }) => {
    await page.goto("/signup");

    await page.getByLabel("Full name").fill("Ada Lovelace");
    await page.getByLabel(/^(Work )?email$/i).fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /Create free account/i }).click();

    // Sign-up is rate limited per IP. CI gets a fresh server every run and
    // never trips it; running this suite repeatedly against one long-lived
    // local server does. That's the protection working, not a failure.
    const rateLimited = await page
      .getByText(/too many sign-up attempts/i)
      .isVisible()
      .catch(() => false);
    test.skip(
      rateLimited,
      "sign-up rate limit reached — restart the server to clear it",
    );

    // Creating an account signs you straight in.
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page.getByText(/Ada/).first()).toBeVisible();

    // The studio should now report the account as the sink.
    await page.goto("/studio");
    await expect(page.getByText(/Saved to your account|Saving/)).toBeVisible({
      timeout: 20_000,
    });

    // Sign out through the account menu.
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /Account menu/i }).click();
    // Scoped to the menu: the dashboard body has its own sign-out button.
    await page
      .getByRole("menu")
      .getByRole("button", { name: /Sign out/i })
      .click();
    await expect(page).toHaveURL(/\/$|\/\?/, { timeout: 20_000 });

    // The dashboard is now off limits again.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/signin/);

    // And the same credentials get back in.
    await page.getByLabel(/^(Work )?email$/i).fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /^Sign in$/ }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  });

  test("the wrong password is refused", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel(/^(Work )?email$/i).fill(email);
    await page.getByLabel("Password").fill("not the password");
    await page.getByRole("button", { name: /^Sign in$/ }).click();
    await expect(page.getByText(/don't match an account/i)).toBeVisible();
    await expect(page).toHaveURL(/\/signin/);
  });

  test("an address can't be registered twice", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("Ada Again");
    await page.getByLabel(/^(Work )?email$/i).fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /Create free account/i }).click();
    const limited = await page
      .getByText(/too many sign-up attempts/i)
      .isVisible()
      .catch(() => false);
    test.skip(limited, "sign-up rate limit reached — restart the server to clear it");
    await expect(page.getByText(/already exists/i)).toBeVisible();
  });
});
