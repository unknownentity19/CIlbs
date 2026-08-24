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

/**
 * Guards the root cause of the sign-in bounce, without needing a database.
 *
 * `<Link>` prefetches by default, and a prefetch of a gated route is answered
 * by the edge gate — so a signed-out visitor's browser cached "redirect to
 * /signin" as the entry for /studio and kept being sent there after signing
 * in. These links must not prefetch. The home page carries two /studio CTAs
 * and the footer carries a third on every page.
 */
test("never prefetches a gated route for a signed-out visitor", async ({
  page,
  isMobile,
}) => {
  const prefetched: string[] = [];
  page.on("request", (request) => {
    const { pathname } = new URL(request.url());
    if (
      /^\/(studio|dashboard)$/.test(pathname) &&
      request.headers()["next-router-prefetch"]
    ) {
      prefetched.push(pathname);
    }
  });

  await page.goto("/");
  // Scroll the footer in, which is where the always-present /studio link is.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));

  // Then open the menus that list both gated routes. On a phone they all live
  // in one panel behind the hamburger, which mounts every item at once — the
  // worst case, since a single tap puts both /studio and /dashboard on screen.
  if (isMobile) {
    await page.getByRole("button", { name: /Toggle menu/i }).click();
    await page.waitForTimeout(1500);
  } else {
    await page.getByRole("button", { name: /^Product$/ }).click();
    await page.waitForTimeout(800);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /^Resources$/ }).click();
    await page.waitForTimeout(800);
  }

  expect(prefetched).toEqual([]);
});

test("robots keeps crawlers out of the gated pages", async ({ request }) => {
  const txt = await (await request.get("/robots.txt")).text();
  expect(txt).toContain("Disallow: /studio");
  expect(txt).toContain("Disallow: /dashboard");
});

test.describe("sign-in", () => {
  test("offers only the sign-in methods that are configured", async ({
    page,
    request,
  }) => {
    // This asserts the *unconfigured* state, so it has to check rather than
    // assume: a local .env.local or a configured deployment makes the sign-in
    // methods legitimately present.
    const providers = await (await request.get("/api/auth/providers")).json();
    test.skip(
      providers !== null && Object.keys(providers ?? {}).length > 0,
      "sign-in is configured here, so there is no unconfigured state to assert",
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
