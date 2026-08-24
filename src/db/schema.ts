import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

/**
 * Database schema.
 *
 * The first four tables are the shapes Auth.js's Drizzle adapter expects —
 * table and column names follow its reference schema so the adapter drops in
 * without a mapping layer. `passwordHash` and `workspace` are our additions:
 * the former backs email/password sign-in, the latter is the label the
 * dashboard shows.
 */

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  /** Null for accounts that only ever signed in through a provider. */
  passwordHash: text("password_hash"),
  workspace: text("workspace").notNull().default("personal"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

/**
 * A saved studio workflow. The graph is stored as JSON rather than normalised
 * into node and edge tables: it is always read and written whole, and keeping
 * the shape identical to the client's `Workflow` type avoids a translation
 * layer on every save.
 */
export const workflows = pgTable(
  "workflow",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    graph: jsonb("graph").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("workflow_user_idx").on(table.userId, table.updatedAt)],
);

/**
 * Errors and events posted by the app (see src/lib/telemetry.ts and the
 * /api/telemetry route). Kept here rather than shipped to a vendor: it costs
 * nothing, it survives longer than a serverless log line, and it's queryable
 * with the same tooling as everything else. Trimmed to the newest rows so it
 * can't eat a free-tier database.
 */
export const eventLog = pgTable(
  "event_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    kind: text("kind").notNull(),
    message: text("message").notNull(),
    context: jsonb("context"),
    release: text("release"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("event_log_created_idx").on(table.createdAt)],
);

export type UserRow = typeof users.$inferSelect;
export type WorkflowRow = typeof workflows.$inferSelect;
export type EventLogRow = typeof eventLog.$inferSelect;
