import { expect, test } from "@playwright/test";

/** Pages that must render for anyone, signed in or not. */
const PUBLIC_PAGES = [
  { path: "/", heading: /Build AI workflows/i },
  { path: "/product", heading: /One canvas/i },
  { path: "/features", heading: /./ },
  { path: "/pricing", heading: /./ },
  { path: "/docs", heading: /Build with Cilbs/i },
  { path: "/about", heading: /bootstrapped/i },
  { path: "/privacy", heading: /Privacy Policy/i },
  { path: "/terms", heading: /Terms of Service/i },
  { path: "/security", heading: /Security at Cilbs/i },
];

test.describe("public pages", () => {
  for (const { path, heading } of PUBLIC_PAGES) {
    test(`${path} renders and is titled`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      const response = await page.goto(path);
      expect(response?.status(), `${path} should return 200`).toBe(200);
      await expect(page.locator("h1").first()).toContainText(heading);
      await expect(page).toHaveTitle(/Cilbs/);

      // A CSP violation or a hydration failure shows up here.
      expect(errors.join("\n")).not.toMatch(
        /Content Security Policy|Hydration|Minified React error/i,
      );
    });
  }

  test("security headers are present", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("sitemap lists the public pages and not the gated ones", async ({
    request,
  }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    for (const path of ["/privacy", "/terms", "/security", "/pricing"]) {
      expect(xml).toContain(path);
    }
    // Behind sign-in, so it has no business in a sitemap.
    for (const path of ["/studio", "/dashboard"]) {
      expect(xml).not.toContain(path);
    }
  });
});

for (const gated of ["/dashboard", "/studio"]) {
  test(`the auth gate keeps signed-out visitors out of ${gated}`, async ({
    page,
  }) => {
    await page.goto(gated);
    await expect(page).toHaveURL(
      new RegExp(`/signin\\?next=(%2F|/)${gated.slice(1)}`),
    );
    await expect(page.locator("h1")).toContainText(/Welcome back/i);
  });
}

test("robots keeps crawlers out of the gated pages", async ({ request }) => {
  const txt = await (await request.get("/robots.txt")).text();
  expect(txt).toContain("Disallow: /studio");
  expect(txt).toContain("Disallow: /dashboard");
});

test.describe("sign-in", () => {
  test("offers only the sign-in methods that are configured", async ({
    page,
  }) => {
    test.skip(
      process.env.E2E_WITH_DB === "1",
      "asserts the unconfigured state; a database makes the email form legitimate",
    );
    await page.goto("/signin");

    // Nothing is configured in CI, so neither method should be offered: the
    // OAuth buttons would hit an Auth.js 500, and the email form has nowhere
    // to look the account up. The page says so instead of pretending.
    await expect(
      page.getByRole("button", { name: /Continue with/ }),
    ).toHaveCount(0);
    await expect(page.getByLabel("Password")).toHaveCount(0);
    await expect(
      page.getByText(/isn't configured on this deployment/i),
    ).toBeVisible();

    // And it says what that means: with no way to sign in, the editor — which
    // is behind the gate — can't be opened either.
    await expect(page.getByText(/editor can't be opened/i)).toBeVisible();
  });

  test("surfaces an OAuth failure passed back in the query string", async ({
    page,
  }) => {
    await page.goto("/signin?error=OAuthAccountNotLinked");
    await expect(page.getByText(/already has an account/i)).toBeVisible();
  });
});
