import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests, in two halves.
 *
 * The public half runs against a deployment with nothing configured — no
 * database, no session secret — which is the state the site ships in and must
 * keep working in. The studio half needs an account, because the editor is
 * behind the gate, so it only runs when a database is available:
 *
 *   node scripts/dev-postgres.mjs start
 *   DATABASE_URL=... npm run db:migrate
 *   DATABASE_URL=... AUTH_SECRET=... npm run start -- --port 3100
 *   E2E_WITH_DB=1 E2E_BASE_URL=http://127.0.0.1:3100 npx playwright test
 *
 * Everything runs against a production build so the checks match what ships:
 * real headers, real redirects, real prerendering.
 */

const withDb = process.env.E2E_WITH_DB === "1";
const STATE = "e2e/.auth/user.json";

/** Specs that drive the editor, and therefore need a session. */
const GATED = ["**/studio.spec.ts", "**/studio-save.spec.ts", "**/auth-db.spec.ts"];
const GATED_MOBILE = ["**/studio-mobile.spec.ts"];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // The gated specs share one account, and with cloud sync they all read and
  // write the same stored workflow — run them one at a time so they can't
  // clobber each other's canvas mid-assertion. The public suite is stateless
  // and stays parallel.
  workers: withDb ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [...GATED, ...GATED_MOBILE, "**/auth.setup.ts"],
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testIgnore: [...GATED, ...GATED_MOBILE, "**/auth.setup.ts"],
    },
    ...(withDb
      ? [
          { name: "setup", testMatch: /auth\.setup\.ts/ },
          {
            name: "desktop-auth",
            use: { ...devices["Desktop Chrome"], storageState: STATE },
            testMatch: GATED,
            dependencies: ["setup"],
          },
          {
            name: "mobile-auth",
            use: { ...devices["Pixel 7"], storageState: STATE },
            testMatch: GATED_MOBILE,
            dependencies: ["setup"],
          },
        ]
      : []),
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start -- --port 3100",
        url: "http://127.0.0.1:3100",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
