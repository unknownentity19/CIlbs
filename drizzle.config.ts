import { loadEnvConfig } from "@next/env";
import type { Config } from "drizzle-kit";

// Read .env.local the same way the app does, so migrations pick up the same
// connection details without anyone having to put a password on a command
// line (where it lands in shell history).
loadEnvConfig(process.cwd());

/**
 * Migration tooling config. Generate SQL with `npm run db:generate` after
 * editing `src/db/schema.ts`, then apply it with `npm run db:migrate`.
 * Migrations are checked in so the schema history is reviewable.
 */
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Prefer an unpooled connection for schema changes. Neon's pooler is the
    // right thing for the app's short queries, but DDL is better off talking
    // to the database directly — falls back to DATABASE_URL when there's only
    // one connection string, as with a local Postgres.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
} satisfies Config;
