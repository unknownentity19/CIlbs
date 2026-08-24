import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env, hasDatabase } from "@/lib/env";
import * as schema from "./schema";

/**
 * Postgres client.
 *
 * `node-postgres` rather than a Neon-specific driver, so the same code runs
 * against a local Postgres in development and Neon's pooled endpoint in
 * production. The pool is created on first use and cached on `globalThis`,
 * which stops hot-reload from opening a fresh pool per edit and burning
 * through the free tier's connection budget.
 */

const globalForDb = globalThis as unknown as {
  cilbsPool?: Pool;
  cilbsDb?: ReturnType<typeof drizzle<typeof schema>>;
};

function create() {
  const url = env().DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and point it at your Postgres instance.",
    );
  }
  const pool =
    globalForDb.cilbsPool ??
    new Pool({
      connectionString: url,
      // Small on purpose: every serverless instance holds its own pool, and
      // the free tier's connection ceiling is the scarce resource.
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
    });
  if (env().NODE_ENV !== "production") globalForDb.cilbsPool = pool;
  return drizzle(pool, { schema });
}

let cached: ReturnType<typeof create> | null = null;

/**
 * The database client. Called rather than exported as a value so that
 * importing this module never opens a connection — the build imports it while
 * collecting page data, long before any query runs.
 *
 * Deliberately not a Proxy: libraries that inspect the drizzle instance to
 * detect the dialect (Auth.js's adapter among them) can't see through one.
 */
export function getDb() {
  if (cached) return cached;
  const instance = globalForDb.cilbsDb ?? create();
  if (env().NODE_ENV !== "production") globalForDb.cilbsDb = instance;
  cached = instance;
  return instance;
}

export { hasDatabase, schema };
