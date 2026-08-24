import type { Config } from "drizzle-kit";

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
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
} satisfies Config;
