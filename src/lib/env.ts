import "server-only";
import { z } from "zod";

/**
 * Server environment, validated once at first use.
 *
 * The point is to fail loudly and early: a missing `AUTH_SECRET` should be an
 * obvious startup error, not a confused 500 the first time somebody tries to
 * log in. Optional values stay optional so the app still builds and runs with
 * nothing configured — the public pages work, and the auth routes report
 * that they are not set up rather than crashing.
 */

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  /** Postgres connection string (Neon's pooled URL in production). */
  DATABASE_URL: z.string().url().optional(),

  /** Session signing secret. Required once auth is in use. */
  AUTH_SECRET: z.string().min(32).optional(),

  /** Canonical origin, used for absolute URLs in metadata and emails. */
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  /** Optional error/event collector (see src/lib/telemetry.ts). */
  TELEMETRY_URL: z.string().url().optional(),

  /**
   * OAuth providers. Each is optional and registered only when both halves are
   * present, so the sign-in page can offer exactly what's configured instead
   * of showing a button that 500s.
   */
  AUTH_GITHUB_ID: z.string().min(1).optional(),
  AUTH_GITHUB_SECRET: z.string().min(1).optional(),
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** True when a database is configured, so callers can degrade instead of throw. */
export function hasDatabase() {
  return Boolean(env().DATABASE_URL);
}

/** Which OAuth providers are fully configured. */
export function oauthProviders() {
  const e = env();
  return {
    github: Boolean(e.AUTH_GITHUB_ID && e.AUTH_GITHUB_SECRET),
    google: Boolean(e.AUTH_GOOGLE_ID && e.AUTH_GOOGLE_SECRET),
  };
}

/**
 * Sign-in availability.
 *
 * The two halves are deliberately independent. OAuth needs only a signing
 * secret — Auth.js can run adapter-less with JWT sessions, so a deployment
 * with no database at all can still offer "Continue with GitHub". Email and
 * password need somewhere to keep the hash, so that half requires Postgres.
 */

/** Any sign-in method is available. */
export function hasAuth() {
  return hasCredentialsAuth() || hasOAuthAuth();
}

/** Email + password: needs a place to store users. */
export function hasCredentialsAuth() {
  return Boolean(env().DATABASE_URL && env().AUTH_SECRET);
}

/** OAuth: works with no database, sessions live in the cookie. */
export function hasOAuthAuth() {
  const providers = oauthProviders();
  return Boolean(env().AUTH_SECRET && (providers.github || providers.google));
}
